/**
 * api.js — All HTTP calls to the dashboard backend.
 * Backend proxies to recording-api and NVR playback.
 */
const API = (() => {

  async function _get(url, params = {}) {
    const qs  = new URLSearchParams(params).toString();
    const res = await fetch(qs ? `${url}?${qs}` : url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /** Unique camera names that have at least one session */
  async function getCameras() {
    const data = await _get('/api/sessions/streams');
    return data.streams || [];
  }

  /** Currently recording streams */
  async function getActive() {
    const data = await _get('/api/sessions/active');
    return data.sessions || [];
  }

  /** Sessions for one camera, optionally filtered by status */
  async function getSessions(streamName, status = '') {
    const params = { streamName, limit: 50 };
    if (status) params.status = status;
    const data = await _get('/api/sessions', params);
    return data.sessions || [];
  }

  /** Segments for one session */
  async function getSegments(sessionId) {
    const data = await _get(`/api/sessions/${sessionId}/segments`);
    return data.segments || [];
  }

  /** Playback URL for a segment (proxied through dashboard server) */
  function playbackUrl(filepath) {
    return `/playback?file=${encodeURIComponent(filepath)}`;
  }

  return { getCameras, getActive, getSessions, getSegments, playbackUrl };
})();
