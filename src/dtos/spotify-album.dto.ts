export interface SpotifyAlbumSearchResult {
  spotifyId: string;
  name: string;
  artistName: string;
  imageUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
}

export interface SpotifyAlbumDetails {
  spotifyId: string;
  name: string;
  imageUrl?: string;
  releaseDate?: string;
  totalTracks?: number;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
}

export interface SpotifyArtist {
  spotifyId?: string;
  name: string;
}

export interface SpotifyTrack {
  spotifyId?: string;
  name: string;
  trackNumber?: number;
  durationMs?: number;
  explicit?: boolean;
}
