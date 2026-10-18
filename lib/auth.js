import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_STATE_FILE = path.resolve(__dirname, '../data/auth-state.json');

// In-memory cache for the admin secret with short TTL to allow propagation across serverless lambdas
let cachedSecret = null;
let lastSecretFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

/**
 * Get current admin secret (from memory, KV, local file, env var, or fallback)
 */
export async function getAdminSecret() {
  const now = Date.now();
  if (cachedSecret && now - lastSecretFetchTime < CACHE_TTL_MS) {
    return cachedSecret;
  }

  // 1. Check Upstash KV / Vercel KV if available
  const kv = getKvConfig();
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
          if (val && typeof val === 'string') {
            cachedSecret = val.trim();
            lastSecretFetchTime = now;
            return cachedSecret;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching admin secret from KV:', err);
    }
  }

  // 2. Check local auth-state.json file (dev persistence)
  try {
    if (fs.existsSync(AUTH_STATE_FILE)) {
      const raw = fs.readFileSync(AUTH_STATE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data && data.password) {
        cachedSecret = String(data.password).trim();
        lastSecretFetchTime = now;
        return cachedSecret;
      }
    }
  } catch (err) {
    // Ignore file read error
  }

  // 3. Check environment variable
  if (process.env.ADMIN_SECRET) {
    cachedSecret = String(process.env.ADMIN_SECRET).trim();
    lastSecretFetchTime = now;
    return cachedSecret;
  }

  // 4. Default fallback
  cachedSecret = 'admin123';
  lastSecretFetchTime = now;
  return cachedSecret;
}

/**
 * Save new admin password to KV, local file, and memory cache
 */
export async function saveAdminPassword(newPassword) {
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const trimmed = newPassword.trim();
  cachedSecret = trimmed;

  // 1. Save to Upstash KV if configured
  const kv = getKvConfig();
  if (kv) {
    try {
      await fetch(`${kv.url}/set/admin_password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmed),
      });
    } catch (err) {
      console.error('Error saving admin password to KV:', err);
    }
  }

  // 2. Save to local file
  try {
    const dir = path.dirname(AUTH_STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      AUTH_STATE_FILE,
      JSON.stringify({ password: trimmed, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    // Ignore filesystem restrictions in serverless
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
 */
export async function verifyAdminToken(req) {
  const secret = await getAdminSecret();
  if (!secret) return false;

  // 1. Check custom headers (support lowercase and uppercase)
  const headers = req.headers || {};
  const customKey = 
    headers['x-admin-key'] || 
    headers['X-Admin-Key'] || 
    headers['x-api-key'] || 
    headers['X-Api-Key'];
  if (customKey && String(customKey).trim() === secret) {
    return true;
  }

  // 2. Check standard 'authorization' header
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (authHeader) {
    const trimmedAuth = String(authHeader).trim();
    if (trimmedAuth === secret) {
      return true;
    }
    const parts = trimmedAuth.split(' ');
    if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'ApiKey')) {
      if (parts[1].trim() === secret) {
        return true;
      }
    }
  }

  // 3. Check JSON request body if present (parse if string)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }
  if (body && typeof body === 'object') {
    const bodyPassword = body.adminKey || body.password || body.passcode || body.key;
    if (bodyPassword && String(bodyPassword).trim() === secret) {
      return true;
    }
  }

  // 4. Check query parameters fallback
  if (req.query) {
    const queryKey = req.query.adminKey || req.query.key || req.query.passcode;
    if (queryKey && String(queryKey).trim() === secret) {
      return true;
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

