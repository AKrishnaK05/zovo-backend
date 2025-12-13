// src/services/acceptService.js
const User = require('../models/User');
const Job = require('../models/Job');

/**
 * Atomically accept a job for a worker.
 * - Marks worker unavailable (only if currently available)
 * - Assigns job if it is still pending
 * - If job assignment fails, reverts worker availability
 *
 * Returns:
 *  { success: true, job, worker }
 *  or
 *  { success: false, code: 'worker_unavailable'|'job_unavailable', message: '...' }
 */
async function acceptJobAtomic({ jobId, workerId }) {
  // Step 1: mark worker unavailable atomically
  const workerUpdated = await User.findOneAndUpdate(
    { _id: workerId, isAvailable: true },           // only proceed if worker is currently available
    { $set: { isAvailable: false } },
    { new: true }
  );

  if (!workerUpdated) {
    return { success: false, code: 'worker_unavailable', message: 'Worker is currently not available' };
  }

  // Step 2: assign job atomically (only if still pending)
  const jobUpdated = await Job.findOneAndUpdate(
    { _id: jobId, status: 'pending' },
    { $set: { worker: workerId, status: 'accepted' } },
    { new: true }
  );

  if (!jobUpdated) {
    // Job was already taken or not pending -> revert worker availability
    try {
      await User.findByIdAndUpdate(workerId, { $set: { isAvailable: true } });
    } catch (revertErr) {
      console.error('CRITICAL: failed to revert worker availability after job_unavailable:', revertErr);
    }
    return { success: false, code: 'job_unavailable', message: 'Job is no longer available' };
  }

  return { success: true, job: jobUpdated, worker: workerUpdated };
}

module.exports = { acceptJobAtomic };
