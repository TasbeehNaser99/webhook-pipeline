import express from 'express';
import { pool } from '../core/db.js';

const app = express();
app.use(express.json());


app.post('/webhook/:path', async (req, res) => {
  const { path } = req.params;
  const payload = req.body;

  console.log(`📩 Received webhook for path: ${path}`);

  const result = await pool.query('SELECT * FROM pipelines WHERE source_path = $1', [path]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Pipeline not found' });
  }


  await pool.query(
    'INSERT INTO jobs (pipeline_id, payload, status) VALUES ($1, $2, $3)',
    [result.rows[0].id, payload, 'pending']
  );

 
  res.status(202).json({ message: 'Accepted and queued' });
});

app.listen(3000, () => console.log('🚀 API Server running on port 3000'));
