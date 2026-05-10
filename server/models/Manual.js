const mongoose = require('mongoose');

const ManualSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  sizeBytes: {
    type: Number,
    required: true
  },
  pageCount: {
    type: Number,
    default: 0
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Manual', ManualSchema);
