const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { parseUrl, parseHtmlEndpoint } = require('./routes/api');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Enable trust proxy - this is required when running behind a reverse proxy like Nginx
app.set('trust proxy', 1);

// Enable CORS for all routes
app.use(cors());

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for HTML content

// Authentication middleware - Apply to all API endpoints
app.use('/api', authenticateToken);

// API endpoints
app.post('/api/parse', parseUrl);
app.post('/api/parse-html', parseHtmlEndpoint);

// Start server
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log('API token authentication is enabled');
}); 