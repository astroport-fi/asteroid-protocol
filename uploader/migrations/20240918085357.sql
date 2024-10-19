-- Create "launchpad_asset" table
CREATE TABLE "public"."launchpad_asset" (
  "id" serial NOT NULL,
  "launchpad_hash" character(64) NOT NULL,
  "asset_id" integer NOT NULL,
  "name" character varying(50) NOT NULL,
  "uploaded" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id"),
  CONSTRAINT "launchpad_asset_id" UNIQUE ("launchpad_hash", "asset_id")
);
-- Create index "idx_launchpad_asset_launchpad_hash" to table: "launchpad_asset"
CREATE INDEX "idx_launchpad_asset_launchpad_hash" ON "public"."launchpad_asset" ("launchpad_hash");
