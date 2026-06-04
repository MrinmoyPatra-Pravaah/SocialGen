import { Router } from 'express';
import { db } from '../db/connection.js';
import { mapJobRow } from '../db/queries.js';
import { requireAuth } from '../middleware/auth.js';
import { formatDateTime } from '../utils/helpers.js';

const router = Router();

// GET /api/dashboard/overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.currentUser.id;
    let totalCampaigns = 0;
    let totalBlogs = 0;
    let activeJobs = 0;
    let failedJobs = 0;
    let recentCampaigns = [];
    let recentBlogs = [];
    let recentJobs = [];

    const USE_FIRESTORE = process.env.USE_FIRESTORE === 'true';

    if (USE_FIRESTORE) {
      const fb = await import('../db/firebase.js');
      // Count campaigns
      const campaignsSnap = await fb.db.collection('calendar_entries').where('user_id', '==', userId).get();
      totalCampaigns = campaignsSnap.size;

      // Count blogs
      const completedJobsSnap = await fb.db.collection('ai_jobs').where('user_id', '==', userId).where('status', '==', 'completed').get();
      totalBlogs = completedJobsSnap.size;

      // Count active
      const pendingJobsSnap = await fb.db.collection('ai_jobs').where('user_id', '==', userId).where('status', 'in', ['pending', 'processing']).get();
      activeJobs = pendingJobsSnap.size;

      // Count failed
      const failedJobsSnap = await fb.db.collection('ai_jobs').where('user_id', '==', userId).where('status', '==', 'failed').get();
      failedJobs = failedJobsSnap.size;

      // Get recent campaigns
      recentCampaigns = await fb.queryCollection('calendar_entries', [['user_id', '==', userId]], 'created_at', 5);

      // Get recent completed blogs (jobs)
      recentBlogs = await fb.queryCollection('ai_jobs', [['user_id', '==', userId], ['status', '==', 'completed']], 'updated_at', 5);

      // Get recent jobs (any status)
      recentJobs = await fb.queryCollection('ai_jobs', [['user_id', '==', userId]], 'created_at', 5);
      recentJobs = recentJobs.map(mapJobRow);
    } else {
      totalCampaigns = db.prepare('SELECT COUNT(*) AS count FROM calendar_entries WHERE user_id = ?').get(userId).count;
      totalBlogs = db.prepare('SELECT COUNT(*) AS count FROM ai_jobs WHERE user_id = ? AND status = ?').get(userId, 'completed').count;
      activeJobs = db.prepare('SELECT COUNT(*) AS count FROM ai_jobs WHERE user_id = ? AND status IN (?, ?)').get(userId, 'pending', 'processing').count;
      failedJobs = db.prepare('SELECT COUNT(*) AS count FROM ai_jobs WHERE user_id = ? AND status = ?').get(userId, 'failed').count;

      recentCampaigns = db.prepare('SELECT * FROM calendar_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId);
      recentBlogs = db.prepare('SELECT * FROM ai_jobs WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 5').all(userId, 'completed');
      recentJobs = db.prepare('SELECT * FROM ai_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId).map(mapJobRow);
    }

    const activities = [];

    for (const campaign of recentCampaigns) {
      activities.push({
        type: 'campaign',
        id: String(campaign.id),
        title: `Scheduled Campaign: ${campaign.campaign_name}`,
        subtitle: `${campaign.platform} • Topic: ${campaign.content_topic}`,
        date: formatDateTime(campaign.created_at)
      });
    }

    for (const blog of recentBlogs) {
      activities.push({
        type: 'blog',
        id: blog.id,
        title: `Generated Blog: ${blog.topic}`,
        subtitle: `Tone: ${blog.tone} • Length: ${blog.length}`,
        date: formatDateTime(blog.updated_at)
      });
    }

    activities.sort((left, right) => new Date(right.date) - new Date(left.date));

    return res.json({
      stats: {
        total_campaigns: totalCampaigns,
        total_blogs: totalBlogs,
        active_jobs: activeJobs,
        failed_jobs: failedJobs
      },
      recent_activities: activities.slice(0, 5),
      recent_jobs: recentJobs
    });
  } catch (error) {
    console.error('Error in /overview:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
