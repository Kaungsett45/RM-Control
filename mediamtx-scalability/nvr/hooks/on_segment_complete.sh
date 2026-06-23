#!/bin/sh
# on_segment_complete.sh
# Called by NVR mediamtx when a recording segment file is complete.
#
# Available arguments (passed by mediamtx):
#   $1 — stream name (%path)
#   $2 — full file path (%segmentpath)
#   $3 — duration seconds (%segmentduration)

# Use environment variables provided by MediaMTX instead of positional arguments
# $MTX_PATH             = stream name
# $MTX_SEGMENT_PATH     = full file path
# $MTX_SEGMENT_DURATION = duration in seconds

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"streamName\":\"${MTX_PATH}\",\"filepath\":\"${MTX_SEGMENT_PATH}\",\"duration\":\"${MTX_SEGMENT_DURATION}\"}" \
  "http://recording-api:5000/api/segments" > /dev/null || true
