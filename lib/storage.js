import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_PORTFOLIO_DATA } from './defaultData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORAGE_FILE = path.resolve(__dirname, '../data/portfolio-state.json');

// In-memory runtime cache
let memoryCache = null;

// Determine if Upstash Redis / Vercel KV REST is configured
function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

export function getStorageProviderInfo() {
  const kv = getKvConfig();
  if (kv) {
    return {
      provider: 'upstash-kv',
      configured: true,
      description: 'Vercel KV / Upstash Redis REST API (Free Tier)',
    };
  }
  return {
    provider: 'local-memory',
    configured: false,
    description: 'In-Memory / Local File Fallback (Connect Upstash Redis in Vercel for cross-lambda persistent storage)',
  };
}

/**
 * Retrieve portfolio data
 */
export async function getPortfolioData() {
  const kv = getKvConfig();

  if (kv) {
    try {
      const res = await fetch(`${kv.url}/get/portfolio_data`, {
        headers: { Authorization: `Bearer ${kv.token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.result) {
          try {
            const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
            return parsed;
          } catch (e) {
            console.error('Failed to parse KV result:', e);
          }
        }
      }
      // If key doesn't exist in KV yet, seed it with default data
      await savePortfolioData(DEFAULT_PORTFOLIO_DATA);
      return DEFAULT_PORTFOLIO_DATA;
    } catch (err) {
      console.error('Error fetching from Upstash KV, falling back to cache:', err);
    }
  }

  // Fallback: Check in-memory cache
  if (memoryCache) {
    return memoryCache;
  }

  // Fallback: Check local JSON file if exists
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
      memoryCache = JSON.parse(raw);
      return memoryCache;
    }
  } catch (err) {
    // Ignore read errors
  }

  // Fallback: default seed
  memoryCache = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  return memoryCache;
}

/**
 * Save updated portfolio data
 */
export async function savePortfolioData(data) {
  memoryCache = data;

  const kv = getKvConfig();
  if (kv) {
    try {
      const serialized = typeof data === 'string' ? data : JSON.stringify(data);
      const res = await fetch(`${kv.url}/set/portfolio_data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serialized),
      });
      if (!res.ok) {
        console.error('KV set returned error status:', res.status);
      }
    } catch (err) {
      console.error('Error saving to Upstash KV:', err);
    }
  }

  // Also persist to local file in development/local environments
  try {
    const dir = path.dirname(LOCAL_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Filesystem might be read-only in some serverless environments
  }

  return memoryCache;
}

/**
 * Reset portfolio data to default seed
 */
export async function resetPortfolioData() {
  const fresh = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  return await savePortfolioData(fresh);
}
