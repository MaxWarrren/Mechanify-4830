const mongoose = require('mongoose');

const ManualChunkSchema = new mongoose.Schema({
  manualId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manual',
    required: true,
    index: true
  },
  page: {
    type: Number,
    required: true,
    min: 1
  },
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  }
});

module.exports = mongoose.model('ManualChunk', ManualChunkSchema);
