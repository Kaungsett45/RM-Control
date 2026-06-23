/**
 * state.js — Single source of truth.
 */
const State = (() => {
  let _camera   = null;   // selected camera name (string)
  let _segment  = null;   // currently playing segment object
  let _sessions = [];     // sessions for selected camera
  let _status   = '';     // filter: '' | 'recording' | 'completed'

  return {
    get camera()     { return _camera; },
    set camera(v)    { _camera = v; },

    get segment()    { return _segment; },
    set segment(v)   { _segment = v; },

    get sessions()   { return _sessions; },
    set sessions(v)  { _sessions = v; },

    get status()     { return _status; },
    set status(v)    { _status = v; },
  };
})();
