CREATE TYPE "public"."intent" AS ENUM('romantic', 'core', 'archive', 'new', 'invest');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"zip" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"body" text NOT NULL,
	"intent" "intent" DEFAULT 'new' NOT NULL
);
