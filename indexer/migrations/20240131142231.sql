-- Create "status" table
CREATE TABLE "public"."status" (
  "id" serial NOT NULL,
  "chain_id" character varying(100) NOT NULL,
  "last_processed_height" integer NOT NULL,
  "base_token" character varying(12) NOT NULL,
  "base_token_usd" real NOT NULL,
  "date_updated" timestamp NOT NULL,
  "last_known_height" integer NULL DEFAULT 0,
  PRIMARY KEY ("id")
);
-- Create "transaction" table
CREATE TABLE "public"."transaction" (
  "id" serial NOT NULL,
  "height" integer NOT NULL,
  "hash" character varying(100) NOT NULL,
  "content" text NOT NULL,
  "gas_used" integer NOT NULL,
  "fees" character varying(100) NOT NULL,
  "content_length" integer NOT NULL,
  "status_message" character varying(255) NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_tx_hash" to table: "transaction"
CREATE INDEX "idx_tx_hash" ON "public"."transaction" ("hash");
-- Create index "transaction_hash_key" to table: "transaction"
CREATE UNIQUE INDEX "transaction_hash_key" ON "public"."transaction" ("hash");
-- Create "inscription" table
CREATE TABLE "public"."inscription" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "version" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "content_hash" character varying(128) NOT NULL,
  "creator" character varying(255) NOT NULL,
  "current_owner" character varying(128) NOT NULL,
  "type" character varying(128) NOT NULL,
  "metadata" json NOT NULL,
  "content_path" character varying(255) NOT NULL,
  "content_size_bytes" integer NOT NULL,
  "date_created" timestamp NOT NULL,
  "is_explicit" boolean NULL DEFAULT false,
  PRIMARY KEY ("id"),
  CONSTRAINT "inscription_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_inscriptions_owner_date" to table: "inscription"
CREATE INDEX "idx_inscriptions_owner_date" ON "public"."inscription" ("date_created");
-- Create index "inscription_content_hash_key" to table: "inscription"
CREATE UNIQUE INDEX "inscription_content_hash_key" ON "public"."inscription" ("content_hash");
-- Create index "inscription_tx_id" to table: "inscription"
CREATE UNIQUE INDEX "inscription_tx_id" ON "public"."inscription" ("transaction_id");
-- Create "inscription_history" table
CREATE TABLE "public"."inscription_history" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "transaction_id" integer NOT NULL,
  "inscription_id" integer NOT NULL,
  "sender" character varying(128) NOT NULL,
  "receiver" character varying(128) NULL,
  "action" character varying(32) NOT NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "inscription_id_fk" FOREIGN KEY ("inscription_id") REFERENCES "public"."inscription" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "inscription_history_un" to table: "inscription_history"
CREATE UNIQUE INDEX "inscription_history_un" ON "public"."inscription_history" ("transaction_id");
-- Create "marketplace_listing" table
CREATE TABLE "public"."marketplace_listing" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "seller_address" character varying(128) NOT NULL,
  "total" bigint NOT NULL,
  "deposit_total" bigint NOT NULL,
  "deposit_timeout" integer NOT NULL,
  "depositor_address" character varying(128) NULL,
  "depositor_timedout_block" integer NULL,
  "is_deposited" boolean NOT NULL DEFAULT false,
  "is_filled" boolean NOT NULL DEFAULT false,
  "is_cancelled" boolean NOT NULL DEFAULT false,
  "date_updated" timestamp NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_listing_tx_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "token" table
CREATE TABLE "public"."token" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "version" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "creator" character varying(128) NOT NULL,
  "current_owner" character varying(128) NOT NULL,
  "name" character varying(32) NOT NULL,
  "ticker" character varying(10) NOT NULL,
  "decimals" smallint NOT NULL,
  "max_supply" numeric NOT NULL,
  "per_mint_limit" bigint NOT NULL,
  "launch_timestamp" bigint NOT NULL,
  "mint_page" character varying(128) NOT NULL DEFAULT 'default',
  "metadata" text NULL,
  "content_path" character varying(255) NULL DEFAULT NULL::character varying,
  "content_size_bytes" integer NULL,
  "circulating_supply" bigint NOT NULL DEFAULT 0,
  "last_price_base" bigint NOT NULL DEFAULT 0,
  "volume_24_base" bigint NOT NULL DEFAULT 0,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "token_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "token_ticker_key" to table: "token"
CREATE UNIQUE INDEX "token_ticker_key" ON "public"."token" ("ticker");
-- Create index "token_tx_id" to table: "token"
CREATE UNIQUE INDEX "token_tx_id" ON "public"."token" ("transaction_id");
-- Create "marketplace_cft20_detail" table
CREATE TABLE "public"."marketplace_cft20_detail" (
  "id" serial NOT NULL,
  "listing_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "amount" bigint NOT NULL,
  "ppt" bigint NOT NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_cft20_detail_ls_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "marketplace_cft20_detail_tk_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "marketplace_cft20_trade_history" table
CREATE TABLE "public"."marketplace_cft20_trade_history" (
  "id" serial NOT NULL,
  "transaction_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "listing_id" integer NOT NULL,
  "seller_address" character varying(128) NOT NULL,
  "buyer_address" character varying(128) NULL,
  "amount_quote" bigint NOT NULL,
  "amount_base" bigint NOT NULL,
  "rate" integer NOT NULL DEFAULT 0,
  "total_usd" real NOT NULL DEFAULT 0,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_cft20_history_ls_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "marketplace_cft20_history_tk_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "marketplace_cft20_history_tx_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "mtth_tx_id" to table: "marketplace_cft20_trade_history"
CREATE UNIQUE INDEX "mtth_tx_id" ON "public"."marketplace_cft20_trade_history" ("transaction_id");
-- Create "marketplace_listing_history" table
CREATE TABLE "public"."marketplace_listing_history" (
  "id" serial NOT NULL,
  "listing_id" integer NOT NULL,
  "transaction_id" integer NOT NULL,
  "sender_address" character varying(128) NOT NULL,
  "action" character varying(64) NOT NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_listing_history_ls_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "marketplace_listing_history_tx_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "token_address_history" table
CREATE TABLE "public"."token_address_history" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "transaction_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "sender" character varying(128) NOT NULL,
  "action" character varying(32) NOT NULL,
  "amount" bigint NOT NULL,
  "receiver" character varying(128) NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "token_tx_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "token_holder" table
CREATE TABLE "public"."token_holder" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "token_id" integer NOT NULL,
  "address" character varying(128) NOT NULL,
  "amount" bigint NOT NULL,
  "date_updated" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "token_holder_ticker_idx" to table: "token_holder"
CREATE INDEX "token_holder_ticker_idx" ON "public"."token_holder" ("token_id");
-- Create "token_open_position" table
CREATE TABLE "public"."token_open_position" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "seller_address" character varying(128) NOT NULL,
  "amount" bigint NOT NULL,
  "ppt" bigint NOT NULL,
  "total" bigint NOT NULL,
  "is_filled" boolean NOT NULL DEFAULT false,
  "is_cancelled" boolean NOT NULL DEFAULT false,
  "date_filled" timestamp NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "transactionid_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "token_trade_history" table
CREATE TABLE "public"."token_trade_history" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "seller_address" character varying(128) NOT NULL,
  "buyer_address" character varying(128) NULL,
  "amount_base" bigint NOT NULL,
  "amount_quote" bigint NOT NULL,
  "rate" integer NOT NULL DEFAULT 0,
  "total_usd" real NOT NULL DEFAULT 0,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "token_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "tth_tx_id" to table: "token_trade_history"
CREATE UNIQUE INDEX "tth_tx_id" ON "public"."token_trade_history" ("transaction_id");
