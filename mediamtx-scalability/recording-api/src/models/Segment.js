/**
 * Segment.js — A single fMP4 file written by the NVR (one per recordSegmentDuration).
 */
const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true },
  streamName:      { type: String, required: true, index: true },
  filename:        { type: String, required: true },
  filepath:        { type: String, required: true },
  startTime:       { type: Date,   required: true, index: true },
  endTime:         { type: Date },
  durationSeconds: { type: Number, default: 0 },
  sizeBytes:       { type: Number, default: 0 },
  metadata:        { type: Object, default: {} }, // For custom text/tags
}, { timestamps: true });

segmentSchema.index({ streamName: 1, startTime:  1 });
segmentSchema.index({ sessionId:  1, startTime:  1 });

module.exports = mongoose.model('Segment', segmentSchema);
