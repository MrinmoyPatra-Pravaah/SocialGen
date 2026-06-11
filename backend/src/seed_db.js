import './load_env.js';
import admin from './db/firebase.js';
import { db } from './db/connection.js';
import dotenv from 'dotenv';
import path from 'node:path';

const uid = 'test-user-uid';
const email = 'test@example.com';
const password = 'Password123';

async function seed() {
  console.log('Starting DB Seeding...');

  // 1. Setup Auth User in Emulator
  try {
    await admin.auth().deleteUser(uid);
    console.log('Deleted existing test user.');
  } catch (err) {
    // Ignore if user doesn't exist
  }

  try {
    await admin.auth().createUser({
      uid: uid,
      email: email,
      password: password,
      emailVerified: true
    });
    console.log('Created test user in Firebase Auth Emulator.');
  } catch (err) {
    console.error('Error creating user:', err);
    process.exit(1);
  }

  // 2. Seed Firestore collections
  const fs = admin.firestore();

  // Clean existing collections
  const collections = ['users', 'calendar_entries', 'ai_jobs'];
  for (const coll of collections) {
    const snap = await fs.collection(coll).get();
    const batch = fs.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleaned Firestore collection: ${coll}`);
  }

  const now = new Date().toISOString().replace('Z', '');

  // Add User profile
  await fs.collection('users').doc(uid).set({
    email: email,
    brand_voice: JSON.stringify({
      sliders: {
        formality: 75,
        humor: 20,
        energy: 80,
        technicality: 45,
        warmth: 60
      },
      keywords: ['AI marketing', 'content automation', 'SaaS scalability', 'growth hacking'],
      avoidWords: ['synergy', 'paradigm shift', 'outside the box']
    }),
    gemini_api_key: 'AIzaSyDDeZQ7gHc-N-HvYCAyfvBoabyauDKND88',
    created_at: Date.now()
  });
  console.log('Seeded users collection.');

  // Add Calendar Entries
  const campaign1Id = 'camp-1';
  const campaign2Id = 'camp-2';
  const campaign3Id = 'camp-3';

  await fs.collection('calendar_entries').doc(campaign1Id).set({
    id: campaign1Id,
    user_id: uid,
    campaign_name: '🚀 Q3 SaaS Scaling',
    platform: 'LinkedIn',
    content_topic: 'Leveraging AI for B2B Demand Gen',
    content_goal: 'Generate signups for free trial',
    start_date: '2026-06-11',
    end_date: '2026-06-25',
    posting_frequency: 'Daily',
    notes: 'Professional, technical yet energetic tone. Highlight scalability.',
    created_at: now
  });

  await fs.collection('calendar_entries').doc(campaign2Id).set({
    id: campaign2Id,
    user_id: uid,
    campaign_name: '☀️ Summer Feature Launch',
    platform: 'Twitter (X)',
    content_topic: 'Introducing SocialGen Campaign Analytics',
    content_goal: 'Increase engagement & feature awareness',
    start_date: '2026-06-12',
    end_date: '2026-06-18',
    posting_frequency: 'Bi-weekly',
    notes: 'Exciting, casual and witty. Include screenshots placeholder.',
    created_at: now
  });

  await fs.collection('calendar_entries').doc(campaign3Id).set({
    id: campaign3Id,
    user_id: uid,
    campaign_name: '🎓 Weekly Growth Workshop',
    platform: 'Facebook',
    content_topic: 'Free webinar on AI copywriting best practices',
    content_goal: 'Webinar registrations',
    start_date: '2026-06-14',
    end_date: '2026-06-15',
    posting_frequency: 'Weekly',
    notes: 'Educational, warm and inviting.',
    created_at: now
  });
  console.log('Seeded calendar_entries collection.');

  // Add AI Jobs
  const job1Id = 'job-1';
  const job2Id = 'job-2';
  const job3Id = 'job-3';

  await fs.collection('ai_jobs').doc(job1Id).set({
    id: job1Id,
    user_id: uid,
    status: 'completed',
    topic: 'How to Build an AI-Driven Marketing Engine in 2026',
    keywords: 'AI, marketing automation, SaaS',
    tone: 'Professional & Authoritative',
    audience: 'CMOs and Growth Managers',
    goal: 'Educate on automated campaign workflow',
    platform: 'Blog & Captions',
    length: 'Long (1200 words)',
    result_content: `# How to Build an AI-Driven Marketing Engine in 2026

Artificial intelligence has evolved from a simple copywriting aid to the core engine of modern marketing departments. If your team is still writing every blog, newsletter, and social post manually from scratch, you are falling behind.

## The Three Pillars of Modern Marketing Automation

1. **Brand Voice Tuning**: Standardizing your brand parameters (formality, humor, technicality) across all models.
2. **Dynamic Campaign Planning**: Consolidating content generation with schedule planning.
3. **Closed-Loop Feedback**: Classifying community comments automatically to respond with context.

---
# Social Media Promotional Captions
## Twitter/X
Building a marketing engine in 2026? 🚀 Here is how to combine AI copywriting, brand voice calibration, and social listening into a single system. #MarketingAI #GrowthSaaS

## LinkedIn
Generic AI outputs fail because they lack brand consistency. In our latest piece, we explore the 3 pillars of AI-driven marketing and how you can establish a dedicated content generation pipeline that preserves your unique voice. Read on! #B2BSaaS #BrandTuning #ContentStrategy

## Instagram
Scale your brand, not your workload. Learn how top marketing teams are using Gemini 2.5 Flash to generate, organize, and publish social media campaigns. Link in bio! 🌟 #SocialMarketing #AI`,
    error_message: null,
    created_at: now,
    updated_at: now
  });

  await fs.collection('ai_jobs').doc(job2Id).set({
    id: job2Id,
    user_id: uid,
    status: 'completed',
    topic: 'The Power of Consistency in Branding',
    keywords: 'brand identity, marketing',
    tone: 'Warm & Educational',
    audience: 'Founders',
    goal: 'Build trust',
    platform: 'LinkedIn',
    length: 'Medium (600 words)',
    result_content: `# The Power of Consistency in Branding

Consistency is the secret sauce of memorable brands. Whether you publish daily or weekly, presenting a coherent tone and style across all touchpoints is crucial for long-term customer trust...`,
    error_message: null,
    created_at: now,
    updated_at: now
  });

  await fs.collection('ai_jobs').doc(job3Id).set({
    id: job3Id,
    user_id: uid,
    status: 'failed',
    topic: 'Under the Hood of Instagram Algorithm',
    keywords: 'instagram, SEO',
    tone: 'Casual',
    audience: 'Creators',
    goal: 'Increase reach',
    platform: 'Instagram',
    length: 'Short (300 words)',
    result_content: null,
    error_message: 'Gemini API call timed out after 15000ms. Please check your network connection.',
    created_at: now,
    updated_at: now
  });
  console.log('Seeded ai_jobs collection.');

  // 3. Seed SQLite collections
  try {
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = OFF;');

    // Clean tables
    db.prepare('DELETE FROM social_accounts WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM campaign_posts WHERE user_id = ?').run(uid);
    // Note: post_comments has cascade delete, but let's delete explicitly to be sure
    db.prepare('DELETE FROM post_comments WHERE post_id IN (SELECT id FROM campaign_posts WHERE user_id = ?)').run(uid);
    console.log('Cleaned SQLite database entries.');

    // Seed Social Accounts
    db.prepare(`
      INSERT INTO social_accounts (user_id, platform, username, avatar_url, access_token, refresh_token, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uid, 'LinkedIn', 'Mrinmoy Patra (Pravaah)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', 'dummy_token', 'dummy_refresh', Date.now() + 30 * 24 * 3600 * 1000, 'active', now);

    db.prepare(`
      INSERT INTO social_accounts (user_id, platform, username, avatar_url, access_token, refresh_token, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uid, 'Twitter', 'mrinmoy_patra', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', 'dummy_token', 'dummy_refresh', Date.now() + 30 * 24 * 3600 * 1000, 'active', now);

    db.prepare(`
      INSERT INTO social_accounts (user_id, platform, username, avatar_url, access_token, refresh_token, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uid, 'Facebook', 'mrinmoy.pravaah', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80', null, null, null, 'disconnected', now);

    console.log('Seeded SQLite social_accounts.');

    // Seed Campaign Posts (which represents our published content)
    // Post 1 (LinkedIn)
    const post1Result = db.prepare(`
      INSERT INTO campaign_posts (calendar_entry_id, user_id, title, content, image_url, posted_at, platform, likes, shares, comments_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1, // Map to campaign 1 (dummy calendar entry ID in SQLite, but wait, SQLite doesn't check foreign key constraints if OFF)
      uid,
      'Building a B2B SaaS Demand Gen Engine',
      `How do you stand out in a noisy B2B SaaS market? 

By publishing highly technical, authoritative content consistently. In this post, we deep dive into the specific prompts and frameworks you can use to automate your content strategy while keeping your brand voice fully aligned.

Read the full breakdown in our newsletter! #B2BSaaS #GrowthSaaS #AI`,
      'https://image.pollinations.ai/prompt/professional%20digital%20workspace%20with%20clean%20charts%20green%20theme?width=800&height=600&nologo=true',
      now,
      'LinkedIn',
      154,
      34,
      3
    );
    const post1Id = post1Result.lastInsertRowid;

    // Post 2 (Twitter)
    const post2Result = db.prepare(`
      INSERT INTO campaign_posts (calendar_entry_id, user_id, title, content, image_url, posted_at, platform, likes, shares, comments_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      2,
      uid,
      'Product Analytics are LIVE! 🚀',
      `No more guessing if your campaigns are working. Our new real-time analytics dashboard is officially live! Track comments, sentiment, and engagement in one view. 

Check your dashboard now! #SaaS #BuildInPublic #AI`,
      'https://image.pollinations.ai/prompt/analytics%20dashboard%20line%20charts%20witty%20flat%20illustration?width=800&height=600&nologo=true',
      now,
      'Twitter (X)',
      89,
      17,
      2
    );
    const post2Id = post2Result.lastInsertRowid;

    console.log('Seeded SQLite campaign_posts.');

    // Seed Comments for Post 1 (LinkedIn)
    db.prepare(`
      INSERT INTO post_comments (post_id, author_name, author_avatar, content, sentiment, created_at, replied, reply_content, starred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post1Id,
      'Sarah Jenkins',
      'SJ',
      'This is exactly what we needed to restructure our marketing funnel. Thanks!',
      'positive',
      now,
      1,
      'Glad it helped, Sarah! Let me know if you need any resources.',
      1
    );

    db.prepare(`
      INSERT INTO post_comments (post_id, author_name, author_avatar, content, sentiment, created_at, replied, reply_content, starred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post1Id,
      'David Chen',
      'DC',
      'How does this scale for smaller teams without dedicated prompt engineers?',
      'neutral',
      now,
      0,
      null,
      0
    );

    db.prepare(`
      INSERT INTO post_comments (post_id, author_name, author_avatar, content, sentiment, created_at, replied, reply_content, starred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post1Id,
      'Alex Mercer',
      'AM',
      'Doesn\'t this lead to generic sounding content if everyone uses it?',
      'negative',
      now,
      0,
      null,
      0
    );

    // Seed Comments for Post 2 (Twitter)
    db.prepare(`
      INSERT INTO post_comments (post_id, author_name, author_avatar, content, sentiment, created_at, replied, reply_content, starred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post2Id,
      'Emily Watson',
      'EW',
      'Just signed up! Can\'t wait to try it out.',
      'positive',
      now,
      1,
      'Welcome aboard, Emily!',
      0
    );

    db.prepare(`
      INSERT INTO post_comments (post_id, author_name, author_avatar, content, sentiment, created_at, replied, reply_content, starred)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post2Id,
      'Marcus Aurelius',
      'MA',
      'Is the coupon code valid for yearly plans as well?',
      'neutral',
      now,
      0,
      null,
      1
    );

    console.log('Seeded SQLite post_comments.');

    db.exec('PRAGMA foreign_keys = ON;');
  } catch (err) {
    console.error('Error seeding SQLite database:', err);
    process.exit(1);
  }

  console.log('DB Seeding completed successfully!');
  process.exit(0);
}

seed();
