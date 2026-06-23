/**
 * Session.js — A recording session = one continuous publish from a camera.
 * One camera disconnect → one session ends. New connect → new session.
 */
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  streamName:     { type: String, required: true, index: true },
  status:         { type: String, enum: ['recording', 'completed', 'failed'], default: 'recording' },
  startTime:      { type: Date,   default: Date.now, index: true },
  endTime:        { type: Date,   default: null },
  segmentCount:   { type: Number, default: 0 },
  totalSizeBytes: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for common dashboard queries
sessionSchema.index({ streamName: 1, startTime: -1 });
sessionSchema.index({ status: 1,    startTime: -1 });

module.exports = mongoose.model('Session', sessionSchema);
