const express = require('express');
const db = require('../db');
const router = express.Router();

const today = () => new Date().toISOString().slice(0, 10);

// Helper: calculate streak for a single habit
function getStreak(habitId, date) {
  const row = db.prepare(`
    SELECT COUNT(*) AS streak FROM (
      SELECT log_date,
             ROW_NUMBER() OVER (ORDER BY log_date DESC) AS rn,
             JULIANDAY(?) - JULIANDAY(log_date) AS days_ago
      FROM habit_logs
      WHERE habit_id = ? AND completed = 1
    ) WHERE days_ago = rn - 1
  `).get(date, habitId);
  return row?.streak || 0;
}

// Helper: best streak for a single habit (all time)
function getBestStreak(habitId) {
  const logs = db.prepare(
    `SELECT log_date FROM habit_logs WHERE habit_id = ? AND completed = 1 ORDER BY log_date ASC`
  ).all(habitId).map(r => r.log_date);

  if (!logs.length) return 0;

  let best = 1, cur = 1;
  for (let i = 1; i < logs.length; i++) {
    const diff = Math.round((new Date(logs[i]) - new Date(logs[i - 1])) / 86400000);
    cur = diff === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

// ── GET /api/stats ──────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const date = req.query.date || today();

  // Summary
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM habits').get();
  const { done_today } = db.prepare(
    `SELECT COUNT(*) AS done_today FROM habit_logs WHERE log_date = ? AND completed = 1`
  ).get(date);

  // Completion rate last 30 days
  const rateRow = db.prepare(`
    SELECT ROUND(
      100.0 * SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END)
      / NULLIF(COUNT(*), 0), 0) AS rate
    FROM habit_logs
    WHERE log_date >= date(?, '-30 days')
  `).get(date);

  // Max current streak across all habits
  const allHabits = db.prepare('SELECT id FROM habits').all();
  const currentStreak = allHabits.reduce((max, h) => Math.max(max, getStreak(h.id, date)), 0);

  // Weekly data — last 7 days
  const weekly = db.prepare(`
    SELECT
      days.log_date,
      ROUND(
        100.0 * SUM(CASE WHEN l.completed = 1 THEN 1 ELSE 0 END)
        / NULLIF((SELECT COUNT(*) FROM habits), 0)
      , 0) AS pct
    FROM (
      WITH RECURSIVE cnt(n) AS (
        SELECT 6 UNION ALL SELECT n-1 FROM cnt WHERE n > 0
      )
      SELECT date(?, '-' || n || ' days') AS log_date FROM cnt
    ) days
    LEFT JOIN habit_logs l ON l.log_date = days.log_date
    GROUP BY days.log_date
    ORDER BY days.log_date ASC
  `).all(date);

  // Monthly data — last 6 months
  const monthly = db.prepare(`
    SELECT
      strftime('%b', months.m) AS month,
      strftime('%Y-%m', months.m) AS ym,
      ROUND(
        100.0 * SUM(CASE WHEN l.completed = 1 THEN 1 ELSE 0 END)
        / NULLIF((SELECT COUNT(*) FROM habits), 0)
      , 0) AS pct
    FROM (
      WITH RECURSIVE cnt(n) AS (
        SELECT 5 UNION ALL SELECT n-1 FROM cnt WHERE n > 0
      )
      SELECT date(?, 'start of month', '-' || n || ' months') AS m FROM cnt
    ) months
    LEFT JOIN habit_logs l ON strftime('%Y-%m', l.log_date) = strftime('%Y-%m', months.m)
    GROUP BY months.m
    ORDER BY months.m ASC
  `).all(date);

  // Heatmap — last 35 days
  const heatmap = db.prepare(`
    SELECT
      days.log_date,
      COALESCE(SUM(CASE WHEN l.completed = 1 THEN 1 ELSE 0 END), 0) AS count
    FROM (
      WITH RECURSIVE cnt(n) AS (
        SELECT 34 UNION ALL SELECT n-1 FROM cnt WHERE n > 0
      )
      SELECT date(?, '-' || n || ' days') AS log_date FROM cnt
    ) days
    LEFT JOIN habit_logs l ON l.log_date = days.log_date
    GROUP BY days.log_date
    ORDER BY days.log_date ASC
  `).all(date);

  // Per-habit stats
  const habits = db.prepare('SELECT id, name, icon FROM habits').all();
  const habit_stats = habits.map(h => {
    const rateRow = db.prepare(`
      SELECT ROUND(100.0 * SUM(completed) / NULLIF(COUNT(*), 0), 0) AS rate
      FROM habit_logs
      WHERE habit_id = ? AND log_date >= date(?, '-30 days')
    `).get(h.id, date);

    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      current_streak: getStreak(h.id, date),
      best_streak: getBestStreak(h.id),
      completion_rate: rateRow?.rate || 0,
    };
  });

  res.json({
    summary: {
      total_habits: total,
      done_today,
      current_streak: currentStreak,
      completion_rate: rateRow?.rate || 0,
    },
    weekly,
    monthly,
    heatmap,
    habit_stats,
  });
});

module.exports = router;
