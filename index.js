const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { getApiDocs } = require('./docs/api-docs');
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

// Routes
app.get('/api/docs', (req, res) => res.send(getApiDocs()));

// Authentication middleware - Apply only to API endpoints, not documentation
app.use('/api/parse', authenticateToken);
app.use('/api/parse-html', authenticateToken);

// API endpoints
app.post('/api/parse', parseUrl);
app.post('/api/parse-html', parseHtmlEndpoint);

// Start server
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`API Documentation available at http://localhost:${config.port}/api/docs`);
    console.log('API token authentication is enabled');
}); 