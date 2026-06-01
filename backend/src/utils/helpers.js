// ── DateTime helpers ─────────────────────────────────────────────────

export function parseDateTime(value) {
  if (!value || typeof value !== 'string') {
    return null;
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

export function formatDateTime(value) {
  return parseDateTime(value);
}

// ── Error helpers ────────────────────────────────────────────────────

export function toRequestError(detail, status = 400) {
  return { detail, status };
}

export function sendError(res, error) {
  return res.status(error.status || 500).json({ detail: error.detail || 'Internal server error' });
}
