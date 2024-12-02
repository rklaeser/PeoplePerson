ALTER TABLE "people" ALTER COLUMN "zip" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "zip" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "people" ALTER COLUMN "body" SET NOT NULL;