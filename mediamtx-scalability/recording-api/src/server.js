/**
 * server.js — Recording API entry point
 */
const express  = require('express');
const { connect } = require('./db');

const app = express();
app.use(express.json());

// Routes
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/segments', require('./routes/segments'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

(async () => {
  await connect();
  app.listen(PORT, () => {
    console.log(`Recording API running on port ${PORT}`);
    console.log(`  MongoDB : ${process.env.MONGO_URI}`);
    console.log(`  NVR API : ${process.env.NVR_API_URL}`);
  });
})();
