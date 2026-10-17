import { verifyAdminToken, isUsingDefaultSecret, saveAdminPassword, getAdminSecret } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Handle password change request
  if (req.method === 'PUT' || (req.method === 'POST' && (body.newPassword || body.action === 'change_password'))) {
    const currentSecret = await getAdminSecret();
    const providedCurrent = body.currentPassword || req.headers['x-admin-key'];

    if (!providedCurrent || providedCurrent !== currentSecret) {
      return res.status(401).json({
        success: false,
        error: 'Current admin passcode is incorrect.',
      });
    }

    if (!body.newPassword || typeof body.newPassword !== 'string' || body.newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New passcode must be at least 6 characters long.',
      });
    }

    if (body.newPassword.trim() === 'admin123') {
      return res.status(400).json({
        success: false,
        error: 'Please choose a passcode different from the default "admin123".',
      });
    }

    try {
      await saveAdminPassword(body.newPassword.trim());
      return res.status(200).json({
        success: true,
        message: 'Admin passcode updated successfully.',
      });
    } catch (err) {
      console.error('Error updating password:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to update passcode.',
      });
    }
  }

  // Handle password verification request
  const isValid = await verifyAdminToken(req);
  const isDefault = await isUsingDefaultSecret();

  if (isValid) {
    return res.status(200).json({
      valid: true,
      message: 'Authenticated as Controller Admin',
      defaultSecretInUse: isDefault,
    });
  }

  return res.status(401).json({
    valid: false,
    message: 'Invalid admin passcode',
    defaultSecretInUse: isDefault,
  });
}
