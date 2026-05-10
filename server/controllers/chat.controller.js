const { GoogleGenAI } = require('@google/genai');
const Vehicle = require('../models/Vehicle');
const Job = require('../models/Job');
const Manual = require('../models/Manual');
const ChatSession = require('../models/ChatSession');
const { searchChunks } = require('./knowledge.controller');

const CHAT_MODEL = 'gemini-3.1-flash-lite-preview';
const HISTORY_WINDOW = 10;

async function buildSystemContext(message, session) {
  let context = 'You are Mechanify Assistant, an expert automotive advisor for a mechanic shop. ' +
    'Answer the user clearly and concisely. Use markdown for formatting (headings, bold, lists, code).\n\n';

  const manual = await Manual.findById(session.manualId);
  if (manual) {
    context += `You are answering with reference to the manual "${manual.filename}"`;
    if (manual.pageCount) context += ` (${manual.pageCount} pages)`;
    context += `.\n\n`;
  }

  context += 'When you cite information from the manual excerpts below, ALWAYS include the page number in your answer using the format (page X). ' +
    'If multiple excerpts support a point, list each page. ' +
    'If the question is not covered by any excerpt, say so plainly and then answer from general automotive knowledge without citing pages.\n\n';

  if (session.vehicleId) {
    const vehicle = await Vehicle.findById(session.vehicleId).populate('customer', 'name');
    if (vehicle) {
      context += 'Vehicle context:\n';
      context += `- ${vehicle.year} ${vehicle.make} ${vehicle.model}\n`;
      context += `- VIN: ${vehicle.vin}\n`;
      context += `- Mileage: ${vehicle.mileage}\n`;
      context += `- Owner: ${vehicle.customer ? vehicle.customer.name : 'Unknown'}\n\n`;

      const jobs = await Job.find({ vehicle: vehicle._id }).sort({ createdAt: -1 });
      if (jobs.length > 0) {
        context += 'Repair history:\n';
        for (const job of jobs) {
          const cost = job.actualCost != null ? `$${job.actualCost}` : `$${job.estimatedCost} est`;
          context += `- ${job.description} [${job.status}] (${cost})\n`;
        }
        context += '\n';
      }
    }
  }

  const chunks = await searchChunks(message, {
    limit: 5,
    manualIds: [session.manualId]
  });
  if (chunks.length > 0) {
    context += 'Relevant manual excerpts:\n';
    chunks.forEach(c => {
      context += `[page ${c.page}] ${c.text}\n\n`;
    });
  } else {
    context += 'No directly relevant manual excerpts were found for this question.\n\n';
  }

  return context;
}

exports.handleChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.manualId) {
      return res.status(400).json({ error: 'Session is missing a referenced manual' });
    }

    session.messages.push({ role: 'user', content: message });
    await session.save();

    const systemContext = await buildSystemContext(message, session);
    const history = session.messages.slice(-HISTORY_WINDOW);
    const transcript = history
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    const prompt = `${systemContext}\nConversation so far:\n${transcript}\n\nAssistant:`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents: prompt
    });

    let assistantText = '';
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        assistantText += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    session.messages.push({ role: 'assistant', content: assistantText });
    await session.save();

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};
