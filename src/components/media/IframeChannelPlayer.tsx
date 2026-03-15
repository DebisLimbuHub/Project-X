interface IframeChannelPlayerProps {
  src: string;
  title: string;
  onReady: () => void;
}

export function IframeChannelPlayer({ src, title, onReady }: IframeChannelPlayerProps) {
  return (
    <iframe
      src={src}
      title={title}
      className="w-full h-full border-0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      onLoad={onReady}
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
