// Shared upstream logic, used by refresh.mjs (weekly, automated) and
// review.mjs (run by a person after checking an entry).
//
// Two kinds of flag:
//   health flags - archived, license changed, repo moved, gone quiet
//   review flags - what changed upstream since a person last reviewed the entry
//
// Every flag is phrased so the same situation produces the same text week after
// week. The workflow diffs flag lines to decide whether to notify anyone, so a
// line that changes by itself ("no pushes in 367 days") would re-notify forever.

export const STALE_DAYS = 365;
export const REVIEW_MAX_DAYS = 180;
const LIST_MAX = 12;
const TIMEOUT_MS = 20000;

export class RateLimited extends Error {}

export function githubHeaders() {
  const h = { 'User-Agent': 'ultimate-ui-catalog', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export function parseRepo(url) {
  const m = String(url).match(/github\.com\/([^/]+)\/([^/#?]+)/);
  return m ? { owner: m[1], name: m[2].replace(/\.git$/, '') } : null;
}

export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** `*` matches within one path segment. The captured part becomes the item's name. */
export function globToRegex(pattern) {
  const parts = pattern.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${parts.join('([^/]+?)')}$`);
}

/**
 * Comparable major version from a release tag: 'v9.4.0', '6.6.4', 'shadcn@4.21.0'.
 * Pre-1.0 projects stay '0' - they bump minor versions routinely, so flagging
 * each one would bury the signal. Reaching 1.0 does flag.
 */
export function majorVersion(tag) {
  const m = String(tag ?? '').match(/(\d+)\.\d+/);
  return m ? String(Number(m[1])) : null;
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')) {
    throw new RateLimited('GitHub rate limit hit. Set GITHUB_TOKEN and retry.');
  }
  return { ok: res.ok, status: res.status, body: res.ok ? await res.json() : null };
}

/**
 * Everything knowable about a source's upstream without judgement.
 *
 * Returns { repo, release, state, problems }:
 *   repo     - GitHub API repository object, or null if unreachable
 *   release  - { tag, published } | null (no releases) | undefined (could not check)
 *   state    - the snapshot review.mjs records as a baseline
 *   problems - flag lines for anything that could not be checked
 */
export async function fetchUpstream(source) {
  const id = source.id;
  const headers = githubHeaders();
  const parsed = parseRepo(source.repo);
  if (!parsed) return { repo: null, state: null, problems: [`${id}: not a GitHub repository, so upstream cannot be checked`] };
  const base = `https://api.github.com/repos/${parsed.owner}/${parsed.name}`;

  let repo;
  try {
    const r = await getJson(base, headers);
    if (!r.ok) return { repo: null, state: null, problems: [`${id}: GitHub returned ${r.status} for the repository - moved, renamed or deleted?`] };
    repo = r.body;
  } catch (e) {
    if (e instanceof RateLimited) throw e;
    return { repo: null, state: null, problems: [`${id}: could not reach GitHub`] };
  }

  const problems = [];

  let release = null;
  try {
    const r = await getJson(`${base}/releases/latest`, headers);
    if (r.ok) release = { tag: r.body.tag_name, published: r.body.published_at?.slice(0, 10) ?? null };
    else if (r.status !== 404) release = undefined; // 404 just means no releases
  } catch (e) {
    if (e instanceof RateLimited) throw e;
    release = undefined;
  }

  const watched = {};
  const watch = source.watch || {};
  if (watch.paths?.length) {
    try {
      const r = await getJson(`${base}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`, headers);
      if (!r.ok) problems.push(`${id}: could not list repository files, so new content was not checked`);
      else if (r.body.truncated) problems.push(`${id}: repository too large to list in one request, so new content was not checked`);
      else {
        for (const pattern of watch.paths) {
          const re = globToRegex(pattern);
          const names = new Set();
          for (const entry of r.body.tree) {
            const m = entry.path.match(re);
            if (m) names.add(m.slice(1).join('/'));
          }
          watched[pattern] = [...names].sort();
        }
      }
    } catch (e) {
      if (e instanceof RateLimited) throw e;
      problems.push(`${id}: could not list repository files, so new content was not checked`);
    }
  }

  for (const h of watch.headings || []) {
    const key = `${h.file}#h${h.level}`;
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${h.file}`, {
        headers: { 'User-Agent': 'ultimate-ui-catalog' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) { problems.push(`${id}: could not read ${h.file}, so its sections were not checked`); continue; }
      const re = new RegExp(`^#{${h.level}}\\s+(.+?)\\s*$`);
      const names = new Set();
      for (const line of (await res.text()).split(/\r?\n/)) {
        const m = line.match(re);
        if (m) names.add(m[1]);
      }
      watched[key] = [...names].sort();
    } catch {
      problems.push(`${id}: could not read ${h.file}, so its sections were not checked`);
    }
  }

  const state = {
    description: repo.description ?? null,
    homepage: repo.homepage || null,
    watched,
  };
  if (release !== undefined) state.release_major = majorVersion(release?.tag);

  return { repo, release, state, problems };
}

/** Upstream health. These clear when the entry itself is fixed, not by reviewing. */
export function healthFlags(source, repo) {
  const id = source.id;
  const flags = [];
  const parsed = parseRepo(source.repo);
  if (repo.archived) flags.push(`${id}: upstream is ARCHIVED`);
  if (daysBetween(repo.pushed_at, new Date().toISOString()) > STALE_DAYS) {
    flags.push(`${id}: no pushes since ${repo.pushed_at.slice(0, 10)}`);
  }
  const license = repo.license?.spdx_id;
  if (license && license !== 'NOASSERTION' && license !== source.license) {
    flags.push(`${id}: LICENSE CHANGED — catalog says ${source.license}, upstream is now ${license}`);
  }
  if (parsed && repo.full_name.toLowerCase() !== `${parsed.owner}/${parsed.name}`.toLowerCase()) {
    flags.push(`${id}: repo moved to ${repo.full_name}`);
  }
  return flags;
}

const list = (names) =>
  names.length > LIST_MAX ? `${names.slice(0, LIST_MAX).join(', ')} +${names.length - LIST_MAX} more` : names.join(', ');

/** What changed since a person last reviewed the entry. These clear by running review.mjs. */
export function reviewFlags(source, state, today) {
  const id = source.id;
  const review = source.review;
  if (!review?.date) return [`${id}: never reviewed - check the entry, then run: node scripts/review.mjs ${id}`];

  const flags = [];
  if (daysBetween(review.date, today) > REVIEW_MAX_DAYS) flags.push(`${id}: review overdue - last reviewed ${review.date}`);

  const b = review.baseline;
  if (!b || !state) return flags;

  if ('description' in b && b.description !== state.description) {
    flags.push(`${id}: description changed since review - now "${state.description ?? ''}"`);
  }
  if ('homepage' in b && b.homepage !== state.homepage) {
    flags.push(`${id}: homepage changed since review - now ${state.homepage ?? 'none'}`);
  }
  if ('release_major' in b && 'release_major' in state && b.release_major !== state.release_major) {
    if (state.release_major == null) flags.push(`${id}: no longer publishes releases (was ${b.release_major}.x at review)`);
    else if (b.release_major == null) flags.push(`${id}: first release since review - ${state.release_major}.x`);
    else flags.push(`${id}: new major version since review - ${state.release_major}.x (was ${b.release_major}.x)`);
  }

  for (const [key, now] of Object.entries(state.watched || {})) {
    const before = b.watched?.[key];
    if (!before) {
      flags.push(`${id}: ${key} is watched but has no review baseline yet - run: node scripts/review.mjs ${id}`);
      continue;
    }
    const added = now.filter((n) => !before.includes(n));
    const removed = before.filter((n) => !now.includes(n));
    if (added.length) flags.push(`${id}: ${added.length} new in ${key} since review - ${list(added)}`);
    if (removed.length) flags.push(`${id}: ${removed.length} removed from ${key} since review - ${list(removed)}`);
  }
  return flags;
}
