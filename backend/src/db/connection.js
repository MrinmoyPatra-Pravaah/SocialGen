import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'saas.db');

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = OFF;');

function hasColumn(table, column) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  return columns.some((item) => item.name === column);
}

export function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      gemini_api_key TEXT,
      brand_voice TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      website_url TEXT,
      platform TEXT NOT NULL,
      campaign_name TEXT NOT NULL,
      content_topic TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      posting_frequency TEXT NOT NULL,
      content_goal TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_jobs (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      website_url TEXT,
      topic TEXT NOT NULL,
      keywords TEXT,
      tone TEXT NOT NULL,
      audience TEXT,
      goal TEXT,
      platform TEXT,
      length TEXT,
      result_content TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS social_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaign_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calendar_entry_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      posted_at TEXT NOT NULL,
      platform TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      FOREIGN KEY(calendar_entry_id) REFERENCES calendar_entries(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      content TEXT NOT NULL,
      sentiment TEXT NOT NULL,
      created_at TEXT NOT NULL,
      replied INTEGER DEFAULT 0,
      reply_content TEXT,
      starred INTEGER DEFAULT 0,
      FOREIGN KEY(post_id) REFERENCES campaign_posts(id) ON DELETE CASCADE
    );
  `);

  if (!hasColumn('users', 'gemini_api_key')) {
    db.exec('ALTER TABLE users ADD COLUMN gemini_api_key TEXT;');
  }

  if (!hasColumn('users', 'brand_voice')) {
    db.exec('ALTER TABLE users ADD COLUMN brand_voice TEXT;');
  }

  if (!hasColumn('post_comments', 'starred')) {
    db.exec('ALTER TABLE post_comments ADD COLUMN starred INTEGER DEFAULT 0;');
  }

  if (!hasColumn('social_accounts', 'access_token')) {
    db.exec('ALTER TABLE social_accounts ADD COLUMN access_token TEXT;');
  }

  if (!hasColumn('social_accounts', 'refresh_token')) {
    db.exec('ALTER TABLE social_accounts ADD COLUMN refresh_token TEXT;');
  }

  if (!hasColumn('social_accounts', 'expires_at')) {
    db.exec('ALTER TABLE social_accounts ADD COLUMN expires_at INTEGER;');
  }
}

export function nowStamp() {
  return new Date().toISOString().replace('Z', '');
}
