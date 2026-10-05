// ─── AniList GraphQL API Integration ───────────────────────────────────────
const ANILIST_URL = 'https://graphql.anilist.co';
const DEFAULT_TTL_MS = 20 * 60 * 1000; // 20 minutes

// ── Local Storage Cache Helpers ─────────────────────────────────────────────
export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(`anidoc_cache_${key}`);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(`anidoc_cache_${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function cacheSet(key, data, ttlMs = DEFAULT_TTL_MS) {
  try {
    localStorage.setItem(
      `anidoc_cache_${key}`,
      JSON.stringify({ data, expiry: Date.now() + ttlMs })
    );
  } catch {}
}

// ── Generic AniList GraphQL Requester ────────────────────────────────────────
export async function anilistRequest(query, variables = {}, cacheKey = null, ttlMs = DEFAULT_TTL_MS) {
  if (cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AniList error (${res.status}): ${errText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'GraphQL query failed');
  }

  const result = json.data;
  if (cacheKey) {
    cacheSet(cacheKey, result, ttlMs);
  }
  return result;
}

// ── Format helpers ───────────────────────────────────────────────────────────
const DAYS = ['sundays', 'mondays', 'tuesdays', 'wednesdays', 'thursdays', 'fridays', 'saturdays'];

function getLocalAiring(airingAt) {
  if (!airingAt) return null;
  const d = new Date(airingAt * 1000);
  const dayName = DAYS[d.getDay()];
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return {
    day: dayName.slice(0, -1), // e.g. "monday"
    dayCapitalized: dayName.charAt(0).toUpperCase() + dayName.slice(1),
    time,
    string: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} at ${time}`
  };
}

// ── Normalize Anime Item (Card & List Views) ─────────────────────────────────
export function normalizeMedia(m) {
  if (!m) return null;
  const english = m.title?.english || null;
  const romaji = m.title?.romaji || null;
  const native = m.title?.native || null;
  const mainTitle = english || romaji || native || 'Untitled Anime';

  const score = m.averageScore
    ? (m.averageScore / 10).toFixed(1)
    : m.meanScore
    ? (m.meanScore / 10).toFixed(1)
    : null;

  const coverLarge = m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || '';
  const coverStandard = m.coverImage?.large || m.coverImage?.medium || coverLarge;
  const banner = m.bannerImage || coverLarge;

  let statusStr = m.status;
  if (m.status === 'RELEASING') statusStr = 'Currently Airing';
  else if (m.status === 'FINISHED') statusStr = 'Finished Airing';
  else if (m.status === 'NOT_YET_RELEASED') statusStr = 'Not yet aired';
  else if (m.status === 'CANCELLED') statusStr = 'Cancelled';
  else if (m.status === 'HIATUS') statusStr = 'On Hiatus';

  const nextAir = m.nextAiringEpisode ? getLocalAiring(m.nextAiringEpisode.airingAt) : null;
  const broadcast = nextAir
    ? {
        day: nextAir.dayCapitalized,
        time: nextAir.time,
        string: `${nextAir.dayCapitalized} at ${nextAir.time}`
      }
    : null;

  const genres = (m.genres || []).map(g => ({
    mal_id: g,
    id: g,
    name: g
  }));

  const synopsis = m.description
    ? m.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
    : 'No synopsis available.';

  let trailer = null;
  if (m.trailer && m.trailer.site === 'youtube' && m.trailer.id) {
    trailer = {
      id: m.trailer.id.trim(),
      site: 'youtube',
      embed_url: `https://www.youtube.com/embed/${m.trailer.id.trim()}`
    };
  }

  const startYear = m.seasonYear || m.startDate?.year || (m.startDate ? m.startDate.year : null);

  return {
    mal_id: m.id,
    id: m.id,
    idMal: m.idMal || m.id,
    title: mainTitle,
    title_english: english,
    title_romaji: romaji,
    title_japanese: native,
    images: {
      jpg: {
        image_url: coverStandard,
        large_image_url: coverLarge
      }
    },
    banner_image: banner,
    score,
    rank: m.rankings?.[0]?.rank || null,
    members: m.popularity || 0,
    favorites: m.favourites || 0,
    type: m.format || 'TV',
    episodes: m.episodes || (m.status === 'RELEASING' ? 'Airing' : 'Unknown'),
    status: statusStr,
    airing: m.status === 'RELEASING',
    duration: m.duration ? `${m.duration} min` : null,
    year: startYear,
    genres,
    synopsis,
    background: null,
    broadcast,
    local: nextAir ? { day: nextAir.day, time: nextAir.time } : null,
    aired: {
      string: startYear ? `${startYear}${m.endDate?.year && m.endDate.year !== startYear ? ` to ${m.endDate.year}` : ''}` : 'TBA'
    },
    studios: (m.studios?.nodes || []).map(s => ({ id: s.id, name: s.name })),
    source: m.source ? m.source.replace(/_/g, ' ') : 'Original',
    rating: m.isAdult ? 'R - 17+' : 'PG-13',
    trailer,
    streaming: (m.externalLinks || []).filter(l => l.type === 'STREAMING').map(l => ({ name: l.site, url: l.url })),
    external: (m.externalLinks || []).filter(l => l.type !== 'STREAMING').map(l => ({ name: l.site, url: l.url })),
    theme: { openings: [], endings: [] }
  };
}

