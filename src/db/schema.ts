export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS Categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT,
  status INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  categoryId INTEGER,
  time TEXT,
  isDone INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  createdBy INTEGER DEFAULT 1,
  FOREIGN KEY (categoryId) REFERENCES Categories(id)
);
`;

export const DB_NAME = 'habittracker';
