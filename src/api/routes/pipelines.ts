import { Router } from 'express';
import { pool } from '../../core/db.js';
import { Queue } from 'bullmq';
import { redisConnection } from '../../core/redis.js'; 

const router = Router();

const webhookQueue = new Queue('webhook-queue', { 
  connection: redisConnection 
});

router.post('/', async (req, res) => {
  const { source_path, processor_type, name, subscriber_url } = req.body;
  
  if (!source_path || !processor_type) {
    return res.status(400).json({ error: 'source_path and processor_type are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO pipelines (name, source_path, processor_type, subscriber_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        name || `Pipeline-${source_path}`,
        source_path,
        processor_type,
        subscriber_url || 'https://httpbin.org/post' 
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
       return res.status(400).json({ error: 'Pipeline path already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/:path', async (req, res) => {
  const { path } = req.params;
  const payload = req.body;

  try {
    const result = await pool.query('SELECT * FROM pipelines WHERE source_path = $1', [path]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const pipeline = result.rows[0];

    const job = await webhookQueue.add('process-webhook', {
      pipeline_id: pipeline.id,
      payload: payload
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true 
    });

    res.status(202).json({ 
      message: 'Accepted and queued', 
      jobId: job.id 
    });

  } catch (err) {
    console.error('❌ Error adding job to queue:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM pipelines');
  res.json(result.rows);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { source_path, processor_type } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pipelines SET source_path = $1, processor_type = $2 WHERE id = $3 RETURNING *`,
      [source_path, processor_type, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Pipeline not found' });
    res.json({ message: 'Pipeline updated successfully', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pipeline' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM pipelines WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

export default router;
