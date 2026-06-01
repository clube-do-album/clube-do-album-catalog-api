import amqp, { type Channel, type ChannelModel } from 'amqplib';

let connection: ChannelModel | undefined;
let channel: Channel | undefined;

export function getRabbitExchange() {
  return process.env.RABBITMQ_EXCHANGE?.trim() || 'clube-do-album.events';
}

export async function getRabbitChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  const rabbitUrl = process.env.RABBITMQ_URL?.trim() || 'amqp://clube:clube@localhost:5672';

  const rabbitConnection = await amqp.connect(rabbitUrl);
  const rabbitChannel = await rabbitConnection.createChannel();

  await rabbitChannel.assertExchange(getRabbitExchange(), 'topic', {
    durable: true,
  });

  connection = rabbitConnection;
  channel = rabbitChannel;

  return rabbitChannel;
}

export async function closeRabbitConnection() {
  if (channel) {
    await channel.close();
    channel = undefined;
  }

  if (connection) {
    await connection.close();
    connection = undefined;
  }
}
