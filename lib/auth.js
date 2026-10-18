import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_AUTH_FILE = path.resolve(__dirname, '../data/auth-state.json');
const TMP_AUTH_FILE = path.join(os.tmpdir(), 'portfolio-auth-state.json');

// In-memory cache for the admin secret
let cachedSecret = null;
let lastSecretFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

export function generateAuthSignature(key, master = 'admin123') {
  return crypto.createHmac('sha256', master).update(String(key).trim()).digest('hex');
}

/**
 * Read auth state from disk (/tmp on serverless, or local data dir in dev)
 */
function readAuthStateFromDisk() {
  const candidateFiles = [TMP_AUTH_FILE, LOCAL_AUTH_FILE];
  for (const file of candidateFiles) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.password && typeof data.password === 'string') {
          const pass = data.password.trim();
          if (pass.length >= 6) {
            return pass;
          }
        }
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
  return null;
}

/**
 * Write auth state to disk (/tmp and local data dir)
 */
function writeAuthStateToDisk(password) {
  const payload = JSON.stringify({ password, updatedAt: new Date().toISOString() }, null, 2);

  // 1. Write to /tmp (writable in AWS Lambda / Vercel Serverless)
  try {
    fs.writeFileSync(TMP_AUTH_FILE, payload, 'utf-8');
  } catch (err) {
    // Ignore error
  }

  // 2. Write to local repo data folder (writable in local dev)
  try {
    const dir = path.dirname(LOCAL_AUTH_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_AUTH_FILE, payload, 'utf-8');
  } catch (err) {
    // Read-only filesystem in serverless, silently ignore
  }
}

/**
 * Get current admin secret (from KV, env var, disk, memory, or fallback)
 */
export async function getAdminSecret() {
  const now = Date.now();
  const kv = getKvConfig();

  // If we have a cached secret and it's within TTL, or if KV is NOT configured
  if (cachedSecret) {
    if (!kv) {
      // Without external KV, memory + /tmp is the source of truth; never expire back to admin123
      return cachedSecret;
    }
    if (now - lastSecretFetchTime < CACHE_TTL_MS) {
      return cachedSecret;
    }
  }

  // 1. Check Upstash KV / Vercel KV if available
  if (kv) {
    try {
      const res = await fetch(`${kv.url}/get/admin_password`, {
        headers: { Authorization: `Bearer ${kv.token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.result !== null && json.result !== undefined) {
          let val = json.result;
          if (typeof val === 'string') {
            val = val.trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              try {
                val = JSON.parse(val);
              } catch (e) {}
            }
          }
          if (val && typeof val === 'string' && val.trim().length >= 6) {
            cachedSecret = val.trim();
            lastSecretFetchTime = now;
            writeAuthStateToDisk(cachedSecret);
            return cachedSecret;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching admin secret from KV:', err);
    }
  }

  // 2. Check disk (/tmp on Vercel or local file)
  const diskSecret = readAuthStateFromDisk();
  if (diskSecret) {
    cachedSecret = diskSecret;
    lastSecretFetchTime = now;
    return cachedSecret;
  }

  // 3. Check environment variable (Vercel Project Settings)
  if (process.env.ADMIN_SECRET) {
    cachedSecret = String(process.env.ADMIN_SECRET).trim();
    lastSecretFetchTime = now;
    return cachedSecret;
  }

  // 4. If memory cache was already a non-default secret, preserve it
  if (cachedSecret && cachedSecret !== 'admin123') {
    return cachedSecret;
  }

  // 5. Default fallback
  cachedSecret = 'admin123';
  lastSecretFetchTime = now;
  return cachedSecret;
}

/**
 * Save new admin password to disk, memory cache, and KV
 */
export async function saveAdminPassword(newPassword) {
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const trimmed = newPassword.trim();
  cachedSecret = trimmed;
  lastSecretFetchTime = Date.now();

  // 1. Save to disk (/tmp and local data file)
  writeAuthStateToDisk(trimmed);

  // 2. Save to Upstash KV if configured
  const kv = getKvConfig();
  if (kv) {
    try {
      // Standard Upstash REST command array
      const cmdRes = await fetch(`${kv.url}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', 'admin_password', trimmed]),
      });
      if (!cmdRes.ok) {
        // Fallback to REST path endpoint
        await fetch(`${kv.url}/set/admin_password`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kv.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trimmed),
        });
      }
    } catch (err) {
      console.error('Error saving admin password to KV:', err);
    }
  }

  return true;
}

