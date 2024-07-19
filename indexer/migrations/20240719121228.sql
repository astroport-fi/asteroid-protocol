-- Create "launchpad" table
CREATE TABLE "public"."launchpad" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "version" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "collection_id" integer NOT NULL,
  "max_supply" numeric NOT NULL,
  "minted_supply" numeric NOT NULL DEFAULT 0,
  "start_date" timestamp NULL,
  "finish_date" timestamp NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "launchpad_collection_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "launchpad_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_launchpad_collection_id" to table: "launchpad"
CREATE INDEX "idx_launchpad_collection_id" ON "public"."launchpad" ("collection_id");
-- Create index "idx_launchpad_transaction_id" to table: "launchpad"
CREATE INDEX "idx_launchpad_transaction_id" ON "public"."launchpad" ("transaction_id");
-- Create index "launchpad_tx_id" to table: "launchpad"
CREATE UNIQUE INDEX "launchpad_tx_id" ON "public"."launchpad" ("transaction_id");
-- Create "launchpad_stage" table
CREATE TABLE "public"."launchpad_stage" (
  "id" serial NOT NULL,
  "collection_id" integer NOT NULL,
  "launchpad_id" integer NOT NULL,
  "name" character varying(32) NULL DEFAULT NULL::character varying,
  "description" text NULL,
  "start_date" timestamp NULL,
  "finish_date" timestamp NULL,
  "price" bigint NOT NULL,
  "per_user_limit" bigint NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "launchpad_stage_collection_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "launchpad_stage_launchpad_fk" FOREIGN KEY ("launchpad_id") REFERENCES "public"."launchpad" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_launchpad_stage_collection_id" to table: "launchpad_stage"
CREATE INDEX "idx_launchpad_stage_collection_id" ON "public"."launchpad_stage" ("collection_id");
-- Create index "idx_launchpad_stage_launchpad_id" to table: "launchpad_stage"
CREATE INDEX "idx_launchpad_stage_launchpad_id" ON "public"."launchpad_stage" ("launchpad_id");
-- Create "launchpad_whitelist" table
CREATE TABLE "public"."launchpad_whitelist" (
  "id" serial NOT NULL,
  "collection_id" integer NOT NULL,
  "launchpad_id" integer NOT NULL,
  "stage_id" integer NOT NULL,
  "address" character varying(128) NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "launchpad_whitelist_collection_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "launchpad_whitelist_launchpad_fk" FOREIGN KEY ("launchpad_id") REFERENCES "public"."launchpad" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "launchpad_whitelist_stage_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."launchpad_stage" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_launchpad_whitelist_address" to table: "launchpad_whitelist"
CREATE INDEX "idx_launchpad_whitelist_address" ON "public"."launchpad_whitelist" ("address");
-- Create index "idx_launchpad_whitelist_collection_id" to table: "launchpad_whitelist"
CREATE INDEX "idx_launchpad_whitelist_collection_id" ON "public"."launchpad_whitelist" ("collection_id");
-- Create index "idx_launchpad_whitelist_launchpad_id" to table: "launchpad_whitelist"
CREATE INDEX "idx_launchpad_whitelist_launchpad_id" ON "public"."launchpad_whitelist" ("launchpad_id");
-- Create index "idx_launchpad_whitelist_stage_id" to table: "launchpad_whitelist"
CREATE INDEX "idx_launchpad_whitelist_stage_id" ON "public"."launchpad_whitelist" ("stage_id");
