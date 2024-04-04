-- Modify "inscription" table
ALTER TABLE "public"."inscription" ADD COLUMN "inscription_number" integer NULL;
-- Create index "idx_inscription_number" to table: "inscription"
CREATE INDEX "idx_inscription_number" ON "public"."inscription" ("inscription_number");
-- Create index "inscription_number" to table: "inscription"
CREATE UNIQUE INDEX "inscription_number" ON "public"."inscription" ("inscription_number");
-- Create "collection_stats" table
CREATE TABLE "public"."collection_stats" (
  "id" integer NOT NULL,
  "listed" bigint NOT NULL,
  "supply" bigint NOT NULL,
  "owners" bigint NOT NULL,
  "volume" numeric NOT NULL,
  "volume_24h" numeric NOT NULL,
  "floor_price" bigint NOT NULL,
  PRIMARY KEY ("id")
);
-- Create "collection_traits" table
CREATE TABLE "public"."collection_traits" (
  "collection_id" integer NOT NULL,
  "trait_type" jsonb NOT NULL,
  "trait_value" jsonb NOT NULL,
  "count" bigint NOT NULL,
  "rarity_score" numeric NOT NULL
);
-- Create index "collection_traits_type_value" to table: "collection_traits"
CREATE UNIQUE INDEX "collection_traits_type_value" ON "public"."collection_traits" ("collection_id", "trait_type", "trait_value");
-- Create "inscription_rarity" table
CREATE TABLE "public"."inscription_rarity" (
  "id" integer NOT NULL,
  "rarity_score" numeric NOT NULL,
  "rarity_rank" integer NOT NULL,
  PRIMARY KEY ("id")
);
