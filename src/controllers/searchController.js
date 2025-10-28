
/**
 * Normalize a JSONPath-like input into a canonical, dot-notation path:
 * - Keeps root "$"
 * - Converts brackets to dots: $.items[0].title -> $.items.0.title
 * - Trims spaces, collapses duplicate dots, removes trailing dots
 * - Case-normalizes to lower-case for case-insensitive matching
 */
export function normalizePath(input) {
  if (!input) return "";
  let s = String(input).trim();

  // ensure starts with $
  if (!s.startsWith("$")) s = "$." + s;

  // remove all whitespace
  s = s.replace(/\s+/g, "");

  // convert brackets to dot segments
  s = s.replace(/\[(\d+|(["'])(.*?)\2)\]/g, (_m, g1, _q, key) => {
    // handles [0] or ["name"] or ['name']
    const seg = key != null ? key : g1; // if key captured, else number
    return "." + seg;
  });

  // unify any remaining '[' or ']' just in case (fallback)
  s = s.replace(/\[/g, ".").replace(/\]/g, "");

  // collapse duplicate dots and remove trailing dot
  s = s.replace(/\.{2,}/g, ".").replace(/\.$/, "");

  // remove optional dot after root like "$."
  s = s.replace(/^\$\./, "$.");

  // lower-case for insensitive compare (JSON keys can be case-sensitive,
  // but for search UX we match insensitively)
  s = s.toLowerCase();

  return s;
}

/**
 * Tokenize a normalized path into segments, preserving "$" as the root.
 * Example: "$.user.address.city" -> ["$", "user", "address", "city"]
 */
export function tokenizePath(normalized) {
  if (!normalized) return [];
  const noRoot = normalized.startsWith("$.") ? normalized.slice(2) : normalized === "$" ? "" : normalized;
  const segs = noRoot ? noRoot.split(".") : [];
  return ["$", ...segs.filter(Boolean)];
}

/**
 * Normalize a node's label to a canonical path prefix to compare against.
 * Expects labels like:
 *  - "$.user (Object)"
 *  - "$.items (Array)"
 *  - "$.user.name: Alice"
 */
export function extractPathFromLabel(label) {
  if (!label) return "";
  let s = String(label);

  // take substring before first " (" or before first ":" if primitive
  const idxType = s.indexOf(" (");
  const idxPrim = s.indexOf(":");
  if (idxType !== -1) s = s.slice(0, idxType);
  else if (idxPrim !== -1) s = s.slice(0, idxPrim);

  return normalizePath(s);
}

/**
 * Find nodes whose label path matches the searchPath.
 * - Supports exact match and prefix/partial segment matches.
 * - Returns all matches, sorted with exact match first, then closest length.
 */
export function findNodesByPath(nodes, searchPath) {
  if (!Array.isArray(nodes) || !nodes.length || !searchPath) return [];

  const target = normalizePath(searchPath);
  const tSegs = tokenizePath(target);

  const matches = [];

  for (const node of nodes) {
    const pathNorm = extractPathFromLabel(node?.data?.label);
    if (!pathNorm) continue;

    // quick exact and prefix checks (fast path)
    if (pathNorm === target) {
      matches.push({ node, score: 0, kind: "exact" });
      continue;
    }
    if (pathNorm.startsWith(target + ".")) {
      // ancestor path; good match
      const score = Math.abs(pathNorm.length - target.length);
      matches.push({ node, score, kind: "prefix" });
      continue;
    }

    // partial segment match: e.g., search "addr" matches "...address"
    const pSegs = tokenizePath(pathNorm);
    let partialHit = false;
    for (let i = 1; i < Math.min(tSegs.length, pSegs.length); i++) {
      // compare segment-wise for prefix
      if (pSegs[i].startsWith(tSegs[i])) {
        partialHit = true;
      } else if (tSegs[i].startsWith(pSegs[i])) {
        partialHit = true;
      }
    }
    if (partialHit) {
      const score = Math.abs(pSegs.length - tSegs.length) + 5; // worse than exact/prefix
      matches.push({ node, score, kind: "partial" });
    }
  }

  // sort: exact first, then lower score (closer length), then by label length
  matches.sort((a, b) => {
    const rank = { exact: 0, prefix: 1, partial: 2 };
    if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
    if (a.score !== b.score) return a.score - b.score;
    return (a.node?.data?.label?.length || 0) - (b.node?.data?.label?.length || 0);
  });

  return matches.map((m) => m.node);
}

/**
 * Backward-compatible single result API.
 */
export function findNodeByPath(nodes, searchPath) {
  const list = findNodesByPath(nodes, searchPath);
  return list[0] || null;
}
