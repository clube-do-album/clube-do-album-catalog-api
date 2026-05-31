import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { AlbumRepository } from '../repositories/album.repository.js';
import { SpotifyService } from './spotify.service.js';

const albumRepository = new AlbumRepository();
const spotifyService = new SpotifyService();

export class AlbumService {
  listAlbums() {
    return albumRepository.findAll();
  }

  async getAlbumById(id: string) {
    const album = await albumRepository.findById(id);

    if (!album) {
      throw new AppError('Album not found.', 404);
    }

    return this.formatAlbumDetails(album);
  }

  searchAlbumsOnSpotify(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      throw new AppError('Query is required.', 400);
    }

    return spotifyService.searchAlbums(normalizedQuery);
  }

  async importAlbumFromSpotify(spotifyId: string, requestedBy?: string) {
    const normalizedSpotifyId = spotifyId.trim();

    if (!normalizedSpotifyId) {
      throw new AppError('spotifyId is required.', 400);
    }

    const existingAlbum = await albumRepository.findBySpotifyId(normalizedSpotifyId);

    if (existingAlbum) {
      return this.formatAlbumDetails(existingAlbum);
    }

    const spotifyAlbum = await spotifyService.getAlbumDetails(normalizedSpotifyId);

    try {
      const importedAlbum = await albumRepository.createAlbumWithRelations(
        spotifyAlbum,
        requestedBy,
      );

      return this.formatAlbumDetails(importedAlbum);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const album = await albumRepository.findBySpotifyId(normalizedSpotifyId);

        if (album) {
          return this.formatAlbumDetails(album);
        }
      }

      throw error;
    }
  }

  private formatAlbumDetails(album: Awaited<ReturnType<AlbumRepository['findById']>>) {
    if (!album) {
      throw new AppError('Album not found.', 404);
    }

    return {
      id: album.id,
      spotifyId: album.spotifyId,
      name: album.name,
      imageUrl: album.imageUrl,
      releaseDate: album.releaseDate,
      totalTracks: album.totalTracks,
      status: album.status,
      artists: album.artists.map(({ artist }) => ({
        id: artist.id,
        spotifyId: artist.spotifyId,
        name: artist.name,
      })),
      tracks: album.tracks.map((track) => ({
        id: track.id,
        spotifyId: track.spotifyId,
        name: track.name,
        trackNumber: track.trackNumber,
        durationMs: track.durationMs,
        explicit: track.explicit,
      })),
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
