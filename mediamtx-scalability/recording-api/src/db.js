/**
 * db.js — Mongoose connection with retry logic
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/nvr';

async function connect() {
  let retries = 30;
  while (retries > 0) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log(`[DB] Connected to MongoDB: ${MONGO_URI}`);
      return;
    } catch (err) {
      retries--;
      console.warn(`[DB] Connection failed (${retries} retries left): ${err.message}`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('[DB] Could not connect to MongoDB after multiple retries');
}

module.exports = { connect };
