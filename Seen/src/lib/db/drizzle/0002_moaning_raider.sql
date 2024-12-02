CREATE TABLE IF NOT EXISTS "associations" (
	"primary_id" uuid NOT NULL,
	"associate_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "associations_primary_id_associate_id_pk" PRIMARY KEY("primary_id","associate_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "associations" ADD CONSTRAINT "associations_primary_id_people_id_fk" FOREIGN KEY ("primary_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "associations" ADD CONSTRAINT "associations_associate_id_people_id_fk" FOREIGN KEY ("associate_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
