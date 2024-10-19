-- Create "troll_post" table
CREATE TABLE "public"."troll_post" (
  "id" integer NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "version" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "launchpad_id" integer NULL DEFAULT NULL,
  "content_hash" character varying(128) NOT NULL,
  "creator" character varying(128) NOT NULL,
  "text" text NOT NULL,
  "content_path" character varying(255) NULL DEFAULT NULL::character varying,
  "content_size_bytes" integer NULL,
  "is_explicit" boolean NULL DEFAULT false,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "troll_post_content_hash_key" UNIQUE ("content_hash"),
  CONSTRAINT "troll_post_tx_id" UNIQUE ("transaction_id"),
  CONSTRAINT "troll_post_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "troll_post_launchpad_fk" FOREIGN KEY ("launchpad_id") REFERENCES "public"."launchpad" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_trgm_troll_post_text" to table: "troll_post"
CREATE INDEX "idx_trgm_troll_post_text" ON "public"."troll_post" USING gin ("text" gin_trgm_ops);
-- Create index "idx_troll_post_creator" to table: "troll_post"
CREATE INDEX "idx_troll_post_creator" ON "public"."troll_post" ("creator");
-- Create index "idx_troll_post_transaction_id" to table: "troll_post"
CREATE INDEX "idx_troll_post_transaction_id" ON "public"."troll_post" ("transaction_id");
-- Create index "idx_troll_post_launchpad_id" to table: "troll_post"
CREATE INDEX "idx_troll_post_launchpad_id" ON "public"."troll_post" ("launchpad_id");
