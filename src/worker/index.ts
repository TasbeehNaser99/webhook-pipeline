import axios from 'axios';
import { redisConnection } from '../core/redis.js';
import { Worker } from 'bullmq';
import { pool } from '../core/db.js';
import crypto from 'crypto'; // 1. استيراد مكتبة التشفير

const worker = new Worker('webhook-queue', async (job) => {
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

    // --- منطق المعالجة ---
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

    // --- 2. جزء التوقيع الرقمي (The Signing Logic) ---
    const secret = process.env.WEBHOOK_SECRET || 'tasbeeh_default_secret_2026';
    const payloadString = JSON.stringify(finalPayload);
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    console.log(`🔐 Generated Signature: ${signature}`);

    // --- إرسال الطلب ---
    try {
      console.log(`🚀 Sending result to: ${pipeline.subscriber_url}`);
      await axios.post(pipeline.subscriber_url, finalPayload, { 
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature, // 3. إضافة التوقيع في الهيدر
          'X-Webhook-Source': 'Tasbeeh-Pipeline-Engine'
        }
      });
      console.log("✅ Delivery Successful with Signature!");
    } catch (error: any) {
      console.error(`❌ Delivery Failed: ${error.message}, BullMQ will retry...`);
      throw error;
    }

    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['completed', job.id]);
    console.log(`✅ Job ${job.id} finished successfully.`);

  } catch (error: any) {
    console.error(`💥 Error processing job ${job.id}:`, error.message);
    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', job.id]);
    throw error;
  }
}, { connection: redisConnection });