// ── GraphQL Fragments ────────────────────────────────────────────────────────
const MEDIA_CARD_FRAGMENT = `
  id
  idMal
  title { romaji english native }
  format
  status
  description
  seasonYear
  startDate { year month day }
  endDate { year month day }
  episodes
  duration
  genres
  averageScore
  popularity
  favourites
  bannerImage
  coverImage { large extraLarge }
  nextAiringEpisode { airingAt timeUntilAiring episode }
`;

// ── Homepage Data Fetcher ───────────────────────────────────────────────────
export async function fetchHomeData() {
  const query = `
    query {
      airing: Page(page: 1, perPage: 15) {
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
      upcoming: Page(page: 1, perPage: 15) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
      top: Page(page: 1, perPage: 15) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
      movies: Page(page: 1, perPage: 15) {
        media(type: ANIME, format: MOVIE, sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
      action: Page(page: 1, perPage: 15) {
        media(type: ANIME, genre: "Action", sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
      romance: Page(page: 1, perPage: 15) {
        media(type: ANIME, genre: "Romance", sort: SCORE_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
    }
  `;

  const data = await anilistRequest(query, {}, 'home_batched_v1', 15 * 60 * 1000);

  return {
    airing: (data.airing?.media || []).map(normalizeMedia),
    upcoming: (data.upcoming?.media || []).map(normalizeMedia),
    top: (data.top?.media || []).map(normalizeMedia),
    movies: (data.movies?.media || []).map(normalizeMedia),
    action: (data.action?.media || []).map(normalizeMedia),
    romance: (data.romance?.media || []).map(normalizeMedia)
  };
}

