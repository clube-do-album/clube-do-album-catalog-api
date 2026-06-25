import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { publishAlbumImportedEvent } from '../messaging/album.publisher.js';
import { AlbumRepository } from '../repositories/album.repository.js';
import { SpotifyService } from './spotify.service.js';

const albumRepository = new AlbumRepository();
const spotifyService = new SpotifyService();

export class AlbumService {
  async listAlbums({ page, limit, query }: { page: number; limit: number; query?: string }) {
    const skip = (page - 1) * limit;
    const [albums, total] = await Promise.all([
      albumRepository.findAll({ query, skip, take: limit }),
      albumRepository.countAll(query),
    ]);

    return {
      items: albums.map((album) => this.formatAlbumSummary(album)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
    };
  }

  async getAlbumById(id: string) {
    const album = await albumRepository.findById(id);

    if (!album) {
      throw new AppError('Album not found.', 404);
    }

    return this.formatAlbumDetails(album);
  }

  async getAlbumsByIds(ids: string[]) {
    const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).slice(0, 50);

    if (uniqueIds.length === 0) {
      return [];
    }

    const albums = await albumRepository.findByIds(uniqueIds);
    const albumsById = new Map(albums.map((album) => [album.id, album]));

    return uniqueIds
      .map((id) => albumsById.get(id))
      .filter((album): album is NonNullable<typeof album> => Boolean(album))
      .map((album) => this.formatAlbumDetails(album));
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
      const formattedAlbum = this.formatAlbumDetails(importedAlbum);

      await publishAlbumImportedEvent({
        event: 'ALBUM_IMPORTED',
        albumId: formattedAlbum.id,
        spotifyId: formattedAlbum.spotifyId,
        name: formattedAlbum.name,
        artistName: formattedAlbum.artists[0]?.name,
        status: formattedAlbum.status,
        occurredAt: new Date().toISOString(),
      });

      return formattedAlbum;
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
        discNumber: track.discNumber,
        trackNumber: track.trackNumber,
        durationMs: track.durationMs,
        explicit: track.explicit,
      })),
    };
  }

  private formatAlbumSummary(album: Awaited<ReturnType<AlbumRepository['findAll']>>[number]) {
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
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
