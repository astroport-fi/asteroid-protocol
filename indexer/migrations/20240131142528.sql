-- Modify "token" table
ALTER TABLE "public"."token" ADD COLUMN "is_explicit" boolean NULL DEFAULT false;
