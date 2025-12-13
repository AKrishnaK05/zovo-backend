const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Job = require('../models/Job');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // 1. Create Admin
    const adminEmail = 'admin.dashboard@gmail.com';
    await User.deleteOne({ email: adminEmail });
    await User.deleteOne({ email: 'admin@gmail.com' });
    await User.deleteOne({ email: 'admin@helpr.com' });

    const admin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: 'password123',
      securityQuestion: 'What is your favorite food?',
      securityAnswer: 'Pizza',
      role: 'admin',
      phone: '1231231234'
    });
    await admin.save();
    console.log(`Admin created: ${admin.email}`);

    // 2. Setup Workers and Customers
    const worker1Email = 'worker.earnings@gmail.com';
    const worker2Email = 'worker2@test.com';
    const customerEmail = 'customer.earnings@gmail.com';

    // Ensure Worker 1 exists (from seedWorker) or create
    let worker1 = await User.findOne({ email: worker1Email });
    if (!worker1) {
      worker1 = await User.create({
        name: 'Earnings Tester',
        email: worker1Email,
        password: 'password123',
        role: 'worker',
        serviceCategories: ['plumbing'],
        securityQuestion: 'Q', securityAnswer: 'A',
        isAvailable: true
      });
    }
    // Force high rating for graph
    worker1.averageRating = 4.5;
    worker1.totalReviews = 10;
    await worker1.save();

    // Ensure Worker 2
    await User.deleteOne({ email: worker2Email });
    const worker2 = await User.create({
      name: 'Other Worker',
      email: worker2Email,
      password: 'password123',
      role: 'worker',
      serviceCategories: ['cleaning'],
      securityQuestion: 'Q', securityAnswer: 'A',
      averageRating: 4.8,
      totalReviews: 5
    });

    // Ensure Customer
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: 'Graph Customer',
        email: customerEmail,
        password: 'password123',
        role: 'customer',
        securityQuestion: 'Q', securityAnswer: 'A'
      });
    }

    // 3. Clear and Create Jobs
    // Remove jobs for these workers to avoid clutter/dupes
    await Job.deleteMany({ worker: { $in: [worker1._id, worker2._id] } });

    const location = { address: "123 Main St", city: "Test City", lat: 0, lng: 0 };

    console.log('Creating jobs...');

    await Job.create({
      customer: customer._id,
      worker: worker2._id,
      title: 'Clean House',
      description: 'General cleaning',
      category: 'cleaning',
      status: 'completed',
      finalPrice: 120,
      scheduledDate: new Date(),
      location: location
    });

    await Job.create({
      customer: customer._id,
      worker: worker2._id,
      title: 'Deep Clean',
      description: 'Deep cleaning service',
      category: 'cleaning',
      status: 'completed',
      finalPrice: 200,
      scheduledDate: new Date(),
      location: location
    });

    await Job.create({
      customer: customer._id,
      worker: worker1._id,
      title: 'Full Rewiring',
      description: 'Complete electrical rewiring',
      category: 'electrical', // plumbing worker doing electrical? fine for test
      status: 'completed',
      finalPrice: 500,
      scheduledDate: new Date(),
      location: location
    });

    console.log('Jobs created successfully');
    console.log('Seeding done!');
    process.exit();

  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedAdmin();
