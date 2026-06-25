import axios, { AxiosError } from 'axios';
import { AppError } from '../errors/app-error.js';
import type {
  SpotifyAlbumDetails,
  SpotifyAlbumSearchResult,
  SpotifyTrack,
} from '../dtos/spotify-album.dto.js';

interface SpotifyImage {
  url: string;
}

interface SpotifyArtistResponse {
  id?: string;
  name: string;
}

interface SpotifyAlbumSearchItem {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date?: string;
  total_tracks?: number;
  artists: SpotifyArtistResponse[];
}

interface SpotifyTrackResponse {
  id?: string;
  name: string;
  disc_number?: number;
  track_number?: number;
  duration_ms?: number;
  explicit?: boolean;
}

interface SpotifyAlbumResponse extends SpotifyAlbumSearchItem {
  tracks: {
    items: SpotifyTrackResponse[];
    next?: string | null;
  };
}

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

export class SpotifyService {
  private accessToken?: string;
  private tokenExpiresAt = 0;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new AppError('Spotify credentials are not configured.', 500);
    }

    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');

      const { data } = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        params,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (error) {
      throw this.toSpotifyError(error, 'Could not authenticate with Spotify.');
    }
  }

  async searchAlbums(query: string): Promise<SpotifyAlbumSearchResult[]> {
    const token = await this.getAccessToken();

    try {
      const { data } = await axios.get<{
        albums: { items: SpotifyAlbumSearchItem[] };
      }>('https://api.spotify.com/v1/search', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: `album:${query}`,
          type: 'album',
          limit: 10,
          market: 'BR',
        },
      });

      return data.albums.items.map((album) => ({
        spotifyId: album.id,
        name: album.name,
        artistName: album.artists.map((artist) => artist.name).join(', '),
        imageUrl: album.images[0]?.url,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
      }));
    } catch (error) {
      throw this.toSpotifyError(error, 'Could not search albums on Spotify.');
    }
  }

  async getAlbumDetails(spotifyId: string): Promise<SpotifyAlbumDetails> {
    const token = await this.getAccessToken();

    try {
      const { data } = await axios.get<SpotifyAlbumResponse>(
        `https://api.spotify.com/v1/albums/${spotifyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            market: 'BR',
          },
        },
      );

      const tracks = await this.getAllAlbumTracks(data.tracks.items, data.tracks.next, token);

      return {
        spotifyId: data.id,
        name: data.name,
        imageUrl: data.images[0]?.url,
        releaseDate: data.release_date,
        totalTracks: data.total_tracks,
        artists: data.artists.map((artist) => ({
          spotifyId: artist.id,
          name: artist.name,
        })),
        tracks,
      };
    } catch (error) {
      throw this.toSpotifyError(error, 'Could not get album details from Spotify.');
    }
  }

  private async getAllAlbumTracks(
    initialTracks: SpotifyTrackResponse[],
    nextUrl: string | null | undefined,
    token: string,
  ): Promise<SpotifyTrack[]> {
    const tracks = [...initialTracks];
    let next = nextUrl;

    while (next) {
      const { data } = await axios.get<{
        items: SpotifyTrackResponse[];
        next?: string | null;
      }>(next, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      tracks.push(...data.items);
      next = data.next;
    }

    return tracks.map((track) => ({
      spotifyId: track.id,
      name: track.name,
      discNumber: track.disc_number,
      trackNumber: track.track_number,
      durationMs: track.duration_ms,
      explicit: track.explicit,
    }));
  }

  private toSpotifyError(error: unknown, fallbackMessage: string): AppError {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        return new AppError('Album not found on Spotify.', 404);
      }

      if (error.response?.status === 400 || error.response?.status === 401) {
        const spotifyMessage = this.getSpotifyErrorMessage(error.response.data);

        return new AppError(
          spotifyMessage
            ? `Spotify request failed: ${spotifyMessage}`
            : 'Invalid Spotify credentials or request.',
          502,
        );
      }
    }

    return new AppError(fallbackMessage, 502);
  }

  private getSpotifyErrorMessage(data: unknown) {
    if (
      typeof data === 'object' &&
      data !== null &&
      'error_description' in data &&
      typeof data.error_description === 'string'
    ) {
      return data.error_description;
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'object' &&
      data.error !== null &&
      'message' in data.error &&
      typeof data.error.message === 'string'
    ) {
      return data.error.message;
    }

    return undefined;
  }
}
