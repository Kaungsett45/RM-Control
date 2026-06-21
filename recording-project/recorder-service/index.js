const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const morgan = require('morgan');

const app = express();
app.use(morgan('dev'));
app.use(express.json());

const RECORDINGS_DIR = '/recordings';
const activeProcesses = new Map(); // path -> { process, readersCount }

// Ensure recordings directory exists
fs.ensureDirSync(RECORDINGS_DIR);

/**
 * Start recording a stream
 */
app.post('/start/:streamPath(*)', async (req, res) => {
    const streamPath = req.params.streamPath;
    console.log(`[Recorder] Reader connected to ${streamPath}`);

    if (activeProcesses.has(streamPath)) {
        activeProcesses.get(streamPath).readersCount++;
        return res.json({ status: 'already_recording', readers: activeProcesses.get(streamPath).readersCount });
    }

    // Prepare output path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(RECORDINGS_DIR, streamPath);
    await fs.ensureDir(outputDir);
    const outputPath = path.join(outputDir, `${timestamp}.mp4`);

    // Spawn FFmpeg to record with better stream detection
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-analyzeduration', '10000000',
        '-probesize', '10000000',
        '-i', rtspUrl,
        '-c', 'copy',
        '-map', '0',
        '-ignore_unknown',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
        // Optional: Log ffmpeg progress/errors
        // console.log(`ffmpeg [${streamPath}]: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        console.log(`[Recorder] FFmpeg for ${streamPath} exited with code ${code}`);
        activeProcesses.delete(streamPath);
    });

    activeProcesses.set(streamPath, {
        process: ffmpeg,
        readersCount: 1,
        outputPath
    });

    res.json({ status: 'started', path: outputPath });
});

/**
 * Stop recording a stream
 */
app.post('/stop/:streamPath(*)', (req, res) => {
    const streamPath = req.params.streamPath;
    const state = activeProcesses.get(streamPath);

    if (!state) return res.status(404).json({ error: 'Not recording' });

    state.readersCount--;
    console.log(`[Recorder] Reader disconnected from ${streamPath}. Remainder: ${state.readersCount}`);

    if (state.readersCount <= 0) {
        console.log(`[Recorder] No more readers. Stopping FFmpeg for ${streamPath}`);
        state.process.kill('SIGINT'); // Send interrupt for graceful close
        activeProcesses.delete(streamPath);
        return res.json({ status: 'stopped' });
    }

    res.json({ status: 'active', readers: state.readersCount });
});

/**
 * List all recordings for the dashboard
 */
app.get('/api/list', async (req, res) => {
    try {
        const files = [];
        const walk = async (dir) => {
            const list = await fs.readdir(dir);
            for (const file of list) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    await walk(fullPath);
                } else if (file.endsWith('.mp4')) {
                    files.push({
                        name: file,
                        path: fullPath.replace(RECORDINGS_DIR, ''),
                        size: stat.size,
                        date: stat.mtime
                    });
                }
            }
        };
        await walk(RECORDINGS_DIR);
        res.json(files.sort((a, b) => b.date - a.date));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Optimization: Background Retention Task
// Deletes files older than 7 days
setInterval(async () => {
    console.log('[Maintenance] Running retention cleanup...');
    const now = Date.now();
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

    const walkAndClean = async (dir) => {
        const list = await fs.readdir(dir);
        for (const file of list) {
            const fullPath = path.join(dir, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await walkAndClean(fullPath);
                // Remove empty dirs
                const children = await fs.readdir(fullPath);
                if (children.length === 0) await fs.remove(fullPath);
            } else {
                if (now - stat.mtimeMs > MAX_AGE) {
                    console.log(`[Maintenance] Deleting old recording: ${file}`);
                    await fs.remove(fullPath);
                }
            }
        }
    };
    try { await walkAndClean(RECORDINGS_DIR); } catch (e) {}
}, 1000 * 60 * 60); // Run every hour

/**
 * Serve recording files
 */
app.use('/api/files', express.static(RECORDINGS_DIR));

/**
 * Serve dashboard
 */
app.use('/ui', express.static('/app/dashboard'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[Recorder] Service running on port ${PORT}`);
    console.log(`[Recorder] Watching path: ${RECORDINGS_DIR}`);
});
