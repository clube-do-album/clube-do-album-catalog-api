import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { AlbumService } from '../services/album.service.js';

const albumService = new AlbumService();

export async function listAlbumsController(_request: Request, response: Response) {
  try {
    const albums = await albumService.listAlbums();

    return response.json(albums);
  } catch (error) {
    return handleControllerError(error, response);
  }
}

export async function getAlbumByIdController(request: Request, response: Response) {
  try {
    const album = await albumService.getAlbumById(request.params.id);

    return response.json(album);
  } catch (error) {
    return handleControllerError(error, response);
  }
}

export async function searchAlbumsController(request: Request, response: Response) {
  try {
    const query = String(request.query.query ?? '');
    const albums = await albumService.searchAlbumsOnSpotify(query);

    return response.json(albums);
  } catch (error) {
    return handleControllerError(error, response);
  }
}

export async function importAlbumController(request: Request, response: Response) {
  try {
    const spotifyId = String(request.body.spotifyId ?? '');
    const requestedBy =
      typeof request.body.requestedBy === 'string' ? request.body.requestedBy : undefined;

    const album = await albumService.importAlbumFromSpotify(spotifyId, requestedBy);

    return response.status(201).json(album);
  } catch (error) {
    return handleControllerError(error, response);
  }
}

function handleControllerError(error: unknown, response: Response) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
    });
  }

  return response.status(500).json({
    message: 'Internal server error.',
  });
}
