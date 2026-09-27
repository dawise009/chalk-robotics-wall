const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

const dbPath =
  process.env.DATABASE_PATH ||
  path.join(process.cwd(), "data", "chalk.db");

// During `next build`, use an isolated in-memory database. Next.js imports
// route modules while collecting page data, so this prevents writes/locks on
// the production SQLite file baked into the Docker build context.
const db = isBuild ? new DatabaseSync(":memory:") : createRuntimeDatabase();

db.exec("PRAGMA foreign_keys = ON");

if (!isBuild) {
  db.exec("PRAGMA journal_mode = WAL");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'officer')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS officer_desk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    note TEXT NOT NULL
  );
`);

function createRuntimeDatabase() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return new DatabaseSync(dbPath);
}

module.exports = db;
