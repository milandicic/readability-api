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

    // Check if token matches
    if (token !== process.env.API_TOKEN) {
        return res.status(403).json({
            success: false,
            error: 'Invalid authentication token'
        });
    }

    next();
};

module.exports = { authenticateToken }; 