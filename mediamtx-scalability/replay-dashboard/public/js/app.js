/**
 * app.js — Main coordinator. Wires API → State → UI. No rendering here.
 */
const App = (() => {

  const REFRESH_MS = 20_000;

  // ── Public: full refresh (topbar button + auto-interval) ─────────────────
  async function refresh() {
    UI.setSpinner('sidebarSpinner', true);
    try {
      const [cameras, active] = await Promise.all([
        API.getCameras(),
        API.getActive(),
      ]);
      UI.renderCameras(cameras, active);

      // Refresh session list if a camera is selected
      if (State.camera) {
        await _loadSessions(State.camera, { silent: true });
      }
    } catch (err) {
      UI.showToast('⚠  Cannot reach Recording API');
      console.error('[App] refresh:', err);
    } finally {
      UI.setSpinner('sidebarSpinner', false);
    }
  }

  // ── Public: user clicks a camera ─────────────────────────────────────────
  async function selectCamera(name) {
    State.camera = name;
    await refresh();             // re-render sidebar active state
    await _loadSessions(name);
  }

  // ── Public: status filter dropdown ───────────────────────────────────────
  async function applyFilter() {
    State.status = document.getElementById('statusFilter').value;
    if (State.camera) await _loadSessions(State.camera);
  }

  // ── Private: load + render sessions for current camera ───────────────────
  async function _loadSessions(name, { silent = false } = {}) {
    if (!silent) UI.renderSessionsLoading(name);
    try {
      const sessions = await API.getSessions(name, State.status);
      State.sessions = sessions;
      UI.renderSessions(name, sessions);

      // Load segments for each session (fire in parallel)
      sessions.forEach(s => _loadTimeline(s));
    } catch (err) {
      console.error('[App] _loadSessions:', err);
      if (!silent) UI.showToast(`⚠  Failed to load sessions for "${name}"`);
    }
  }

  // ── Private: load segments for one session → render its timeline ──────────
  async function _loadTimeline(session) {
    try {
      const segments = await API.getSegments(session._id);
      UI.renderTimeline(session, segments);
    } catch (err) {
      console.warn(`[App] _loadTimeline ${session._id}:`, err.message);
      UI.showToast(`⚠ Failed to load segments for session starting ${new Date(session.startTime).toLocaleTimeString()}`);
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  function init() {
    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  return { refresh, selectCamera, applyFilter, init };
})();

document.addEventListener('DOMContentLoaded', App.init);
