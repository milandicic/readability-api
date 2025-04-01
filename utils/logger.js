const pino = require('pino');

// Determine if we're in development or production
const isDev = process.env.NODE_ENV !== 'production';

// Configure logger
const logger = pino({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined, // In production, use standard JSON output
    redact: {
        paths: ['req.headers.authorization'], // Don't log auth tokens
        remove: true,
    },
});

module.exports = logger; 