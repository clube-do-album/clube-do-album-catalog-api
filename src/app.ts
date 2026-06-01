import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { routes } from './routes/index.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(((error, _request, response, _next) => {
  if (error instanceof SyntaxError) {
    return response.status(400).json({
      message: 'Invalid JSON body.',
    });
  }

  return response.status(500).json({
    message: 'Internal server error.',
  });
}) as ErrorRequestHandler);
