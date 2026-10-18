import { put, del, head } from '@vercel/blob';

// In-memory fallback store when BLOB_READ_WRITE_TOKEN is not configured (local dev)
const localBlobStore = new Map();

/**
 * Check if Vercel Blob is configured with an active token
 */
export function isVercelBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Upload a file to Vercel Blob (or fallback to local dev data storage)
 * @param {Object} options
 * @param {string} options.pathname - Desired filename / path (e.g. 'headshots/profile-1.jpg')
 * @param {Buffer|Blob|string} options.data - File buffer or base64 data
 * @param {string} options.contentType - MIME type
 * @returns {Promise<{ url: string, pathname: string, contentType: string, size: number, provider: string }>}
 */
export async function uploadBlob({ pathname, data, contentType }) {
  if (!pathname) {
    throw new Error('pathname is required for blob upload');
  }

  // Convert base64 data URL to Buffer if provided as string
  let buffer;
  let detectedType = contentType || 'application/octet-stream';

  if (typeof data === 'string') {
    if (data.startsWith('data:')) {
      const match = data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(data);
      }
    } else {
      buffer = Buffer.from(data, 'base64');
    }
  } else if (Buffer.isBuffer(data)) {
    buffer = data;
  } else {
    buffer = Buffer.from(data);
  }

  // 1. Production / Configured Vercel Blob
  if (isVercelBlobConfigured()) {
    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType: detectedType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return {
        url: blob.url,
        downloadUrl: blob.downloadUrl || blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || detectedType,
        size: buffer.length,
        provider: 'vercel-blob',
      };
    } catch (err) {
      console.error('Error uploading to Vercel Blob, falling back to data URL:', err);
    }
  }

  // 2. Local Fallback: Self-contained Data URL or Local Serve URL
  const blobId = `blob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const cleanName = pathname.replace(/^.*[\\\/]/, '');
  
  // For images and documents, a base64 data URI is fully self-contained,
  // requires zero disk writes, and persists with portfolio state across instances.
  const base64Data = buffer.toString('base64');
  const dataUri = `data:${detectedType};base64,${base64Data}`;

  localBlobStore.set(blobId, {
    buffer,
    contentType: detectedType,
    pathname: cleanName,
    createdAt: new Date().toISOString(),
  });

  return {
    url: dataUri,
    downloadUrl: dataUri,
    pathname: cleanName,
    contentType: detectedType,
    size: buffer.length,
    provider: 'local-data-url',
    blobId,
  };
}

/**
 * Delete a blob from Vercel Blob
 * @param {string} url - URL of the blob to delete
 */
export async function deleteBlob(url) {
  if (!url) return false;

  if (isVercelBlobConfigured() && url.includes('blob.vercel-storage.com')) {
    try {
      await del(url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return true;
    } catch (err) {
      console.error('Error deleting blob from Vercel Blob:', err);
      return false;
    }
  }

  // Local fallback cleanup
  for (const [id, item] of localBlobStore.entries()) {
    if (url.includes(id)) {
      localBlobStore.delete(id);
      return true;
    }
  }

  return true;
}
