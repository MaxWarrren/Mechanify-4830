const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'A job must be associated with a vehicle']
  },
  description: {
    type: String,
    required: [true, 'Please add a description of the job']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  estimatedCost: {
    type: Number,
    required: [true, 'Please add an estimated cost'],
    min: [0, 'Estimated cost cannot be negative']
  },
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
