import { openapiSpec } from '../lib/openapiSpec.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation // Portfolio Controller</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-16x16.png" sizes="16x16" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0a0c10;
      --card-bg: #12161f;
      --border-color: #21262d;
      --accent-volt: #ccff00;
      --accent-electric: #00ccff;
      --text-main: #e6edf3;
      --text-muted: #8b949e;
    }

    body {
      margin: 0;
      padding: 0;
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Top HUD Navigation Bar */
    .top-nav {
      background: #161b22;
      border-bottom: 1px solid var(--border-color);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .top-nav .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      font-size: 14px;
      color: #ffffff;
      letter-spacing: 0.05em;
    }

    .top-nav .brand span.badge {
      background: rgba(204, 255, 0, 0.15);
      border: 1px solid var(--accent-volt);
      color: var(--accent-volt);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .top-nav .nav-links {
      display: flex;
      gap: 16px;
      font-size: 13px;
      font-family: 'Space Mono', monospace;
    }

    .top-nav .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }

    .top-nav .nav-links a:hover {
      color: var(--accent-volt);
    }

    /* Info Banner */
    .auth-banner {
      background: rgba(0, 204, 255, 0.08);
      border-bottom: 1px solid rgba(0, 204, 255, 0.2);
      padding: 10px 24px;
      font-size: 12px;
      font-family: 'Space Mono', monospace;
      color: #a5d6ff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .auth-banner code {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--accent-volt);
    }

    /* Swagger Dark Theme Adjustments */
    .swagger-ui {
      background: var(--bg-dark);
      color: var(--text-main);
    }

    .swagger-ui .wrapper {
      max-width: 1280px;
      padding: 24px;
    }

    .swagger-ui .info {
      margin: 20px 0;
    }

    .swagger-ui .info .title {
      color: #ffffff;
      font-family: 'Space Mono', monospace;
      letter-spacing: -0.02em;
    }

    .swagger-ui .info p, .swagger-ui .info li {
      color: var(--text-muted);
    }

    .swagger-ui .scheme-container {
      background: #161b22;
      box-shadow: none;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .swagger-ui .opblock {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      box-shadow: none;
      margin-bottom: 16px;
    }

    .swagger-ui .opblock.opblock-get {
      border-color: rgba(0, 204, 255, 0.4);
      background: rgba(0, 204, 255, 0.04);
    }

    .swagger-ui .opblock.opblock-put {
      border-color: rgba(204, 255, 0, 0.4);
      background: rgba(204, 255, 0, 0.04);
    }

    .swagger-ui .opblock.opblock-post {
      border-color: rgba(74, 222, 128, 0.4);
      background: rgba(74, 222, 128, 0.04);
    }

    .swagger-ui .opblock .opblock-summary {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 4px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
    }

    .swagger-ui .opblock-summary-path {
      color: #ffffff !important;
      font-family: 'Space Mono', monospace;
      font-size: 14px;
    }

    .swagger-ui .opblock-summary-description {
      color: var(--text-muted) !important;
    }

    .swagger-ui .opblock-body {
      background: #0d1117;
    }

    .swagger-ui section.models {
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      border-radius: 6px;
    }

    .swagger-ui section.models h4 {
      color: #ffffff;
      font-family: 'Space Mono', monospace;
    }

    .swagger-ui .btn.authorize {
      border-color: var(--accent-volt);
      color: var(--accent-volt);
      background: transparent;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      font-weight: 700;
    }

    .swagger-ui .btn.authorize svg {
      fill: var(--accent-volt);
    }

    .swagger-ui .btn.authorize:hover {
      background: var(--accent-volt);
      color: #000;
    }

    .swagger-ui .btn.authorize:hover svg {
      fill: #000;
    }

    .swagger-ui .btn.execute {
      background-color: var(--accent-volt);
      border-color: var(--accent-volt);
      color: #000;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
    }

    .swagger-ui select {
      background: #161b22;
      color: #fff;
      border: 1px solid var(--border-color);
    }

    .swagger-ui textarea, .swagger-ui input[type="text"] {
      background: #0d1117;
      color: #e6edf3;
      border: 1px solid var(--border-color);
    }

    .swagger-ui table thead tr td, .swagger-ui table thead tr th {
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
    }

    .swagger-ui .response-col_status {
      color: #ffffff;
      font-family: 'Space Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="top-nav">
    <div class="brand">
      <span>⚡ PORTFOLIO_API</span>
      <span class="badge">Swagger UI // OpenAPI 3.0</span>
    </div>
    <div class="nav-links">
      <a href="/openapi.json" target="_blank">[ Raw OpenAPI Spec ]</a>
      <a href="/api/health" target="_blank">[ Health Diagnostics ]</a>
      <a href="http://localhost:3000" target="_blank">[ Open Web App ]</a>
    </div>
  </div>

  <div class="auth-banner">
    <div>
      🔐 <strong>Authentication:</strong> Click the <strong>Authorize</strong> button below to provide <code>x-admin-key: admin123</code> for testing PUT/POST endpoints.
    </div>
    <div>
      Free Tier: <strong>Eligible</strong>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(openapiSpec)};
      
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
        persistAuthorization: true
      });

      window.ui = ui;
    };
  </script>
</body>
</html>`;

  return res.status(200).send(html);
}
