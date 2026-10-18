import { getPortfolioData, savePortfolioData } from '../lib/storage.js';
import { verifyAdminToken } from '../lib/auth.js';

// In-memory rate limiter for anonymous reactions (max 30 requests / 60 seconds per visitor)
const reactionRateLimits = new Map();

function isRateLimited(visitorId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAllowed = 30;

  const record = reactionRateLimits.get(visitorId) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    reactionRateLimits.set(visitorId, record);
    return false;
  }

  if (record.count >= maxAllowed) {
    return true;
  }

  record.count += 1;
  reactionRateLimits.set(visitorId, record);
  return false;
}

export default async function handler(req, res) {
  // CORS configuration
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-key, X-Admin-Key, x-api-key, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // 1. GET: Public posts retrieval
  if (req.method === 'GET') {
    try {
      const portfolio = await getPortfolioData();
      const allPosts = Array.isArray(portfolio.posts) ? portfolio.posts : [];
      const isAuthorized = await verifyAdminToken(req);

      // Single post query by ID or slug
      const targetIdentifier = query.id || query.slug;
      if (targetIdentifier) {
        const post = allPosts.find(p => p.id === targetIdentifier || p.slug === targetIdentifier);
        if (!post) {
          return res.status(404).json({ success: false, error: 'Transmission log not found.' });
        }
        if (post.status !== 'published' && !isAuthorized) {
          return res.status(403).json({ success: false, error: 'Transmission is unpublished draft.' });
        }
        return res.status(200).json({ success: true, post });
      }

      // Return published posts for public visitors, or all for authenticated admins
      const visiblePosts = isAuthorized ? allPosts : allPosts.filter(p => p.status === 'published');
      return res.status(200).json({
        success: true,
        count: visiblePosts.length,
        posts: visiblePosts,
      });
    } catch (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve posts.' });
    }
  }

  // 2. POST: Anonymous Reactions Handler
  if (req.method === 'POST' && (body.action === 'react' || query.action === 'react')) {
    const { postId, reactionType, visitorId } = body;

    if (!postId || !reactionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: postId and reactionType are required.',
      });
    }

    // Allowed reaction types
    const validReactions = ['like', 'fire', 'rocket', 'love'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid reaction type. Must be one of: ${validReactions.join(', ')}`,
      });
    }

    // Opaque visitor identifier check (privacy-conscious: random client UUID, no hardware ID)
    const clientKey = String(visitorId || req.headers['x-forwarded-for'] || 'anonymous_guest').slice(0, 64);
    if (isRateLimited(clientKey)) {
      return res.status(429).json({
        success: false,
        error: 'Reaction rate limit reached. Please wait a moment before sending more reactions.',
      });
    }

    try {
      const portfolio = await getPortfolioData();
      const posts = Array.isArray(portfolio.posts) ? [...portfolio.posts] : [];
      const postIndex = posts.findIndex(p => p.id === postId || p.slug === postId);

      if (postIndex === -1) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const targetPost = { ...posts[postIndex] };
      const currentReactions = { ...(targetPost.reactions || {}) };
      currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;
      targetPost.reactions = currentReactions;
      posts[postIndex] = targetPost;

      portfolio.posts = posts;
      await savePortfolioData(portfolio);

      return res.status(200).json({
        success: true,
        message: 'Reaction recorded successfully.',
        reactions: currentReactions,
      });
    } catch (err) {
      console.error('Error updating reaction:', err);
      return res.status(500).json({ success: false, error: 'Failed to record reaction.' });
    }
  }

  // 3. ADMIN-PROTECTED: Create / Update / Delete Post
  const isAuthorized = await verifyAdminToken(req);
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin passcode required to manage posts.',
    });
  }

  // POST: Create or Update single post
  if (req.method === 'POST' || req.method === 'PUT') {
    const postData = body.post || body;
    if (!postData || !postData.title) {
      return res.status(400).json({ success: false, error: 'Post title is required.' });
    }

    try {
      const portfolio = await getPortfolioData();
      const posts = Array.isArray(portfolio.posts) ? [...portfolio.posts] : [];
      const postId = postData.id || `post_${Date.now()}`;
      const slug = postData.slug || postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const existingIndex = posts.findIndex(p => p.id === postId || p.id === postData.id);
      const updatedPost = {
        id: postId,
        slug,
        title: postData.title,
        content: postData.content || '',
        summary: postData.summary || '',
        status: postData.status || 'published',
        publishedAt: postData.publishedAt || new Date().toISOString(),
        createdAt: postData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: Array.isArray(postData.tags) ? postData.tags : [],
        images: Array.isArray(postData.images) ? postData.images : [],
        coverImage: postData.coverImage || (postData.images && postData.images.find(img => img.isCover)?.url) || (postData.images && postData.images[0]?.url) || '',
        reactions: postData.reactions || { like: 0, fire: 0, rocket: 0 },
        readTimeMinutes: postData.readTimeMinutes || Math.max(1, Math.ceil((postData.content || '').split(/\s+/).length / 200)),
      };

      if (existingIndex >= 0) {
        posts[existingIndex] = updatedPost;
      } else {
        posts.unshift(updatedPost);
      }

      portfolio.posts = posts;
      await savePortfolioData(portfolio);

      return res.status(200).json({
        success: true,
        message: existingIndex >= 0 ? 'Post updated successfully.' : 'Post created successfully.',
        post: updatedPost,
      });
    } catch (err) {
      console.error('Error saving post:', err);
      return res.status(500).json({ success: false, error: 'Failed to save post.' });
    }
  }

  // DELETE: Remove post
  if (req.method === 'DELETE') {
    const targetId = body.id || query.id;
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Post id is required.' });
    }

    try {
      const portfolio = await getPortfolioData();
      const posts = Array.isArray(portfolio.posts) ? [...portfolio.posts] : [];
      const filtered = posts.filter(p => p.id !== targetId && p.slug !== targetId);

      if (filtered.length === posts.length) {
        return res.status(404).json({ success: false, error: 'Post not found to delete.' });
      }

      portfolio.posts = filtered;
      await savePortfolioData(portfolio);

      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting post:', err);
      return res.status(500).json({ success: false, error: 'Failed to delete post.' });
    }
  }

  return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
}
