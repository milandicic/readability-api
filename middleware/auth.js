const crypto = require('crypto');
const { apiToken } = require('../config/app');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
    // Skip authentication for documentation if it exists
    if (req.path === '/api/docs') {
        return next();
    }

    // Get auth header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        logger.warn({
            msg: 'Authentication failed - missing token',
            ip: req.ip,
            path: req.originalUrl,
        });

        return res.status(401).json({
            success: false,
            error: 'Authentication token is required'
        });
    }

    // Verify API token exists in configuration
    if (!apiToken) {
        logger.error('API_TOKEN environment variable is not set');
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

            logger.warn({
                msg: 'Authentication failed - invalid token',
                ip: req.ip,
                path: req.originalUrl,
            });

            return res.status(403).json({
                success: false,
                error: 'Invalid authentication token'
            });
        }

        // Authentication successful
        next();
    } catch (error) {
        logger.error({
            msg: 'Authentication error',
            error: error.message,
            stack: error.stack,
        });

        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};

module.exports = { authenticateToken }; 