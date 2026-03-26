import { Worker } from 'bullmq';
import { pool } from '../core/db.js';
import axios from 'axios';

const worker = new Worker('webhook-queue', async (job) => {
  const { jobId, payload, processorType } = job.data;
  console.log(`🛠️ Processing Job ${jobId}...`);

  try {
   
    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['processing', jobId]);

    const pipelineQuery = await pool.query(
      `SELECT p.subscriber_url 
       FROM pipelines p 
       JOIN jobs j ON p.id = j.pipeline_id 
       WHERE j.id = $1`, 
      [jobId]
    );
    const callbackUrl = pipelineQuery.rows[0]?.subscriber_url;

    let resultData = payload;
    if (processorType === 'uppercase' && payload.message) {
      resultData = { ...payload, message: payload.message.toUpperCase(), processed_at: new Date() };
    }

   
    if (callbackUrl) {
      console.log(`📡 Sending result to: ${callbackUrl}`);
      
      const dataToPost = typeof resultData === 'string' ? JSON.parse(resultData) : resultData;

      try {
        await axios.post(callbackUrl, {
          jobId: jobId,
          status: 'completed',
          data: dataToPost
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'WebhookPipeline/1.0'
          },
          timeout: 10000 
        });
        console.log(`✅ Callback sent successfully to ${callbackUrl}`);
      } catch (axiosError: any) {
      
        const errorDetail = axiosError.response 
          ? `${axiosError.response.status} ${axiosError.response.statusText}` 
          : axiosError.message;
        console.error(`⚠️ Callback failed: ${errorDetail}`);
      }
    }

   
    await pool.query(
      'UPDATE jobs SET status = $1, result = $2 WHERE id = $3',
      ['completed', JSON.stringify(resultData), jobId]
    );

    console.log(`✅ Job ${jobId} finished!`);

  } catch (error) {
    console.error(`❌ Error in job ${jobId}:`, error);
    await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', ['failed', jobId]);
  }
}, {
  connection: { host: 'localhost', port: 6379 },
 
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 }
});

console.log('🤖 Worker is standing by and listening for jobs...');
