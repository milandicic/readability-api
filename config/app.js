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
    }
}; 