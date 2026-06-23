# Use Alpine as base to have a shell and package manager
FROM alpine:3.18

# Install dependencies needed (curl for hooks, ffmpeg if needed for some paths)
RUN apk add --no-cache curl ca-certificates

# Copy mediamtx binary from the official image
COPY --from=bluenviron/mediamtx:latest /mediamtx /usr/local/bin/mediamtx

# MediaMTX looks for mediamtx.yml in the current directory or /usr/local/etc/mediamtx.yml
# We'll run it from /
WORKDIR /
EXPOSE 8554 1935 8888 8889 9997

ENTRYPOINT [ "mediamtx" ]
