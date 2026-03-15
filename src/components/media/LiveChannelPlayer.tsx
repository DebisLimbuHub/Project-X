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
    case 'youtube-video':
      return 'YouTube video';
    case 'youtube-playlist':
      return 'YouTube playlist';
    case 'youtube-user-uploads':
      return 'YouTube uploads';
    case 'direct-iframe':
      return 'Embedded page';
    case 'hls':
      return 'HLS stream';
  }
}

function getYouTubeErrorMessage(code: number | null): string | null {
  switch (code) {
    case 2:
      return 'The YouTube source parameters were rejected.';
    case 5:
      return 'The YouTube player hit an HTML5 playback error.';
    case 100:
      return 'The YouTube video is unavailable or has been removed.';
    case 101:
    case 150:
      return 'The broadcaster does not allow this YouTube stream to be embedded.';
    case 153:
      return 'The YouTube player rejected playback because the client identity could not be verified.';
    default:
      return null;
  }
}

export function LiveChannelPlayer({ channel }: LiveChannelPlayerProps) {
  const selectedChannelSourceIndex = useCyberStore((state) => state.selectedChannelSourceIndex);
  const selectNextChannelSource = useCyberStore((state) => state.selectNextChannelSource);
  const sources = useMemo(() => (channel ? getSortedSources(channel) : []), [channel]);
  const currentSource = sources[selectedChannelSourceIndex] ?? null;
  const resolvedEmbedUrl = currentSource ? buildEmbedUrl(currentSource) : null;
  const websiteUrl = channel ? getChannelWebsiteUrl(channel, currentSource) : null;
  const popoutUrl = resolvedEmbedUrl ?? websiteUrl;
  const [isLoading, setIsLoading] = useState(true);
  const [lastErrorCode, setLastErrorCode] = useState<number | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);

  const hasNextSource = selectedChannelSourceIndex < sources.length - 1;
  const sourceLabel = currentSource ? currentSource.label ?? getProviderLabel(currentSource.provider) : 'No source';
  const isRenderableSource = Boolean(
    currentSource &&
      ((isYouTubeSource(currentSource) && resolvedEmbedUrl) ||
        (currentSource.provider === 'hls' && currentSource.streamUrl) ||
        (currentSource.provider === 'direct-iframe' && resolvedEmbedUrl)),
  );

  useEffect(() => {
    setIsLoading(true);
    setFallbackReason(null);
  }, [channel?.id, selectedChannelSourceIndex]);

  useEffect(() => {
    setLastErrorCode(null);
  }, [channel?.id]);

  if (!channel) {
    return (
      <ChannelUnavailableFallback
        title="No live channel selected"
        reason="Choose a channel from the list above to start playback."
      />
    );
  }

  const handleReady = () => {
    setIsLoading(false);
    setFallbackReason(null);
  };

  const handleSourceFailure = (message: string, errorCode: number | null = null) => {
    if (errorCode !== null) {
      setLastErrorCode(errorCode);
    }

    if (hasNextSource) {
      selectNextChannelSource();
      return;
    }

    setIsLoading(false);
    setFallbackReason(message);
  };

  const debugProvider = currentSource?.provider ?? 'none';

  return (
    <div className="rounded-sm border border-cyber-border bg-black/70 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyber-border bg-cyber-card/60 flex-wrap">
        <div className="min-w-0 mr-auto">
          <div className="text-[10px] font-sans font-semibold text-accent-cyan truncate">
            {channel.name}
          </div>
          <div className="text-[8px] font-mono uppercase tracking-wider text-gray-600">
            {channel.region} • {sourceLabel}
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

      <div className="relative min-h-[220px] h-[clamp(220px,28vh,360px)] bg-black">
        {isLoading && isRenderableSource && !fallbackReason && (
          <div className="absolute inset-0 z-10 animate-pulse bg-[linear-gradient(135deg,rgba(13,20,32,0.92),rgba(21,35,57,0.75),rgba(13,20,32,0.92))]" />
        )}

        {currentSource ? (
          isYouTubeSource(currentSource) && resolvedEmbedUrl ? (
            <YouTubeChannelPlayer
              key={`${channel.id}-${selectedChannelSourceIndex}`}
              title={channel.name}
              source={currentSource}
              onReady={handleReady}
              onError={(errorCode) =>
                handleSourceFailure(
                  getYouTubeErrorMessage(errorCode) ?? 'The YouTube source failed to load.',
                  errorCode,
                )
              }
            />
          ) : currentSource.provider === 'hls' && currentSource.streamUrl ? (
            <HlsChannelPlayer
              key={`${channel.id}-${selectedChannelSourceIndex}`}
              title={channel.name}
              streamUrl={currentSource.streamUrl}
              onReady={handleReady}
              onError={(message) => handleSourceFailure(message)}
            />
          ) : currentSource.provider === 'direct-iframe' && resolvedEmbedUrl ? (
            <IframeChannelPlayer
              key={`${channel.id}-${selectedChannelSourceIndex}`}
              title={channel.name}
              src={resolvedEmbedUrl}
              onReady={handleReady}
            />
          ) : (
            <ChannelUnavailableFallback
              title={channel.name}
              reason="This source cannot be embedded. Open the source directly or try the next fallback."
              websiteUrl={websiteUrl}
              popoutUrl={popoutUrl}
              hasNextSource={hasNextSource}
              onTryNextSource={selectNextChannelSource}
            />
          )
        ) : (
          <ChannelUnavailableFallback
            title={channel.name}
            reason="No playable sources are configured for this channel."
            websiteUrl={websiteUrl}
            popoutUrl={popoutUrl}
          />
        )}

        {!isLoading && fallbackReason && (
          <div className="absolute inset-0">
            <ChannelUnavailableFallback
              title={channel.name}
              reason={fallbackReason}
              websiteUrl={websiteUrl}
              popoutUrl={popoutUrl}
              hasNextSource={hasNextSource}
              onTryNextSource={selectNextChannelSource}
            />
          </div>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="px-3 py-2 border-t border-cyber-border bg-cyber-card/40 text-[8px] font-mono text-gray-500">
          provider: {debugProvider} | embed: {resolvedEmbedUrl ?? 'n/a'} | source:{' '}
          {sources.length === 0 ? '0/0' : `${selectedChannelSourceIndex + 1}/${sources.length}`} | last error:{' '}
          {lastErrorCode ?? 'none'}
        </div>
      )}
    </div>
  );
}
