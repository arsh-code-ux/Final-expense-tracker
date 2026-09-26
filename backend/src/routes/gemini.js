const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

function getPreferredAiProvider(env = process.env) {
  if (env.GROQ_API_KEY) return 'groq';
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('placeholder')) return 'openai';
  return null;
}

function getGroqModelCandidates(env = process.env) {
  return [
    env.GROQ_MODEL || 'groq/compound',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
  ];
}

function buildHelpdeskPrompt({ title, description, question }) {
  const safeTitle = String(title || '').trim();
  const safeDescription = String(description || '').trim();
  const safeQuestion = String(question || '').trim();

  return `You are a practical support engineer helping a real user in a personal finance / expense-tracking app. Answer this exact case, not a generic template.

Title: ${safeTitle}
Context and description: ${safeDescription}
Question: ${safeQuestion}

Instructions:
- Start with a direct answer to the exact question asked.
- Use this user's situation only. Do not give a generic advice template.
- Focus on the real root cause, immediate action, and the most useful next step.
- For money-related problems, consider income, recurring expenses, savings buffer, debt, essentials vs wants, and category priorities.
- For app/product issues, think in terms of cause, fix, validation, and what to check next.
- Keep the tone practical, realistic, and helpful for a busy person.
- Include step-by-step actions only when they are specific and actionable.
- Include small examples or checklists only if they materially improve the answer.
- If some details are missing, clearly state the assumption.
- Do NOT repeat boilerplate phrases like "here is a general approach" or "in summary" without real value.
- Do NOT output a cookie-cutter response that could fit any user.

Required result:
Return a clean Markdown answer that is specific to this case. Use only the sections that actually help this user, such as:
## Direct answer
## Why this is happening
## Recommended fix
## Step-by-step plan
## What to monitor next

Make it useful for real-world decision-making and financially sensible.`;
}

async function generateResponse(prompt, systemInstruction = 'You are a helpful AI project assistant.') {
  const provider = getPreferredAiProvider();

  if (provider === 'groq') {
    const groqApiKey = process.env.GROQ_API_KEY;
    const modelCandidates = getGroqModelCandidates();

    for (const model of modelCandidates) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 900
          })
        });

        if (!response.ok) {
          const body = await response.text();
          if (response.status === 404) {
            console.warn(`Groq model ${model} unavailable, trying next model. Details: ${body}`);
            continue;
          }
          throw new Error(`Groq API error: ${response.status} ${body}`);
        }

        const data = await response.json();
        return { text: data.choices?.[0]?.message?.content || 'No response generated.' };
      } catch (err) {
        if (model === modelCandidates[modelCandidates.length - 1]) {
          throw err;
        }
      }
    }
  }

  if (provider === 'gemini') {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1200 }
      })
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return { text: data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || 'No response generated.' };
  }

  if (provider === 'openai') {
    const openAiKey = process.env.OPENAI_API_KEY;
    const { OpenAI } = require('openai');
    const client = new OpenAI({ apiKey: openAiKey });
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
      max_tokens: 800
    });
    return { text: resp.choices?.[0]?.message?.content || '' };
  }

  throw new Error('No AI provider is configured. Add GROQ_API_KEY or GEMINI_API_KEY to backend/.env.');
}

// Explain code or text
router.post('/explain', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'No text provided' });
    const prompt = `Explain the following note or code for the user. Focus only on what it does, important decisions, risks, and practical next steps. Answer the actual content, not a generic template:\n\n${text}`;
    const out = await generateResponse(prompt, 'You are a precise project analyst. Give a readable answer with short headings or paragraphs when useful. Do not add decorative symbols, filler, or unrelated advice.');
    res.json({ explanation: out.text });
  } catch (err) {
    console.error('Gemini explain error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.post('/improve', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'No text provided' });
    const prompt = `Review this note or code and suggest concrete improvements. Preserve the original intent and provide a revised version only when it helps:\n\n${text}`;
    const out = await generateResponse(prompt, 'You are a senior technical editor. Respond specifically to the supplied content, using clean readable Markdown without decorative symbols or filler.');
    res.json({ improved: out.text });
  } catch (err) {
    console.error('Gemini improve error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Generate docs from code/text
router.post('/docs', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'No text provided' });
    const prompt = `Create concise developer documentation for the following code or project content. Include purpose, inputs, outputs, setup, and a small usage example only when supported by the content:\n\n${text}`;
    const out = await generateResponse(prompt, 'You are a technical writer. Do not invent behavior that is not present in the supplied content. Use clear headings and readable Markdown.');
    res.json({ docs: out.text });
  } catch (err) {
    console.error('Gemini docs error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Explain repository README or summarize
router.post('/readme', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'No text provided' });
    const prompt = `Generate a project README from this description or code overview. Include only details supported by the input and keep setup instructions practical:\n\n${text}`;
    const out = await generateResponse(prompt, 'You are a product documentation specialist. Produce clean, readable Markdown without unnecessary decorative symbols.');
    res.json({ readme: out.text });
  } catch (err) {
    console.error('Gemini readme error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

router.post('/helpdesk', auth, async (req, res) => {
  try {
    const { title, description, question } = req.body;
    if (!String(title || '').trim() || !String(description || '').trim() || !String(question || '').trim()) {
      return res.status(400).json({ message: 'Title, description, and question are required' });
    }

    const prompt = buildHelpdeskPrompt({ title, description, question });
    const out = await generateResponse(prompt, 'You are a careful product support engineer and financial planning advisor. Give accurate, realistic, context-specific guidance in readable Markdown. Always answer the user\'s actual question first, use the real details they provided, and avoid generic templates or repeated boilerplate. Call out assumptions clearly when relevant, and suggest practical next steps a real person can act on quickly.');
    res.json({ markdown: out.text, title: `${String(title).trim()} - Help Desk Response` });
  } catch (err) {
    console.error('Help desk AI error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
module.exports.buildHelpdeskPrompt = buildHelpdeskPrompt;
module.exports.getPreferredAiProvider = getPreferredAiProvider;
module.exports.getGroqModelCandidates = getGroqModelCandidates;
