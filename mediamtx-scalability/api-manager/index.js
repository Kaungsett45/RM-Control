const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MEDIAMTX_API = process.env.MEDIAMTX_API_URL || 'http://origin:9997/v3';
const MTX_USER = process.env.MTX_ADMIN_USER || 'admin';
const MTX_PASS = process.env.MTX_ADMIN_PASS || 'admin';

// Helper to handle API calls
const callMediaMTX = async (method, path, data = null) => {
    try {
        const response = await axios({
            method,
            url: `${MEDIAMTX_API}${path}`,
            data,
            auth: {
                username: MTX_USER,
                password: MTX_PASS
            }
        });
        return { status: response.status, data: response.data };
    } catch (error) {
        console.error(`MediaMTX API Error [${method} ${path}]:`, error.response?.data || error.message);
        return { 
            status: error.response?.status || 500, 
            error: error.response?.data || error.message 
        };
    }
};

const router = express.Router();

/**
 * PATH CRUD OPERATIONS
 */

// List all paths
router.get('/paths', async (req, res) => {
    const result = await callMediaMTX('get', '/config/paths/list');
    res.status(result.status).json(result.data || result.error);
});

// Add a new path
router.post('/paths', async (req, res) => {
    const { name, ...config } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    
    const result = await callMediaMTX('post', `/config/paths/add/${name}`, config);
    res.status(result.status).json(result.data || result.error);
});

// Update a path
router.patch('/paths/:name', async (req, res) => {
    const result = await callMediaMTX('patch', `/config/paths/patch/${req.params.name}`, req.body);
    res.status(result.status).json(result.data || result.error);
});

// Remove a path
router.delete('/paths/:name', async (req, res) => {
    const result = await callMediaMTX('delete', `/config/paths/remove/${req.params.name}`);
    res.status(result.status).json(result.data || result.error);
});

// Use the router with /manager prefix
app.use('/manager', router);

/**
 * ADDITIONAL API FEATURES
 */

// Get global config
router.get('/config', async (req, res) => {
    const result = await callMediaMTX('get', '/config/global/get');
    res.status(result.status).json(result.data || result.error);
});

// Get active sessions
router.get('/sessions', async (req, res) => {
    const result = await callMediaMTX('get', '/sessions/list');
    res.status(result.status).json(result.data || result.error);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MediaMTX API Manager running on port ${PORT}`);
    console.log(`Targeting MediaMTX at ${MEDIAMTX_API}`);
});
