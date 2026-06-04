import { GEMINI_API_KEY } from '../config/index.js';

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini error');
  }
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
}

export async function fetchCommentsFromExternalApi(count) {
  try {
    // Fetch comments from DummyJSON
    const commentsRes = await fetch(`https://dummyjson.com/comments?limit=${count}&skip=${Math.floor(Math.random() * 50)}`);
    const commentsData = await commentsRes.json();
    
    // Fetch users from randomuser.me for names and avatars
    const usersRes = await fetch(`https://randomuser.me/api/?results=${count}`);
    const usersData = await usersRes.json();

    const comments = [];
    for (let i = 0; i < count; i++) {
      const apiComment = commentsData.comments?.[i] || { body: 'Great insights!' };
      const apiUser = usersData.results?.[i] || { name: { first: 'John', last: 'Doe' }, picture: { thumbnail: '' } };
      
      const firstName = apiUser.name.first || 'John';
      const lastName = apiUser.name.last || 'Doe';
      const initials = (firstName[0] + lastName[0]).toUpperCase();
      
      // Basic sentiment detection
      let sentiment = 'positive';
      const lowercaseBody = apiComment.body.toLowerCase();
      if (lowercaseBody.includes('not') || lowercaseBody.includes('no') || lowercaseBody.includes('fail') || lowercaseBody.includes('bad')) {
        sentiment = 'negative';
      } else if (lowercaseBody.includes('how') || lowercaseBody.includes('what') || lowercaseBody.includes('why') || lowercaseBody.includes('question')) {
        sentiment = 'neutral';
      }

      comments.push({
        name: `${firstName} ${lastName}`,
        text: apiComment.body,
        sentiment: sentiment,
        avatar: initials
      });
    }
    return comments;
  } catch (err) {
    console.error('[EngagementSeeder] External API fallback failed, returning basic generated comments:', err);
    return [
      { name: 'John Doe', text: 'Highly relevant information. Thanks for sharing!', sentiment: 'positive', avatar: 'JD' },
      { name: 'Jane Smith', text: 'How do you apply this to non-tech startups?', sentiment: 'neutral', avatar: 'JS' }
    ].slice(0, count);
  }
}

export async function generateEngagementComments(postContent, count = 2) {
  const prompt = `You are a social media audience simulator. Read this social media post content:
"${postContent}"

Generate exactly ${count} realistic, engaging comments on this post from different simulated users (keep comments under 25 words each).
Return a JSON array of objects, where each object has:
- "name": full name of the user (e.g. "Alice Connor")
- "text": comment body text.
- "sentiment": "positive", "neutral", or "negative".
- "avatar": initials of the user (e.g. "AC").

Return ONLY the JSON array. Do not wrap it in markdown fences.`;

  if (GEMINI_API_KEY) {
    try {
      const rawText = await generateWithGemini(prompt);
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, count);
      }
    } catch (err) {
      console.error('[EngagementSeeder] Gemini comments generation failed, falling back to external APIs:', err);
    }
  }

  // Fallback to external API
  console.log('[EngagementSeeder] Seeding comments from external APIs (dummyjson/randomuser)...');
  return await fetchCommentsFromExternalApi(count);
}
