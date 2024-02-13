-- Create "inscription_trade_history" table
CREATE TABLE "public"."inscription_trade_history" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "transaction_id" integer NOT NULL,
  "inscription_id" integer NOT NULL,
  "seller_address" character varying(128) NOT NULL,
  "buyer_address" character varying(128) NULL,
  "amount_quote" bigint NOT NULL,
  "total_usd" real NOT NULL DEFAULT 0,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "inscription_id_fk" FOREIGN KEY ("inscription_id") REFERENCES "public"."inscription" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "ith_tx_id" to table: "inscription_trade_history"
CREATE UNIQUE INDEX "ith_tx_id" ON "public"."inscription_trade_history" ("transaction_id");
-- Create "marketplace_inscription_detail" table
CREATE TABLE "public"."marketplace_inscription_detail" (
  "id" serial NOT NULL,
  "listing_id" integer NOT NULL,
  "inscription_id" integer NOT NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "marketplace_inscription_detail_ik_fk" FOREIGN KEY ("inscription_id") REFERENCES "public"."inscription" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "marketplace_inscription_detail_ls_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listing" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
