require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    apiToken: process.env.API_TOKEN,
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
    },
    axios: {
        timeout: parseInt(process.env.AXIOS_TIMEOUT) || 10000, // 10 second timeout
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ReadabilityAPI/1.0;)'
        }
    },
    cors: {
        // By default allow all origins, but can be restricted via CORS_ALLOWED_ORIGINS
        allowAllOrigins: process.env.CORS_ALLOW_ALL === 'true' || true,
        // Comma-separated list of allowed origins (only used if allowAllOrigins is false)
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ?
            process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
            ['http://localhost:3000', 'http://localhost:8080'],
        // HTTP methods allowed for CORS
        methods: process.env.CORS_METHODS ?
            process.env.CORS_METHODS.split(',').map(method => method.trim()) :
            ['GET', 'POST'],
        // HTTP headers allowed in requests
        allowedHeaders: process.env.CORS_ALLOWED_HEADERS ?
            process.env.CORS_ALLOWED_HEADERS.split(',').map(header => header.trim()) :
            ['Content-Type', 'Authorization']
    }
}; 