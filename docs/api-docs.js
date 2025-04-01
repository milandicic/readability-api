const getApiDocs = () => `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Readability.js API Documentation</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            pre {
                background: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
            }
            .endpoint {
                margin-bottom: 30px;
            }
        </style>
    </head>
    <body>
        <h1>Readability.js API Documentation</h1>
        
        <div class="endpoint">
            <h2>Parse URL</h2>
            <p><strong>Endpoint:</strong> POST /api/parse</p>
            <p><strong>Rate Limit:</strong> 100 requests per 15 minutes per IP</p>
            
            <h3>Request Format:</h3>
            <pre>
{
    "url": "https://example.com/article"
}
            </pre>
            
            <h3>Response Format:</h3>
            <pre>
{
    "success": true,
    "data": {
        "title": "Article Title",
        "byline": "Author Name",
        "content": "Article content in HTML format",
        "textContent": "Plain text content",
        "length": 12345,
        "excerpt": "Article excerpt",
        "siteName": "Site Name",
        "lang": "en"
    }
}
            </pre>
            
            <h3>Error Response:</h3>
            <pre>
{
    "success": false,
    "error": "Error message"
}
            </pre>
            
            <h3>Example Usage:</h3>
            <pre>
curl -X POST \\
     -H "Content-Type: application/json" \\
     -d '{"url": "https://example.com/article"}' \\
     http://localhost:3000/api/parse
            </pre>
        </div>

        <div class="endpoint">
            <h2>Parse Raw HTML</h2>
            <p><strong>Endpoint:</strong> POST /api/parse-html</p>
            <p><strong>Rate Limit:</strong> 100 requests per 15 minutes per IP</p>
            
            <h3>Request Format:</h3>
            <pre>
{
    "html": "<!DOCTYPE html><html><body>Your HTML content here...</body></html>",
    "url": "https://example.com/article" // Optional: helps with relative URLs
}
            </pre>
            
            <h3>Response Format:</h3>
            <pre>
{
    "success": true,
    "data": {
        "title": "Article Title",
        "byline": "Author Name",
        "content": "Article content in HTML format",
        "textContent": "Plain text content",
        "length": 12345,
        "excerpt": "Article excerpt",
        "siteName": "Site Name",
        "lang": "en"
    }
}
            </pre>
            
            <h3>Error Response:</h3>
            <pre>
{
    "success": false,
    "error": "Error message"
}
            </pre>
            
            <h3>Example Usage:</h3>
            <pre>
curl -X POST \\
     -H "Content-Type: application/json" \\
     -d '{"html": "<!DOCTYPE html><html><body>Your HTML content...</body></html>"}' \\
     http://localhost:3000/api/parse-html
            </pre>
        </div>
    </body>
    </html>
`;

module.exports = { getApiDocs }; 