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

export interface DownloadGroup {
  format: "mp4" | "mkv";
  quality: "360p" | "480p" | "720p" | "1080p";
  mirrors: Mirror[];
}

export interface StreamSource {
  episode: number;
  embedUrl: string;
  qualities: { quality: string; mirrors: MirrorOption[] }[];
  mirrors: Mirror[];
  downloadGroups: DownloadGroup[];
  episodeUrl: string;
}
