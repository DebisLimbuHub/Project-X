export {};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTNamespace {
    Player: new (
      element: string | HTMLElement,
      config: YTPlayerConfig,
    ) => YTPlayerInstance;
    PlayerState: {
      UNSTARTED: -1;
      ENDED: 0;
      PLAYING: 1;
      PAUSED: 2;
      BUFFERING: 3;
      CUED: 5;
    };
  }

  interface YTPlayerConfig {
    events?: {
      onReady?: (event: YTPlayerEvent) => void;
      onError?: (event: YTPlayerErrorEvent) => void;
      onStateChange?: (event: YTPlayerStateChangeEvent) => void;
    };
  }

  interface YTPlayerInstance {
    destroy: () => void;
    mute: () => void;
    playVideo: () => void;
    getIframe: () => HTMLIFrameElement;
  }

  interface YTPlayerEvent {
    target: YTPlayerInstance;
  }

  interface YTPlayerErrorEvent extends YTPlayerEvent {
    data: number;
  }

  interface YTPlayerStateChangeEvent extends YTPlayerEvent {
    data: number;
  }
}
