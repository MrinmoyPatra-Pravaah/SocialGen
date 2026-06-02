import { db } from './connection.js';
import * as fb from './firebase.js';

const USE_FIRESTORE = process.env.USE_FIRESTORE === 'true';

// ── Timestamp normalization ──────────────────────────────────────────

function normalizeTimestampValue(value) {
  if (!value || typeof value !== 'string') {
    return value ?? null;
  }

  const trimmed = value.trim();
  if (trimmed.includes('T')) {
    return trimmed.replace(/Z$/, '');
  }

  if (trimmed.includes(' ')) {
    const [datePart, timePart] = trimmed.split(' ');
    return `${datePart}T${(timePart || '').replace(/Z$/, '')}`;
  }

  return trimmed;
}

// ── Row mappers ──────────────────────────────────────────────────────

export function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    gemini_api_key: row.gemini_api_key ?? null,
    brand_voice: row.brand_voice ?? null,
    created_at: normalizeTimestampValue(row.created_at)
  };
}

export function mapCalendarRow(row) {
  if (!row) return null;
  const numId = Number(row.id);
  const numUserId = Number(row.user_id);
  return {
    id: isNaN(numId) ? row.id : numId,
    user_id: isNaN(numUserId) ? row.user_id : numUserId,
    website_url: row.website_url ?? null,
    platform: row.platform,
    campaign_name: row.campaign_name,
    content_topic: row.content_topic,
    start_date: row.start_date,
    end_date: row.end_date,
    posting_frequency: row.posting_frequency,
    content_goal: row.content_goal,
    notes: row.notes ?? null,
    created_at: normalizeTimestampValue(row.created_at)
  };
}

export function mapJobRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    status: row.status,
    website_url: row.website_url ?? null,
    topic: row.topic,
    keywords: row.keywords ?? null,
    tone: row.tone,
    audience: row.audience ?? null,
    goal: row.goal ?? null,
    platform: row.platform ?? null,
    length: row.length ?? null,
    result_content: row.result_content ?? null,
    error_message: row.error_message ?? null,
    created_at: normalizeTimestampValue(row.created_at),
    updated_at: normalizeTimestampValue(row.updated_at)
  };
}

// ── Query helpers ────────────────────────────────────────────────────

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

export function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

export function findCalendarEntryById(entryId, userId) {
  return db.prepare('SELECT * FROM calendar_entries WHERE id = ? AND user_id = ?').get(entryId, userId) || null;
}

// Async compatible helpers that use Firestore when `USE_FIRESTORE=true`,
// otherwise they delegate to the SQLite helpers above.
export async function findCalendarEntryByIdAsync(entryId, userId) {
  if (USE_FIRESTORE) {
    const doc = await fb.getDoc('calendar_entries', String(entryId));
    if (!doc) return null;
    if (String(doc.user_id) !== String(userId)) return null;
    return doc;
  }
  return Promise.resolve(findCalendarEntryById(entryId, userId));
}

