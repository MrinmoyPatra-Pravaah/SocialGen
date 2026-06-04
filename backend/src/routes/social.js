import { Router } from 'express';
import { db, nowStamp } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { toRequestError, sendError } from '../utils/helpers.js';
import { getAuthorizeUrl, exchangeCodeAndFetchProfile } from '../services/socialAuth.js';

const router = Router();

// GET /api/social/accounts — get connected channels
router.get('/accounts', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM social_accounts WHERE user_id = ? ORDER BY created_at DESC').all(req.currentUser.id);
    return res.json(rows);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// GET /api/social/auth/link/:platform — Initiate real OAuth redirection
router.get('/auth/link/:platform', requireAuth, (req, res) => {
  try {
    const { platform } = req.params;
    
    // Read the origin from query parameters, or default to the referer/origin headers
    const frontendOrigin = req.query.origin || req.headers.referer || 'http://localhost:5173';
    let cleanOrigin = 'http://localhost:5173';
    try {
      const url = new URL(frontendOrigin);
      cleanOrigin = url.origin;
    } catch (e) {
      // fallback
    }

    // Create state variable containing verified user ID, platform, and clean frontend origin
    const state = Buffer.from(`${req.currentUser.id}:${platform}:${cleanOrigin}`).toString('base64');
    const redirectUrl = getAuthorizeUrl(platform, state);
    
    return res.json({ redirectUrl });
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// GET /api/social/auth/callback — OAuth callback processor
router.get('/auth/callback', async (req, res) => {
  let redirectBase = 'http://localhost:5173';
  try {
    const { code, state } = req.query || {};
    
    if (!state) {
      return res.redirect(`${redirectBase}/connections?status=error&message=Missing+state`);
    }

    // Decode state to retrieve user association and origin
    const decoded = Buffer.from(state, 'base64').toString('ascii');
    const [userId, platform, frontendOrigin] = decoded.split(':');

    if (frontendOrigin) {
      redirectBase = frontendOrigin;
    }

    if (!code) {
      return res.redirect(`${redirectBase}/connections?status=error&message=Missing+code`);
    }

    if (!userId || !platform) {
      return res.redirect(`${redirectBase}/connections?status=error&message=Invalid+state+association`);
    }

    // Call exchange API to fetch verified token credentials
    const profile = await exchangeCodeAndFetchProfile(platform, code);

    // Save or update linked credentials in database
    const existing = db.prepare('SELECT id FROM social_accounts WHERE user_id = ? AND platform = ?').get(userId, platform);
    
    if (existing) {
      db.prepare(`
        UPDATE social_accounts 
        SET username = ?, avatar_url = ?, access_token = ?, refresh_token = ?, expires_at = ?, status = 'active', created_at = ? 
        WHERE id = ?
      `).run(
        profile.username,
        profile.avatar_url,
        profile.access_token,
        profile.refresh_token,
        profile.expires_at,
        nowStamp(),
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO social_accounts (user_id, platform, username, avatar_url, access_token, refresh_token, expires_at, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(
        userId,
        platform,
        profile.username,
        profile.avatar_url,
        profile.access_token,
        profile.refresh_token,
        profile.expires_at,
        nowStamp()
      );
    }

    // Redirect user back to the connections manager view with success indicator
    return res.redirect(`${redirectBase}/connections?status=success&platform=${encodeURIComponent(platform)}&handle=${encodeURIComponent(profile.username)}`);
  } catch (error) {
    console.error('[socialAuthCallback] Error processing oauth callback:', error);
    return res.redirect(`${redirectBase}/connections?status=error&message=${encodeURIComponent(error.message)}`);
  }
});

// DELETE /api/social/accounts/:id — disconnect channel
router.delete('/accounts/:id', requireAuth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM social_accounts WHERE id = ? AND user_id = ?').run(req.params.id, req.currentUser.id);
    if (info.changes === 0) {
      return sendError(res, toRequestError('Account not found', 404));
    }
    return res.status(204).send();
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// GET /api/social/posts — get daily campaign-generated posts
router.get('/posts', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM campaign_posts WHERE user_id = ? ORDER BY posted_at DESC').all(req.currentUser.id);
    return res.json(rows);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// PUT /api/social/posts/:id — update campaign post content
router.put('/posts/:id', requireAuth, (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content) {
      return sendError(res, toRequestError('Content is required', 400));
    }
    
    const post = db.prepare('SELECT id FROM campaign_posts WHERE id = ? AND user_id = ?').get(req.params.id, req.currentUser.id);
    if (!post) {
      return sendError(res, toRequestError('Campaign post not found', 404));
    }

    db.prepare('UPDATE campaign_posts SET content = ? WHERE id = ?').run(content, req.params.id);
    const updated = db.prepare('SELECT * FROM campaign_posts WHERE id = ?').get(req.params.id);
    return res.json(updated);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// DELETE /api/social/posts/:id — delete campaign post
router.delete('/posts/:id', requireAuth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM campaign_posts WHERE id = ? AND user_id = ?').run(req.params.id, req.currentUser.id);
    if (info.changes === 0) {
      return sendError(res, toRequestError('Campaign post not found', 404));
    }
    return res.status(204).send();
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// GET /api/social/comments — get unified inbox comments
router.get('/comments', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.*, p.platform, p.title as post_title 
      FROM post_comments c
      JOIN campaign_posts p ON c.post_id = p.id
      WHERE p.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.currentUser.id);
    return res.json(rows);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/social/comments/:id/reply — reply to comment
router.post('/comments/:id/reply', requireAuth, (req, res) => {
  try {
    const { reply_content } = req.body || {};
    if (!reply_content) {
      return sendError(res, toRequestError('Reply content is required', 400));
    }

    // Verify ownership of the comment through post -> user
    const comment = db.prepare(`
      SELECT c.id 
      FROM post_comments c
      JOIN campaign_posts p ON c.post_id = p.id
      WHERE c.id = ? AND p.user_id = ?
    `).get(req.params.id, req.currentUser.id);

    if (!comment) {
      return sendError(res, toRequestError('Comment not found', 404));
    }

    db.prepare('UPDATE post_comments SET replied = 1, reply_content = ? WHERE id = ?').run(reply_content, req.params.id);
    const updated = db.prepare('SELECT * FROM post_comments WHERE id = ?').get(req.params.id);
    return res.json(updated);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/social/comments/:id/star — toggle star
router.post('/comments/:id/star', requireAuth, (req, res) => {
  try {
    const comment = db.prepare(`
      SELECT c.id, c.starred
      FROM post_comments c
      JOIN campaign_posts p ON c.post_id = p.id
      WHERE c.id = ? AND p.user_id = ?
    `).get(req.params.id, req.currentUser.id);

    if (!comment) {
      return sendError(res, toRequestError('Comment not found', 404));
    }

    const nextStar = comment.starred === 1 ? 0 : 1;
    db.prepare('UPDATE post_comments SET starred = ? WHERE id = ?').run(nextStar, req.params.id);
    return res.json({ id: comment.id, starred: nextStar });
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

export default router;
