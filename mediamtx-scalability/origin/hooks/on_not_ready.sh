#!/bin/sh
# on_not_ready.sh — fired by origin mediamtx when a publisher (camera) disconnects.
#
# Available env vars: MTX_PATH (stream name), RTSP_PORT

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"streamName\":\"${MTX_PATH}\"}" \
  "http://recording-api:5000/api/sessions/close" > /dev/null || true