// ── Anime Details (Full Single Media) ────────────────────────────────────────
export async function fetchAnimeDetails(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { romaji english native }
        format
        status
        description
        seasonYear
        startDate { year month day }
        endDate { year month day }
        episodes
        duration
        countryOfOrigin
        isAdult
        genres
        averageScore
        popularity
        favourites
        source
        bannerImage
        coverImage { large extraLarge }
        trailer { id site thumbnail }
        nextAiringEpisode { airingAt timeUntilAiring episode }
        rankings { rank type allTime context }
        studios(isMain: true) { nodes { id name } }
        externalLinks { id url site type }
        characters(sort: [ROLE, RELEVANCE, ID], perPage: 12) {
          edges {
            role
            node {
              id
              name { full native }
              image { large medium }
            }
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
              id
              name { full native }
              image { large medium }
              languageV2
            }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 12) {
          nodes {
            mediaRecommendation {
              ${MEDIA_CARD_FRAGMENT}
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english native }
              format
              type
              status
              episodes
              averageScore
              description
              coverImage { large extraLarge }
            }
          }
        }
        reviews(sort: RATING_DESC, perPage: 5) {
          nodes {
            id
            score
            summary
            body
            createdAt
            user {
              id
              name
              avatar { large }
            }
          }
        }
      }
    }
  `;

  const data = await anilistRequest(query, { id: Number(id) }, `anime_details_${id}`, 20 * 60 * 1000);
  const m = data?.Media;
  if (!m) return null;

  const base = normalizeMedia(m);

  // Characters & Voice Actors
  const characters = (m.characters?.edges || []).map(edge => ({
    role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
    character: {
      mal_id: edge.node.id,
      id: edge.node.id,
      name: edge.node.name?.full || edge.node.name?.native || 'Unknown',
      images: {
        jpg: {
          image_url: edge.node.image?.large || edge.node.image?.medium || ''
        }
      }
    },
    voice_actors: (edge.voiceActors || []).map(va => ({
      person: {
        mal_id: va.id,
        name: va.name?.full || va.name?.native || 'Unknown',
        images: {
          jpg: {
            image_url: va.image?.large || va.image?.medium || ''
          }
        }
      },
      language: va.languageV2 || 'Japanese'
    }))
  }));

  // Recommendations
  const recommendations = (m.recommendations?.nodes || [])
    .filter(r => r?.mediaRecommendation)
    .map(r => ({
      entry: normalizeMedia(r.mediaRecommendation)
    }));

  // Relations
  const relationMap = {};
  const relatedDetails = {};

  (m.relations?.edges || []).forEach(edge => {
    if (!edge.node) return;
    let relType = edge.relationType;
    if (relType === 'PREQUEL') relType = 'Prequel';
    else if (relType === 'SEQUEL') relType = 'Sequel';
    else if (relType === 'PARENT') relType = 'Parent Story';
    else if (relType === 'SIDE_STORY') relType = 'Side Story';
    else if (relType === 'SPIN_OFF') relType = 'Spin-off';
    else if (relType === 'ALTERNATIVE') relType = 'Alternative';
    else if (relType === 'CHARACTER') relType = 'Character';
    else relType = 'Other';

    const normalizedRel = normalizeMedia(edge.node);
    relatedDetails[edge.node.id] = normalizedRel;

    if (!relationMap[relType]) relationMap[relType] = [];
    relationMap[relType].push({
      mal_id: edge.node.id,
      id: edge.node.id,
      name: edge.node.title?.english || edge.node.title?.romaji || 'Unknown',
      type: edge.node.format ? edge.node.format.toLowerCase() : 'anime'
    });
  });

  const relations = Object.entries(relationMap).map(([relation, entry]) => ({
    relation,
    entry
  }));

  // Reviews
  const reviews = (m.reviews?.nodes || []).map(rev => ({
    mal_id: rev.id,
    user: {
      username: rev.user?.name || 'Anonymous',
      images: { jpg: { image_url: rev.user?.avatar?.large || '' } }
    },
    date: rev.createdAt ? new Date(rev.createdAt * 1000).toISOString() : new Date().toISOString(),
    score: rev.score ? (rev.score / 10).toFixed(1) : '8.0',
    review: rev.body || rev.summary || ''
  }));

  // Promo Gallery Pictures
  const pictures = [];
  if (m.bannerImage) {
    pictures.push({
      jpg: {
        image_url: m.bannerImage,
        large_image_url: m.bannerImage
      }
    });
  }
  if (m.coverImage?.extraLarge) {
    pictures.push({
      jpg: {
        image_url: m.coverImage.extraLarge,
        large_image_url: m.coverImage.extraLarge
      }
    });
  }

  return {
    anime: {
      ...base,
      relations
    },
    characters,
    recommendations,
    pictures,
    reviews,
    relatedDetails
  };
}

// ── Weekly Airing Schedule ──────────────────────────────────────────────────
export async function fetchWeeklySchedule() {
  const now = Math.floor(Date.now() / 1000);
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date();
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const startSec = Math.floor(monday.getTime() / 1000);
  const endSec = startSec + (7 * 86400);

  const query = `
    query ($start: Int, $end: Int) {
      Page(page: 1, perPage: 100) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          airingAt
          episode
          media {
            ${MEDIA_CARD_FRAGMENT}
          }
        }
      }
    }
  `;

  const data = await anilistRequest(query, { start: startSec, end: endSec }, 'weekly_sched_v1', 30 * 60 * 1000);
  const rawList = data?.Page?.airingSchedules || [];

  const grouped = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };

  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const seenIdsByDay = new Set();

  rawList.forEach(item => {
    if (!item.media) return;
    const norm = normalizeMedia(item.media);
    const airDate = new Date(item.airingAt * 1000);
    const dayKey = dayKeys[airDate.getDay()];
    const dedupeKey = `${dayKey}_${norm.mal_id}`;
    if (seenIdsByDay.has(dedupeKey)) return;
    seenIdsByDay.add(dedupeKey);

    const time = `${airDate.getHours().toString().padStart(2, '0')}:${airDate.getMinutes().toString().padStart(2, '0')}`;
    const localized = {
      ...norm,
      local: { day: dayKey, time },
      broadcast: {
        time,
        day: dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
      }
    };
    if (grouped[dayKey]) {
      grouped[dayKey].push(localized);
    }
  });

  return grouped;
}

// ── Search & Filter ──────────────────────────────────────────────────────────
export async function searchAnime({
  query = '',
  genre = '',
  format = '',
  status = '',
  sort = 'SCORE_DESC',
  minScore = 0,
  year = '',
  page = 1,
  perPage = 24
} = {}) {
  // AniList enum mappings
  let aniSort = ['POPULARITY_DESC'];
  if (sort === 'score' || sort === 'SCORE_DESC') aniSort = ['SCORE_DESC', 'POPULARITY_DESC'];
  else if (sort === 'popularity' || sort === 'POPULARITY_DESC') aniSort = ['POPULARITY_DESC'];
  else if (sort === 'favorites' || sort === 'FAVOURITES_DESC') aniSort = ['FAVOURITES_DESC'];
  else if (sort === 'start_date' || sort === 'START_DATE_DESC') aniSort = ['START_DATE_DESC'];
  else if (sort === 'members') aniSort = ['POPULARITY_DESC'];

  let aniFormat = undefined;
  if (format) {
    const fUpper = format.toUpperCase();
    if (['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'].includes(fUpper)) {
      aniFormat = fUpper;
    }
  }

  let aniStatus = undefined;
  if (status) {
    const sLower = status.toLowerCase();
    if (sLower === 'airing') aniStatus = 'RELEASING';
    else if (sLower === 'complete' || sLower === 'finished') aniStatus = 'FINISHED';
    else if (sLower === 'upcoming') aniStatus = 'NOT_YET_RELEASED';
  }

  const variables = {
    page: Number(page) || 1,
    perPage: Number(perPage) || 24,
    sort: aniSort
  };

  if (query && query.trim()) variables.search = query.trim();
  if (genre && genre.trim()) variables.genre = genre.trim();
  if (aniFormat) variables.format = aniFormat;
  if (aniStatus) variables.status = aniStatus;
  if (minScore > 0) variables.averageScore_greater = Math.round(minScore * 10);
  if (year && Number(year)) {
    variables.startDate_greater = Number(`${year}0101`);
    variables.startDate_lesser = Number(`${year}1231`);
  }

  const gqlQuery = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus, $averageScore_greater: Int, $startDate_greater: FuzzyDateInt, $startDate_lesser: FuzzyDateInt) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        media(search: $search, genre: $genre, sort: $sort, format: $format, status: $status, averageScore_greater: $averageScore_greater, startDate_greater: $startDate_greater, startDate_lesser: $startDate_lesser, type: ANIME, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
    }
  `;

  const cacheKey = `search_${JSON.stringify(variables)}`;
  const data = await anilistRequest(gqlQuery, variables, cacheKey, 10 * 60 * 1000);

  const pageInfo = data?.Page?.pageInfo || {};
  const mediaList = (data?.Page?.media || []).map(normalizeMedia);

  return {
    results: mediaList,
    pagination: {
      last_visible_page: pageInfo.lastPage || 1,
      has_next_page: !!pageInfo.hasNextPage,
      current_page: pageInfo.currentPage || 1,
      items: {
        total: pageInfo.total || mediaList.length,
        count: mediaList.length,
        per_page: pageInfo.perPage || perPage
      }
    }
  };
}

