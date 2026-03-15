/**
 * Project X — API Proxy Server
 *
 * Lightweight Express server that proxies external API calls
 * to bypass browser CORS restrictions.
 *
 * Endpoints:
 *   GET /api/rss?url=<encoded_rss_url>  → Fetches and parses RSS/Atom feeds
 *   GET /api/cisa-kev                    → CISA Known Exploited Vulnerabilities
 *   GET /api/nvd?keyword=<term>          → NVD CVE search
 *
 * Runs on port 3001 alongside Vite dev server (port 5173).
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ===== RSS FEED PROXY =====

app.get('/api/rss', async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl || typeof feedUrl !== 'string') {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Validate URL
  try {
    const parsed = new URL(feedUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'ProjectX-CyberMonitor/0.1 (OSINT Dashboard)',
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Feed returned ${response.status}`,
        url: feedUrl,
      });
    }

    const text = await response.text();
    const items = parseRSS(text, feedUrl);

    res.json({
      ok: true,
      url: feedUrl,
      itemCount: items.length,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[RSS] Failed to fetch ${feedUrl}: ${message}`);
    res.status(502).json({ error: message, url: feedUrl });
  }
});

// ===== CISA KEV ENDPOINT =====

app.get('/api/cisa-kev', async (_req, res) => {
  try {
    const response = await fetch(
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      { signal: AbortSignal.timeout(15_000) }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `CISA returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CISA-KEV] Failed: ${message}`);
    res.status(502).json({ error: message });
  }
});

// ===== NVD CVE SEARCH =====

app.get('/api/nvd', async (req, res) => {
  const keyword = req.query.keyword || '';
  const resultsPerPage = Math.min(Number(req.query.limit) || 20, 50);

  try {
    const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
    if (keyword) url.searchParams.set('keywordSearch', String(keyword));
    url.searchParams.set('resultsPerPage', String(resultsPerPage));

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ProjectX-CyberMonitor/0.1' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `NVD returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[NVD] Failed: ${message}`);
    res.status(502).json({ error: message });
  }
});

// ===== STOCK QUOTES (Yahoo Finance v8 chart API → Simulated) =====

const BASE_PRICES = {
  CRWD: 345.00, PANW: 188.50, FTNT: 98.20, ZS: 215.00,
  S: 24.80, CYBR: 315.00, NET: 118.00, OKTA: 102.00,
  QLYS: 142.00, TENB: 41.50, RPD: 37.80, VRNS: 46.20,
};

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function fetchFromYahooV8(symbolList) {
  const settled = await Promise.allSettled(
    symbolList.map(async symbol => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
      const response = await fetch(url, {
        headers: YAHOO_HEADERS,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Yahoo v8 returned ${response.status} for ${symbol}`);
      const data = await response.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) throw new Error(`No price data for ${symbol}`);
      const price = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose || price;
      const change = parseFloat((price - previousClose).toFixed(2));
      const changePercent = parseFloat(((change / previousClose) * 100).toFixed(2));
      return { symbol, price, change, changePercent };
    })
  );
  const quotes = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (quotes.length === 0) throw new Error('Yahoo v8 returned no results');
  return quotes;
}

function buildSimulated(symbolList) {
  return symbolList.map(symbol => {
    const base = BASE_PRICES[symbol] || 100;
    const change = parseFloat(((Math.random() - 0.48) * base * 0.04).toFixed(2));
    const changePercent = parseFloat(((change / base) * 100).toFixed(2));
    return { symbol, price: parseFloat((base + change).toFixed(2)), change, changePercent };
  });
}

app.get('/api/stocks', async (req, res) => {
  const symbols = req.query.symbols;
  if (!symbols || typeof symbols !== 'string') {
    return res.status(400).json({ error: 'Missing ?symbols= parameter' });
  }

  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9.^=-]{1,10}$/.test(s)).slice(0, 20);
  if (symbolList.length === 0) {
    return res.status(400).json({ error: 'No valid symbols provided' });
  }

  // 1. Try Yahoo Finance v8 chart API
  try {
    const quotes = await fetchFromYahooV8(symbolList);
    console.log(`[Stocks] Yahoo v8 OK (${quotes.length}/${symbolList.length} symbols)`);
    return res.json({ ok: true, quotes, simulated: false });
  } catch (err) {
    console.warn(`[Stocks] Yahoo v8 failed: ${err.message} — using simulated data`);
  }

  // 2. Simulated fallback
  const quotes = buildSimulated(symbolList);
  console.log('[Stocks] Returning simulated data');
  return res.json({ ok: true, quotes, simulated: true });
});

// ===== HEALTH CHECK =====

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ProjectX API Proxy', uptime: process.uptime() });
});

// ===== RSS PARSER =====

function parseRSS(xml, sourceUrl) {
  const items = [];

  // Try RSS 2.0 <item> format
  const rssItemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = rssItemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link') || extractAtomLink(block),
      description: stripHtml(extractTag(block, 'description') || extractTag(block, 'summary') || ''),
      pubDate: extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || '',
      source: sourceUrl,
    });
  }

  // If no RSS items found, try Atom <entry> format
  if (items.length === 0) {
    const atomEntryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = atomEntryRegex.exec(xml)) !== null) {
      const block = match[1];
      items.push({
        title: extractTag(block, 'title'),
        link: extractAtomLink(block) || extractTag(block, 'link'),
        description: stripHtml(extractTag(block, 'summary') || extractTag(block, 'content') || ''),
        pubDate: extractTag(block, 'published') || extractTag(block, 'updated') || '',
        source: sourceUrl,
      });
    }
  }

  return items.slice(0, 30); // Cap at 30 items per feed
}

function extractTag(block, tag) {
  // Handle CDATA: <tag><![CDATA[content]]></tag>
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle normal: <tag>content</tag>
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(regex);
  return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
}

function extractAtomLink(block) {
  const m = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return m ? m[1] : '';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
}

// ===== START =====

app.listen(PORT, () => {
  console.log(`\n  ⚡ Project X API Proxy running on http://localhost:${PORT}`);
  console.log(`  📡 RSS proxy:  /api/rss?url=<feed_url>`);
  console.log(`  🐛 CISA KEV:   /api/cisa-kev`);
  console.log(`  🔍 NVD search: /api/nvd?keyword=<term>`);
  console.log(`  📈 Stocks:     /api/stocks?symbols=CRWD,PANW,...\n`);
});
