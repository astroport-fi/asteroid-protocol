-- Modify "inscription" table
ALTER TABLE "public"."inscription" ALTER COLUMN "metadata" TYPE jsonb;
-- Modify "token" table
ALTER TABLE "public"."token" ALTER COLUMN "metadata" TYPE jsonb;
