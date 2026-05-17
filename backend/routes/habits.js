const express = require('express');
const db = require('../db');
const router = express.Router();

const today = () => new Date().toISOString().slice(0, 10);

// ── GET /api/habits  ─────────────────────────────────────────────────────────
// Returns all habits with today's completion status + current streak
router.get('/', (req, res) => {
  const date = req.query.date || today();

  const habits = db.prepare(`
    SELECT h.*,
      CASE WHEN l.id IS NOT NULL AND l.completed = 1 THEN 1 ELSE 0 END AS done
    FROM habits h
    LEFT JOIN habit_logs l ON l.habit_id = h.id AND l.log_date = ?
    ORDER BY h.created_at ASC, h.id ASC
  `).all(date);

  const streakStmt = db.prepare(`
    SELECT COUNT(*) AS streak FROM (
      SELECT log_date,
             ROW_NUMBER() OVER (ORDER BY log_date DESC) AS rn,
             JULIANDAY(?) - JULIANDAY(log_date) AS days_ago
      FROM habit_logs
      WHERE habit_id = ? AND completed = 1
    ) WHERE days_ago = rn - 1
  `);

  res.json(habits.map(h => ({
    ...h,
    streak: streakStmt.get(date, h.id)?.streak || 0,
  })));
});

// ── POST /api/habits  ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, icon = 'check_circle', category = 'General', duration = 'Daily', frequency = 'daily' } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  const result = db.prepare(
    `INSERT INTO habits (name, icon, category, duration, frequency) VALUES (?, ?, ?, ?, ?)`
  ).run(name.trim(), icon, category, duration, frequency);

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...habit, done: 0, streak: 0 });
});

// ── GET /api/habits/:id  ─────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const logs = db.prepare(
    `SELECT log_date, completed FROM habit_logs WHERE habit_id = ? ORDER BY log_date DESC LIMIT 30`
  ).all(req.params.id);

  res.json({ ...habit, logs });
});

// ── PUT /api/habits/:id  ─────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { name, icon, category, duration, frequency } = req.body;
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  db.prepare(`
    UPDATE habits SET
      name      = COALESCE(?, name),
      icon      = COALESCE(?, icon),
      category  = COALESCE(?, category),
      duration  = COALESCE(?, duration),
      frequency = COALESCE(?, frequency)
    WHERE id = ?
  `).run(name, icon, category, duration, frequency, req.params.id);

  res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id));
});

// ── DELETE /api/habits/:id  ──────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Habit not found' });
  res.json({ success: true });
});

// ── POST /api/habits/reset  ──────────────────────────────────────────────────
router.post('/reset', (req, res) => {
  db.prepare('DELETE FROM habit_logs').run();
  db.prepare('DELETE FROM habits').run();
  res.json({ success: true });
});


// ── POST /api/habits/:id/toggle  ─────────────────────────────────────────────
// Toggle today's completion for a habit
router.post('/:id/toggle', (req, res) => {
  const { date = today() } = req.body;
  const habit = db.prepare('SELECT id FROM habits WHERE id = ?').get(req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const existing = db.prepare(
    'SELECT id, completed FROM habit_logs WHERE habit_id = ? AND log_date = ?'
  ).get(req.params.id, date);

  let done;
  if (existing) {
    const newCompleted = existing.completed ? 0 : 1;
    db.prepare('UPDATE habit_logs SET completed = ? WHERE id = ?').run(newCompleted, existing.id);
    done = newCompleted;
  } else {
    db.prepare('INSERT INTO habit_logs (habit_id, log_date, completed) VALUES (?, ?, 1)').run(req.params.id, date);
    done = 1;
  }

  res.json({ habit_id: Number(req.params.id), date, done });
});

module.exports = router;
