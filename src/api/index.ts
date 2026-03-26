import express from 'express';
import { Queue } from 'bullmq';
import { pool } from '../core/db.js';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const app = express();
app.use(express.json());

const webhookQueue = new Queue('webhook-queue', {
  connection: {
    host:process.env.REDIS_HOST || 'localhost',
    port: 6379
  }
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(webhookQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.post('/webhook/:path', async (req, res) => {
  const { path } = req.params;
  const payload = req.body;

  const apiKey = req.headers['x-api-key'];
  const MASTER_KEY = 'tasbeeh_secret_123';

  if (apiKey !== MASTER_KEY) {
    console.log('🚫 Unauthorized access attempt!');
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  try {
    console.log(`📩 Received webhook for path: ${path}`);

    const result = await pool.query('SELECT * FROM pipelines WHERE source_path = $1', [path]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const jobResult = await pool.query(
      'INSERT INTO jobs (pipeline_id, payload, status) VALUES ($1, $2, $3) RETURNING id',
      [result.rows[0].id, JSON.stringify(payload), 'pending']
    );

    const jobId = jobResult.rows[0].id;

    await webhookQueue.add('process-webhook', {
      jobId: jobId,
      payload: payload,
      processorType: result.rows[0].processor_type
    }, {
      attempts: 3, 
      backoff: {
        type: 'exponential',
        delay: 5000 
      }
    });

    console.log(`📤 Job ${jobId} added to Redis queue`);

    res.status(202).json({
      message: 'Accepted and queued',
      jobId: jobId
    });

  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/admin/queues`);
});
