const express = require('express');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');
const { formatAmount } = require('../utils/currency');

const router = express.Router();

const demoUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

function sanitizeAssistantText(text = '') {
  if (!text || typeof text !== 'string') return '';

  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*+(?!\s)/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*[|•▪️]\s*/gm, '')
    .replace(/^\s*---+\s*$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

  return cleaned.replace(/\n{3,}/g, '\n\n');
}

async function generateGroqFinanceReply(message, summary, userCurrency) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is missing');
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
            {
              role: 'system',
              content: `You are TrackExpense AI, a warm, practical assistant who helps with personal finance and everyday life questions. Use the user's financial data when relevant, but answer general questions naturally and helpfully too. Be friendly, specific, and supportive. If the question is about money, tailor advice to the user's transaction summary and current balance. If the question is general, provide a useful, direct answer without being robotic. Keep responses clear, realistic, and action-oriented. Write in plain prose with short paragraphs. Avoid markdown headings, bold markers, bullet stars, code fences, separators like --- or pipes, and unnecessary list formatting. If you use a list, keep it very short and simple without markdown symbols.`
            },
            {
              role: 'user',
              content: `User question: ${message}\n\nUser financial summary:\n${summary}\n\nUser preferred currency: ${userCurrency}\n\nAnswer in a helpful, natural way. If the question is financial, use the summary. If it is general, still be useful and practical. Keep it concise but complete. Use plain language, short paragraphs, and no markdown noise.`
            }
          ],
          temperature: 0.8,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 404) {
          console.warn(`Groq model ${model} unavailable; trying next model. Details: ${body}`);
          continue;
        }
        throw new Error(`Groq API error: ${response.status} ${body}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return sanitizeAssistantText(content);
    } catch (error) {
      if (model === modelCandidates[modelCandidates.length - 1]) {
        throw error;
      }
    }
  }

  throw new Error('Groq finance model could not generate a response');
}

function buildTransactionSummary(transactions, userCurrency) {
  if (!transactions || transactions.length === 0) {
    return `No transactions yet. The user has not added any financial activity yet. Encourage them to add expenses and income to get tailored insights.`;
  }

  const expenses = transactions.filter((t) => t.type === 'expense');
  const incomes = transactions.filter((t) => t.type === 'income');
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const categoryMap = {};
  expenses.forEach((tx) => {
    const category = tx.category || 'Uncategorized';
    categoryMap[category] = (categoryMap[category] || 0) + Number(tx.amount || 0);
  });

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, amount]) => `${category}: ${formatAmount(amount, userCurrency)}`)
    .join('; ');

  const recent = transactions.slice(0, 8).map((t) => `${t.type} ${t.category} ${formatAmount(Number(t.amount || 0), userCurrency)} on ${new Date(t.date).toISOString().slice(0, 10)}`).join(' | ');

  return `Income total: ${formatAmount(totalIncome, userCurrency)}. Expense total: ${formatAmount(totalExpense, userCurrency)}. Net balance: ${formatAmount(netBalance, userCurrency)}. Top categories: ${topCategories || 'None yet'}. Recent activity: ${recent}.`;
}

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'Please enter a valid financial question.' });
    }

    const userId = req.user ? req.user._id : demoUserId;

    let userCurrency = 'USD';
    if (req.user) {
      const user = await User.findById(req.user._id).select('preferences');
      userCurrency = user?.preferences?.currency || 'USD';
    }

    const recentTransactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(30);
    const summary = buildTransactionSummary(recentTransactions, userCurrency);

    try {
      const reply = await generateGroqFinanceReply(message, summary, userCurrency);
      return res.json({ reply });
    } catch (groqError) {
      const expenseTotal = recentTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const incomeTotal = recentTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const balance = incomeTotal - expenseTotal;

      const fallbackReply = recentTransactions.length
        ? `I can still help here. Based on your recent data, your net balance is ${formatAmount(balance, userCurrency)}, with ${formatAmount(expenseTotal, userCurrency)} spent and ${formatAmount(incomeTotal, userCurrency)} earned. For your question, the best first step is to look at the biggest expense category and set a clear next action, such as reducing one wasteful category or increasing your savings target for the month.`
        : `I can help with this. Since you have not added transaction data yet, I would still suggest starting with a clear goal, a simple daily routine, and a realistic spending plan. If you want, add your expenses and income and I can turn that into a better budget or savings plan.`;

      return res.json({ reply: fallbackReply });
    }
  } catch (err) {
    console.error('Chat error:', err);
    res.json({
      reply: 'I hit a small issue while preparing your financial answer. Please try again and I’ll help you with your spending, budget, or savings question.'
    });
  }
});

module.exports = router;
module.exports.sanitizeAssistantText = sanitizeAssistantText;
