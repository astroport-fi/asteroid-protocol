-- Create "collection" table
CREATE TABLE "public"."collection" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "version" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "content_hash" character varying(128) NOT NULL,
  "creator" character varying(128) NOT NULL,
  "minter" character varying(128) NULL,
  "name" character varying(32) NOT NULL,
  "symbol" character varying(10) NOT NULL,
  "metadata" jsonb NOT NULL,
  "content_path" character varying(255) NULL DEFAULT NULL::character varying,
  "content_size_bytes" integer NULL,
  "is_explicit" boolean NULL DEFAULT false,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "collection_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "collection_content_hash_key" to table: "collection"
CREATE UNIQUE INDEX "collection_content_hash_key" ON "public"."collection" ("content_hash");
-- Create index "collection_name_key" to table: "collection"
CREATE UNIQUE INDEX "collection_name_key" ON "public"."collection" ("name");
-- Create index "collection_symbol_key" to table: "collection"
CREATE UNIQUE INDEX "collection_symbol_key" ON "public"."collection" ("symbol");
-- Create index "collection_tx_id" to table: "collection"
CREATE UNIQUE INDEX "collection_tx_id" ON "public"."collection" ("transaction_id");
-- Create index "idx_collection_creator" to table: "collection"
CREATE INDEX "idx_collection_creator" ON "public"."collection" ("creator");
-- Create index "idx_collection_name" to table: "collection"
CREATE INDEX "idx_collection_name" ON "public"."collection" ("name");
-- Create index "idx_collection_symbol" to table: "collection"
CREATE INDEX "idx_collection_symbol" ON "public"."collection" ("symbol");
-- Create index "idx_collection_transaction_id" to table: "collection"
CREATE INDEX "idx_collection_transaction_id" ON "public"."collection" ("transaction_id");
-- Modify "inscription" table
ALTER TABLE "public"."inscription" ADD COLUMN "collection_id" integer NULL, ADD
 CONSTRAINT "inscription_collection_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- Create index "idx_inscription_collection_id" to table: "inscription"
CREATE INDEX "idx_inscription_collection_id" ON "public"."inscription" ("collection_id");
