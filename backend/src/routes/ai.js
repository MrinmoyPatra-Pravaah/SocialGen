import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { GEMINI_API_KEY } from '../config/index.js';
import { 
  findJobByIdAsync, 
  getAllJobsForUserAsync, 
  createJobAsync, 
  updateJobAsync, 
  deleteJobAsync, 
  mapJobRow 
} from '../db/queries.js';
import { requireAuth } from '../middleware/auth.js';
import { toRequestError, sendError } from '../utils/helpers.js';
import { runAiGenerationTask } from '../services/gemini.js';

const router = Router();

// POST /api/ai/jobs
router.post('/jobs', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const jobId = randomUUID();

    const created = await createJobAsync({
      id: jobId,
      user_id: req.currentUser.id,
      status: 'pending',
      website_url: body.website_url ?? null,
      topic: body.topic,
      keywords: body.keywords ?? null,
      tone: body.tone,
      audience: body.audience ?? null,
      goal: body.goal ?? null,
      platform: body.platform ?? null,
      length: body.length ?? 'Medium',
      result_content: null,
      error_message: null
    });

    process.nextTick(() => {
      void runAiGenerationTask(jobId);
    });

    return res.status(201).json(created);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// GET /api/ai/jobs
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const statusFilter = req.query.status_filter;
    const jobs = await getAllJobsForUserAsync(req.currentUser.id, statusFilter);
    return res.json(jobs);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// GET /api/ai/jobs/:jobId
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const job = await findJobByIdAsync(req.params.jobId, req.currentUser.id);

    if (!job) {
      return sendError(res, toRequestError('AI Job not found', 404));
    }

    return res.json(mapJobRow(job));
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/ai/jobs/:jobId/retry
router.post('/jobs/:jobId/retry', requireAuth, async (req, res) => {
  try {
    const job = await findJobByIdAsync(req.params.jobId, req.currentUser.id);
    if (!job) {
      return sendError(res, toRequestError('AI Job not found', 404));
    }

    if (!['failed', 'completed'].includes(job.status)) {
      return sendError(res, toRequestError(`Cannot retry a job in '${job.status}' state`, 400));
    }

    const updated = await updateJobAsync(job.id, req.currentUser.id, {
      status: 'pending',
      error_message: null
    });

    process.nextTick(() => {
      void runAiGenerationTask(job.id);
    });

    return res.json(updated);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/ai/jobs/:jobId/cancel
router.post('/jobs/:jobId/cancel', requireAuth, async (req, res) => {
  try {
    const job = await findJobByIdAsync(req.params.jobId, req.currentUser.id);
    if (!job) {
      return sendError(res, toRequestError('AI Job not found', 404));
    }

    if (!['pending', 'processing'].includes(job.status)) {
      return sendError(res, toRequestError(`Cannot cancel a job in '${job.status}' state`, 400));
    }

    const updated = await updateJobAsync(job.id, req.currentUser.id, {
      status: 'failed',
      error_message: 'Cancelled by user'
    });

    return res.json(updated);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// PUT /api/ai/jobs/:jobId
router.put('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const job = await findJobByIdAsync(req.params.jobId, req.currentUser.id);
    if (!job) {
      return sendError(res, toRequestError('AI Job not found', 404));
    }

    if (job.status !== 'completed') {
      return sendError(res, toRequestError('Only completed jobs can have their text updated', 400));
    }

    const { result_content } = req.body || {};
    const updated = await updateJobAsync(job.id, req.currentUser.id, {
      result_content
    });

    return res.json(updated);
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// DELETE /api/ai/jobs/:jobId
router.delete('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteJobAsync(req.params.jobId, req.currentUser.id);
    if (!deleted) {
      return sendError(res, toRequestError('AI Job not found', 404));
    }
    return res.status(204).send();
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/ai/remix — Transform content for multiple platforms
router.post('/remix', requireAuth, async (req, res) => {
  try {
    const { content, tone_level } = req.body || {};
    if (!content) {
      return sendError(res, toRequestError('Content is required', 400));
    }

    const toneDesc = tone_level < 30 ? 'very formal and professional' : tone_level > 70 ? 'casual and conversational' : 'balanced and approachable';
    const prompt = `You are an expert social media copywriter. Transform the following content into optimized posts for each platform. The tone should be ${toneDesc}.

Original Content:
${content}

Return a JSON object with these keys: twitter, linkedin, instagram, facebook, email. Each value should be the optimized post text for that platform. Follow platform best practices (character limits, hashtag conventions, formatting). Return ONLY valid JSON, no markdown fences.`;

    const apiKey = GEMINI_API_KEY || '';

    if (!apiKey) {
      return sendError(res, toRequestError('Gemini API key not configured', 400));
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    });

    const data = await response.json().catch(() => ({}));
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
    
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const remixes = JSON.parse(cleaned);
      return res.json({ remixes });
    } catch {
      return res.json({ remixes: { twitter: text.slice(0, 280), linkedin: text, instagram: text, facebook: text, email: text } });
    }
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

// POST /api/ai/hashtags — Generate hashtag recommendations
router.post('/hashtags', requireAuth, async (req, res) => {
  try {
    const { topic, platform } = req.body || {};
    if (!topic) {
      return sendError(res, toRequestError('Topic is required', 400));
    }

    const prompt = `You are a social media strategist specializing in hashtag research. For the topic "${topic}" on ${platform || 'Instagram'}, generate hashtag recommendations.

Return a JSON object with these keys:
- high_reach: array of 6 high-reach hashtags (1M+ potential impressions)
- medium_reach: array of 6 medium-reach hashtags (100K-1M impressions)
- niche: array of 6 niche/targeted hashtags (<100K but highly relevant)
- platform_tips: a short tip about hashtag usage on ${platform || 'Instagram'}

All hashtags should start with #. Return ONLY valid JSON, no markdown fences.`;

    const apiKey = GEMINI_API_KEY || '';

    if (!apiKey) {
      return sendError(res, toRequestError('Gemini API key not configured', 400));
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
      })
    });

    const data = await response.json().catch(() => ({}));
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
    
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return res.json(JSON.parse(cleaned));
    } catch {
      return res.json({
        high_reach: ['#' + topic.replace(/\s/g, ''), '#Marketing', '#Growth', '#Strategy', '#Business', '#Content'],
        medium_reach: ['#ContentMarketing', '#DigitalStrategy', '#SocialMedia', '#BrandGrowth', '#OnlineBusiness', '#MarketingTips'],
        niche: ['#' + topic.replace(/\s/g, '') + '2026', '#NicheMarketing', '#GrowthHacking', '#ContentCreator', '#SmartMarketing', '#DataDriven'],
        platform_tips: `For ${platform || 'Instagram'}, mix popular and niche hashtags for optimal reach.`
      });
    }
  } catch (error) {
    return sendError(res, toRequestError(error.message, 500));
  }
});

export default router;