/**
 * Check if the active secret is the default "admin123"
 */
export async function isUsingDefaultSecret() {
  const secret = await getAdminSecret();
  return secret === 'admin123';
}

/**
 * Verify admin request authorization
 * Checks:
 * 1. 'x-admin-key' or 'x-api-key' header (case-insensitive)
 * 2. 'authorization' header (direct string, Bearer <token>, or ApiKey <token>)
 * 3. Request body { password }, { adminKey }, { passcode }, or { key } (even if raw string)
 * 4. Query string (?adminKey= or ?key= or ?passcode=)
 * 5. Cold-start fallback reconciliation for serverless functions
 */
export async function verifyAdminToken(req) {
  const secret = await getAdminSecret();
  if (!secret) return false;

  const headers = req.headers || {};

  // Extract custom headers (x-admin-key, x-api-key, etc.)
  const customKey = (
    headers['x-admin-key'] ||
    headers['X-Admin-Key'] ||
    headers['x-api-key'] ||
    headers['X-Api-Key'] ||
    ''
  ).toString().trim();

  // Extract standard Authorization header
  let authBearer = '';
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (authHeader) {
    const trimmedAuth = String(authHeader).trim();
    if (trimmedAuth.startsWith('Bearer ') || trimmedAuth.startsWith('ApiKey ')) {
      authBearer = trimmedAuth.slice(7).trim();
    } else {
      authBearer = trimmedAuth;
    }
  }

  // Extract from body if JSON
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }
  const bodyKey = (body && typeof body === 'object') ?
    (body.adminKey || body.password || body.passcode || body.key || '').toString().trim() : '';

  // Extract from query
  const queryKey = req.query ?
    (req.query.adminKey || req.query.key || req.query.passcode || '').toString().trim() : '';

  // Any extracted token candidate
  const candidateKeys = [customKey, authBearer, bodyKey, queryKey].filter(Boolean);

  // 1. Direct match with current active secret
  for (const candidate of candidateKeys) {
    if (candidate === secret) {
      return true;
    }
  }

  // 2. Fallback / Cold-Start Reconciliation
  // If the server is currently on default 'admin123' (e.g. freshly cold-started serverless container)
  if (secret === 'admin123') {
    const fallbackHeader = (
      headers['x-admin-fallback'] ||
      headers['X-Admin-Fallback'] ||
      (body && typeof body === 'object' ? body.adminFallback : '') ||
      ''
    ).toString().trim();

    const signature = (
      headers['x-admin-signature'] ||
      headers['X-Admin-Signature'] ||
      ''
    ).toString().trim();

    // Check if the client provided proof that they know the master secret 'admin123'
    for (const candidate of candidateKeys) {
      if (candidate.length >= 6) {
        // Did client send fallback header matching default secret?
        if (fallbackHeader === 'admin123') {
          saveAdminPassword(candidate).catch(() => {});
          return true;
        }

        // Did client send valid HMAC signature?
        if (signature && signature === generateAuthSignature(candidate, 'admin123')) {
          saveAdminPassword(candidate).catch(() => {});
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Explicitly verify a password string against current admin secret
 */
export async function verifyPassword(password) {
  if (!password || typeof password !== 'string') return false;
  const secret = await getAdminSecret();
  return password.trim() === secret;
}

