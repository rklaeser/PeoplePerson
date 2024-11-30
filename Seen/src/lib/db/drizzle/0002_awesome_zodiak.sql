ALTER TABLE "people" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "body" text NOT NULL;