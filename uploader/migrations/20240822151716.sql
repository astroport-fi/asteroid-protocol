-- Create "launchpad" table
CREATE TABLE "public"."launchpad" (
  "hash" character(64) NOT NULL,
  "creator" character(45) NOT NULL,
  "folder" character(25) NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("hash")
);
-- Create index "idx_launchpad_creator" to table: "launchpad"
CREATE INDEX "idx_launchpad_creator" ON "public"."launchpad" ("creator");
-- Create "launchpad_inscription" table
CREATE TABLE "public"."launchpad_inscription" (
  "id" serial NOT NULL,
  "launchpad_hash" character(64) NOT NULL,
  "inscription_number" integer NOT NULL,
  "name" character varying(50) NOT NULL,
  "uploaded" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id"),
  CONSTRAINT "launchpad_inscription_number" UNIQUE ("launchpad_hash", "inscription_number")
);
-- Create index "idx_launchpad_inscription_launchpad_hash" to table: "launchpad_inscription"
CREATE INDEX "idx_launchpad_inscription_launchpad_hash" ON "public"."launchpad_inscription" ("launchpad_hash");
-- Create "session" table
CREATE TABLE "public"."session" (
  "address" character(45) NOT NULL,
  "hash" character(25) NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("address")
);
-- Create index "idx_session" to table: "session"
CREATE INDEX "idx_session" ON "public"."session" ("hash");
