import { Router } from 'express';
import { db } from '../db/connection.js';
import { findCalendarEntryByIdAsync, getAllCalendarEntriesForUserAsync, createCalendarEntryAsync, updateCalendarEntryAsync, deleteCalendarEntryAsync, mapCalendarRow } from '../db/queries.js';
import { requireAuth } from '../middleware/auth.js';
import { toRequestError, sendError } from '../utils/helpers.js';
import { nowStamp } from '../db/connection.js';
import { GEMINI_API_KEY } from '../config/index.js';
import { generateEngagementComments } from '../services/engagementSeeder.js';

const router = Router();

// GET /api/calendar
router.get('/', requireAuth, async (req, res) => {
  try {
    const entries = await getAllCalendarEntriesForUserAsync(req.currentUser.id);
    return res.json(entries);
  } catch (err) {
    return sendError(res, toRequestError(err.message, 500));
  }
});

// GET /api/calendar/:entryId
router.get('/:entryId', requireAuth, async (req, res) => {
  const entryId = Number(req.params.entryId);
  const entry = await findCalendarEntryByIdAsync(entryId, req.currentUser.id);

  if (!entry) {
    return sendError(res, toRequestError('Calendar entry not found', 404));
  }

  return res.json(mapCalendarRow(entry));
});

// POST /api/calendar
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const entry = await createCalendarEntryAsync({ ...body, user_id: req.currentUser.id });
    return res.status(201).json(entry);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// PUT /api/calendar/:entryId
router.put('/:entryId', requireAuth, async (req, res) => {
  try {
    const entryId = Number(req.params.entryId);
    const updated = await updateCalendarEntryAsync(entryId, req.currentUser.id, req.body || {});
    if (!updated) return sendError(res, toRequestError('Calendar entry not found', 404));
    return res.json(mapCalendarRow(updated));
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/calendar/:entryId/trigger - generate & post immediately
router.post('/:entryId/trigger', requireAuth, async (req, res) => {
  try {
    const entryId = Number(req.params.entryId);
    const campaign = await findCalendarEntryByIdAsync(entryId, req.currentUser.id);

    if (!campaign) {
      return sendError(res, toRequestError('Calendar entry not found', 404));
    }

    // Generate content using a structured Gemini request
    const prompt = `You are an automated campaign copywriter. Create today's daily post for the campaign "${campaign.campaign_name}".
Topic: "${campaign.content_topic}"
Goal: "${campaign.content_goal}"
Platform: "${campaign.platform}"
Tone: "${campaign.notes || 'Professional and engaging'}"

Return a JSON object containing:
1. "title": a catchy short title.
2. "content": a detailed post body with appropriate formatting and hashtags.
3. "image_prompt": a descriptive text prompt for an image generator (creative poster) representing this topic (e.g. "a modern professional workspace with clean digital charts, soft green accents, light background, high contrast, flat illustration").

Return ONLY valid JSON. No markdown fences.`;

    const apiKey = GEMINI_API_KEY || '';
    let generated;

    if (apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          })
        });

        const data = await response.json().catch(() => ({}));
        const rawText = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generated = JSON.parse(cleaned);
      } catch (err) {
        console.error('[Trigger Campaign] Gemini call error:', err);
      }
    }

    if (!generated || !generated.title) {
      // Fallback content if API fails
      generated = {
        title: `Daily Updates on ${campaign.content_topic}`,
        content: `We are rolling out our daily update on ${campaign.content_topic}! Today's theme focuses on maximizing output and aligning with our primary goal: ${campaign.content_goal}.\n\nWhat are your thoughts on this? Let us know! #Marketing #Growth`,
        image_prompt: `${campaign.content_topic} professional digital design illustration green theme light background`
      };
    }

    // Create poster image URL using Pollinations text-to-image generator
    const posterPrompt = encodeURIComponent(generated.image_prompt || `${campaign.content_topic} abstract marketing illustration`);
    const imageUrl = `https://image.pollinations.ai/prompt/${posterPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    // Publish to connected Social Media channel if user has linked accounts
    let platformNormal = campaign.platform;
    if (platformNormal.includes('Twitter')) platformNormal = 'Twitter';
    if (platformNormal.includes('LinkedIn')) platformNormal = 'LinkedIn';
    if (platformNormal.includes('Facebook')) platformNormal = 'Facebook';
    if (platformNormal.includes('Instagram')) platformNormal = 'Instagram';

    const account = db.prepare(`
      SELECT access_token FROM social_accounts 
      WHERE user_id = ? AND platform = ? AND status = 'active'
    `).get(req.currentUser.id, platformNormal);

    let publishedMessage = 'Simulation mode run (no linked platform account).';
    if (account && account.access_token) {
      try {
        const { publishToSocialChannel } = await import('../services/socialPublishers.js');
        const pubResult = await publishToSocialChannel(
          platformNormal,
          account.access_token,
          generated.title,
          generated.content,
          imageUrl
        );
        if (pubResult.success) {
          publishedMessage = `Successfully published to ${platformNormal}. Post ID: ${pubResult.platform_post_id}`;
        } else {
          publishedMessage = `Failed to publish to ${platformNormal}: ${pubResult.error}`;
        }
      } catch (pubErr) {
        console.error('[Trigger Campaign] social publishers integration failed:', pubErr);
      }
    }

    // Save post to database
    const insertResult = db.prepare(`
      INSERT INTO campaign_posts (calendar_entry_id, user_id, title, content, image_url, posted_at, platform, likes, shares, comments_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      campaign.id,
      req.currentUser.id,
      generated.title,
      generated.content,
      imageUrl,
      nowStamp(),
      campaign.platform,
      0, // Math.floor(Math.random() * 50 + 10), // Random simulated likes
      0, // Math.floor(Math.random() * 15 + 2),  // Random simulated shares
      0
    );

    const newPostId = insertResult.lastInsertRowid;

    // Seed mock comments
    /* Commented out comment seeding as requested:
    const comments = await generateEngagementComments(generated.content, 2);
    for (const comment of comments) {
      db.prepare(`
        INSERT INTO post_comments (post_id, author_name, author_avatar, content, sentiment, created_at, replied, reply_content, starred)
        VALUES (?, ?, ?, ?, ?, ?, 0, null, 0)
      `).run(
        newPostId,
        comment.name,
        comment.avatar,
        comment.text,
        comment.sentiment,
        nowStamp()
      );
    }
    db.prepare('UPDATE campaign_posts SET comments_count = ? WHERE id = ?').run(comments.length, newPostId);
    */

    return res.json({
      success: true,
      message: 'Campaign post generated and published successfully!',
      status_info: publishedMessage,
      post: {
        id: newPostId,
        title: generated.title,
        content: generated.content,
        image_url: imageUrl,
        platform: campaign.platform
      }
    });

  } catch (error) {
    console.error('Error in POST /:entryId/trigger:', error);
    return sendError(res, toRequestError(error.message, 500));
  }
});

// DELETE /api/calendar/:entryId
router.delete('/:entryId', requireAuth, async (req, res) => {
  const entryId = Number(req.params.entryId);
  const ok = await deleteCalendarEntryAsync(entryId, req.currentUser.id);
  if (!ok) return sendError(res, toRequestError('Calendar entry not found', 404));
  return res.status(204).send();
});

export default router;
