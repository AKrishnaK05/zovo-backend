const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Job = require('../models/Job');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedWorker = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create Worker
        const workerEmail = 'worker.earnings@gmail.com';
        await User.deleteOne({ email: workerEmail });

        // Cleanup previous failed test user if exists
        await User.deleteOne({ email: 'worker.earnings@test.com' });

        const worker = await User.create({
            name: 'Earnings Tester',
            email: workerEmail,
            password: 'password123',
            securityQuestion: 'What is your favorite food?',
            securityAnswer: 'Pizza',
            role: 'worker',
            phone: '1234567890',
            serviceCategories: ['plumbing', 'electrical'],
            isAvailable: true
        });

        console.log(`Worker created: ${worker._id}`);

        // 2. Create a Customer (for the job)
        const customerEmail = 'customer.earnings@gmail.com';
        await User.deleteOne({ email: customerEmail });
        await User.deleteOne({ email: 'customer.earnings@test.com' });

        const customer = await User.create({
            name: 'Job Giver',
            email: customerEmail,
            password: 'password123',
            securityQuestion: 'What is your favorite food?',
            securityAnswer: 'Burger',
            role: 'customer',
            phone: '0987654321'
        });

        console.log(`Customer created: ${customer._id}`);

        // 3. Create Completed Jobs
        await Job.deleteMany({ worker: worker._id });

        const job1 = await Job.create({
            customer: customer._id,
            worker: worker._id,
            title: 'Fix Leaking Tap',
            description: 'Kitchen tap is leaking',
            category: 'plumbing',
            status: 'completed',
            location: {
                address: '123 Test St',
                city: 'Test City',
                lat: 0,
                lng: 0
            },
            scheduledDate: new Date(),
            finalPrice: 150
        });

        const job2 = await Job.create({
            customer: customer._id,
            worker: worker._id,
            title: 'Install Ceiling Fan',
            description: 'Bedroom fan installation',
            category: 'electrical',
            status: 'completed',
            location: {
                address: '456 Sample Rd',
                city: 'Test City',
                lat: 0,
                lng: 0
            },
            scheduledDate: new Date(Date.now() - 86400000), // yesterday
            finalPrice: 200
        });

        console.log('Completed jobs created');

        console.log('Seeding done!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedWorker();
