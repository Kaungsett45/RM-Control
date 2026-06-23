/**
 * segments.js — Segment metadata endpoints.
 *
 * Called by:
 *   - NVR runOnRecordSegmentComplete hook → POST /api/segments
 *   - Dashboard                           → GET  /api/segments
 */
const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const Session = require('../models/Session');
const Segment = require('../models/Segment');

const RECORDINGS_DIR = process.env.RECORDINGS_DIR || '/recordings';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse MediaMTX Go duration strings like "10m0s" OR raw seconds like "60.0" */
function parseDuration(s) {
  if (!s) return 0;
  // If it's a raw number (string)
  if (!isNaN(s)) return parseFloat(s);
  
  // Handle "1h30m10.5s", "10m0s", "10.5s", etc.
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)m/);
  const s_ = s.match(/(\d+(?:\.\d+)?)s/);
  
  const total = (h ? parseInt(h[1]) * 3600 : 0) +
                (m ? parseInt(m[1]) * 60 : 0) +
                (s_ ? parseFloat(s_[1]) : 0);
  
  return total || 1; // Default to 1s
}

/**
 * Derive startTime from filename like "2026-06-22_07-10-00-000000.mp4"
 * Falls back to current time if pattern doesn't match.
 */
function startTimeFromFilename(filename) {
  const m = filename.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
  if (!m) return new Date();
  const [, yr, mo, dy, hh, mm, ss] = m;
  return new Date(`${yr}-${mo}-${dy}T${hh}:${mm}:${ss}Z`);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/segments
// Called by NVR hook: { streamName, filepath, duration }
router.post('/', async (req, res) => {
  const { streamName, filepath, duration } = req.body;
  console.log(`[segments] Request received: ${streamName} - ${filepath} (${duration})`);

  if (!streamName || !filepath) {
    return res.status(400).json({ error: 'streamName and filepath required' });
  }

  try {
    const filename        = path.basename(filepath);
    const durationSeconds = parseDuration(duration);
    const startTime       = startTimeFromFilename(filename);
    const endTime         = new Date(startTime.getTime() + durationSeconds * 1000);

    // Get file size from disk
    let sizeBytes = 0;
    try {
      sizeBytes = fs.statSync(filepath).size;
    } catch {
      console.warn(`[segments] Cannot stat: ${filepath}`);
    }

    // Find matching session
    // Logic: Find the session for this stream that started NO LATER than 5 seconds AFTER the segment started.
    // This handles cases where NVR starts recording just before the on_ready hook completes.
    const session = await Session.findOne({
      streamName,
      startTime: { $lte: new Date(startTime.getTime() + 5000) } 
    }).sort({ startTime: -1 });

    if (!session) {
      console.warn(`[segments] No suitable session found for ${streamName} (starting near ${startTime.toISOString()})`);
    }

    const segment = await Segment.create({
      sessionId:  session?._id,
      streamName,
      filename,
      filepath,
      startTime,
      endTime,
      durationSeconds,
      sizeBytes,
    });

    // Update session totals
    if (session) {
      await Session.findByIdAndUpdate(session._id, {
        $inc: { segmentCount: 1, totalSizeBytes: sizeBytes },
      });
    }

    console.log(`[segments] Saved: ${streamName}/${filename} (${(sizeBytes/1024/1024).toFixed(1)} MB)`);
    res.status(201).json(segment);
  } catch (err) {
    console.error('[segments]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/segments?streamName=&sessionId=&from=ISO&to=ISO&limit=100
router.get('/', async (req, res) => {
  try {
    const { streamName, sessionId, from, to, limit = 100 } = req.query;
    const q = {};
    if (streamName) q.streamName = streamName;
    if (sessionId)  q.sessionId  = sessionId;
    if (from || to) {
      q.startTime = {};
      if (from) q.startTime.$gte = new Date(from);
      if (to)   q.startTime.$lte = new Date(to);
    }
    const segments = await Segment.find(q).sort({ startTime: 1 }).limit(+limit);
    res.json({ segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
