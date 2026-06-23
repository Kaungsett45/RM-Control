/**
 * nvr.js — Calls the NVR MediaMTX API to add/remove recording paths.
 *
 * Flow:
 *  camera → origin [runOnReady] → recording-api [POST /sessions/open]
 *    → addNvrPath("cam1") → NVR starts pulling rtsp://origin:8554/cam1
 *    → NVR records to /recordings/cam1/...mp4
 */
const axios = require('axios');

const NVR_API  = process.env.NVR_API_URL || 'http://nvr:9997';
const MTX_USER = process.env.MTX_ADMIN_USER || 'admin';
const MTX_PASS = process.env.MTX_ADMIN_PASS || 'admin';

const nvrClient = axios.create({
  baseURL: NVR_API,
  timeout: 5000,
  auth: { username: MTX_USER, password: MTX_PASS }
});

/**
 * Tell NVR to start pulling + recording a stream from origin.
 * Path config inherits record: yes, recordSegmentDuration: 10m etc from NVR pathDefaults.
 */
async function addNvrPath(streamName) {
  await nvrClient.post(`/v3/config/paths/add/${encodeURIComponent(streamName)}`, {
    source: `rtsp://${MTX_USER}:${MTX_PASS}@origin:8554/${streamName}`,
    sourceOnDemand: false,   // always pull (NVR = continuous recorder)
  });
  console.log(`[NVR] Added path: ${streamName}`);
}

/**
 * Tell NVR to stop pulling + recording a stream (camera disconnected).
 */
async function removeNvrPath(streamName) {
  await nvrClient.delete(`/v3/config/paths/delete/${encodeURIComponent(streamName)}`);
  console.log(`[NVR] Removed path: ${streamName}`);
}

module.exports = { addNvrPath, removeNvrPath };
