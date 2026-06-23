/**
 * utils.js — Pure helper functions. No DOM, no state.
 */
const Utils = (() => {

  /** Format ISO date → { date, time, iso } */
  function fmt(isoString) {
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }),
      time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      iso:  d.toISOString(),
    };
  }

  /** Format seconds → "10m 30s", "1h 5m" */
  function fmtDuration(seconds) {
    if (!seconds) return '—';
    const h  = Math.floor(seconds / 3600);
    const m  = Math.floor((seconds % 3600) / 60);
    const s  = Math.round(seconds % 60);
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s || !parts.length) parts.push(`${s}s`);
    return parts.join(' ');
  }

  /** Format bytes → "48.2 MB", "1.2 GB" */
  function fmtSize(bytes) {
    if (!bytes) return '—';
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  /** Elapsed seconds between two ISO strings */
  function elapsed(start, end) {
    if (!start) return 0;
    const endMs = end ? new Date(end).getTime() : Date.now();
    return Math.max(0, (endMs - new Date(start).getTime()) / 1000);
  }

  return { fmt, fmtDuration, fmtSize, elapsed };
})();
