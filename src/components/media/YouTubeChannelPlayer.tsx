import { useEffect, useMemo, useRef } from 'react';
import type { LiveChannelSource } from '@/types';
import { buildYouTubeEmbedUrl } from '@/utils/liveChannelEmbed';

interface YouTubeChannelPlayerProps {
  title: string;
  source: LiveChannelSource;
  onReady: () => void;
  onError: (errorCode: number) => void;
}

let youtubeApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API can only load in the browser.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const handleReady = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube API loaded without a Player constructor.'));
      }
    };

    const previousHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      handleReady();
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load the YouTube IFrame API.'));
      document.head.appendChild(script);
    }

    window.setTimeout(() => {
      if (!window.YT?.Player) {
        reject(new Error('Timed out waiting for the YouTube IFrame API.'));
      }
    }, 12000);
  });

  return youtubeApiPromise;
}

export function YouTubeChannelPlayer({
  title,
  source,
  onReady,
  onError,
}: YouTubeChannelPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(source), [source]);

  useEffect(() => {
    if (!embedUrl || !iframeRef.current) {
      onError(2);
      return;
    }

    let cancelled = false;

    loadYouTubeIframeApi()
      .then(() => {
        if (cancelled || !iframeRef.current) return;

        playerRef.current?.destroy();
        playerRef.current = new window.YT!.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
              event.target.mute();
              try {
                event.target.playVideo();
              } catch {
                // The player still counts as ready if autoplay is blocked.
              }
              onReady();
            },
            onError: (event) => {
              if (cancelled) return;
              onError(event.data);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          onError(5);
        }
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [embedUrl, onError, onReady]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      src={embedUrl}
      className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
