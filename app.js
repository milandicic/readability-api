const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const config = require('./config/app');
const { parseUrl, parseHtmlEndpoint } = require('./routes/api');
const { authenticateToken } = require('./middleware/auth');
const { validateUrlRequest, validateHtmlRequest } = require('./middleware/validation');
const logger = require('./utils/logger');

// Verify API token is configured
if (!config.apiToken) {
    logger.error('API_TOKEN environment variable is not set. Authentication will fail.');
    logger.error('Please set API_TOKEN in your .env file or environment variables.');
}

const app = express();

// Enable trust proxy - this is required when running behind a reverse proxy like Nginx
app.set('trust proxy', 1);

// Configure Helmet based on environment - less restrictive for development
const isProduction = process.env.NODE_ENV === 'production';
app.use(
    helmet({
        // Disable content security policy in development for Swagger UI to work properly
        contentSecurityPolicy: isProduction ? undefined : false,
        // Allow iframe embedding in development
        frameguard: isProduction ? undefined : false,
        // Allow cross-origin for Swagger UI resources
        crossOriginEmbedderPolicy: false,
        // Allow opener access for Swagger UI
        crossOriginOpenerPolicy: { policy: 'unsafe-none' }
    })
);

// Configure CORS - By default allow all origins but can be restricted via environment variables
const corsOptions = {
    origin: (config.cors && config.cors.allowAllOrigins) ? '*' : function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        const allowedOrigins = (config.cors && config.cors.allowedOrigins) ?
            config.cors.allowedOrigins : ['http://localhost:3000', 'http://localhost:8080'];

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: (config.cors && config.cors.methods) ? config.cors.methods : ['GET', 'POST'],
    allowedHeaders: (config.cors && config.cors.allowedHeaders) ?
        config.cors.allowedHeaders : ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // For legacy browser support (IE11, various SmartTVs)
};
app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
    // Log the incoming request
    logger.info({
        msg: 'Incoming request',
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });

    // Track response time
    const start = Date.now();

    // Log when the response is finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            msg: 'Request completed',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
});

// Rate limiting
const limiter = rateLimit({
    ...config.rateLimit,
    // Add standardized headers as per RFC 6585
    standardHeaders: true,
    // Add custom rate limit information to response
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    }
});
app.use(limiter);

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for HTML content

// Add a simple health check and debug route at the root
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Readability API is running',
        apiEndpoints: ['/api/parse', '/api/parse-html'],
        info: `Request received at ${new Date().toISOString()}`,
        path: req.path,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
    });
});

// API Documentation - Configure Swagger UI with options to work better in mixed HTTP/HTTPS environments
const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        validatorUrl: null,  // Disable validator
        docExpansion: 'list',
        persistAuthorization: true,
    }
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// JSON version of the Swagger spec for API clients to consume
app.get('/api/docs.json', (req, res) => {
    res.json(swaggerSpec);
});

// Authentication middleware - Apply to API endpoints only, not to root or docs
app.use('/api', authenticateToken);

// API endpoints
app.post('/api/parse', validateUrlRequest, parseUrl);
app.post('/api/parse-html', validateHtmlRequest, parseHtmlEndpoint);

// Add catch-all route for 404s
app.use((req, res) => {
    logger.warn({
        msg: 'Route not found',
        path: req.originalUrl,
        method: req.method,
    });

    res.status(404).json({
        success: false,
        error: `The requested path ${req.originalUrl} was not found`,
    });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log the error
    logger.error({
        msg: 'Server error',
        error: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

module.exports = app; 