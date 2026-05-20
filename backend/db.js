const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'habits.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    icon      TEXT    NOT NULL DEFAULT 'check_circle',
    category  TEXT    NOT NULL DEFAULT 'General',
    duration  TEXT    NOT NULL DEFAULT 'Daily',
    frequency TEXT    NOT NULL DEFAULT 'daily',
    created_at TEXT   NOT NULL DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id  INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    log_date  TEXT    NOT NULL DEFAULT (date('now')),
    completed INTEGER NOT NULL DEFAULT 1,
    UNIQUE(habit_id, log_date)
  );
`);

// ── Seed default habits if DB is empty ──────────────────────────────────────

const count = db.prepare('SELECT COUNT(*) AS cnt FROM habits').get();
if (count.cnt === 0) {
  const insert = db.prepare(
    `INSERT INTO habits (name, icon, category, duration, frequency)
     VALUES (@name, @icon, @category, @duration, @frequency)`
  );

  const seeds = [
    { name: 'Morning Meditation', icon: 'self_improvement', category: 'Mindfulness', duration: '10 min', frequency: 'daily' },
    { name: 'Drink 2L Water',     icon: 'water_drop',       category: 'Nutrition',   duration: 'All day', frequency: 'daily' },
    { name: 'Read 20 Pages',      icon: 'menu_book',         category: 'Learning',   duration: '25 min',  frequency: 'daily' },
    { name: 'Evening Yoga',       icon: 'fitness_center',    category: 'Fitness',    duration: '20 min',  frequency: 'daily' },
  ];

  const insertMany = db.transaction((habits) => {
    for (const h of habits) insert.run(h);
  });
  insertMany(seeds);
}

module.exports = db;
