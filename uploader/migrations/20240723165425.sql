-- Create "launchpad" table
CREATE TABLE "public"."launchpad" (
  "hash" character(64) NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Create "launchpad_inscription" table
CREATE TABLE "public"."launchpad_inscription" (
  "id" serial NOT NULL,
  "launchpad_hash" character(64) NOT NULL,
  "inscription_number" integer NOT NULL,
  "name" character varying(50) NOT NULL,
  "uploaded" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
-- Create index "idx_launchpad_inscription_launchpad_hash" to table: "launchpad_inscription"
CREATE INDEX "idx_launchpad_inscription_launchpad_hash" ON "public"."launchpad_inscription" ("launchpad_hash");
-- Create index "launchpad_inscription_number" to table: "launchpad_inscription"
CREATE UNIQUE INDEX "launchpad_inscription_number" ON "public"."launchpad_inscription" ("launchpad_hash", "inscription_number");
