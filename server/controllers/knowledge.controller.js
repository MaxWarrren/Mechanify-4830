const { PDFParse } = require('pdf-parse');
const Manual = require('../models/Manual');
const ManualChunk = require('../models/ManualChunk');

const VOYAGE_MODEL = 'voyage-4-lite';
const VOYAGE_DIM = 1024;
const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';

function chunkPageText(text, chunkSize = 1000, overlap = 200) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];
  const chunks = [];
  let i = 0;
  while (i < cleaned.length) {
    chunks.push(cleaned.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

async function voyageEmbed(texts, inputType) {
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not configured');
  }
  const response = await fetch(VOYAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
      output_dimension: VOYAGE_DIM,
      truncation: true
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage embeddings failed (${response.status}): ${body}`);
  }
  const data = await response.json();
  return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
}

exports.uploadManual = async (req, res) => {
  let manual = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const parser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
    let pages;
    try {
      const result = await parser.getText();
      pages = result.pages;
    } finally {
      await parser.destroy();
    }

    if (!pages || pages.length === 0) {
      return res.status(400).json({ error: 'PDF contained no extractable text' });
    }

    // Build (page, text) pairs, chunking each page so we keep page numbers accurate.
    const records = [];
    for (const page of pages) {
      const pageChunks = chunkPageText(page.text, 1000, 200);
      for (const text of pageChunks) {
        records.push({ page: page.num, text });
      }
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'PDF contained no extractable text' });
    }

    manual = await Manual.create({
      filename: req.file.originalname,
      sizeBytes: req.file.size,
      pageCount: pages.length
    });

    const batchSize = 128;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const vectors = await voyageEmbed(batch.map(r => r.text), 'document');
      await ManualChunk.insertMany(batch.map((r, idx) => ({
        manualId: manual._id,
        page: r.page,
        text: r.text,
        embedding: vectors[idx]
      })));
    }

    res.status(201).json({
      message: 'Manual uploaded and embedded successfully',
      manual,
      chunksProcessed: records.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (manual) {
      await ManualChunk.deleteMany({ manualId: manual._id }).catch(() => {});
      await Manual.findByIdAndDelete(manual._id).catch(() => {});
    }
    res.status(500).json({ error: error.message || 'Failed to process PDF' });
  }
};

exports.getManuals = async (req, res) => {
  try {
    const manuals = await Manual.find().sort({ uploadDate: -1 });
    res.status(200).json(manuals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteManual = async (req, res) => {
  try {
    const manualId = req.params.id;
    await ManualChunk.deleteMany({ manualId });
    const deleted = await Manual.findByIdAndDelete(manualId);
    if (!deleted) {
      return res.status(404).json({ error: 'Manual not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchChunks = async (query, { limit = 5, manualIds = null } = {}) => {
  if (!query || !process.env.VOYAGE_API_KEY) return [];
  try {
    const [vector] = await voyageEmbed([query], 'query');
    const stage = {
      index: 'manual_chunks_vector_index',
      path: 'embedding',
      queryVector: vector,
      numCandidates: Math.max(limit * 20, 100),
      limit
    };
    if (Array.isArray(manualIds) && manualIds.length > 0) {
      const mongoose = require('mongoose');
      stage.filter = {
        manualId: { $in: manualIds.map(id => new mongoose.Types.ObjectId(id)) }
      };
    }
    return await ManualChunk.aggregate([
      { $vectorSearch: stage },
      { $project: { text: 1, manualId: 1, page: 1, score: { $meta: 'vectorSearchScore' } } }
    ]);
  } catch (err) {
    console.warn('Vector search unavailable, falling back to no retrieval:', err.message);
    return [];
  }
};

// Returns a small sampling of chunks from a single manual, for intro generation
// without requiring the vector index to be present.
exports.sampleChunks = async (manualId, limit = 6) => {
  const chunks = await ManualChunk.find({ manualId })
    .sort({ page: 1 })
    .limit(limit)
    .select('text page');
  return chunks;
};
