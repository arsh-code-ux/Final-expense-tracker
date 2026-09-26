const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const Note = require('../models/Note');
const router = express.Router();

function safeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function getProjectData(projectId, userId) {
  const project = await Project.findById(projectId).populate('members.user', 'name email');
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });

  const isMember = project.owner.equals(userId) || project.members.some((m) => m.user && m.user.equals(userId));
  if (!isMember) throw Object.assign(new Error('You are not a member of this project'), { statusCode: 403 });

  const expenses = await Transaction.find({ spaceId: projectId }).sort({ date: -1 }).limit(50);
  const notes = await Note.find({ spaceId: projectId }).sort({ updatedAt: -1 }).limit(20);

  return { project, expenses, notes };
}

async function callGroq(prompt, systemInstruction) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw Object.assign(new Error('GROQ_API_KEY is missing on the backend'), { statusCode: 500 });
  }

  const modelCandidates = ['groq/compound', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

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
          temperature: 0.7,
          max_tokens: 700
        })
      });

      if (!response.ok) {
        const text = await response.text();
        if (response.status === 404) {
          console.warn(`Groq model unavailable: ${model}`, text);
          continue;
        }
        throw new Error(`Groq API error: ${response.status} ${text}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content.trim();
    } catch (error) {
      if (model === modelCandidates[modelCandidates.length - 1]) {
        throw error;
      }
    }
  }

  throw new Error('AI model could not generate a response');
}

function buildBudgetSummary(project, expenses, notes) {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const categoryTotals = {};
  const memberTotals = {};

  expenses.forEach((expense) => {
    const category = expense.category || 'Uncategorized';
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount || 0);

    const memberId = expense.userId?.toString();
    if (memberId) {
      memberTotals[memberId] = (memberTotals[memberId] || 0) + Number(expense.amount || 0);
    }
  });

  return {
    projectName: project.name,
    budget: Number(project.budget || 0),
    totalSpent,
    remaining: Number(project.budget || 0) - totalSpent,
    categoryTotals,
    memberTotals,
    recentExpenses: expenses.slice(0, 8).map((expense) => ({
      title: expense.notes || expense.category,
      amount: Number(expense.amount || 0),
      category: expense.category,
      userId: expense.userId?.toString(),
      date: expense.date
    })),
    notes: notes.slice(0, 6).map((note) => ({ title: note.title, content: note.content }))
  };
}

router.post('/analyze-budget', auth, async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

    const { project, expenses, notes } = await getProjectData(projectId, req.user._id);
    const summary = buildBudgetSummary(project, expenses, notes);

    const prompt = `Analyze this budget for a collaborative financial space. Keep the answer practical and brief.\n\nProject: ${summary.projectName}\nBudget: ₹${summary.budget}\nTotal spent: ₹${summary.totalSpent}\nRemaining: ₹${summary.remaining}\n\nCategory totals: ${JSON.stringify(summary.categoryTotals, null, 2)}\n\nMember totals: ${JSON.stringify(summary.memberTotals, null, 2)}\n\nRecent expenses: ${JSON.stringify(summary.recentExpenses, null, 2)}\n\nRelevant notes:\n${summary.notes.map((note) => `- ${note.title}: ${note.content}`).join('\n') || 'No notes.'}\n\nProvide a short budget analysis with 3 bullet points and 3 practical suggestions. Mention that this is informational budgeting help and not professional financial advice.`;

    const systemInstruction = 'You are a helpful personal finance assistant. Give clear, practical budget analysis in plain language. Avoid exaggerated claims or guaranteed recommendations. This is information only, not professional financial advice.';
    const analysis = await callGroq(prompt, systemInstruction);

    res.json({ analysis, summary });
  } catch (err) {
    console.error('Analyze budget error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
});

router.post('/improve-budget', auth, async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

    const { project, expenses, notes } = await getProjectData(projectId, req.user._id);
    const summary = buildBudgetSummary(project, expenses, notes);

    const prompt = `Suggest practical improvements for this budget.\n\nProject: ${summary.projectName}\nBudget: ₹${summary.budget}\nSpent: ₹${summary.totalSpent}\nRemaining: ₹${summary.remaining}\n\nCategory totals: ${JSON.stringify(summary.categoryTotals, null, 2)}\n\nMember totals: ${JSON.stringify(summary.memberTotals, null, 2)}\n\nRecent expenses: ${JSON.stringify(summary.recentExpenses, null, 2)}\n\nNotes: ${JSON.stringify(summary.notes, null, 2)}\n\nGive simple improvements and a realistic action plan. Do not make unrealistic claims.`;

    const systemInstruction = 'You are a practical budget coach. Provide concise, realistic improvement ideas for monthly spending, savings, and shared budget health.';
    const suggestion = await callGroq(prompt, systemInstruction);

    res.json({ suggestion, summary });
  } catch (err) {
    console.error('Improve budget error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
});

router.post('/explain-note', auth, async (req, res) => {
  try {
    const { projectId, noteId } = req.body;
    if (!projectId || !noteId) return res.status(400).json({ message: 'Project ID and note ID are required' });

    const { project } = await getProjectData(projectId, req.user._id);
    const note = await Note.findOne({ _id: noteId, spaceId: projectId || project._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const prompt = `Explain this note in simple language for someone managing a shared budget.\n\n${note.content}`;
    const systemInstruction = 'You are a clear, friendly budgeting assistant. Explain the note in simple language without sounding robotic.';
    const explanation = await callGroq(prompt, systemInstruction);

    res.json({ explanation, note: { title: note.title, content: note.content } });
  } catch (err) {
    console.error('Explain note error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
});

router.post('/improve-note', auth, async (req, res) => {
  try {
    const { projectId, noteId } = req.body;
    if (!projectId || !noteId) return res.status(400).json({ message: 'Project ID and note ID are required' });

    const { project } = await getProjectData(projectId, req.user._id);
    const note = await Note.findOne({ _id: noteId, spaceId: projectId || project._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const prompt = `Improve this markdown note for clarity and budget planning. Keep it useful and organized. Return improved markdown only.\n\n${note.content}`;
    const systemInstruction = 'You are a budgeting note editor. Improve structure, clarity, and organization while keeping the original meaning. Output Markdown only.';
    const improved = await callGroq(prompt, systemInstruction);

    res.json({ improved, original: note.content });
  } catch (err) {
    console.error('Improve note error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
});

router.post('/ask', auth, async (req, res) => {
  try {
    const { projectId, question } = req.body;
    if (!projectId || !safeText(question)) return res.status(400).json({ message: 'Project ID and question are required' });

    const { project, expenses, notes } = await getProjectData(projectId, req.user._id);
    const summary = buildBudgetSummary(project, expenses, notes);

    const prompt = `Answer this user question using actual project data only. Do not invent numbers.\n\nQuestion: ${question}\n\nProject: ${summary.projectName}\nBudget: ₹${summary.budget}\nSpent: ₹${summary.totalSpent}\nRemaining: ₹${summary.remaining}\n\nCategory totals: ${JSON.stringify(summary.categoryTotals, null, 2)}\n\nMember totals: ${JSON.stringify(summary.memberTotals, null, 2)}\n\nRecent expenses: ${JSON.stringify(summary.recentExpenses, null, 2)}\n\nNotes: ${JSON.stringify(summary.notes, null, 2)}`;

    const systemInstruction = 'You are a finance-aware assistant. Answer with the actual numbers provided and clearly state if the data is insufficient. Do not invent values.';
    const answer = await callGroq(prompt, systemInstruction);

    res.json({ answer, summary });
  } catch (err) {
    console.error('Ask AI error:', err);
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
