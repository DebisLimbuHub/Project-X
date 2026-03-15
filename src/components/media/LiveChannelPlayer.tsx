import { useEffect, useMemo, useState } from 'react';
import type { LiveChannel } from '@/types';
import { useCyberStore } from '@/store';
import {
  buildEmbedUrl,
  getChannelWebsiteUrl,
  getSortedSources,
  isYouTubeSource,
} from '@/utils/liveChannelEmbed';
import { ChannelUnavailableFallback } from '@/components/media/ChannelUnavailableFallback';
import { HlsChannelPlayer } from '@/components/media/HlsChannelPlayer';
import { IframeChannelPlayer } from '@/components/media/IframeChannelPlayer';
import { YouTubeChannelPlayer } from '@/components/media/YouTubeChannelPlayer';

interface LiveChannelPlayerProps {
  channel: LiveChannel | null;
}

function getProviderLabel(provider: LiveChannel['sources'][number]['provider']): string {
  switch (provider) {
    case 'youtube-video':      return 'YouTube video';
    case 'youtube-playlist':   return 'YouTube playlist';
    case 'youtube-user-uploads': return 'YouTube uploads';
    case 'direct-iframe':      return 'Embedded page';
    case 'hls':                return 'HLS stream';
  }
}

export function LiveChannelPlayer({ channel }: LiveChannelPlayerProps) {
  const selectedChannelSourceIndex = useCyberStore((state) => state.selectedChannelSourceIndex);
  const selectNextChannelSource = useCyberStore((state) => state.selectNextChannelSource);

  // activeChannel is what's actually rendered. It's set to null first on every
  // channel/source change, then set to the new channel on the next animation frame.
  // This guarantees the old iframe is fully unmounted before the new one mounts,
  // preventing the flicker/morph that happens when React tries to reuse the element.
  const [activeChannel, setActiveChannel] = useState<LiveChannel | null>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);

  useEffect(() => {
    const targetChannel = channel;
    const targetIndex = selectedChannelSourceIndex;

    // Null-first: always unmount the current player before mounting the new one.
    setActiveChannel(null);

    if (!targetChannel) return;

    const rafId = requestAnimationFrame(() => {
      setActiveChannel(targetChannel);
      setActiveSourceIndex(targetIndex);
    });

    return () => cancelAnimationFrame(rafId);
  }, [channel?.id, selectedChannelSourceIndex]);

  const sources = useMemo(
    () => (activeChannel ? getSortedSources(activeChannel) : []),
    [activeChannel],
  );
  const currentSource = sources[activeSourceIndex] ?? null;
  const resolvedEmbedUrl = currentSource ? buildEmbedUrl(currentSource) : null;
  const websiteUrl = activeChannel ? getChannelWebsiteUrl(activeChannel, currentSource) : null;
  const popoutUrl = resolvedEmbedUrl ?? websiteUrl;
  const hasNextSource = activeSourceIndex < sources.length - 1;
  const sourceLabel = currentSource
    ? (currentSource.label ?? getProviderLabel(currentSource.provider))
    : 'No source';

  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  // Clear fallback reason whenever the active channel or source changes.
  useEffect(() => {
    setFallbackReason(null);
  }, [activeChannel?.id, activeSourceIndex]);

  if (!channel) {
    return (
      <ChannelUnavailableFallback
        title="No live channel selected"
        reason="Choose a channel from the list above to start playback."
      />
    );
  }

  const handleSourceFailure = (message: string) => {
    if (hasNextSource) {
      selectNextChannelSource();
      return;
    }
    setFallbackReason(message);
  };

  // While transitioning (activeChannel === null but channel !== null),
  // show a minimal loading pulse so there's no jarring blank flash.
  if (!activeChannel) {
    return (
      <div className="rounded-sm border border-cyber-border bg-black/70 overflow-hidden">
        <div className="relative w-full bg-black animate-pulse" style={{ paddingBottom: '56.25%' }} />
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-cyber-border bg-black/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyber-border bg-cyber-card/60 flex-wrap">
        <div className="min-w-0 mr-auto">
          <div className="text-[10px] font-sans font-semibold text-accent-cyan truncate">
            {activeChannel.name}
          </div>
          <div className="text-[8px] font-mono uppercase tracking-wider text-gray-600">
            {activeChannel.region} • {sourceLabel}
          </div>
        </div>
        <span className="text-[7px] font-mono uppercase tracking-wider text-threat-critical border border-threat-critical/30 bg-threat-critical/10 px-1.5 py-0.5 rounded-sm">
          Live
        </span>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-accent-cyan/40 text-accent-cyan hover:text-white hover:border-accent-cyan/70 transition-colors"
          >
            Open source
          </a>
        )}
        {popoutUrl && (
          <a
            href={popoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-cyber-border text-gray-300 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors"
          >
            Pop out
          </a>
        )}
      </div>

      {/* Player — 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 relative bg-black overflow-hidden">
          {currentSource ? (
            isYouTubeSource(currentSource) && resolvedEmbedUrl ? (
              <YouTubeChannelPlayer
                key={`${activeChannel.id}-${activeSourceIndex}`}
                title={activeChannel.name}
                source={currentSource}
                onReady={() => setFallbackReason(null)}
                onError={() =>
                  handleSourceFailure('The YouTube source failed to load.')
                }
              />
            ) : currentSource.provider === 'hls' && currentSource.streamUrl ? (
              <HlsChannelPlayer
                key={`${activeChannel.id}-${activeSourceIndex}`}
                title={activeChannel.name}
                streamUrl={currentSource.streamUrl}
                onReady={() => setFallbackReason(null)}
                onError={(message) => handleSourceFailure(message)}
              />
            ) : currentSource.provider === 'direct-iframe' && resolvedEmbedUrl ? (
              <IframeChannelPlayer
                key={`${activeChannel.id}-${activeSourceIndex}`}
                title={activeChannel.name}
                src={resolvedEmbedUrl}
                onReady={() => setFallbackReason(null)}
              />
            ) : (
              <ChannelUnavailableFallback
                title={activeChannel.name}
                reason="This source cannot be embedded. Open the source directly or try the next fallback."
                websiteUrl={websiteUrl}
                popoutUrl={popoutUrl}
                hasNextSource={hasNextSource}
                onTryNextSource={selectNextChannelSource}
              />
            )
          ) : (
            <ChannelUnavailableFallback
              title={activeChannel.name}
              reason="No playable sources are configured for this channel."
              websiteUrl={websiteUrl}
              popoutUrl={popoutUrl}
            />
          )}

          {fallbackReason && (
            <div className="absolute inset-0">
              <ChannelUnavailableFallback
                title={activeChannel.name}
                reason={fallbackReason}
                websiteUrl={websiteUrl}
                popoutUrl={popoutUrl}
                hasNextSource={hasNextSource}
                onTryNextSource={selectNextChannelSource}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
