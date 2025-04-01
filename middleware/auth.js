const crypto = require('crypto');
const { apiToken } = require('../config/app');

const authenticateToken = (req, res, next) => {
    // Skip authentication for web interface and documentation
    if (req.path === '/' || req.path === '/api/docs') {
        return next();
    }

    // Get auth header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication token is required'
        });
    }

    // Verify API token exists in configuration
    if (!apiToken) {
        console.error('API_TOKEN environment variable is not set');
        return res.status(500).json({
            success: false,
            error: 'Server authentication configuration error'
        });
    }

    // Check if token matches using constant-time comparison
    try {
        const tokenBuffer = Buffer.from(token, 'utf8');
        const apiTokenBuffer = Buffer.from(apiToken, 'utf8');

        if (tokenBuffer.length !== apiTokenBuffer.length ||
            !crypto.timingSafeEqual(tokenBuffer, apiTokenBuffer)) {
            return res.status(403).json({
                success: false,
                error: 'Invalid authentication token'
            });
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};

module.exports = { authenticateToken }; 