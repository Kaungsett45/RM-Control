/**
 * player.js — Video playback. Coordinates State, UI and the <video> element.
 */
const Player = (() => {

  const video = () => document.getElementById('player');

  /**
   * Play a segment object (comes from timeline block onclick).
   * @param {Object} seg — Segment document from MongoDB
   */
  function play(seg) {
    State.segment = seg;

    const url = API.playbackUrl(seg.filepath);

    // Show video element
    UI.showPlayer();

    const v = video();
    
    // Add error listener if not already present
    if (!v.dataset.errorHandled) {
      v.addEventListener('error', () => {
        const error = v.error;
        let msg = '⚠ Video playback error';
        if (error.code === 1) msg = '⚠ Playback aborted';
        if (error.code === 2) msg = '⚠ Network error';
        if (error.code === 3) msg = '⚠ Video decoding failed';
        if (error.code === 4) msg = '⚠ Video not found or access denied';
        
        UI.showToast(msg);
        console.error('[Player] Video Error:', error);
      });
      v.dataset.errorHandled = "true";
    }

    v.src = url;
    v.load();
    v.play().catch(err => {
      // Chrome/Safari block autoplay without interaction. 
      // If it's a real error (like 404), the 'error' listener above will catch it.
      if (err.name !== 'NotAllowedError') {
        console.warn('[Player] Playback failed:', err.message);
      }
    });

    // Re-render active session to highlight the playing block
    const session = State.sessions.find(s => s._id === seg.sessionId);
    if (session) {
      // Re-fetch segments to refresh active-play highlight
      API.getSegments(session._id).then(segs => UI.renderTimeline(session, segs));
    }

    // Show segment info
    if (session) {
      UI.renderInfo(session, seg, url);
    }

    UI.showToast(`▶  ${seg.streamName} — ${new Date(seg.startTime).toLocaleTimeString()}`);
  }

  /**
   * Switches the UI to watch the live stream from the Edge server.
   */
  function playLive() {
    if (!State.camera) return;
    
    // Clear segment selection
    State.segment = null;
    
    // Reset info panel
    document.getElementById('infoBody').innerHTML = `
      <div class="info-row" style="grid-column: 1 / -1; margin-bottom: 20px;">
        <span class="info-label">Live View</span>
        <span class="info-value" style="color:var(--red); font-weight:bold;">⏺ ${State.camera} is recording</span>
      </div>
      <div class="info-row" style="grid-column: 1 / -1;">
        <span class="info-label">Source</span>
        <span class="info-value">Edge Server (HLS)</span>
      </div>
    `;

    // The edge server exposes HLS on host port 8889.
    // MediaMTX serves a built-in HTML player at the root stream path.
    const liveUrl = `http://localhost:8889/${State.camera}/`;
    
    // Set the iframe source
    const iframe = document.getElementById('livePlayer');
    iframe.src = liveUrl;

    // Show the iframe, hide the video
    UI.showLivePlayer();
    
    UI.showToast(`▶ Playing Live: ${State.camera}`);
  }

  return { play, playLive };
})();
