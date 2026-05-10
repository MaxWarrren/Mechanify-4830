const { GoogleGenAI } = require('@google/genai');
const ChatSession = require('../models/ChatSession');
const Manual = require('../models/Manual');
const { sampleChunks } = require('./knowledge.controller');

const INTRO_MODEL = 'gemini-3.1-flash-lite-preview';

async function generateIntroMessage(manual) {
  if (!process.env.GEMINI_API_KEY) {
    return `I have access to **${manual.filename}**. What would you like to know about it?`;
  }
  const chunks = await sampleChunks(manual._id, 6);
  const excerpt = chunks.map(c => `(page ${c.page}) ${c.text}`).join('\n\n');

  const prompt = `You are Mechanify Assistant. The user has selected the manual "${manual.filename}" ` +
    `(${manual.pageCount || 'unknown'} pages). Below are excerpts from it.\n\n` +
    `Excerpts:\n${excerpt || '(no excerpts available yet)'}\n\n` +
    `Write a single short intro message (markdown allowed) that:\n` +
    `1. Confirms you have access to this manual.\n` +
    `2. In one sentence, says what it appears to cover, based on the excerpts.\n` +
    `3. Asks one specific starter question that references something concrete from the excerpts.\n\n` +
    `Keep it under 80 words. Do not invent details that aren't in the excerpts.`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({ model: INTRO_MODEL, contents: prompt });
    return (result.text || '').trim() ||
      `I have access to **${manual.filename}**. What would you like to know about it?`;
  } catch (err) {
    console.warn('Intro generation failed:', err.message);
    return `I have access to **${manual.filename}**. What would you like to know about it?`;
  }
}

exports.listSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({}, 'title updatedAt createdAt manualId')
      .sort({ updatedAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { vehicleId, manualId } = req.body || {};
    if (!manualId) {
      return res.status(400).json({ error: 'manualId is required' });
    }
    const manual = await Manual.findById(manualId);
    if (!manual) return res.status(404).json({ error: 'Manual not found' });

    const session = await ChatSession.create({
      vehicleId: vehicleId || null,
      manualId,
      title: manual.filename
    });

    const intro = await generateIntroMessage(manual);
    session.messages.push({ role: 'assistant', content: intro });
    await session.save();

    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { title, vehicleId } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = title;
    if (vehicleId !== undefined) update.vehicleId = vehicleId || null;

    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(200).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
