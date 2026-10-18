import { resetPortfolioData } from '../lib/storage.js';
import { verifyAdminToken } from '../lib/auth.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, X-Admin-Key, x-api-key, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST to reset.' });
  }

  // Ensure an authorization credential was submitted
  const hasAuthHeader = req.headers['x-admin-key'] || req.headers['authorization'] || req.headers['x-api-key'];
  const hasBodyPassword = req.body && typeof req.body === 'object' && (req.body.password || req.body.adminKey || req.body.passcode);

  if (!hasAuthHeader && !hasBodyPassword) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin password is required to reset the portfolio to seed data.',
    });
  }

  const isAuthorized = await verifyAdminToken(req);
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Incorrect admin password. Factory seed reset rejected.',
    });
  }

  try {
    const data = await resetPortfolioData();
    return res.status(200).json({
      success: true,
      message: 'Portfolio reset to default successfully',
      data,
    });
  } catch (err) {
    console.error('Error resetting portfolio:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset portfolio data',
    });
  }
}
