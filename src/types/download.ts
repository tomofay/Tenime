export interface DownloadLink {
  name: string;
  url: string;
}

export interface DownloadOption {
  quality: string;
  links: DownloadLink[];
}
