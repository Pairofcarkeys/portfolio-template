/** Public summary allowlist. Never forwards provider payloads or credentials. */
export function summarizeSocialStats(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.accounts) || !Number.isFinite(Date.parse(snapshot.fetchedAt))) return null;
  let views = 0, postCount = 0, postsWithViews = 0;
  const seen = new Set();
  const accounts = new Set();
  for (const account of snapshot.accounts) {
    if (!['instagram', 'tiktok'].includes(account.platform) || typeof account.handle !== 'string' || !Array.isArray(account.posts)) return null;
    const accountKey = `${account.platform}:${account.handle}`;
    if (accounts.has(accountKey)) return null;
    accounts.add(accountKey);
    for (const post of account.posts) {
      if (!post || typeof post.id !== 'string') return null;
      const key = `${account.platform}:${post.id}`;
      if (seen.has(key)) return null;
      seen.add(key);
      postCount++;
      if (post.views != null) {
        if (!Number.isSafeInteger(post.views) || post.views < 0) return null;
        views += post.views;
        postsWithViews++;
      }
    }
  }
  if (!Number.isSafeInteger(views)) return null;
  return {schemaVersion:1, fetchedAt:snapshot.fetchedAt, views, postCount, postsWithViews, accountCount:accounts.size, complete:snapshot.complete === true && snapshot.accounts.length > 0 && snapshot.accounts.every(a => a.status === 'complete')};
}

export function isSocialSummary(value) {
  return value?.schemaVersion === 1 && Number.isFinite(Date.parse(value.fetchedAt)) &&
    ['views', 'postCount', 'postsWithViews', 'accountCount'].every(key => Number.isSafeInteger(value[key]) && value[key] >= 0) &&
    value.postsWithViews <= value.postCount && typeof value.complete === 'boolean';
}
