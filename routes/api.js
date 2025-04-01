const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const config = require('../config/app');
const { validateUrl } = require('../utils/urlValidator');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *  schemas:
 *    ReadabilityResponse:
 *      type: object
 *      properties:
 *        success:
 *          type: boolean
 *          description: Indicates if the operation was successful
 *        data:
 *          type: object
 *          properties:
 *            title:
 *              type: string
 *              description: Article title
 *            byline:
 *              type: string
 *              description: Author name
 *            content:
 *              type: string
 *              description: Article content in HTML format
 *            textContent:
 *              type: string
 *              description: Plain text content
 *            length:
 *              type: integer
 *              description: Content length
 *            excerpt:
 *              type: string
 *              description: Article excerpt
 *            siteName:
 *              type: string
 *              description: Site name
 *            lang:
 *              type: string
 *              description: Content language
 *    ErrorResponse:
 *      type: object
 *      properties:
 *        success:
 *          type: boolean
 *          description: Always false for error responses
 *        error:
 *          type: string
 *          description: Error message
 */

// JSDOM resource constraint configuration to prevent DoS attacks 
const JSDOM_OPTIONS = {
    runScripts: 'outside-only',
    resources: 'usable',
    pretendToBeVisual: true,  // Needed for some Readability features
    // Set resource limits to prevent DoS via complex HTML
    resourceLoader: {
        strictSSL: true,
        // Only allow loading for same origin
        fetch(url, options) {
            const resourceUrl = new URL(url);
            const baseUrl = new URL(options.baseURL || 'http://localhost');

            // Only allow loading resources from the same origin
            if (resourceUrl.origin !== baseUrl.origin) {
                return null;
            }

            return null; // In general, we don't want to fetch external resources
        }
    }
};

/**
 * Parse HTML content using Readability
 */
const parseHtml = async (html, url) => {
    const startTime = Date.now();

    try {
        // Create a timeout promise to limit JSDOM/Readability processing time
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('HTML parsing timed out'));
            }, 10000); // 10 second timeout
        });

        // Create the parsing promise
        const parsingPromise = new Promise((resolve, reject) => {
            try {
                const dom = new JSDOM(html, {
                    ...JSDOM_OPTIONS,
                    url: url || 'http://localhost',
                });

                const document = dom.window.document;
                const article = new Readability(document).parse();

                if (!article) {
                    throw new Error('Could not parse article content');
                }

                resolve(article);
            } catch (error) {
                reject(error);
            }
        });

        // Race the parsing against the timeout
        const article = await Promise.race([parsingPromise, timeoutPromise]);

        const duration = Date.now() - startTime;
        logger.debug({
            msg: 'HTML parsing completed',
            url,
            duration: `${duration}ms`,
            contentLength: html.length,
        });

        return article;
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error({
            msg: 'HTML parsing failed',
            error: error.message,
            url,
            duration: `${duration}ms`,
            contentLength: html.length,
        });
        throw error;
    }
};

/**
 * Centralized error handling for API responses
 */
const handleError = (error, res) => {
    if (error.code === 'ECONNABORTED') {
        logger.warn({
            msg: 'Request timeout',
            error: error.message,
        });

        return res.status(504).json({
            success: false,
            error: 'Request timeout'
        });
    }

    if (error.response) {
        logger.warn({
            msg: 'Failed to fetch URL',
            error: error.response.statusText,
            status: error.response.status,
            url: error.config?.url,
        });

        return res.status(error.response.status).json({
            success: false,
            error: `Failed to fetch URL: ${error.response.statusText}`
        });
    }

    logger.error({
        msg: 'API error',
        error: error.message,
        stack: error.stack,
    });

    res.status(500).json({
        success: false,
        error: error.message
    });
};

/**
 * @swagger
 * /api/parse:
 *   post:
 *     summary: Extract readable content from a URL
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: The URL to fetch and parse
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadabilityResponse'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Invalid token or restricted URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       504:
 *         description: Gateway timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const parseUrl = async (req, res) => {
    try {
        const { url } = req.body;

        // SSRF protection - validate URL against blocked IP ranges
        const urlValidation = await validateUrl(url);
        if (!urlValidation.valid) {
            logger.warn({
                msg: 'SSRF attempt blocked',
                url,
                reason: urlValidation.reason,
                ip: req.ip,
            });

            return res.status(403).json({
                success: false,
                error: urlValidation.reason
            });
        }

        logger.info({
            msg: 'Fetching URL',
            url,
        });

        const startTime = Date.now();
        const response = await axios.get(url, config.axios);
        const fetchDuration = Date.now() - startTime;

        logger.debug({
            msg: 'URL fetched successfully',
            url,
            duration: `${fetchDuration}ms`,
            contentLength: response.data.length,
        });

        const article = await parseHtml(response.data, url);

        res.json({
            success: true,
            data: article
        });

    } catch (error) {
        handleError(error, res);
    }
};

/**
 * @swagger
 * /api/parse-html:
 *   post:
 *     summary: Parse raw HTML content directly
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - html
 *             properties:
 *               html:
 *                 type: string
 *                 description: The HTML content to parse
 *               url:
 *                 type: string
 *                 description: Optional URL to help with relative links
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReadabilityResponse'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Invalid token or restricted URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const parseHtmlEndpoint = async (req, res) => {
    try {
        const { html, url } = req.body;

        // SSRF protection for optional URL in parse-html endpoint
        if (url) {
            const urlValidation = await validateUrl(url);
            if (!urlValidation.valid) {
                logger.warn({
                    msg: 'SSRF attempt blocked in HTML parsing',
                    url,
                    reason: urlValidation.reason,
                    ip: req.ip,
                });

                return res.status(403).json({
                    success: false,
                    error: urlValidation.reason
                });
            }
        }

        logger.info({
            msg: 'Parsing HTML content',
            url: url || 'no url provided',
            contentLength: html.length,
        });

        const article = await parseHtml(html, url);

        res.json({
            success: true,
            data: article
        });

    } catch (error) {
        handleError(error, res);
    }
};

module.exports = {
    parseUrl,
    parseHtmlEndpoint,
}; 