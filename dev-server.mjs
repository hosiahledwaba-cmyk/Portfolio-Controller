import http from 'http';
import { URL } from 'url';
import portfolioHandler from './api/portfolio.js';
import resetHandler from './api/reset.js';
import healthHandler from './api/health.js';
import authHandler from './api/auth.js';
import docsHandler from './api/docs.js';
import openapiHandler from './api/openapi.js';
import blobHandler from './api/blob.js';
import cvExtractHandler from './api/cv-extract.js';
import githubHandler from './api/github.js';
import postsHandler from './api/posts.js';

const PORT = process.env.PORT || 4000;

function enhanceResponse(res) {
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = function (data) {
    res.end(data);
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  // Set default CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // Parse URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  // Buffer and parse JSON body if present
  let bodyData = '';
  req.on('data', chunk => {
    bodyData += chunk;
  });

  req.on('end', async () => {
    if (bodyData) {
      try {
        req.body = JSON.parse(bodyData);
      } catch (e) {
        req.body = bodyData;
      }
    } else {
      req.body = {};
    }

    const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';

    try {
      if (pathname === '/docs' || pathname === '/api/docs' || pathname === '/') {
        return await docsHandler(req, res);
      } else if (pathname === '/openapi.json' || pathname === '/api/openapi.json') {
        return await openapiHandler(req, res);
      } else if (pathname === '/api/portfolio') {
        return await portfolioHandler(req, res);
      } else if (pathname === '/api/reset' || pathname === '/api/portfolio/reset') {
        return await resetHandler(req, res);
      } else if (pathname === '/api/health') {
        return await healthHandler(req, res);
      } else if (pathname === '/api/auth') {
        return await authHandler(req, res);
      } else if (pathname === '/api/blob' || pathname === '/api/upload') {
        return await blobHandler(req, res);
      } else if (pathname === '/api/cv-extract' || pathname === '/api/cv/extract') {
        return await cvExtractHandler(req, res);
      } else if (pathname === '/api/github' || pathname === '/api/github/repos' || pathname === '/api/github/sync') {
        return await githubHandler(req, res);
      } else if (pathname === '/api/posts' || pathname === '/api/posts/react' || pathname.startsWith('/api/posts/')) {
        return await postsHandler(req, res);
      } else {
        return res.status(404).json({ success: false, error: `Route ${pathname} not found` });
      }
    } catch (err) {
      console.error('Unhandled server error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
});

server.listen(PORT, () => {
  console.log(`⚡ Serverless Controller API dev server running at: http://localhost:${PORT}`);
  console.log(`   - 📖 Swagger Docs: http://localhost:${PORT}/docs`);
  console.log(`   - 📋 OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
  console.log(`   - 🎯 Portfolio API: http://localhost:${PORT}/api/portfolio`);
  console.log(`   - 🩺 Health Check:  http://localhost:${PORT}/api/health`);
});
