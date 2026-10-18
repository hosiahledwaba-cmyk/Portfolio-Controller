/**
 * GitHub Synchronization & Auto-Publishing Engine
 * 
 * Automatically discovers all eligible public repositories from a GitHub account
 * and publishes them to the portfolio, while preserving:
 * 1. Manually created projects (including projects without GitHub repos).
 * 2. User customizations (custom titles, outcomes, descriptions, screenshots, featured status, displayOrder).
 * 3. Excluded / hidden repositories list.
 * 4. Graceful handling of API rate limits, network errors, and deleted/private repos.
 */

import { getPortfolioData, savePortfolioData } from './storage.js';

/**
 * Fetch public repositories securely from GitHub API
 * Keeps GITHUB_TOKEN strictly server-side if configured.
 */
export async function fetchGitHubPublicRepos(username) {
  let targetUser = (username || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/.*$/, '').trim();
  if (!targetUser) targetUser = 'hosiahledwaba-cmyk';

  const githubUrl = `https://api.github.com/users/${encodeURIComponent(targetUser)}/repos?sort=updated&direction=desc&per_page=100&type=public`;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Portfolio-Controller-Serverless-API',
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const githubRes = await fetch(githubUrl, { headers });

  const rateLimitRemaining = githubRes.headers.get('x-ratelimit-remaining');
  const rateLimitReset = githubRes.headers.get('x-ratelimit-reset');

  if (!githubRes.ok) {
    const errorJson = await githubRes.json().catch(() => ({}));
    if (githubRes.status === 404) {
      throw new Error(`GitHub user "${targetUser}" was not found. Please verify the account handle.`);
    }
    if (githubRes.status === 403) {
      const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString() : 'shortly';
      throw new Error(`GitHub API rate limit reached (resets at ${resetDate}). Using existing portfolio data.`);
    }
    throw new Error(errorJson.message || `GitHub API error (status ${githubRes.status})`);
  }

  const rawRepos = await githubRes.json();
  if (!Array.isArray(rawRepos)) {
    return { repos: [], rateLimitRemaining, rateLimitReset, username: targetUser };
  }

  // Filter public non-private repos and sanitize
  const sanitized = rawRepos
    .filter(repo => !repo.private)
    .map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description ? repo.description.trim() : '',
      url: repo.html_url,
      homepage: repo.homepage ? repo.homepage.trim() : '',
      language: repo.language || 'Code',
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      isFork: Boolean(repo.fork),
      isArchived: Boolean(repo.archived),
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      createdAt: repo.created_at,
      defaultBranch: repo.default_branch || 'main',
      license: repo.license?.spdx_id || repo.license?.name || null,
    }));

  return { repos: sanitized, rateLimitRemaining, rateLimitReset, username: targetUser };
}

/**
 * Synchronize and Auto-Publish GitHub repositories into portfolio projects
 * Merges with existing projects while preserving all user customizations and manual projects.
 */
