const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const config = require('../config/app');
const { validateUrl } = require('../utils/urlValidator');
const logger = require('../utils/logger');

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
 * Parse a URL and extract readable content
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
 * Parse raw HTML content directly
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