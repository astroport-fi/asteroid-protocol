-- Modify "launchpad_mint_reservation" table
ALTER TABLE "public"."launchpad_mint_reservation" ADD COLUMN "is_expired" boolean NULL DEFAULT false, ADD COLUMN "date_created" timestamp NOT NULL;
