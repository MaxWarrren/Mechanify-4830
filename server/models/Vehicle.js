const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'A vehicle must belong to a customer']
  },
  make: {
    type: String,
    required: [true, 'Please add a make']
  },
  model: {
    type: String,
    required: [true, 'Please add a model']
  },
  year: {
    type: Number,
    required: [true, 'Please add a year'],
    min: [1900, 'Year must be valid'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  vin: {
    type: String,
    required: [true, 'Please add a VIN'],
    unique: true
  },
  mileage: {
    type: Number,
    required: [true, 'Please add mileage'],
    min: [0, 'Mileage cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
