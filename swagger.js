const swaggerJsdoc = require('swagger-jsdoc');

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Get server URL from environment or use default
const serverUrl = process.env.API_URL || 'http://localhost:3000';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Readability API',
            version: '1.0.0',
            description: 'A standalone API service built on top of Mozilla\'s Readability.js library that extracts clean, readable content from web pages.',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: serverUrl,
                description: isProduction ? 'Production server' : 'Development server',
            },
            {
                url: 'http://localhost:3000',
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js', './index.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs; 