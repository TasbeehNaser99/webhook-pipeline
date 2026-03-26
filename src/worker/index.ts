import { Worker } from 'bullmq';
import { pool } from '../core/db.js';

const worker = new Worker('webhook-queue', async (job) => {
  console.log(`👷 Processing job ${job.id}...`);
  
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
  }
});

console.log('🚀 Worker is ready and watching for jobs...');
