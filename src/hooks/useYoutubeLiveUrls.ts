import { useState, useEffect } from 'react';

export interface LiveUrlEntry {
  name: string;
  handle: string;
  videoId: string | null;
  embedUrl: string | null;
  isLive: boolean;
}

export type LiveUrlMap = Record<string, LiveUrlEntry>;

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useYoutubeLiveUrls(): LiveUrlMap {
  const [liveUrls, setLiveUrls] = useState<LiveUrlMap>({});

  useEffect(() => {
    async function fetchLiveUrls() {
      try {
        const response = await fetch('/api/youtube-live');
        const data = await response.json();
        if (data.ok && data.channels) {
          setLiveUrls(data.channels);
        }
      } catch (err) {
        console.error('[useYoutubeLiveUrls] Failed to fetch live URLs:', err);
      }
    }

    fetchLiveUrls();
    const timer = setInterval(fetchLiveUrls, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return liveUrls;
}
