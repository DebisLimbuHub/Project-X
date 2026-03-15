import { useEffect, useRef } from 'react';

interface HlsChannelPlayerProps {
  streamUrl: string;
  title: string;
  onReady: () => void;
  onError: (message: string) => void;
}

export function HlsChannelPlayer({
  streamUrl,
  title,
  onReady,
  onError,
}: HlsChannelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let hlsInstance: {
      destroy: () => void;
    } | null = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      void video.play().catch(() => {
        // Autoplay can be blocked even when the source is valid. The controls
        // remain available and we still treat the stream as ready.
      });
      onReady();
      return;
    }

    void import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return;

        if (!Hls.isSupported()) {
          onError('HLS playback is not supported in this browser for this source.');
          return;
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsInstance = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void video.play().catch(() => {
            // Autoplay can still be blocked after the manifest resolves.
          });
          onReady();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            hls.destroy();
            onError(`The HLS stream failed to load (${data.type}).`);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          onError('The HLS player dependency failed to load.');
        }
      });

    return () => {
      cancelled = true;
      hlsInstance?.destroy();
    };
  }, [onError, onReady, streamUrl]);

  return (
    <video
      ref={videoRef}
      title={title}
      className="w-full h-full bg-black"
      controls
      autoPlay
      muted
      playsInline
      onLoadedData={onReady}
      onError={() => onError('The HLS stream failed to load.')}
    />
  );
}
