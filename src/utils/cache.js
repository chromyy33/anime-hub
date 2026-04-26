const TTL_MS = 30 * 60 * 1000; // 30 minutes

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(`animehub_cache_${key}`);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem(`animehub_cache_${key}`); return null; }
    return data;
  } catch { return null; }
}

export function cacheSet(key, data) {
  try {
    localStorage.setItem(`animehub_cache_${key}`, JSON.stringify({ data, expiry: Date.now() + TTL_MS }));
  } catch {}
}

export async function fetchCached(url, cacheKey) {
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let delayMs = 1200;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, delayMs + Math.random() * 400));
      delayMs *= 2;
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data || json;
    cacheSet(cacheKey, data);
    return data;
  }
  throw new Error('Rate limit exceeded');
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
