#!/bin/sh
# on_ready.sh — fired by origin mediamtx when a publisher (camera) connects
# and the stream becomes available.
#
# Available env vars: MTX_PATH (stream name), RTSP_PORT

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"streamName\":\"${MTX_PATH}\"}" \
  "http://recording-api:5000/api/sessions/open" > /dev/null || true
