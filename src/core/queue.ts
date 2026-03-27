import { Queue } from 'bullmq';

export const webhookQueue = new Queue('webhook-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
  },
});