// ── Character Details ────────────────────────────────────────────────────────
export async function fetchCharacterDetails(id) {
  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name { full native alternative }
        image { large medium }
        description
        favourites
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 20) {
          edges {
            characterRole
            voiceActors(language: JAPANESE, sort: [RELEVANCE, ID]) {
              id
              name { full native }
              languageV2
              image { large medium }
            }
            node {
              id
              title { romaji english native }
              format
              coverImage { large extraLarge }
            }
          }
        }
      }
    }
  `;

  const data = await anilistRequest(query, { id: Number(id) }, `char_details_${id}`, 30 * 60 * 1000);
  const c = data?.Character;
  if (!c) return null;

  const anime = (c.media?.edges || []).map(edge => ({
    role: edge.characterRole === 'MAIN' ? 'Main' : 'Supporting',
    anime: {
      mal_id: edge.node.id,
      id: edge.node.id,
      title: edge.node.title?.english || edge.node.title?.romaji || 'Untitled',
      type: edge.node.format || 'TV',
      images: {
        jpg: {
          image_url: edge.node.coverImage?.large || edge.node.coverImage?.extraLarge || ''
        }
      }
    }
  }));

  const voicesMap = new Map();
  (c.media?.edges || []).forEach(edge => {
    (edge.voiceActors || []).forEach(va => {
      if (!voicesMap.has(va.id)) {
        voicesMap.set(va.id, {
          person: {
            mal_id: va.id,
            name: va.name?.full || va.name?.native || 'Unknown',
            images: {
              jpg: {
                image_url: va.image?.large || va.image?.medium || ''
              }
            }
          },
          language: va.languageV2 || 'Japanese'
        });
      }
    });
  });

  const voices = Array.from(voicesMap.values());
  const about = c.description ? c.description.replace(/<[^>]*>/g, '').trim() : '';

  const pictures = [];
  if (c.image?.large) {
    pictures.push({
      jpg: {
        image_url: c.image.large,
        large_image_url: c.image.large
      }
    });
  }

  return {
    character: {
      mal_id: c.id,
      id: c.id,
      name: c.name?.full || c.name?.native || 'Unknown Character',
      name_kanji: c.name?.native || '',
      nicknames: c.name?.alternative || [],
      about,
      favorites: c.favourites || 0,
      images: {
        jpg: {
          image_url: c.image?.large || c.image?.medium || ''
        }
      },
      anime,
      voices
    },
    pictures
  };
}

// ── Live Autocomplete Search Suggestions ────────────────────────────────────
export async function fetchSuggestions(queryStr) {
  if (!queryStr || queryStr.trim().length < 2) return [];
  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          id
          title { romaji english }
          format
          seasonYear
          coverImage { large }
        }
      }
    }
  `;
  try {
    const data = await anilistRequest(query, { search: queryStr.trim() });
    return (data?.Page?.media || []).map(normalizeMedia);
  } catch {
    return [];
  }
}

// ── Anime of the Day ─────────────────────────────────────────────────────────
export async function fetchAnimeOfDay() {
  const query = `
    query {
      Page(page: 1, perPage: 25) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_CARD_FRAGMENT}
        }
      }
    }
  `;
  const data = await anilistRequest(query, {}, 'aod_pool', 12 * 60 * 60 * 1000);
  const list = (data?.Page?.media || []).map(normalizeMedia);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
