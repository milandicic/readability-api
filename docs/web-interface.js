const getWebInterface = () => `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Readability.js Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary-color: #4f46e5;
                --primary-hover: #4338ca;
                --text-color: #111827;
                --bg-color: #ffffff;
                --light-gray: #f3f4f6;
                --border-color: #e5e7eb;
                --success-color: #10b981;
                --error-color: #ef4444;
            }
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Inter', sans-serif;
                color: var(--text-color);
                background-color: var(--bg-color);
                line-height: 1.5;
                max-width: 900px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            h1 {
                font-weight: 700;
                font-size: 1.75rem;
                color: var(--primary-color);
                margin: 0;
            }
            
            .api-docs-link {
                display: inline-flex;
                align-items: center;
                font-weight: 500;
                font-size: 0.875rem;
                color: var(--primary-color);
                text-decoration: none;
                padding: 0.5rem 0.75rem;
                border-radius: 0.375rem;
                background-color: rgba(79, 70, 229, 0.1);
                transition: all 0.15s ease;
            }
            
            .api-docs-link:hover {
                background-color: rgba(79, 70, 229, 0.15);
                transform: translateY(-1px);
            }
            
            .api-docs-link svg {
                margin-right: 0.375rem;
            }
            
            .form-container {
                background-color: var(--light-gray);
                border-radius: 0.5rem;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            label {
                display: block;
                font-weight: 500;
                margin-bottom: 0.5rem;
            }
            
            input[type="url"] {
                width: 100%;
                padding: 0.75rem;
                font-size: 1rem;
                border: 1px solid var(--border-color);
                border-radius: 0.375rem;
                margin-bottom: 1rem;
                font-family: 'Inter', sans-serif;
            }
            
            input[type="url"]:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
            }
            
            button {
                padding: 0.75rem 1.25rem;
                font-size: 1rem;
                font-weight: 500;
                border: none;
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: 'Inter', sans-serif;
            }
            
            .btn-primary {
                background-color: var(--primary-color);
                color: white;
            }
            
            .btn-primary:hover {
                background-color: var(--primary-hover);
            }
            
            .btn-secondary {
                background-color: white;
                color: var(--text-color);
                border: 1px solid var(--border-color);
                margin-left: 0.75rem;
            }
            
            .btn-secondary:hover {
                background-color: var(--light-gray);
            }
            
            .btn-container {
                display: flex;
                align-items: center;
            }
            
            #result {
                margin-top: 2rem;
                padding: 1.5rem;
                border: 1px solid var(--border-color);
                border-radius: 0.5rem;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: break-word;
                display: none;
            }
            
            #result.visible {
                display: block;
            }
            
            #result img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1em 0;
            }
            
            #result h2 {
                margin-bottom: 1rem;
                color: var(--text-color);
                font-size: 1.5rem;
                line-height: 1.3;
            }
            
            .article-meta {
                margin-bottom: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid var(--border-color);
            }
            
            .article-meta p {
                margin-bottom: 0.5rem;
            }
            
            #result table {
                max-width: 100%;
                overflow-x: auto;
                display: block;
                border-collapse: collapse;
                margin: 1em 0;
            }
            
            #result table td, #result table th {
                padding: 0.5rem;
                border: 1px solid var(--border-color);
            }
            
            #result pre {
                max-width: 100%;
                overflow-x: auto;
                padding: 1em;
                background: var(--light-gray);
                border-radius: 0.375rem;
                margin: 1em 0;
            }
            
            #result iframe {
                max-width: 100%;
                width: 100%;
                margin: 1em 0;
            }
            
            .spinner {
                display: none;
                width: 2rem;
                height: 2rem;
                border-radius: 50%;
                border: 3px solid rgba(79, 70, 229, 0.3);
                border-top-color: var(--primary-color);
                animation: spin 1s linear infinite;
                margin: 2rem auto;
            }
            
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
            
            .error-message {
                color: var(--error-color);
                padding: 1rem;
                background-color: rgba(239, 68, 68, 0.1);
                border-radius: 0.375rem;
                margin-bottom: 1rem;
            }
            
            #result .content {
                width: 100%;
                overflow-x: hidden;
                line-height: 1.6;
            }
            
            #result .content h1,
            #result .content h2,
            #result .content h3,
            #result .content h4,
            #result .content h5,
            #result .content h6 {
                margin: 1.5em 0 0.75em;
                line-height: 1.3;
            }
            
            #result .content h1:first-child,
            #result .content h2:first-child,
            #result .content h3:first-child,
            #result .content h4:first-child,
            #result .content h5:first-child,
            #result .content h6:first-child {
                margin-top: 0;
            }
            
            #result .content p,
            #result .content ul,
            #result .content ol {
                margin-bottom: 1.25em;
            }
            
            #result .content li {
                margin-bottom: 0.5em;
            }
            
            #result .content blockquote {
                margin: 1.5em 0;
                padding: 0.75em 1.25em;
                border-left: 4px solid var(--primary-color);
                background-color: var(--light-gray);
                font-style: italic;
            }
            
            @media (max-width: 640px) {
                body {
                    padding: 1rem;
                }
                
                header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .btn-container {
                    margin-top: 1rem;
                }
                
                .btn-secondary {
                    margin-left: 0;
                    margin-top: 0.5rem;
                }
            }
        </style>
    </head>
    <body>
        <header>
            <h1>Readability.js Demo</h1>
            <a href="/api/docs" target="_blank" class="api-docs-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                API Documentation
            </a>
        </header>
        
        <div class="form-container">
            <div class="form-group">
                <label for="url">Enter URL to parse:</label>
                <input type="url" id="url" placeholder="https://example.com/article">
                <div class="btn-container">
                    <button class="btn-primary" onclick="parseArticle()">Parse Article</button>
                </div>
            </div>
        </div>
        
        <div id="error-container"></div>
        <div class="spinner" id="loading-spinner"></div>
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
                const resultDiv = document.getElementById('result');
                const spinner = document.getElementById('loading-spinner');
                const errorContainer = document.getElementById('error-container');
                
                // Clear previous results and errors
                resultDiv.innerHTML = '';
                resultDiv.classList.remove('visible');
                errorContainer.innerHTML = '';
                
                if (!url) {
                    errorContainer.innerHTML = '<div class="error-message">Please enter a URL</div>';
                    return;
                }

                try {
                    // Show loading spinner
                    spinner.style.display = 'block';
                    
                    const response = await fetch('/api/parse', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + API_TOKEN
                        },
                        body: JSON.stringify({ url })
                    });

                    const data = await response.json();
                    
                    // Hide spinner
                    spinner.style.display = 'none';
                    
                    if (data.error) {
                        errorContainer.innerHTML = \`<div class="error-message">Error: \${data.error}</div>\`;
                        return;
                    }

                    resultDiv.innerHTML = \`
                        <div>
                            <h2>\${data.data.title}</h2>
                            <div class="article-meta">
                                <p><strong>Author:</strong> \${data.data.byline || 'Unknown'}</p>
                                <p><strong>Length:</strong> \${data.data.length} characters</p>
                                <p><strong>Excerpt:</strong> \${data.data.excerpt}</p>
                            </div>
                            <div class="content">\${data.data.content}</div>
                        </div>
                    \`;

                    // Fix any excessive spacing issues in the content
                    resultDiv.querySelectorAll('.content p').forEach(paragraph => {
                        if (paragraph.innerHTML.trim() === '') {
                            paragraph.style.margin = '0.5em 0';
                        }
                    });

                    resultDiv.querySelectorAll('a').forEach(link => {
                        link.setAttribute('target', '_blank');
                        link.setAttribute('rel', 'noopener noreferrer');
                    });
                    
                    // Show the result container
                    resultDiv.classList.add('visible');
                } catch (error) {
                    // Hide spinner
                    spinner.style.display = 'none';
                    
                    errorContainer.innerHTML = 
                        \`<div class="error-message">Error: \${error.message}</div>\`;
                }
            }
        </script>
    </body>
    </html>
`;

module.exports = { getWebInterface };