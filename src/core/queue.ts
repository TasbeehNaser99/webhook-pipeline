import { Queue } from 'bullmq';

export const webhookQueue = new Queue('webhook-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});
