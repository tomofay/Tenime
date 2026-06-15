export interface JikanImage {
  image_url: string;
  large_image_url: string;
  small_image_url: string;
}

export interface JikanImages {
  jpg: JikanImage;
  webp: JikanImage;
}

export interface Trailer {
  youtube_id: string | null;
  url: string | null;
  embed_url: string | null;
}

export interface Title {
  type: string;
  title: string;
}

export interface Aired {
  from: string;
  to: string | null;
  prop: {
    from: { day: number; month: number; year: number };
    to: { day: number | null; month: number | null; year: number | null };
  };
  string: string;
}

export interface Broadcast {
  day: string | null;
  time: string | null;
  timezone: string | null;
  string: string | null;
}

export interface Genre {
  mal_id: number;
  name: string;
  type: string;
  url?: string;
}

export interface Studio {
  mal_id: number;
  name: string;
  type?: string;
  url?: string;
}

export interface Producer {
  mal_id: number;
  name: string;
  type: string;
  url?: string;
}

export interface Licensor {
  mal_id: number;
  name: string;
  type: string;
  url?: string;
}

export interface Theme {
  openings: string[];
  endings: string[];
}

export interface ExternalLink {
  name: string;
  url: string;
}

export interface StreamingLink {
  name: string;
  url: string;
}

export interface AnimeRelationItem {
  mal_id: number;
  name: string;
  type: string;
  url?: string;
}

export interface AnimeRelation {
  relation: string;
  entry: AnimeRelationItem[];
}

export interface Anime {
  mal_id: number;
  url: string;
  images: JikanImages;
  trailer: Trailer;
  approved: boolean;
  titles: Title[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: string;
  source: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  aired: Aired;
  duration: string;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  broadcast: Broadcast;
  producers: Producer[];
  licensors: Licensor[];
  studios: Studio[];
  genres: Genre[];
  explicit_genres: Genre[];
  themes: Genre[];
  demographics: Genre[];
  relations: AnimeRelation[];
  theme: Theme;
  external: ExternalLink[];
  streaming: StreamingLink[];
}

export interface Episode {
  mal_id: number;
  title: string;
  episode: string;
  url: string | null;
  score: number | null;
  filler: boolean;
  recap: boolean;
  forum_url?: string | null;
}

export interface Pagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface AnimeListResponse {
  data: Anime[];
  pagination: Pagination;
}

export interface AnimeDetailResponse {
  data: Anime;
}

export interface EpisodeListResponse {
  data: Episode[];
  pagination: Pagination;
}
