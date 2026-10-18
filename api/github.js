import { getPortfolioData } from '../lib/storage.js';
import { fetchGitHubPublicRepos, syncAndAutoPublishProjects } from '../lib/githubSync.js';

export default async function handler(req, res) {
  // CORS configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, X-Admin-Key, x-api-key, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Trigger Auto-Discovery & Auto-Publishing Sync
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const result = await syncAndAutoPublishProjects({
        username: body.username,
      });

      return res.status(result.success ? 200 : 200).json(result);
    } catch (err) {
      console.error('Error during GitHub sync POST:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to complete GitHub synchronization.',
      });
    }
  }

  // GET: Fetch discovered repos or sync if requested
  if (req.method === 'GET') {
    const shouldSync = req.query?.sync === 'true' || req.query?.autoPublish === 'true';
    const username = (req.query?.username || '').trim();

    if (shouldSync) {
      try {
        const result = await syncAndAutoPublishProjects({ username });
        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: err.message || 'Failed to sync GitHub repositories.',
        });
      }
    }

    try {
      const result = await fetchGitHubPublicRepos(username);
      return res.status(200).json({
        success: true,
        username: result.username,
        count: result.repos.length,
        rateLimitRemaining: result.rateLimitRemaining,
        rateLimitReset: result.rateLimitReset,
        authenticated: Boolean(process.env.GITHUB_TOKEN),
        fetchedAt: new Date().toISOString(),
        repos: result.repos,
      });
    } catch (err) {
      const status = err.message.includes('not found') ? 404 : err.message.includes('rate limit') ? 429 : 500;
      return res.status(status).json({
        success: false,
        error: err.message,
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`,
  });
}
