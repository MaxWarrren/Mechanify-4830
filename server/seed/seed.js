const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Job = require('../models/Job');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Job.deleteMany();
    await Vehicle.deleteMany();
    await Customer.deleteMany();

    // 1. Create Customers
    const createdCustomers = await Customer.insertMany([
      { name: 'John Doe', email: 'john@example.com', phone: '555-0101', status: 'active', notes: 'Brings the Camry in every 5k miles, prefers Mobil 1.' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', status: 'active', notes: 'New customer referral from John.' },
      { name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0103', status: 'returning' }
    ]);

    // 2. Create Vehicles
    const createdVehicles = await Vehicle.insertMany([
      { customer: createdCustomers[0]._id, make: 'Toyota', model: 'Camry', year: 2018, vin: '1HGCM82633A004', mileage: 45000 },
      { customer: createdCustomers[1]._id, make: 'Honda', model: 'Civic', year: 2020, vin: '2HGFC2F58LH52', mileage: 30000 },
      { customer: createdCustomers[2]._id, make: 'Ford', model: 'F-150', year: 2015, vin: '1FTFW1E8XEF00', mileage: 85000 }
    ]);

    // 3. Create Jobs
    await Job.insertMany([
      { vehicle: createdVehicles[0]._id, description: 'Oil change and tire rotation', status: 'pending', estimatedCost: 80 },
      { vehicle: createdVehicles[1]._id, description: 'Brake pad replacement', status: 'in-progress', estimatedCost: 350 },
      { vehicle: createdVehicles[2]._id, description: 'Transmission flush', status: 'completed', estimatedCost: 200, actualCost: 220 }
    ]);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
