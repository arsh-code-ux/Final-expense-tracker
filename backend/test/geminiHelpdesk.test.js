const test = require('node:test');
const assert = require('node:assert/strict');

const geminiRouter = require('../src/routes/gemini');

test('help desk prompt uses the real user problem instead of a generic template', () => {
  const prompt = geminiRouter.buildHelpdeskPrompt({
    title: 'Budget tracking issue',
    description: 'I am moving to a new city and my monthly rent is higher than expected.',
    question: 'How should I rework my monthly budget quickly?'
  });

  assert.match(prompt, /Title:/i);
  assert.match(prompt, /Context and description:/i);
  assert.match(prompt, /Question:/i);
  assert.match(prompt, /Start with a direct answer to the exact question asked|Do NOT output a cookie-cutter response|specific to this case/i);
});

test('preferred provider prioritizes Groq when available', () => {
  const provider = geminiRouter.getPreferredAiProvider({
    GROQ_API_KEY: 'gsk-test',
    GEMINI_API_KEY: 'gemini-test',
    OPENAI_API_KEY: 'openai-test'
  });

  assert.equal(provider, 'groq');
});

test('Groq model list uses supported live model IDs', () => {
  const models = geminiRouter.getGroqModelCandidates({ GROQ_MODEL: 'groq/compound' });

  assert.deepEqual(models[0], 'groq/compound');
  assert.ok(models.includes('openai/gpt-oss-20b'));
  assert.ok(!models.some((model) => model.includes('llama-3.')));
});
