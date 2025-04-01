const app = require('./app');
const logger = require('./utils/logger');

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info({
        msg: `Readability API server running on port ${PORT}`,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    logger.info({
        msg: `${signal} received, starting graceful shutdown`,
    });

    server.close(() => {
        logger.info({
            msg: 'Server closed gracefully',
        });
        process.exit(0);
    });

    // Force shutdown after 10s if server hasn't closed
    setTimeout(() => {
        logger.error({
            msg: 'Graceful shutdown timed out, forcing exit',
        });
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
    logger.error({
        msg: 'Unhandled Promise Rejection',
        reason,
        stack: reason.stack,
    });
});

process.on('uncaughtException', (error) => {
    logger.error({
        msg: 'Uncaught Exception',
        error: error.message,
        stack: error.stack,
    });

    // For uncaught exceptions, it's safest to exit
    gracefulShutdown('uncaughtException');
}); 