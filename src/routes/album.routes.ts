import { Router } from 'express';
import {
  getAlbumByIdController,
  importAlbumController,
  listAlbumsController,
  searchAlbumsController,
} from '../controllers/album.controller.js';

export const albumRouter = Router();

albumRouter.get('/albums', listAlbumsController);
albumRouter.get('/albums/search', searchAlbumsController);
albumRouter.post('/albums/import', importAlbumController);
albumRouter.get('/albums/:id', getAlbumByIdController);