export async function syncAndAutoPublishProjects(options = {}) {
  const portfolio = await getPortfolioData();
  const currentProjects = Array.isArray(portfolio.projects) ? [...portfolio.projects] : [];
  const currentGithubConfig = portfolio.githubConfig || {
    username: 'hosiahledwaba-cmyk',
    lastSyncedAt: '',
    excludedRepos: [],
    autoPublish: true,
  };

  const username = options.username || currentGithubConfig.username || 'hosiahledwaba-cmyk';
  const excludedRepos = Array.isArray(currentGithubConfig.excludedRepos) ? currentGithubConfig.excludedRepos : [];
  const excludedSet = new Set(excludedRepos.map(r => r.toLowerCase()));

  // 1. Fetch live public repositories from GitHub API
  let fetchResult;
  try {
    fetchResult = await fetchGitHubPublicRepos(username);
  } catch (err) {
    console.warn('GitHub fetch warning during sync:', err.message);
    // Gracefully preserve existing data on GitHub API failure or rate limit
    return {
      success: false,
      error: err.message,
      data: portfolio,
      warning: 'GitHub sync failed or rate-limited; existing portfolio data was preserved intact.',
    };
  }

  const { repos, rateLimitRemaining, rateLimitReset } = fetchResult;

  // Track discovered repos by lowercase name and html_url
  const discoveredMap = new Map();
  for (const repo of repos) {
    discoveredMap.set(repo.name.toLowerCase(), repo);
    discoveredMap.set(repo.url.toLowerCase(), repo);
  }

  // 2. Separate existing projects into:
  // - Manual projects (must be 100% preserved)
  // - Existing GitHub-sourced projects (preserve customizations, update dynamic stats)
  let newlyPublishedCount = 0;
  let updatedCount = 0;

  const processedProjects = currentProjects.map(proj => {
    // If it's a manual project, preserve exactly as is
    if (!proj.isGithubSourced && !proj.githubRepoName) {
      return proj;
    }

    const repoKey = (proj.githubRepoName || '').toLowerCase();
    const urlKey = (proj.githubUrl || '').toLowerCase();
    const matchedRepo = discoveredMap.get(repoKey) || discoveredMap.get(urlKey);

    if (matchedRepo) {
      // Repository still exists on GitHub:
      // Check if user has excluded it
      const isExcluded = excludedSet.has(matchedRepo.name.toLowerCase());

      updatedCount++;

      // Merge dynamic GitHub stats while preserving user customizations
      return {
        ...proj,
        // If excluded, mark as hidden from live portfolio
        hidden: isExcluded,
        // Dynamic stats from GitHub
        stars: matchedRepo.stars,
        forks: matchedRepo.forks,
        lastUpdated: matchedRepo.updatedAt,
        githubUrl: matchedRepo.url,
        // Live URL: keep user's liveUrl if set, otherwise fallback to homepage
        liveUrl: proj.liveUrl || matchedRepo.homepage || '',
        // Technologies: keep user technologies, ensure primary language is included
        technologies: Array.isArray(proj.technologies) && proj.technologies.length > 0
          ? proj.technologies
          : [matchedRepo.language, ...(matchedRepo.topics || [])].filter(Boolean),
        // Outcome & description: preserve user customizations if present
        outcome: proj.outcome || `Maintained open-source repository with ${matchedRepo.stars} stars and active version control.`,
        description: proj.description || matchedRepo.description || `Public GitHub repository developed in ${matchedRepo.language}.`,
        // Images & Cover: uploaded images strictly take precedence over automatically sourced imagery
        coverImage: proj.coverImage || (proj.images && proj.images.find(img => img.isCover)?.url) || proj.image || '',
        images: Array.isArray(proj.images) ? proj.images : (proj.image && !proj.isPlaceholder ? [{ id: 'img-1', url: proj.image, isCover: true }] : []),
        image: proj.coverImage || (proj.images && proj.images.find(img => img.isCover)?.url) || (proj.images && proj.images[0]?.url) || proj.image || `https://placehold.co/800x600/050505/00E5FF.png?text=${encodeURIComponent(matchedRepo.name)}`,
        isPlaceholder: (proj.images && proj.images.length > 0) || (proj.image && !proj.isPlaceholder) ? false : (proj.isPlaceholder ?? true),
        githubRepoName: matchedRepo.name,
        isGithubSourced: true,
      };
    } else {
      // Repository was deleted, renamed, or made private on GitHub:
      // Gracefully preserve project so user customizations are never lost!
      return {
        ...proj,
        githubStatus: 'unavailable', // Flag indicator without abruptly deleting
      };
    }
  });

  // 3. Auto-discover and Auto-Publish NEW eligible public repositories
  // Every public repository that is NOT excluded and NOT already in processedProjects is published!
  const existingRepoNames = new Set(
    processedProjects
      .filter(p => p.isGithubSourced && p.githubRepoName)
      .map(p => p.githubRepoName.toLowerCase())
  );
  const existingUrls = new Set(
    processedProjects
      .filter(p => p.githubUrl)
      .map(p => p.githubUrl.toLowerCase())
  );

  let nextOrder = processedProjects.reduce((max, p) => Math.max(max, p.displayOrder || 0), 0) + 1;

  for (const repo of repos) {
    const isExcluded = excludedSet.has(repo.name.toLowerCase());
    const alreadyExists = existingRepoNames.has(repo.name.toLowerCase()) || existingUrls.has(repo.url.toLowerCase());

    if (!alreadyExists) {
      newlyPublishedCount++;

      const newProject = {
        id: `github-${repo.name}`,
        title: repo.name.replace(/[-_]/g, ' '),
        description: repo.description || `Public GitHub open-source repository developed in ${repo.language}.`,
        outcome: `Maintained repository with ${repo.stars} stars and active version control.`,
        technologies: [repo.language, ...(repo.topics || [])].filter((t) => Boolean(t) && t !== 'Unknown'),
        image: `https://placehold.co/800x600/050505/00E5FF.png?text=${encodeURIComponent(repo.name)}`,
        images: [],
        coverImage: '',
        isPlaceholder: true,
        placeholderCaption: `Interface view or architectural schematic for ${repo.name}.`,
        featured: false,
        displayOrder: nextOrder++,
        githubUrl: repo.url,
        liveUrl: repo.homepage || '',
        isGithubSourced: true,
        githubRepoName: repo.name,
        stars: repo.stars,
        forks: repo.forks,
        lastUpdated: repo.updatedAt,
        hidden: isExcluded, // If previously excluded, keep hidden; otherwise automatically published!
      };

      processedProjects.push(newProject);
    }
  }

  // 4. Ensure consistent 1-indexed displayOrder across all projects
  const finalProjects = processedProjects.map((p, idx) => ({
    ...p,
    displayOrder: p.displayOrder || (idx + 1),
  }));

  // 5. Update portfolio with auto-published projects and sync metadata
  const updatedPortfolio = {
    ...portfolio,
    projects: finalProjects,
    githubConfig: {
      ...currentGithubConfig,
      username,
      lastSyncedAt: new Date().toISOString(),
      autoPublish: true,
      lastSyncSummary: {
        totalDiscovered: repos.length,
        newlyPublished: newlyPublishedCount,
        updatedCount,
        rateLimitRemaining,
        syncedAt: new Date().toISOString(),
      },
    },
  };

  // Persist to storage
  await savePortfolioData(updatedPortfolio);

  return {
    success: true,
    message: `Synchronized with GitHub: ${newlyPublishedCount} new repositories published, ${updatedCount} existing repositories updated. Total: ${repos.length} public repos.`,
    newlyPublishedCount,
    updatedCount,
    totalDiscovered: repos.length,
    rateLimitRemaining,
    rateLimitReset,
    data: updatedPortfolio,
  };
}
