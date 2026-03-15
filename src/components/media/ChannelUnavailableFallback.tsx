interface ChannelUnavailableFallbackProps {
  title: string;
  reason?: string | null;
  websiteUrl?: string | null;
  popoutUrl?: string | null;
  hasNextSource?: boolean;
  onTryNextSource?: () => void;
}

export function ChannelUnavailableFallback({
  title,
  reason,
  websiteUrl,
  popoutUrl,
  hasNextSource = false,
  onTryNextSource,
}: ChannelUnavailableFallbackProps) {
  return (
    <div className="h-full min-h-[220px] flex items-center justify-center px-5 py-6 bg-[radial-gradient(circle_at_top,#11213b_0%,#0b1018_52%,#070a11_100%)]">
      <div className="max-w-sm text-center">
        <div className="text-[11px] font-display font-semibold tracking-[0.3em] text-threat-critical uppercase">
          Live stream unavailable
        </div>
        <div className="mt-2 text-sm font-sans text-gray-200">
          {title}
        </div>
        <div className="mt-2 text-[10px] font-mono leading-relaxed text-gray-500">
          {reason || 'This source could not be embedded right now. Try another source or open the channel directly.'}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-sm border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan hover:text-white hover:border-accent-cyan/70 transition-colors"
            >
              Open source
            </a>
          )}
          {popoutUrl && (
            <a
              href={popoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-sm border border-cyber-border text-gray-300 hover:border-accent-cyan/40 hover:text-accent-cyan transition-colors"
            >
              Pop out
            </a>
          )}
          {hasNextSource && onTryNextSource && (
            <button
              onClick={onTryNextSource}
              className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-sm border border-threat-high/40 bg-threat-high/10 text-threat-high hover:text-white hover:border-threat-high/70 transition-colors"
            >
              Try next source
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
