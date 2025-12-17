// src/models/Assignment.js
const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['offered', 'accepted', 'rejected', 'timeout'], default: 'offered' },
  responseAt: { type: Date },
  payload: { type: Object }, // store the offer payload sent
  attempt: { type: Number, default: 1 }, // attempt number in case of retries
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
