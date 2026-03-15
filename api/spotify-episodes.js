export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const showId = req.query.showId;
  if (!showId || typeof showId !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing showId', episodes: [] });
  }

  try {
    // Use Spotify's oEmbed endpoint to get show metadata
    const embedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/show/${showId}`;

    let showTitle = '';
    const oembedRes = await fetch(embedUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      showTitle = oembedData.title || '';
    }

    // Fetch the embed page which contains episode data in a lighter format
    const embedPageUrl = `https://open.spotify.com/embed/show/${showId}`;
    const response = await fetch(embedPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Spotify embed returned ${response.status}`);
    }

    const html = await response.text();
    let episodes = [];

    // Pattern 1: Extract from script tags containing JSON
    const scriptBlocks = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];

    for (const block of scriptBlocks) {
      const jsonContent = block.replace(/<\/?script[^>]*>/gi, '').trim();
      if (jsonContent.length < 100 || !jsonContent.startsWith('{')) continue;

      try {
        const data = JSON.parse(jsonContent);
        const jsonStr = JSON.stringify(data);

        // Find episode-like objects anywhere in the JSON
        const episodeMatches = jsonStr.matchAll(/"name"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"uri"\s*:\s*"spotify:episode:([a-zA-Z0-9]+)"/g);

        for (const m of episodeMatches) {
          const title = m[1]
            .replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
              String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
            )
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');

          const episodeId = m[2];
          if (title === showTitle) continue;

          episodes.push({
            id: episodeId,
            title,
            description: '',
            publishedAt: '',
            durationMs: 0,
            thumbnailUrl: '',
            externalUrl: `https://open.spotify.com/episode/${episodeId}`,
          });
        }

        // Extract release dates and match by index
        const dateMatches = jsonStr.matchAll(/"releaseDate"\s*:\s*\{[^}]*"isoString"\s*:\s*"([^"]+)"/g);
        const dates = [];
        for (const dm of dateMatches) dates.push(dm[1]);
        for (let i = 0; i < Math.min(episodes.length, dates.length); i++) {
          episodes[i].publishedAt = dates[i];
        }

        // Extract durations and match by index
        const durationMatches = jsonStr.matchAll(/"totalMilliseconds"\s*:\s*(\d+)/g);
        const durations = [];
        for (const dm of durationMatches) durations.push(parseInt(dm[1], 10));
        for (let i = 0; i < Math.min(episodes.length, durations.length); i++) {
          episodes[i].durationMs = durations[i];
        }

        if (episodes.length > 0) break;
      } catch {
        continue;
      }
    }

    // Pattern 2: Simpler regex fallback on raw HTML
    if (episodes.length === 0) {
      const nameRegex = /"name":"((?:[^"\\]|\\.)*)"/g;
      const names = [];
      let m;
      while ((m = nameRegex.exec(html)) !== null) {
        const name = m[1].replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
          String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
        );
        if (name.length > 5 && name.length < 200 && name !== showTitle) {
          names.push(name);
        }
      }

      const uniqueNames = [...new Set(names)];
      for (let i = 0; i < Math.min(uniqueNames.length, 10); i++) {
        episodes.push({
          id: `ep-${showId}-${i}`,
          title: uniqueNames[i],
          description: '',
          publishedAt: '',
          durationMs: 0,
          thumbnailUrl: '',
          externalUrl: `https://open.spotify.com/show/${showId}`,
        });
      }
    }

    // Deduplicate by title
    const seen = new Set();
    episodes = episodes.filter((ep) => {
      const key = ep.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    episodes.sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) return 0;
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    const result = episodes.slice(0, 10);

    return res.json({
      ok: result.length > 0,
      showId,
      episodeCount: result.length,
      episodes: result,
    });
  } catch (err) {
    console.error(`[Spotify] Episode fetch failed for ${showId}:`, err.message);
    return res.status(502).json({
      ok: false,
      error: err.message || 'Failed to fetch episodes',
      episodes: [],
    });
  }
}
