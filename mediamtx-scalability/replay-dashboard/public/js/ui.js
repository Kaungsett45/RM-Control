/**
 * ui.js — All DOM rendering. Reads State; never fetches data itself.
 */
const UI = (() => {

  // ── Toast ─────────────────────────────────────────────────────────────────
  let _toastTimer = null;
  function showToast(msg, ms = 3000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function setSpinner(id, on) {
    const el = document.getElementById(id);
    if (el) el.style.display = on ? 'inline-block' : 'none';
  }

  // ── Camera sidebar ─────────────────────────────────────────────────────────
  function renderCameras(cameras, activeSessions) {
    const activeNames = new Set(activeSessions.map(s => s.streamName));
    const el = document.getElementById('cameraList');

    if (!cameras.length) {
      el.innerHTML = `<div class="empty-pane" style="padding:24px 10px">
        <div class="ep-icon">📡</div><p>No cameras yet. Start streaming to see them here.</p>
      </div>`;
      return;
    }

    el.innerHTML = cameras.map(name => {
      const isActive = activeNames.has(name);
      const isSelected = State.camera === name;
      return `<div class="camera-item ${isSelected ? 'active' : ''}" onclick="App.selectCamera('${name}')">
        <div class="cam-icon">
          📷
          ${isActive ? '<div class="rec-dot"></div>' : ''}
        </div>
        <div class="cam-info">
          <div class="cam-name">${name}</div>
          <div class="cam-meta">${isActive ? '⏺ recording' : 'idle'}</div>
        </div>
      </div>`;
    }).join('');

    // Active badge in topbar
    const badge = document.getElementById('activeBadge');
    const count = document.getElementById('activeCount');
    if (activeSessions.length) {
      badge.style.display = 'flex';
      count.textContent   = activeSessions.length;
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Session list ───────────────────────────────────────────────────────────
  function renderSessionsLoading(name) {
    document.getElementById('paneTitle').textContent = `${name}  —  loading…`;
    document.getElementById('sessionList').innerHTML =
      `<div class="empty-pane"><div class="spinner" style="width:22px;height:22px"></div></div>`;
  }

  function renderSessions(name, sessions) {
    document.getElementById('paneTitle').textContent =
      `${name}  —  ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;
    
    document.getElementById('paneFilters').style.display = 'flex';

    // Show 'Watch Live' button if any session is active
    const isLive = sessions.some(s => s.status === 'recording');
    document.getElementById('btnWatchLive').style.display = isLive ? 'inline-flex' : 'none';

    const list = document.getElementById('sessionList');

    if (!sessions.length) {
      list.innerHTML = `<div class="empty-pane">
        <div class="ep-icon">🎞️</div>
        <p>No sessions found.<br/>Start streaming to see recordings here.</p>
      </div>`;
      return;
    }

    list.innerHTML = sessions.map(s => _sessionCard(s)).join('');
  }

  function _sessionCard(session) {
    const { time: startTime, date } = Utils.fmt(session.startTime);
    const endTime   = session.endTime ? Utils.fmt(session.endTime).time : 'now';
    const isRec     = session.status === 'recording';
    const totalSecs = Utils.elapsed(session.startTime, session.endTime);

    return `<div class="session-card ${isRec ? 'is-recording' : ''}">
      <div class="session-head">
        <span class="session-status ${session.status}">${isRec ? '⏺ Recording' : '✓ Completed'}</span>
        <span class="session-time">${date} &nbsp;${startTime} → ${endTime}</span>
        <div class="session-stats">
          <span>⏱ ${Utils.fmtDuration(totalSecs)}</span>
          <span>📦 ${session.segmentCount} segs</span>
          <span>💾 ${Utils.fmtSize(session.totalSizeBytes)}</span>
        </div>
      </div>
      <div class="timeline-wrap" id="timeline-${session._id}">
        <div class="timeline-label">Segments — click to play</div>
        <div class="timeline-track" id="track-${session._id}">
          <div class="empty-pane" style="width:100%;height:100%">
            <span class="spinner"></span>
          </div>
        </div>
        <div class="timeline-ruler" id="ruler-${session._id}"></div>
      </div>
    </div>`;
  }

  // ── Timeline rendering (called after segments load) ─────────────────────────
  function renderTimeline(session, segments) {
    const track = document.getElementById(`track-${session._id}`);
    const ruler = document.getElementById(`ruler-${session._id}`);
    if (!track) return;

    if (!segments.length) {
      track.innerHTML = `<div style="color:var(--text3);font-size:10px;padding:0 6px;display:flex;align-items:center">No segments yet</div>`;
      ruler.innerHTML = '';
      return;
    }

    // Total duration = sum of segment durations
    const total = segments.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) || 1;

    track.innerHTML = segments.map((seg, i) => {
      const pct       = ((seg.durationSeconds || 0) / total * 100).toFixed(2);
      const isPlaying = State.segment?._id === seg._id;
      const isRec     = !seg.durationSeconds || seg.durationSeconds < 1;
      const cls       = isRec ? 'recording' : 'complete';
      const dur       = Utils.fmtDuration(seg.durationSeconds);
      const segJson   = JSON.stringify(seg).replace(/"/g, '&quot;');

      return `<div class="seg-block ${cls} ${isPlaying ? 'active-play' : ''}"
                   style="width:${pct}%; min-width:${pct < 3 ? '40px' : 'auto'}"
                   title="Segment ${i+1} — ${dur} — ${Utils.fmt(seg.startTime).time}"
                   onclick="Player.play(${segJson})">
        <span class="seg-dur">${pct > 12 ? dur : ''}</span>
      </div>`;
    }).join('');

    // Ruler: show start time of first + last segment
    const first = Utils.fmt(segments[0].startTime).time;
    const last  = Utils.fmt(segments[segments.length - 1].startTime).time;
    ruler.innerHTML = `
      <span class="ruler-label">${first}</span>
      <span class="ruler-label">${last}</span>`;
  }

  // ── Player info panel ───────────────────────────────────────────────────────
  function renderInfo(session, seg, url) {
    const { time, date, iso } = Utils.fmt(seg.startTime);
    const endFmt = seg.endTime ? Utils.fmt(seg.endTime).time : '—';
    const isRec  = seg.status === 'recording' || !seg.durationSeconds;

    document.getElementById('infoBody').innerHTML = [
      _infoRow('Camera',    session.streamName, false),
      _infoRow('Date',      date,               false),
      _infoRow('Start',     time,               true),
      _infoRow('End',       endFmt,             true),
      _infoRow('Duration',  Utils.fmtDuration(seg.durationSeconds), false),
      _infoRow('File size', Utils.fmtSize(seg.sizeBytes),           false),
      _infoRow('Status',    isRec
        ? `<span style="color:var(--red)">⏺ Recording</span>`
        : `<span style="color:var(--green)">✓ Complete</span>`, false, true),
      _infoRow('Filename',  `<span class="plain">${seg.filename || '—'}</span>`, false, true),
      _infoRow('Storage Path', `<span class="plain" style="font-size:10px">${seg.filepath || '—'}</span>`, false, true),
      _infoRow('Action', `<a href="${url}" download="${seg.filename}" class="btn" style="text-decoration:none; display:inline-block; margin-top:5px">📥 Download MP4</a>`, false, true),
    ].join('');
  }

  function renderInfoIdle() {
    document.getElementById('infoBody').innerHTML = `<div class="info-idle">No segment selected.</div>`;
  }

  function _infoRow(label, value, mono = false, raw = false) {
    const cls = mono ? 'info-value' : 'info-value plain';
    const val = raw ? value : `<span class="${cls}">${value}</span>`;
    return `<div class="info-row">
      <span class="info-label">${label}</span>
      ${raw ? `<span class="info-value">${value}</span>` : `<span class="${cls}">${value}</span>`}
    </div>`;
  }

  // ── Player visibility ───────────────────────────────────────────────────────
  function showPlayer() {
    document.getElementById('videoIdle').style.display = 'none';
    document.getElementById('livePlayer').style.display = 'none';
    document.getElementById('livePlayer').src = ''; // stop live playback
    document.getElementById('player').style.display    = 'block';
  }

  function showLivePlayer() {
    document.getElementById('videoIdle').style.display = 'none';
    const video = document.getElementById('player');
    video.style.display = 'none';
    video.pause(); // stop recorded playback
    video.removeAttribute('src'); // unload video
    video.load();
    document.getElementById('livePlayer').style.display = 'block';
  }

  return {
    showToast, setSpinner,
    renderCameras,
    renderSessionsLoading, renderSessions, renderTimeline,
    renderInfo, renderInfoIdle,
    showPlayer, showLivePlayer
  };
})();
