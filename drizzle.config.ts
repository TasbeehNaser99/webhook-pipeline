import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: 'postgres://user:password@localhost:5432/pipeline_db',
  },
  verbose: true,
  strict: true,
});
