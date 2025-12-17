const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Job = require('../models/Job');
const { buildJobFeatureVector } = require('./featureBuilder');
const { getDriverScoring } = require('./predictionService');

/**
 * Core Dispatch Logic (Reusable)
 * Finds best candidates, filters out existing offers/rejections, and dispatches to Top N.
 * 
 * @param {Object} job - The Job document
 * @param {Object} io - Socket.IO instance
 * @param {number} targetCount - How many NEW offers to send (default 3 for fresh, or 1 for replenishment)
 */
async function dispatchToTopK(job, io, targetCount = 3) {
    if (targetCount <= 0) return 0;

    console.log(`📢 Dispatching to Top ${targetCount} for Job ${job._id}...`);

    // 1. Get Exclusions (Workers who already have an assignment: Offered, Accepted, Rejected)
    const existingAssignments = await Assignment.find({ jobId: job._id }).select('workerId');
    const excludeWorkerIds = existingAssignments.map(a => a.workerId.toString());

    // 2. Find Available Candidates
    const allWorkers = await User.find({
        role: 'worker',
        isAvailable: true,
        activeJob: null
    }).select('name _id serviceCategories averageRating totalReviews').lean();

    // 3. Filter Candidates
    const jobCategory = job.category.toLowerCase();
    let validCandidates = allWorkers.filter(w => {
        // Exclude if already interacted with this job
        if (excludeWorkerIds.includes(w._id.toString())) return false;

        // Match Category
        if (!w.serviceCategories || !Array.isArray(w.serviceCategories)) return false;
        return w.serviceCategories.some(c => c.toLowerCase() === jobCategory);
    });

    if (validCandidates.length === 0) {
        console.warn(`⚠️ No new valid candidates found for Job ${job._id}`);
        return 0;
    }

    // 4. ML Scoring (Parallel)
    console.log(`🤖 Scoring ${validCandidates.length} new candidates...`);
    const scoredCandidates = await Promise.all(validCandidates.map(async (worker) => {
        try {
            const features = buildJobFeatureVector(job, worker);
            const probMap = await getDriverScoring(features, worker._id.toString());
            const workerIdStr = String(worker._id);

            let score = probMap[workerIdStr] || probMap['heuristic_score'] || probMap['1'];

            if (score === undefined) score = 0.1; // Baseline

            worker.mlScore = score;
            return worker;
        } catch (err) {
            console.error(`Error scoring worker ${worker._id}:`, err.message);
            worker.mlScore = 0;
            return worker;
        }
    }));

    // 5. Sort & Slice
    scoredCandidates.sort((a, b) => {
        if (b.mlScore !== a.mlScore) return b.mlScore - a.mlScore;
        return b.averageRating - a.averageRating;
    });

    const topK = scoredCandidates.slice(0, targetCount);

    // 6. Persist & Emit
    if (topK.length > 0) {
        console.log(`✨ Dispatching to ${topK.length} workers.`);
        await Promise.all(topK.map(async (worker) => {
            try {
                // Create Assignment
                await Assignment.create({
                    jobId: job._id,
                    workerId: worker._id,
                    status: 'offered',
                    payload: { score: worker.mlScore }
                });

                // Socket Emit
                if (io) {
                    const room = `worker-${worker._id.toString()}`;
                    console.log(`   -> 🚀 EMIT to ${worker.name} (Room: ${room})`);
                    io.to(room).emit('assignmentRequest', {
                        jobId: job._id,
                        category: job.category,
                        pickup: job.location,
                        scheduledDate: job.scheduledDate,
                        estimatedPrice: job.estimatedPrice,
                        notes: job.customerNotes,
                        score: worker.mlScore
                    });
                }
            } catch (e) {
                console.error(`   ❌ Dispatch failed for ${worker.name}:`, e.message);
            }
        }));
    }

    return topK.length;
}

/**
 * Replenish Job Offers
 * Checks if active offers < 3. If so, dispatches to next best workers.
 */
async function replenishJob(jobId, io) {
    try {
        const job = await Job.findById(jobId);
        if (!job || job.status !== 'pending') return;

        // Count ACTIVE offers
        const activeOffers = await Assignment.countDocuments({
            jobId: jobId,
            status: 'offered'
        });

        const TARGET_K = 3;
        const needed = TARGET_K - activeOffers;

        if (needed > 0) {
            console.log(`🔄 Replenishment: Need ${needed} more workers (Active: ${activeOffers}).`);
            await dispatchToTopK(job, io, needed);
        } else {
            console.log(`✅ Replenishment: Job has enough active offers (${activeOffers}).`);
        }

    } catch (err) {
        console.error("Replenish Error:", err.message);
    }
}

module.exports = {
    dispatchToTopK,
    replenishJob
};
