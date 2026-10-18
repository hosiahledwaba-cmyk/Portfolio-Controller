import { extractTextFromBuffer, parseCvTextToPortfolio } from '../lib/cvParser.js';
import { verifyAdminToken } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to extract CV data.',
    });
  }

  const isAuthorized = await verifyAdminToken(req);
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { data, filename } = body;

  if (!data) {
    return res.status(400).json({
      success: false,
      error: 'Missing data field (base64 string or data URL).',
    });
  }

  try {
    let buffer;
    if (typeof data === 'string' && data.startsWith('data:')) {
      const base64Data = data.split(';base64,').pop() || '';
      buffer = Buffer.from(base64Data, 'base64');
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data, 'base64');
    } else {
      buffer = Buffer.from(data);
    }

    const rawText = extractTextFromBuffer(buffer, filename || 'document.pdf');
    const parsedData = parseCvTextToPortfolio(rawText);

    return res.status(200).json({
      success: true,
      message: 'CV text extracted successfully.',
      rawTextLength: rawText.length,
      snippet: rawText.substring(0, 300),
      extracted: parsedData,
    });
  } catch (err) {
    console.error('CV text extraction error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to extract text from CV document.',
    });
  }
}