export async function getAllCalendarEntriesForUserAsync(userId) {
  if (USE_FIRESTORE) {
    const docs = await fb.queryCollection('calendar_entries', [['user_id', '==', userId]]);
    return docs.map(mapCalendarRow);
  }
  const rows = db.prepare('SELECT * FROM calendar_entries WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  return rows.map(mapCalendarRow);
}

export async function createCalendarEntryAsync(entry) {
  if (USE_FIRESTORE) {
    const now = new Date().toISOString().replace('Z', '');
    const created = await fb.createDoc('calendar_entries', { ...entry, created_at: entry.created_at || now }, entry.id ? String(entry.id) : null);
    return mapCalendarRow(created);
  }
  const createdAt = new Date().toISOString().replace('Z', '');
  const insert = db.prepare(`
    INSERT INTO calendar_entries (
      user_id, website_url, platform, campaign_name, content_topic,
      start_date, end_date, posting_frequency, content_goal, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insert.run(
    entry.user_id,
    entry.website_url ?? null,
    entry.platform,
    entry.campaign_name,
    entry.content_topic,
    entry.start_date,
    entry.end_date,
    entry.posting_frequency,
    entry.content_goal,
    entry.notes ?? null,
    createdAt
  );

  const row = db.prepare('SELECT * FROM calendar_entries WHERE id = ?').get(info.lastInsertRowid);
  return mapCalendarRow(row);
}

export async function updateCalendarEntryAsync(entryId, userId, updates) {
  if (USE_FIRESTORE) {
    // ensure ownership
    const existing = await findCalendarEntryByIdAsync(entryId, userId);
    if (!existing) return null;
    const updated = await fb.updateDoc('calendar_entries', String(entryId), updates);
    return mapCalendarRow(updated);
  }
  const allowed = ['website_url', 'platform', 'campaign_name', 'content_topic', 'start_date', 'end_date', 'posting_frequency', 'content_goal', 'notes'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length > 0) {
    values.push(entryId, userId);
    db.prepare(`UPDATE calendar_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  }

  const updated = findCalendarEntryById(entryId, userId);
  return Promise.resolve(updated);
}

export async function deleteCalendarEntryAsync(entryId, userId) {
  if (USE_FIRESTORE) {
    const existing = await findCalendarEntryByIdAsync(entryId, userId);
    if (!existing) return false;
    await fb.deleteDoc('calendar_entries', String(entryId));
    return true;
  }
  const existing = findCalendarEntryById(entryId, userId);
  if (!existing) return false;
  db.prepare('DELETE FROM calendar_entries WHERE id = ? AND user_id = ?').run(entryId, userId);
  return Promise.resolve(true);
}

export function findJobById(jobId, userId = null) {
  if (userId === null || userId === undefined) {
    return db.prepare('SELECT * FROM ai_jobs WHERE id = ?').get(jobId) || null;
  }

  return db.prepare('SELECT * FROM ai_jobs WHERE id = ? AND user_id = ?').get(jobId, userId) || null;
}

export async function findUserByIdAsync(id) {
  if (USE_FIRESTORE) {
    return await fb.getDoc('users', String(id));
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

export async function findUserByEmailAsync(email) {
  if (USE_FIRESTORE) {
    const docs = await fb.queryCollection('users', [['email', '==', email]]);
    return docs[0] || null;
  }
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

export async function findJobByIdAsync(jobId, userId = null) {
  if (USE_FIRESTORE) {
    const doc = await fb.getDoc('ai_jobs', String(jobId));
    if (!doc) return null;
    if (userId && String(doc.user_id) !== String(userId)) return null;
    return doc;
  }
  return Promise.resolve(findJobById(jobId, userId));
}

export async function getAllJobsForUserAsync(userId, statusFilter = null) {
  if (USE_FIRESTORE) {
    const filters = [['user_id', '==', userId]];
    if (statusFilter) {
      filters.push(['status', '==', statusFilter]);
    }
    const docs = await fb.queryCollection('ai_jobs', filters, 'created_at');
    return docs.map(mapJobRow);
  }
  let query = 'SELECT * FROM ai_jobs WHERE user_id = ?';
  const params = [userId];
  if (statusFilter) {
    query += ' AND status = ?';
    params.push(statusFilter);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return rows.map(mapJobRow);
}

export async function createJobAsync(job) {
  if (USE_FIRESTORE) {
    const now = new Date().toISOString().replace('Z', '');
    const data = {
      ...job,
      created_at: job.created_at || now,
      updated_at: job.updated_at || now
    };
    const created = await fb.createDoc('ai_jobs', data, job.id ? String(job.id) : null);
    return mapJobRow(created);
  }
  const createdAt = new Date().toISOString().replace('Z', '');
  db.prepare(`
    INSERT INTO ai_jobs (
      id, user_id, status, website_url, topic, keywords, tone,
      audience, goal, platform, length, result_content, error_message,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.user_id,
    job.status,
    job.website_url ?? null,
    job.topic,
    job.keywords ?? null,
    job.tone,
    job.audience ?? null,
    job.goal ?? null,
    job.platform ?? null,
    job.length ?? 'Medium',
    job.result_content ?? null,
    job.error_message ?? null,
    createdAt,
    createdAt
  );
  const row = findJobById(job.id, job.user_id);
  return mapJobRow(row);
}

export async function updateJobAsync(jobId, userId, updates) {
  if (USE_FIRESTORE) {
    const existing = await findJobByIdAsync(jobId, userId);
    if (!existing) return null;
    const now = new Date().toISOString().replace('Z', '');
    const updated = await fb.updateDoc('ai_jobs', String(jobId), { ...updates, updated_at: now });
    return mapJobRow(updated);
  }
  const allowed = ['status', 'result_content', 'error_message'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }
  if (fields.length > 0) {
    const createdAt = new Date().toISOString().replace('Z', '');
    values.push(createdAt, jobId, userId);
    db.prepare(`UPDATE ai_jobs SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND user_id = ?`).run(...values);
  }
  const updated = findJobById(jobId, userId);
  return Promise.resolve(mapJobRow(updated));
}

export async function deleteJobAsync(jobId, userId) {
  if (USE_FIRESTORE) {
    const existing = await findJobByIdAsync(jobId, userId);
    if (!existing) return false;
    await fb.deleteDoc('ai_jobs', String(jobId));
    return true;
  }
  const existing = findJobById(jobId, userId);
  if (!existing) return false;
  db.prepare('DELETE FROM ai_jobs WHERE id = ? AND user_id = ?').run(jobId, userId);
  return Promise.resolve(true);
}
