import { Router } from 'express';
import { albumRouter } from './album.routes.js';
import { healthRouter } from './health.routes.js';

export const routes = Router();

routes.use(healthRouter);
routes.use(albumRouter);
