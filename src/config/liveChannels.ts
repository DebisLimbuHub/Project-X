import type { LiveChannel } from '@/types';

export type { LiveChannel } from '@/types';

// Video IDs are resolved dynamically via /api/youtube-live — not hardcoded here.
// Sources retain websiteUrl only, used for the "Open Source" link.
export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'bloomberg',
    name: 'Bloomberg Television',
    region: 'Global',
    category: 'finance',
    description: 'Global markets, macro, and business coverage.',
    tags: ['markets', 'business', 'global', 'tv'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://www.bloomberg.com/live/us', priority: 1 }],
  },
  {
    id: 'skynews',
    name: 'Sky News',
    region: 'UK',
    category: 'general',
    description: 'Rolling UK and international breaking news.',
    tags: ['uk', 'breaking', 'world', 'politics'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://news.sky.com/watch-live', priority: 1 }],
  },
  {
    id: 'euronews',
    name: 'Euronews',
    region: 'Europe',
    category: 'geopolitics',
    description: 'European affairs, global affairs, and breaking headlines.',
    tags: ['europe', 'world', 'eu', 'breaking'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://www.euronews.com/live', priority: 1 }],
  },
  {
    id: 'dwnews',
    name: 'DW News',
    region: 'Global',
    category: 'general',
    description: 'German public international news and analysis.',
    tags: ['germany', 'europe', 'world', 'analysis'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://www.dw.com/en/live-tv/s-100825', priority: 1 }],
  },
  {
    id: 'cnbc',
    name: 'CNBC',
    region: 'Global',
    category: 'business',
    description: 'US business television and market coverage.',
    tags: ['usa', 'markets', 'business', 'equities'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://www.cnbc.com/live-tv/', priority: 1 }],
  },
  {
    id: 'france24',
    name: 'France 24 English',
    region: 'Europe',
    category: 'geopolitics',
    description: 'French international news service in English.',
    tags: ['france', 'europe', 'world', 'breaking'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://www.france24.com/en/live', priority: 1 }],
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    region: 'Qatar',
    category: 'geopolitics',
    description: 'International live coverage focused on global affairs.',
    tags: ['middle east', 'world', 'breaking', 'live'],
    sources: [{ provider: 'youtube-video', websiteUrl: 'https://www.aljazeera.com/live/', priority: 1 }],
  },
];
