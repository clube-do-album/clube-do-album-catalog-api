import { AlbumStatus, ImportRequestStatus, type Prisma } from '@prisma/client';
import type { SpotifyAlbumDetails, SpotifyArtist } from '../dtos/spotify-album.dto.js';
import { prisma } from '../config/prisma.js';

const albumRelations = {
  artists: {
    include: {
      artist: {
        select: {
          id: true,
          spotifyId: true,
          name: true,
        },
      },
    },
  },
  tracks: {
    orderBy: {
      trackNumber: 'asc' as const,
    },
    select: {
      id: true,
      spotifyId: true,
      name: true,
      trackNumber: true,
      durationMs: true,
      explicit: true,
    },
  },
};

export class AlbumRepository {
  findAll() {
    return prisma.album.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        spotifyId: true,
        name: true,
        imageUrl: true,
        releaseDate: true,
        totalTracks: true,
        status: true,
      },
    });
  }

  findById(id: string) {
    return prisma.album.findUnique({
      where: { id },
      include: albumRelations,
    });
  }

  findBySpotifyId(spotifyId: string) {
    return prisma.album.findUnique({
      where: { spotifyId },
      include: albumRelations,
    });
  }

  createAlbumWithRelations(data: SpotifyAlbumDetails, requestedBy?: string) {
    return prisma.$transaction(async (transaction) => {
      const album = await transaction.album.create({
        data: {
          spotifyId: data.spotifyId,
          name: data.name,
          imageUrl: data.imageUrl,
          releaseDate: data.releaseDate,
          totalTracks: data.totalTracks,
          status: AlbumStatus.AVAILABLE,
        },
      });

      for (const artistData of data.artists) {
        const artist = await this.findOrCreateArtist(transaction, artistData);

        await transaction.albumArtist.create({
          data: {
            albumId: album.id,
            artistId: artist.id,
          },
        });
      }

      if (data.tracks.length > 0) {
        await transaction.track.createMany({
          data: data.tracks.map((track) => ({
            spotifyId: track.spotifyId,
            albumId: album.id,
            name: track.name,
            trackNumber: track.trackNumber,
            durationMs: track.durationMs,
            explicit: track.explicit ?? false,
          })),
        });
      }

      await transaction.albumImportRequest.create({
        data: {
          spotifyId: data.spotifyId,
          albumId: album.id,
          userId: requestedBy,
          status: ImportRequestStatus.FINISHED,
        },
      });

      return transaction.album.findUniqueOrThrow({
        where: { id: album.id },
        include: albumRelations,
      });
    });
  }

  private async findOrCreateArtist(
    transaction: Prisma.TransactionClient,
    artistData: SpotifyArtist,
  ) {
    if (artistData.spotifyId) {
      return transaction.artist.upsert({
        where: {
          spotifyId: artistData.spotifyId,
        },
        update: {
          name: artistData.name,
        },
        create: {
          spotifyId: artistData.spotifyId,
          name: artistData.name,
        },
      });
    }

    const existingArtist = await transaction.artist.findFirst({
      where: {
        spotifyId: null,
        name: artistData.name,
      },
    });

    if (existingArtist) {
      return existingArtist;
    }

    return transaction.artist.create({
      data: {
        name: artistData.name,
      },
    });
  }
}
