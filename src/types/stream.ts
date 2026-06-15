export interface Mirror {
  name: string;
  url: string;
}

export interface MirrorOption {
  name: string;
  id: number;
  i: number;
  q: string;
}

export interface StreamSource {
  episode: number;
  embedUrl: string;
  qualities: { quality: string; mirrors: MirrorOption[] }[];
  mirrors: Mirror[];
  episodeUrl: string;
}
