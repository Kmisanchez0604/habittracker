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
  description TEXT,
  frequency TEXT DEFAULT 'daily',
  categoryId INTEGER,
  time TEXT,
  icon TEXT,
  isDone INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  createdBy INTEGER DEFAULT 1,
  FOREIGN KEY (categoryId) REFERENCES Categories(id)
);

CREATE TABLE IF NOT EXISTS HabitCompletions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habitId INTEGER NOT NULL,
  date TEXT NOT NULL,
  completed INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (habitId) REFERENCES Habits(id)
);
`;

export const DB_NAME = 'habittracker';
