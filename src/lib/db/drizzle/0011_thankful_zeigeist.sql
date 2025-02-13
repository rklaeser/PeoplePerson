CREATE TABLE IF NOT EXISTS "groupAssociations" (
	"group_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groupAssociations_group_id_person_id_pk" PRIMARY KEY("group_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "group" RENAME TO "groups";--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "group_person_id_people_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupAssociations" ADD CONSTRAINT "groupAssociations_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupAssociations" ADD CONSTRAINT "groupAssociations_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "groups" DROP COLUMN IF EXISTS "person_id";