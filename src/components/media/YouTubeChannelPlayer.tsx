import React, { memo, useState } from 'react';
import type { LiveChannelSource } from '@/types';
import { buildYouTubeEmbedUrl } from '@/utils/liveChannelEmbed';

interface YouTubeChannelPlayerProps {
  title: string;
  source: LiveChannelSource;
  onReady: () => void;
  onError: (errorCode: number) => void;
}

// ── Error Boundary — catches unexpected React render errors inside the iframe tree

interface VideoErrorBoundaryState { hasError: boolean }

class VideoErrorBoundary extends React.Component<React.PropsWithChildren, VideoErrorBoundaryState> {
  state: VideoErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): VideoErrorBoundaryState { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-cyber-card">
          <div className="text-center">
            <span className="text-gray-500 text-sm font-mono block mb-2">Video unavailable</span>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-accent-cyan text-xs font-mono border border-accent-cyan/30 px-3 py-1 rounded hover:bg-accent-cyan/10"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── VideoFrame — memoized so it NEVER re-renders unless src changes.
// Channel switching is handled by unmounting/remounting the parent (null-first + rAF).

const VideoFrame = memo(function VideoFrame({
  src,
  title,
  onReady,
  onError,
}: {
  src: string;
  title: string;
  onReady: () => void;
  onError: (errorCode: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cyber-card">
        <div className="text-center">
          <span className="text-gray-500 text-sm font-mono block mb-2">Stream unavailable</span>
          <button
            onClick={() => { setError(false); setLoaded(false); }}
            className="text-accent-cyan text-xs font-mono border border-accent-cyan/30 px-3 py-1 rounded hover:bg-accent-cyan/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin mx-auto mb-2" />
            <span className="text-gray-500 text-xs font-mono">Loading stream…</span>
          </div>
        </div>
      )}
      <iframe
        src={src}
        title={title}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        style={{ border: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        onLoad={() => { setLoaded(true); onReady(); }}
        onError={() => { setError(true); onError(5); }}
      />
    </div>
  );
});

// ── Public component

export function YouTubeChannelPlayer({ title, source, onReady, onError }: YouTubeChannelPlayerProps) {
  const embedUrl = buildYouTubeEmbedUrl(source);

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-cyber-card">
        <span className="text-gray-500 text-sm font-mono">No embed URL for this source</span>
      </div>
    );
  }

  return (
    <VideoErrorBoundary>
      <VideoFrame src={embedUrl} title={title} onReady={onReady} onError={onError} />
    </VideoErrorBoundary>
  );
}
