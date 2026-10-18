import { getPortfolioData, savePortfolioData } from '../lib/storage.js';
import { verifyAdminToken, isUsingDefaultSecret } from '../lib/auth.js';

export default async function handler(req, res) {
  // CORS configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, X-Admin-Key, x-api-key, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Public read endpoint for webapp
  if (req.method === 'GET') {
    try {
      const data = await getPortfolioData();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve portfolio details',
      });
    }
  }

  // PUT / POST: Protected update endpoint
  if (req.method === 'PUT' || req.method === 'POST') {
    // Parse JSON body first so verifyAdminToken can inspect body.adminKey / body.password if headers were dropped
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {}
    }

    const isAuthorized = await verifyAdminToken(req);
    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing admin passcode. Please provide the admin key.',
      });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid payload: Request body must be a valid JSON object.',
        });
      }

      // Strip authentication credentials from incoming body before persisting to database
      const sanitizedBody = { ...body };
      delete sanitizedBody.adminKey;
      delete sanitizedBody.passcode;
      delete sanitizedBody.password;

      // Merge current data with incoming updates or replace completely if whole structure is passed
      const current = await getPortfolioData();
      const updated = {
        ...current,
        ...sanitizedBody,
      };

      const saved = await savePortfolioData(updated);
      const isDefault = await isUsingDefaultSecret();

      return res.status(200).json({
        success: true,
        message: 'Portfolio details updated successfully',
        data: saved,
        warning: isDefault
          ? 'Notice: Default admin passcode is in use. Set a custom password in Controller or ADMIN_SECRET in Vercel for production.'
          : undefined,
      });
    } catch (err) {
      console.error('Error updating portfolio:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to update portfolio data',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`,
  });
}
