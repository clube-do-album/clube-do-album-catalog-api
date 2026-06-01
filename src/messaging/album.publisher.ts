import { getRabbitChannel, getRabbitExchange } from './rabbitmq.connection.js';

export interface AlbumImportedEvent {
  event: 'ALBUM_IMPORTED';
  albumId: string;
  spotifyId: string;
  name: string;
  artistName?: string;
  status: string;
  occurredAt: string;
}

const ALBUM_IMPORTED_ROUTING_KEY = 'album.imported';

export async function publishAlbumImportedEvent(payload: AlbumImportedEvent): Promise<void> {
  const channel = await getRabbitChannel();
  const exchange = getRabbitExchange();
  const message = Buffer.from(JSON.stringify(payload));

  channel.publish(exchange, ALBUM_IMPORTED_ROUTING_KEY, message, {
    persistent: true,
    contentType: 'application/json',
  });
}
