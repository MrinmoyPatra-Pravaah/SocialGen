import { GEMINI_API_KEY } from '../config/index.js';
import { findJobByIdAsync, findUserByIdAsync, updateJobAsync } from '../db/queries.js';

// ── Prompt builder ───────────────────────────────────────────────────

export function buildGenerationPrompt(job, owner = null) {
  let voiceGuidelines = '';
  
  try {
    if (owner && owner.brand_voice) {
      const voice = JSON.parse(owner.brand_voice);
      const sliders = voice.sliders || {};
      voiceGuidelines = `
Brand Voice Guidelines (adhere to these strictly):
- Formality level: ${sliders.formality || 50}% (higher is more formal, lower is more casual)
- Humor/Playfulness: ${sliders.humor || 30}% (higher is more witty/playful, lower is serious)
- Energy level: ${sliders.energy || 70}% (higher is more enthusiastic/energetic, lower is calm)
- Technicality: ${sliders.technicality || 50}% (higher is more technical/jargon-friendly, lower is simple)
- Warmth/Personableness: ${sliders.warmth || 65}% (higher is warmer, lower is neutral)
`;
      if (voice.keywords && voice.keywords.length > 0) {
        voiceGuidelines += `- Keywords to include when appropriate: ${voice.keywords.join(', ')}\n`;
      }
      if (voice.avoidWords && voice.avoidWords.length > 0) {
        voiceGuidelines += `- Words/Phrases to avoid entirely: ${voice.avoidWords.join(', ')}\n`;
      }
    }
  } catch (err) {
    console.error('Error parsing brand voice for prompt:', err);
  }

  return `
You are an expert copywriter and social media strategist.
Write a highly engaging blog post and corresponding social media posts based on these details:

Topic: ${job.topic}
Website: ${job.website_url || 'N/A'}
Keywords: ${job.keywords || 'N/A'}
Tone: ${job.tone}
Target Audience: ${job.audience || 'General'}
Content Goal: ${job.goal || 'Informative'}
Target Social Platform: ${job.platform || 'LinkedIn'}
Desired Length: ${job.length || 'Medium'}
${voiceGuidelines}

Format the output as clean Markdown:
1. Start with a catchy Title.
2. Write a highly comprehensive, detailed, and authoritative blog post (aim for 800 - 1500 words). Expand deeply on each section:
   - **Introduction**: Provide background context, explain the industry relevance, and state the thesis.
   - **Detailed Key Points**: Create separate, descriptive subheadings for each point. Write multiple paragraphs under each containing deep analysis, real-world examples, and industry statistics or trends.
   - **Actionable Takeaways**: List concrete, tactical steps the reader can implement immediately.
   - **Conclusion**: Summarize insights and end with an engaging call-to-action.
3. At the end, add a section separator "---" followed by "# Social Media Promotional Captions".
4. Provide 3 different promotional social captions tailored to:
   - Twitter/X (short, punchy, with hashtags)
   - LinkedIn (professional, detailed, hook-driven, with hashtags)
   - Instagram (engaging, visually descriptive, with hashtags)
`;
}

// ── Gemini API helpers ───────────────────────────────────────────────

function getGeminiKeyForJob(job) {
  return GEMINI_API_KEY || '';
}

function extractGeminiError(data, responseStatus) {
  const message = data?.error?.message || data?.message || `Gemini request failed with status ${responseStatus}`;
  return message;
}

async function generateWithGemini(job, apiKey, owner = null) {
  const prompt = buildGenerationPrompt(job, owner);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractGeminiError(data, response.status));
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

// ── Background generation task ───────────────────────────────────────

export async function runAiGenerationTask(jobId) {
  let userIdForJob = null;
  try {
    const job = await findJobByIdAsync(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found in database.`);
      return;
    }
    userIdForJob = job.user_id;

    await updateJobAsync(jobId, userIdForJob, { status: 'processing' });
    console.log(`Job ${jobId} status updated to 'processing'.`);

    const activeKey = getGeminiKeyForJob(job);
    if (!activeKey) {
      throw new Error('Gemini API key is not configured for this user or server');
    }

    const owner = await findUserByIdAsync(userIdForJob);
    const resultText = await generateWithGemini(job, activeKey, owner);

    await updateJobAsync(jobId, userIdForJob, {
      status: 'completed',
      result_content: resultText,
      error_message: null
    });

    console.log(`Job ${jobId} processing finished. Status: completed`);
  } catch (error) {
    console.error('Error in background generation task:', error);
    if (userIdForJob) {
      try {
        await updateJobAsync(jobId, userIdForJob, {
          status: 'failed',
          error_message: `Background process error: ${error.message}`
        });
      } catch (dbError) {
        console.error('Could not write failure state to DB:', dbError);
      }
    }
  }
}
