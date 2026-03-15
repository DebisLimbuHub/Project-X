import { useEffect, useMemo, useState } from 'react';
import type { LiveChannel } from '@/types';
import { LIVE_CHANNELS } from '@/config/liveChannels';
import { useCyberStore } from '@/store';
import { useYoutubeLiveUrls } from '@/hooks/useYoutubeLiveUrls';
import type { LiveUrlEntry } from '@/hooks/useYoutubeLiveUrls';

interface LiveChannelsPanelProps {
  searchQuery?: string;
  showSearchInput?: boolean;
}

function LiveStatusBadge({ entry }: { entry: LiveUrlEntry | undefined }) {
  if (entry === undefined) return null;
  if (entry.isLive) {
    return (
      <span className="text-[7px] font-mono text-threat-critical bg-threat-critical/10 border border-threat-critical/30 px-1.5 py-0.5 rounded-sm">
        LIVE
      </span>
    );
  }
  if (entry.embedUrl) {
    return (
      <span className="text-[7px] font-mono text-gray-500 bg-cyber-card border border-cyber-border px-1.5 py-0.5 rounded-sm">
        REPLAY
      </span>
    );
  }
  return (
    <span className="text-[7px] font-mono text-gray-600 bg-cyber-card border border-cyber-border px-1.5 py-0.5 rounded-sm">
      OFFLINE
    </span>
  );
}

function ChannelRow({
  channel,
  active,
  onSelect,
  liveEntry,
}: {
  channel: LiveChannel;
  active: boolean;
  onSelect: () => void;
  liveEntry: LiveUrlEntry | undefined;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-sm border px-3 py-2 transition-colors ${
        active
          ? 'border-accent-cyan/50 bg-accent-cyan/10'
          : 'border-cyber-border bg-cyber-card/50 hover:bg-cyber-hover'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`text-[10px] font-sans font-semibold truncate ${active ? 'text-accent-cyan' : 'text-gray-200'}`}>
            {channel.name}
          </div>
          <div className="text-[8px] font-mono uppercase tracking-wider text-gray-600">
            {channel.region}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <LiveStatusBadge entry={liveEntry} />
          <span
            className={`text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
              active
                ? 'text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10'
                : 'text-gray-500 border-cyber-border'
            }`}
          >
            {channel.category}
          </span>
        </div>
      </div>
    </button>
  );
}

export function LiveChannelsPanel({
  searchQuery,
  showSearchInput = true,
}: LiveChannelsPanelProps) {
  const liveChannels = useCyberStore((state) => state.liveChannels);
  const selectedChannelId = useCyberStore((state) => state.selectedChannelId);
  const channelSearch = useCyberStore((state) => state.channelSearch);
  const setChannelSearch = useCyberStore((state) => state.setChannelSearch);
  const setLiveChannels = useCyberStore((state) => state.setLiveChannels);
  const selectChannel = useCyberStore((state) => state.selectChannel);
  const [categoryFilter, setCategoryFilter] = useState<LiveChannel['category'] | 'all'>('all');

  const liveUrls = useYoutubeLiveUrls();

  useEffect(() => {
    setLiveChannels(LIVE_CHANNELS);
  }, [setLiveChannels]);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setChannelSearch(searchQuery);
    }
  }, [searchQuery, setChannelSearch]);

  const categories = useMemo<(LiveChannel['category'] | 'all')[]>(
    () => ['all', ...new Set(liveChannels.map((channel) => channel.category))],
    [liveChannels],
  );

  const effectiveSearch = searchQuery ?? channelSearch;

  const filteredChannels = useMemo(() => {
    const query = effectiveSearch.trim().toLowerCase();
    return liveChannels.filter((channel) => {
      const matchesCategory = categoryFilter === 'all' || channel.category === categoryFilter;
      const haystack = [
        channel.name,
        channel.region,
        channel.category,
        channel.description ?? '',
        ...(channel.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [categoryFilter, effectiveSearch, liveChannels]);

  const selectedChannel = useMemo(
    () =>
      filteredChannels.find((channel) => channel.id === selectedChannelId) ??
      filteredChannels[0] ??
      null,
    [filteredChannels, selectedChannelId],
  );

  const embedUrl = selectedChannel ? (liveUrls[selectedChannel.id]?.embedUrl ?? null) : null;
  const liveEntry = selectedChannel ? liveUrls[selectedChannel.id] : undefined;

  useEffect(() => {
    if (filteredChannels.length === 0) return;
    if (!selectedChannel) {
      selectChannel(filteredChannels[0].id);
    }
  }, [filteredChannels, selectChannel, selectedChannel]);

  return (
    <div className="hud-panel h-full flex flex-col overflow-hidden">
      <div className="hud-panel-header">
        <span className="hud-panel-title">Live Channels</span>
        <span className="text-[8px] font-mono uppercase tracking-wider text-gray-600">
          {filteredChannels.length} feeds
        </span>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1 min-h-0">
        {showSearchInput && searchQuery === undefined && (
          <label className="relative block">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-[10px]">⌕</span>
            <input
              type="text"
              value={channelSearch}
              onChange={(event) => setChannelSearch(event.target.value)}
              placeholder="Search channels..."
              className="w-full bg-cyber-card border border-cyber-border text-gray-300 text-[10px] font-mono pl-6 pr-3 py-1.5 rounded-sm focus:outline-none focus:border-accent-cyan/50 placeholder-gray-700"
            />
          </label>
        )}

        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const active = categoryFilter === category;
            return (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded-sm border transition-colors ${
                  active
                    ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                    : 'border-cyber-border text-gray-500 hover:text-gray-300 hover:bg-cyber-hover'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {filteredChannels.length > 0 ? (
          <>
            <div className="space-y-2 overflow-y-auto pr-1 max-h-36" style={{ scrollbarWidth: 'thin' }}>
              {filteredChannels.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  active={channel.id === selectedChannel?.id}
                  onSelect={() => selectChannel(channel.id)}
                  liveEntry={liveUrls[channel.id]}
                />
              ))}
            </div>

            {embedUrl ? (
              <div style={{ width: '100%', height: '160px', minHeight: '160px' }}>
                <iframe
                  key={`${selectedChannel?.id}-${embedUrl}`}
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 'none', display: 'block' }}
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center border border-cyber-border rounded-sm bg-cyber-card/40"
                style={{ height: '160px' }}
              >
                <div className="text-center">
                  <span className="text-[9px] font-mono text-gray-500 block mb-1">
                    {liveEntry === undefined ? 'Loading stream...' : 'Stream offline'}
                  </span>
                  {selectedChannel && (
                    <span className="text-[8px] font-mono text-gray-600">
                      {selectedChannel.name} is not currently live
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 rounded-sm border border-cyber-border bg-cyber-card/40 px-4 py-8 text-center flex items-center justify-center">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                No channels match
              </div>
              <div className="mt-2 text-[9px] font-mono text-gray-600">
                Refine the search or clear the category filter to restore live feeds.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
