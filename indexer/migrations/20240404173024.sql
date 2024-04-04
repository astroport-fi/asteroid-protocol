-- Create "collection_stats" table
CREATE TABLE "public"."collection_stats" (
  "id" integer NOT NULL,
  "listed" bigint NOT NULL,
  "supply" bigint NOT NULL,
  "owners" bigint NOT NULL,
  "volume" numeric NOT NULL,
  "volume_24h" numeric NOT NULL,
  "floor_price" bigint NOT NULL,
  CONSTRAINT "collection_stats_id_fk" FOREIGN KEY ("id") REFERENCES "public"."collection" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "collection_stats_id" to table: "collection_stats"
CREATE UNIQUE INDEX "collection_stats_id" ON "public"."collection_stats" ("id");
-- Create index "idx_collection_stats_id" to table: "collection_stats"
CREATE INDEX "idx_collection_stats_id" ON "public"."collection_stats" ("id");
-- Create "collection_traits" table
CREATE TABLE "public"."collection_traits" (
  "collection_id" integer NOT NULL,
  "trait_type" jsonb NOT NULL,
  "trait_value" jsonb NOT NULL,
  "count" bigint NOT NULL,
  "rarity_score" numeric NOT NULL,
  CONSTRAINT "collection_traits_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "collection_traits_collection_id" to table: "collection_traits"
CREATE UNIQUE INDEX "collection_traits_collection_id" ON "public"."collection_traits" ("collection_id");
-- Create index "collection_traits_type_value" to table: "collection_traits"
CREATE UNIQUE INDEX "collection_traits_type_value" ON "public"."collection_traits" ("collection_id", "trait_type", "trait_value");
-- Create index "idx_collection_traits_collection_id" to table: "collection_traits"
CREATE INDEX "idx_collection_traits_collection_id" ON "public"."collection_traits" ("collection_id");
-- Modify "inscription" table
ALTER TABLE "public"."inscription" ADD COLUMN "inscription_number" integer NULL;
-- Create index "idx_inscription_number" to table: "inscription"
CREATE INDEX "idx_inscription_number" ON "public"."inscription" ("inscription_number");
-- Create index "inscription_number" to table: "inscription"
CREATE UNIQUE INDEX "inscription_number" ON "public"."inscription" ("inscription_number");
-- Create "inscription_rarity" table
CREATE TABLE "public"."inscription_rarity" (
  "id" integer NOT NULL,
  "rarity_score" numeric NOT NULL,
  "rarity_rank" integer NOT NULL,
  CONSTRAINT "inscription_rarity_id_fk" FOREIGN KEY ("id") REFERENCES "public"."inscription" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_inscription_rarity_id" to table: "inscription_rarity"
CREATE INDEX "idx_inscription_rarity_id" ON "public"."inscription_rarity" ("id");
-- Create index "inscription_rarity_id" to table: "inscription_rarity"
CREATE UNIQUE INDEX "inscription_rarity_id" ON "public"."inscription_rarity" ("id");
