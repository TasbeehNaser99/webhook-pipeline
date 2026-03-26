import { Pool } from 'pg';


export const pool = new Pool({
  user: 'user',
  host: process.env.DB_HOST ||'localhost',
  database: 'pipeline_db',
  password: 'password',
  port: 5432,
});

pool.on('connect', () => {
  console.log('🐘 Connected to PostgreSQL');
});
