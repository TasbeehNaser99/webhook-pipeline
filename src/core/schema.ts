import { pgTable, serial, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const pipelines = pgTable('pipelines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sourcePath: text('source_path').notNull().unique(), 
  processorType: text('processor_type').notNull().default('enricher'),
  subscriberUrl: text('subscriber_url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    pathIndex: uniqueIndex('path_idx').on(table.sourcePath),
  };
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  pipelineId: integer('pipeline_id')
    .references(() => pipelines.id, { onDelete: 'cascade' }) 
    .notNull(),
  status: text('status').notNull().default('pending'), 
  payload: text('payload'), 
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});
