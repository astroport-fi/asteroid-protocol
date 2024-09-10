-- Modify "launchpad_mint_reservation" table
ALTER TABLE "public"."launchpad_mint_reservation" ADD COLUMN "metadata" jsonb NULL, ADD COLUMN "is_random" boolean NULL DEFAULT true;