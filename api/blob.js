import { uploadBlob, deleteBlob, isVercelBlobConfigured } from '../lib/blobStorage.js';
import { verifyAdminToken } from '../lib/auth.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, X-Admin-Key, x-api-key, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Check blob storage provider status
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      provider: isVercelBlobConfigured() ? 'vercel-blob' : 'local-data-url',
      configured: isVercelBlobConfigured(),
      description: isVercelBlobConfigured()
        ? 'Vercel Blob Storage Active (Global Edge CDN)'
        : 'Local Self-Contained Storage (Configure BLOB_READ_WRITE_TOKEN in Vercel for cloud Blob CDN)',
    });
  }

  // Protected mutation actions require admin authorization
  const isAuthorized = await verifyAdminToken(req);
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin passcode required to manage media blobs.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // POST: Upload blob (Headshot or CV)
  if (req.method === 'POST') {
    const { pathname, filename, data, contentType } = body;
    const targetPath = pathname || filename;

    if (!targetPath || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pathname/filename and data (base64 string or data URL).',
      });
    }

    try {
      const result = await uploadBlob({
        pathname: targetPath,
        data,
        contentType,
      });

      return res.status(200).json({
        success: true,
        message: 'File successfully uploaded to blob storage.',
        ...result,
      });
    } catch (err) {
      console.error('Blob upload error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to upload blob.',
      });
    }
  }

  // DELETE: Remove blob
  if (req.method === 'DELETE') {
    const url = body.url || req.query.url;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing url parameter to delete blob.',
      });
    }

    try {
      await deleteBlob(url);
      return res.status(200).json({
        success: true,
        message: 'Blob successfully deleted.',
      });
    } catch (err) {
      console.error('Blob deletion error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete blob.',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`,
  });
}
