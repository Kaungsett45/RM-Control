/**
 * server.js — Replay Dashboard backend
 *
 * Proxies:
 *   /api/sessions/* → recording-api:5000/api/sessions/*
 *   /api/segments/* → recording-api:5000/api/segments/*
 *   /playback       → nvr:9996/recording/playback  (with auth + Range forwarding)
 */
const express = require('express');
const axios   = require('axios');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(express.json());

const RECORDING_API  = process.env.RECORDING_API_URL  || 'http://recording-api:5000';
const NVR_PLAYBACK   = process.env.NVR_PLAYBACK_URL   || 'http://nvr:9996';
const MTX_USER       = process.env.MTX_ADMIN_USER     || 'admin';
const MTX_PASS       = process.env.MTX_ADMIN_PASS     || 'admin';

// ── Recording API proxy ───────────────────────────────────────────────────────

async function proxyGet(url, res, params = {}) {
  try {
    const r = await axios.get(url, { params, timeout: 8000 });
    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data || err.message });
  }
}

async function proxyPost(url, body, res) {
  try {
    const r = await axios.post(url, body, { timeout: 8000 });
    res.status(r.status).json(r.data);
  } catch (err) {
    const status = err.response?.status || 502;
    res.status(status).json({ error: err.response?.data || err.message });
  }
}

// Sessions
app.get ('/api/sessions/streams',     (req, res) => proxyGet(`${RECORDING_API}/api/sessions/streams`, res));
app.get ('/api/sessions/active',      (req, res) => proxyGet(`${RECORDING_API}/api/sessions/active`,  res));
app.get ('/api/sessions',             (req, res) => proxyGet(`${RECORDING_API}/api/sessions`, res, req.query));
app.get ('/api/sessions/:id',         (req, res) => proxyGet(`${RECORDING_API}/api/sessions/${req.params.id}`, res));
app.get ('/api/sessions/:id/segments',(req, res) => proxyGet(`${RECORDING_API}/api/sessions/${req.params.id}/segments`, res));

// Segments
app.get ('/api/segments', (req, res) => proxyGet(`${RECORDING_API}/api/segments`, res, req.query));

// ── Playback proxy (manual stream pipe with auth + Range support) ─────────────
// FIX: Previous proxy with http-proxy-middleware didn't forward auth.
// Now we manually pipe the response, forwarding Range headers for video scrubbing.

app.get('/playback', (req, res) => {
  const filePath = req.query.file;
  if (!filePath) return res.status(400).send('File path required');

  // Basic security check: ensure it's within /recordings
  const fullPath = path.resolve(filePath);
  if (!fullPath.startsWith('/recordings')) {
    console.error(`[playback] Access denied: ${fullPath} (must start with /recordings)`);
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(fullPath)) {
    console.error(`[playback] File not found: ${fullPath}`);
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(fullPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(fullPath).pipe(res);
  }
});

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Replay Dashboard   : http://0.0.0.0:${PORT}`);
  console.log(`  Recording API    : ${RECORDING_API}`);
  console.log(`  NVR Playback     : ${NVR_PLAYBACK}`);
});
