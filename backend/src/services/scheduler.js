import { db, nowStamp } from '../db/connection.js';
import { GEMINI_API_KEY } from '../config/index.js';
import { publishToSocialChannel } from './socialPublishers.js';
import { generateEngagementComments } from './engagementSeeder.js';

// Helper to query Gemini
async function askGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured in backend.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini error');
  }

  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
}

// Perform campaign automated generation check
export async function checkAndRunAutomatedCampaigns() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all calendar campaigns active today
    const activeCampaigns = db.prepare(`
      SELECT * FROM calendar_entries 
      WHERE start_date <= ? AND end_date >= ?
    `).all(today, today);

    console.log(`[Scheduler] Checking ${activeCampaigns.length} active campaigns for today (${today})...`);

    for (const campaign of activeCampaigns) {
      // Check if post already generated today
      const alreadyPosted = db.prepare(`
        SELECT id FROM campaign_posts 
        WHERE calendar_entry_id = ? AND posted_at LIKE ?
      `).get(campaign.id, `${today}%`);

      if (alreadyPosted) {
        console.log(`[Scheduler] Campaign "${campaign.campaign_name}" already has a post for today.`);
        continue;
      }

      console.log(`[Scheduler] Generating daily post for Campaign "${campaign.campaign_name}"...`);

      // Generate content via Gemini
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

      let generated;
      try {
        const rawText = await askGemini(prompt);
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generated = JSON.parse(cleaned);
      } catch (err) {
        console.error(`[Scheduler] Gemini generation failed for campaign ${campaign.id}:`, err);
        // Fallback content if API fails
        generated = {
          title: `Daily Updates on ${campaign.content_topic}`,
          content: `We are rolling out our daily update on ${campaign.content_topic}! Today's theme focuses on maximizing output and aligning with our primary goal: ${campaign.content_goal}.\n\nWhat are your thoughts on this? Let us know! #Marketing #Growth`,
          image_prompt: `${campaign.content_topic} professional digital design illustration green theme light background`
        };
      }

      // Create creative poster image URL using Pollinations text-to-image generator
      const posterPrompt = encodeURIComponent(generated.image_prompt || `${campaign.content_topic} abstract marketing illustration`);
      const imageUrl = `https://image.pollinations.ai/prompt/${posterPrompt}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*100000)}`;

      // Publish to connected Social Media channel if user has linked accounts
      let platformNormal = campaign.platform;
      if (platformNormal.includes('Twitter')) platformNormal = 'Twitter';
      if (platformNormal.includes('LinkedIn')) platformNormal = 'LinkedIn';
      if (platformNormal.includes('Facebook')) platformNormal = 'Facebook';
      if (platformNormal.includes('Instagram')) platformNormal = 'Instagram';

      const account = db.prepare(`
        SELECT access_token FROM social_accounts 
        WHERE user_id = ? AND platform = ? AND status = 'active'
      `).get(campaign.user_id, platformNormal);

      if (account && account.access_token) {
        console.log(`[Scheduler] Publishing campaign post to live ${platformNormal} API...`);
        const pubResult = await publishToSocialChannel(
          platformNormal,
          account.access_token,
          generated.title,
          generated.content,
          imageUrl
        );
        if (pubResult.success) {
          console.log(`[Scheduler] Social post successfully published. Platform Post ID: ${pubResult.platform_post_id}`);
        } else {
          console.warn(`[Scheduler] Social post publication failed on channel: ${pubResult.error}`);
        }
      } else {
        console.log(`[Scheduler] No connected ${platformNormal} account found for user ${campaign.user_id}. Running in simulation/sandbox mode.`);
      }

      // Save post to database
      const result = db.prepare(`
        INSERT INTO campaign_posts (calendar_entry_id, user_id, title, content, image_url, posted_at, platform, likes, shares, comments_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        campaign.id,
        campaign.user_id,
        generated.title,
        generated.content,
        imageUrl,
        nowStamp(),
        campaign.platform,
        0, // Math.floor(Math.random() * 50 + 10), // Random simulated likes
        0, // Math.floor(Math.random() * 15 + 2),  // Random simulated shares
        0 // comments_count will start at 0 and update
      );

      const newPostId = result.lastInsertRowid;
      console.log(`[Scheduler] Daily post successfully registered in local DB with ID ${newPostId}`);

      // Seed mock comments after 3 seconds
      /* Commented out comment seeding as requested:
      setTimeout(async () => {
        try {
          const comments = await generateEngagementComments(generated.content, Math.floor(Math.random() * 2) + 1);
          
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

          // Update comments_count in campaign_posts
          db.prepare('UPDATE campaign_posts SET comments_count = ? WHERE id = ?').run(comments.length, newPostId);
          console.log(`[Scheduler] Seeded ${comments.length} comments for post ID ${newPostId}`);
        } catch (err) {
          console.error('[Scheduler] Seeding comments failed:', err);
        }
      }, 3000);
      */
    }
  } catch (error) {
    console.error('[Scheduler] Automation check encountered an error:', error);
  }
}

// Scheduler initialization loop
let intervalId = null;
export function startCampaignScheduler() {
  if (intervalId) return;

  console.log('[Scheduler] Social Gen Campaign Automation Scheduler Started.');
  
  // Run check immediately on start
  checkAndRunAutomatedCampaigns();

  // Check every 60 seconds
  intervalId = setInterval(() => {
    checkAndRunAutomatedCampaigns();
  }, 60000);
}

export function stopCampaignScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Scheduler] Social Gen Campaign Automation Scheduler Stopped.');
  }
}
