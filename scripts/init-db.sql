CREATE TABLE IF NOT EXISTS pipelines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_path TEXT UNIQUE NOT NULL, 
    processor_type VARCHAR(50) NOT NULL, 
    subscriber_url TEXT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    pipeline_id INTEGER REFERENCES pipelines(id),
    status VARCHAR(50) DEFAULT 'pending', 
    payload JSONB, 
    result JSONB, 
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
