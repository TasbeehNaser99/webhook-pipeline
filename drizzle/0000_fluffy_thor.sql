CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipeline_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"source_path" text NOT NULL,
	"processor_type" text DEFAULT 'enricher' NOT NULL,
	"subscriber_url" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "pipelines_source_path_unique" UNIQUE("source_path")
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "path_idx" ON "pipelines" USING btree ("source_path");