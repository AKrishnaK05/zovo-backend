const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Review = require('../models/Review');
const Job = require('../models/Job');
const User = require('../models/User');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedReview = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find a completed job
        const job = await Job.findOne({ status: 'completed' });

        if (!job) {
            console.log('No completed job found. Please run seedAdmin.js first.');
            process.exit(1);
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ job: job._id });
        if (existingReview) {
            console.log('Review already exists for this job.');
            // Delete it to cycle the test or just exit? Let's delete it to ensure freshness
            await Review.deleteOne({ _id: existingReview._id });
            console.log('Deleted existing review.');
        }

        console.log(`Creating review for Job: ${job.title} (ID: ${job._id})`);

        const review = await Review.create({
            job: job._id,
            customer: job.customer,
            worker: job.worker,
            rating: 5,
            comment: 'Excellent service! The worker was very professional and did a great job.',
            wouldRecommend: true
        });

        // Update job status
        job.hasReview = true;
        await job.save();

        // Update worker rating
        const worker = await User.findById(job.worker);
        if (worker) {
            await worker.updateRating(5);
        }

        console.log('Review created successfully:', review);
        process.exit();

    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedReview();
