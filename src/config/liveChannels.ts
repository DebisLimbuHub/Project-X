import type { LiveChannel } from '@/types';

export type { LiveChannel } from '@/types';

// Previous iterations stored one-off embed URLs here. We keep ordered source
// fallbacks instead so blocked or stale embeds can degrade gracefully.
export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'bloomberg',
    name: 'Bloomberg Business',
    region: 'Global',
    category: 'finance',
    description: 'Global markets, macro, and business coverage.',
    tags: ['markets', 'business', 'global', 'tv'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'Bloomberg',
        websiteUrl: 'https://www.bloomberg.com/live/us',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: 'd5l6EXyF0JA',
        websiteUrl: 'https://www.bloomberg.com/live/us',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
  {
    id: 'sky_news',
    name: 'Sky News',
    region: 'UK',
    category: 'general',
    description: 'Rolling UK and international breaking news.',
    tags: ['uk', 'breaking', 'world', 'politics'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'SkyNews',
        websiteUrl: 'https://news.sky.com/watch-live',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: 'y60wDzZt8yg',
        websiteUrl: 'https://news.sky.com/watch-live',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
  {
    id: 'euronews',
    name: 'Euronews English',
    region: 'Europe',
    category: 'geopolitics',
    description: 'European affairs, global affairs, and breaking headlines.',
    tags: ['europe', 'world', 'eu', 'breaking'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'euronews',
        websiteUrl: 'https://www.euronews.com/live',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: 'sGirPok4S-g',
        websiteUrl: 'https://www.euronews.com/live',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
  {
    id: 'dw',
    name: 'DW News',
    region: 'Germany',
    category: 'geopolitics',
    description: 'German public international news and analysis.',
    tags: ['germany', 'europe', 'world', 'analysis'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'dwnews',
        websiteUrl: 'https://www.dw.com/en/live-tv/s-100825',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: 'NKzj5QLxvtE',
        websiteUrl: 'https://www.dw.com/en/live-tv/s-100825',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
  {
    id: 'cnbc',
    name: 'CNBC',
    region: 'USA',
    category: 'business',
    description: 'US business television and market coverage.',
    tags: ['usa', 'markets', 'business', 'equities'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'CNBCtelevision',
        websiteUrl: 'https://www.cnbc.com/live-tv/',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: '5wP7hl2GMUA',
        websiteUrl: 'https://www.cnbc.com/live-tv/',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
  {
    id: 'france24',
    name: 'France 24 English',
    region: 'France',
    category: 'general',
    description: 'French international news service in English.',
    tags: ['france', 'europe', 'world', 'breaking'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'FRANCE24English',
        websiteUrl: 'https://www.france24.com/en/live',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: 'rt1EUoLY6ow',
        websiteUrl: 'https://www.france24.com/en/live',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    region: 'Qatar',
    category: 'geopolitics',
    description: 'International live coverage focused on global affairs.',
    tags: ['middle east', 'world', 'breaking', 'live'],
    sources: [
      {
        provider: 'youtube-user-uploads',
        uploadsUser: 'AlJazeeraEnglish',
        websiteUrl: 'https://www.aljazeera.com/live/',
        priority: 1,
        label: 'YouTube uploads',
      },
      {
        provider: 'youtube-video',
        videoId: '-upyPouRrB8',
        websiteUrl: 'https://www.aljazeera.com/live/',
        priority: 2,
        label: 'Current live video',
      },
    ],
  },
];
