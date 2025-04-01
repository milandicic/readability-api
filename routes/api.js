const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const config = require('../config/app');

const parseHtml = async (html, url) => {
    const dom = new JSDOM(html, {
        url: url || 'http://localhost',
        runScripts: 'outside-only',
        resources: 'usable'
    });

    const document = dom.window.document;
    const article = new Readability(document).parse();

    if (!article) {
        throw new Error('Could not parse article content');
    }

    return article;
};

const handleError = (error, res) => {
    if (error.code === 'ECONNABORTED') {
        return res.status(504).json({
            success: false,
            error: 'Request timeout'
        });
    }

    if (error.response) {
        return res.status(error.response.status).json({
            success: false,
            error: `Failed to fetch URL: ${error.response.statusText}`
        });
    }

    res.status(500).json({
        success: false,
        error: error.message
    });
};

const parseUrl = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        const response = await axios.get(url, config.axios);
        const article = await parseHtml(response.data, url);

        res.json({
            success: true,
            data: article
        });

    } catch (error) {
        handleError(error, res);
    }
};

const parseHtmlEndpoint = async (req, res) => {
    try {
        const { html, url } = req.body;

        if (!html) {
            return res.status(400).json({
                success: false,
                error: 'HTML content is required'
            });
        }

        if (url) {
            try {
                new URL(url);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid URL format'
                });
            }
        }

        const article = await parseHtml(html, url);

        res.json({
            success: true,
            data: article
        });

    } catch (error) {
        handleError(error, res);
    }
};

// Legacy endpoint for backward compatibility
// const legacyParse = async (req, res) => {
//     try {
//         const { url } = req.body;

//         if (!url) {
//             return res.status(400).json({ error: 'URL is required' });
//         }

//         const response = await axios.get(url);
//         const article = await parseHtml(response.data, url);

//         res.json(article);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

module.exports = {
    parseUrl,
    parseHtmlEndpoint,
    // legacyParse
}; 