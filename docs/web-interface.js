const getWebInterface = () => `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Readability.js Demo</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            input[type="url"] {
                width: 100%;
                padding: 8px;
                margin-bottom: 10px;
            }
            button {
                padding: 10px 20px;
                background-color: #007bff;
                color: white;
                border: none;
                cursor: pointer;
            }
            button:hover {
                background-color: #0056b3;
            }
            #result {
                margin-top: 20px;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 4px;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: break-word;
            }
            #result img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1em 0;
            }
            #result .content {
                width: 100%;
                overflow-x: hidden;
            }
            #result table {
                max-width: 100%;
                overflow-x: auto;
                display: block;
            }
            #result pre {
                max-width: 100%;
                overflow-x: auto;
                padding: 1em;
                background: #f5f5f5;
                border-radius: 4px;
            }
            #result iframe {
                max-width: 100%;
                width: 100%;
                margin: 1em 0;
            }
        </style>
    </head>
    <body>
        <h1>Readability.js Demo</h1>
        <div class="form-group">
            <label for="url">Enter URL to parse:</label>
            <input type="url" id="url" placeholder="https://example.com/article">
            <button onclick="parseArticle()">Parse Article</button>
        </div>
        <div id="result"></div>

        <script>
            const API_TOKEN = '${process.env.API_TOKEN}';

            // Add event listener for Enter key
            document.getElementById('url').addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    parseArticle();
                }
            });

            async function parseArticle() {
                const url = document.getElementById('url').value;
                if (!url) {
                    alert('Please enter a URL');
                    return;
                }

                try {
                    const response = await fetch('/api/parse', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + API_TOKEN
                        },
                        body: JSON.stringify({ url })
                    });

                    const data = await response.json();
                    const resultDiv = document.getElementById('result');
                    
                    if (data.error) {
                        resultDiv.innerHTML = \`<p style="color: red;">Error: \${data.error}</p>\`;
                        return;
                    }

                    resultDiv.innerHTML = \`
                        <div>
                            <h2>\${data.data.title}</h2>
                            <p><strong>Author:</strong> \${data.data.byline || 'Unknown'}</p>
                            <p><strong>Length:</strong> \${data.data.length} characters</p>
                            <p><strong>Excerpt:</strong> \${data.data.excerpt}</p>
                            <div class="content">\${data.data.content}</div>
                        </div>
                    \`;

                    resultDiv.querySelectorAll('a').forEach(link => {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                    });
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        \`<p style="color: red;">Error: \${error.message}</p>\`;
                }
            }
        </script>
    </body>
    </html>
`;

module.exports = { getWebInterface };