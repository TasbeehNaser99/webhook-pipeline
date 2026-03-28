import axios from 'axios';
import { redisConnection } from '../core/redis.js';
import { Worker } from 'bullmq';
import { pool } from '../core/db.js';
import crypto from 'crypto'; 

export const worker = new Worker('webhook-queue', async (job) => {
  const { pipeline_id, payload } = job.data;
  console.log(`👷 Processing job ${job.id} for Pipeline ID: ${pipeline_id}...`);

  try {
    const res = await pool.query('SELECT * FROM pipelines WHERE id = $1', [pipeline_id]);

    if (res.rowCount === 0) {
      console.error(`❌ Pipeline ${pipeline_id} not found. Skipping job.`);
      return;
    }

    const pipeline = res.rows[0];
    const type = pipeline.processor_type;
    console.log(`🔍 Action Type detected: [${type}]`);
    let finalPayload = payload;

  
    switch (type) {
      case 'transformer':
        finalPayload = { data: JSON.stringify(payload).toUpperCase() };
        console.log(`🔄 [TRANSFORMER]: Data converted to Uppercase`);
        break;
      case 'filter':
        if (payload.level === 'error' || payload.priority === 'high') {
          console.log(`🛡️ [FILTER]: CRITICAL DATA DETECTED!`);
        }
        break;
      case 'enricher':
        console.log("💎 [ENRICHER]: Adding extra flair to data...");
        finalPayload = { ...payload, origin: "Attil", tech: "Node.js" };
        break;
      default:
        console.log(`📦 [DEFAULT]: Standard logging`);
    }

    const secret = process.env.WEBHOOK_SECRET || 'tasbeeh_default_secret_2026';
    const payloadString = JSON.stringify(finalPayload);
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    console.log(`🔐 Generated Signature: ${signature}`);

    try {
      console.log(`🚀 Sending result to: ${pipeline.subscriber_url}`);
      await axios.post(pipeline.subscriber_url, finalPayload, { 
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature, 
          'X-Webhook-Source': 'Tasbeeh-Pipeline-Engine'
        }
      });
      console.log("✅ Delivery Successful with Signature!");
    } catch (error: unknown) {
       const message = error instanceof Error ? error.message : 'Unknown error';

       console.error(`❌ Delivery Failed: ${message}, BullMQ will retry`);
       throw error;
      }

    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['completed', job.id]);
    console.log(`✅ Job ${job.id} finished successfully.`);

  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';

  console.error(`💥 Error processing job ${job.id}:`, message);

  await pool.query(
    'UPDATE jobs SET status = $1 WHERE id = $2',
    ['failed', job.id]
  );

  throw error;
}
}, { connection: redisConnection });
