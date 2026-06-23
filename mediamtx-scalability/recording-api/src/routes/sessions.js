/**
 * sessions.js — CRUD for recording sessions + session lifecycle hooks.
 *
 * Called by:
 *   - origin runOnReady hook   → POST /api/sessions/open
 *   - origin runOnNotReady hook → POST /api/sessions/close
 *   - Dashboard UI             → GET  /api/sessions
 */
const router  = require('express').Router();
const Session = require('../models/Session');
const Segment = require('../models/Segment');
const { addNvrPath, removeNvrPath } = require('../services/nvr');

// ── Helpers ──────────────────────────────────────────────────────────────────

function sizeMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

// ── Session Lifecycle (called by mediamtx hooks) ──────────────────────────────

// POST /api/sessions/open
// Body: { streamName }
router.post('/open', async (req, res) => {
  const { streamName } = req.body;
  if (!streamName) return res.status(400).json({ error: 'streamName required' });

  try {
    // Idempotent: if already recording, return existing session
    const existing = await Session.findOne({ streamName, status: 'recording' });
    if (existing) {
      console.log(`[sessions] Already recording: ${streamName}`);
      return res.json(existing);
    }

    const session = await Session.create({ streamName, startTime: new Date() });
    console.log(`[sessions] Opened: ${streamName} → ${session._id}`);

    // Tell NVR to start pulling and recording this path
    try {
      await addNvrPath(streamName);
    } catch (err) {
      console.warn(`[sessions] NVR addPath failed for ${streamName}:`, err.message);
      // Non-fatal — session is still created, NVR may catch up
    }

    res.status(201).json(session);
  } catch (err) {
    console.error('[sessions/open]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/close
// Body: { streamName }
router.post('/close', async (req, res) => {
  const { streamName } = req.body;
  if (!streamName) return res.status(400).json({ error: 'streamName required' });

  try {
    const session = await Session.findOneAndUpdate(
      { streamName, status: 'recording' },
      { status: 'completed', endTime: new Date() },
      { new: true }
    );

    if (!session) {
      console.warn(`[sessions] No active session to close for: ${streamName}`);
      return res.status(404).json({ error: 'No active session found' });
    }

    console.log(`[sessions] Closed: ${streamName} → ${session._id}`);

    // Tell NVR to stop recording
    try {
      await removeNvrPath(streamName);
    } catch (err) {
      console.warn(`[sessions] NVR removePath failed for ${streamName}:`, err.message);
    }

    res.json(session);
  } catch (err) {
    console.error('[sessions/close]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Query Routes (used by dashboard) ─────────────────────────────────────────

// GET /api/sessions/streams  — unique camera names that have sessions
router.get('/streams', async (req, res) => {
  try {
    const streams = await Session.distinct('streamName');
    res.json({ streams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/active
router.get('/active', async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'recording' }).sort({ startTime: -1 });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions?streamName=&status=&from=ISO&to=ISO&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { streamName, status, from, to, page = 1, limit = 20 } = req.query;
    const q = {};
    if (streamName) q.streamName = streamName;
    if (status)     q.status     = status;
    if (from || to) {
      q.startTime = {};
      if (from) q.startTime.$gte = new Date(from);
      if (to)   q.startTime.$lte = new Date(to);
    }

    const [sessions, total] = await Promise.all([
      Session.find(q).sort({ startTime: -1 }).limit(+limit).skip((+page - 1) * +limit),
      Session.countDocuments(q),
    ]);

    res.json({ sessions, total, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id/segments
router.get('/:id/segments', async (req, res) => {
  try {
    const segments = await Segment.find({ sessionId: req.params.id }).sort({ startTime: 1 });
    res.json({ segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
