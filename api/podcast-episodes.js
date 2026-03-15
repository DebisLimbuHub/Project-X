export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { name, rssUrl } = req.query;
  if (!name && !rssUrl) {
    return res.status(400).json({ ok: false, error: 'Missing name or rssUrl', episodes: [] });
  }

  // 1. Try the provided RSS URL directly
  if (rssUrl) {
    const episodes = await fetchFromRSS(rssUrl);
    if (episodes && episodes.length > 0) {
      return res.json({ ok: true, episodes: episodes.slice(0, 10), source: rssUrl });
    }
  }

  // 2. iTunes API lookup → get the real feedUrl for this podcast
  if (name) {
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=podcast&limit=3`;
      const itunesRes = await fetch(itunesUrl, {
        headers: { 'User-Agent': 'SpectreIntel/1.0 (OSINT Dashboard)' },
        signal: AbortSignal.timeout(8000),
      });

      if (itunesRes.ok) {
        const data = await itunesRes.json();
        for (const result of (data.results || [])) {
          const feedUrl = result.feedUrl;
          if (!feedUrl) continue;
          const episodes = await fetchFromRSS(feedUrl);
          if (episodes && episodes.length > 0) {
            return res.json({
              ok: true,
              episodes: episodes.slice(0, 10),
              source: feedUrl,
              collectionName: result.collectionName,
            });
          }
        }
      }
    } catch (err) {
      console.error('[iTunes] Lookup failed:', err.message);
    }
  }

  return res.status(502).json({ ok: false, error: 'Could not load episodes for this podcast', episodes: [] });
}

async function fetchFromRSS(feedUrl) {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'SpectreIntel/1.0 (OSINT Dashboard)',
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const items = parseRSS(text, feedUrl);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

function parseRSS(xml, sourceUrl) {
  const items = [];
  const rssItemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = rssItemRegex.exec(xml)) !== null) {
    const block = match[1];
    const duration = extractTag(block, 'itunes:duration') || '';
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link') || extractAtomLink(block),
      description: stripHtml(extractTag(block, 'description') || extractTag(block, 'itunes:summary') || ''),
      pubDate: extractTag(block, 'pubDate') || '',
      duration: normalizeDuration(duration),
      source: sourceUrl,
    });
  }
  if (items.length === 0) {
    const atomRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = atomRegex.exec(xml)) !== null) {
      const block = match[1];
      items.push({
        title: extractTag(block, 'title'),
        link: extractAtomLink(block) || extractTag(block, 'link'),
        description: stripHtml(extractTag(block, 'summary') || extractTag(block, 'content') || ''),
        pubDate: extractTag(block, 'published') || extractTag(block, 'updated') || '',
        duration: '',
        source: sourceUrl,
      });
    }
  }
  return items.slice(0, 15);
}

function extractTag(block, tag) {
  const escapedTag = tag.replace(':', '\\:');
  const cdataRegex = new RegExp(`<${escapedTag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${escapedTag}>`, 'i');
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  const regex = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
  const m = block.match(regex);
  return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
}

function extractAtomLink(block) {
  const m = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return m ? m[1] : '';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 250);
}

// Convert HH:MM:SS or MM:SS or raw seconds to "Xm" string
function normalizeDuration(raw) {
  if (!raw) return '';
  if (raw.includes(':')) {
    const parts = raw.split(':').map(Number);
    let secs = 0;
    if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) secs = parts[0] * 60 + parts[1];
    return secs > 0 ? `${Math.round(secs / 60)}m` : '';
  }
  const n = parseInt(raw, 10);
  if (!isNaN(n)) return n > 3600 ? `${Math.round(n / 60)}m` : `${n}m`;
  return '';
}
