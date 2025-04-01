const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Validate the URL endpoint request body
 */
const validateUrlRequest = [
    body('url')
        .notEmpty().withMessage('URL is required')
        .isURL({
            protocols: ['http', 'https'],
            require_protocol: true,
            require_valid_protocol: true,
            require_host: true,
            allow_underscores: true,
        })
        .withMessage('URL must be a valid HTTP or HTTPS URL'),

    // Validation result handler
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);

            logger.warn({
                msg: 'URL validation failed',
                errors: errorMessages,
                body: req.body,
            });

            return res.status(400).json({
                success: false,
                error: errorMessages.join('. ')
            });
        }
        next();
    }
];

/**
 * Validate the HTML endpoint request body
 */
const validateHtmlRequest = [
    body('html')
        .notEmpty().withMessage('HTML content is required')
        .isString().withMessage('HTML must be a string'),

    body('url')
        .optional()
        .isURL({
            protocols: ['http', 'https'],
            require_protocol: true,
            require_valid_protocol: true,
            require_host: true,
            allow_underscores: true,
        })
        .withMessage('URL must be a valid HTTP or HTTPS URL'),

    // Validation result handler
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);

            logger.warn({
                msg: 'HTML validation failed',
                errors: errorMessages,
                bodySize: req.body.html ? req.body.html.length : 0,
                url: req.body.url,
            });

            return res.status(400).json({
                success: false,
                error: errorMessages.join('. ')
            });
        }
        next();
    }
];

module.exports = {
    validateUrlRequest,
    validateHtmlRequest
}; 