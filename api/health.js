import { getStorageProviderInfo } from '../lib/storage.js';
import { isUsingDefaultSecret, verifyAdminToken } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isAuthorized = await verifyAdminToken(req);

  const baseResponse = {
    status: 'healthy',
    service: 'Portfolio Controller Serverless API',
    runtime: 'Node.js (Vercel Serverless Function)',
    timestamp: new Date().toISOString(),
    tier: 'Vercel Free Tier Eligible',
  };

  // Do not expose internal storage topology or default credential warnings to public callers
  if (!isAuthorized) {
    return res.status(200).json(baseResponse);
  }

  const storageInfo = getStorageProviderInfo();

  return res.status(200).json({
    ...baseResponse,
    storage: storageInfo,
    security: {
      defaultSecretInUse: await isUsingDefaultSecret(),
    },
  });
}
