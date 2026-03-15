interface IframeChannelPlayerProps {
  src: string;
  title: string;
  onReady: () => void;
}

export function IframeChannelPlayer({ src, title, onReady }: IframeChannelPlayerProps) {
  if (!src) {
    return (
      <div className="flex items-center justify-center h-full bg-cyber-card">
        <span className="text-gray-500 text-sm font-mono">Select a channel</span>
      </div>
    );
  }

  return (
    <iframe
      key={src}
      src={src}
      title={title}
      width="100%"
      height="100%"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      onLoad={onReady}
      style={{ border: 'none' }}
    />
  );
}
