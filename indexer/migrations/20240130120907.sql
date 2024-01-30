-- Create "inscription" table
CREATE TABLE "public"."inscription" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "height" bigint NULL,
  "version" text NULL,
  "transaction_id" bigint NULL,
  "content_hash" text NULL,
  "creator" text NULL,
  "current_owner" text NULL,
  "type" text NULL,
  "metadata" jsonb NULL,
  "content_path" text NULL,
  "content_size_bytes" bigint NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "inscription_history" table
CREATE TABLE "public"."inscription_history" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "height" bigint NULL,
  "transaction_id" bigint NULL,
  "inscription_id" bigint NULL,
  "sender" text NULL,
  "receiver" text NULL,
  "action" text NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "marketplace_cft20_detail" table
CREATE TABLE "public"."marketplace_cft20_detail" (
  "id" bigserial NOT NULL,
  "listing_id" bigint NULL,
  "token_id" bigint NULL,
  "amount" bigint NULL,
  "ppt" bigint NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "marketplace_listing" table
CREATE TABLE "public"."marketplace_listing" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "transaction_id" bigint NULL,
  "seller_address" text NULL,
  "total" bigint NULL,
  "deposit_total" bigint NULL,
  "deposit_timeout" bigint NULL,
  "depositor_address" text NULL,
  "depositor_timedout_block" bigint NULL,
  "is_deposited" boolean NULL,
  "is_filled" boolean NULL,
  "is_cancelled" boolean NULL,
  "date_updated" timestamptz NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "marketplace_listing_history" table
CREATE TABLE "public"."marketplace_listing_history" (
  "id" bigserial NOT NULL,
  "listing_id" bigint NULL,
  "transaction_id" bigint NULL,
  "sender_address" text NULL,
  "action" text NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "status" table
CREATE TABLE "public"."status" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "last_known_height" bigint NULL,
  "last_processed_height" bigint NULL,
  "base_token" text NULL,
  "base_token_usd" numeric NULL,
  "date_updated" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "token" table
CREATE TABLE "public"."token" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "height" bigint NULL,
  "version" text NULL,
  "transaction_id" bigint NULL,
  "creator" text NULL,
  "current_owner" text NULL,
  "name" text NULL,
  "ticker" text NULL,
  "decimals" bigint NULL,
  "max_supply" bigint NULL,
  "per_mint_limit" bigint NULL,
  "launch_timestamp" bigint NULL,
  "mint_page" text NULL,
  "metadata" jsonb NULL,
  "content_path" text NULL,
  "content_size_bytes" bigint NULL,
  "circulating_supply" bigint NULL,
  "last_price_base" bigint NULL,
  "volume_24_base" bigint NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "token_address_history" table
CREATE TABLE "public"."token_address_history" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "height" bigint NULL,
  "transaction_id" bigint NULL,
  "token_id" bigint NULL,
  "sender" text NULL,
  "receiver" text NULL,
  "action" text NULL,
  "amount" bigint NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "token_holder" table
CREATE TABLE "public"."token_holder" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "token_id" bigint NULL,
  "address" text NULL,
  "amount" bigint NULL,
  "date_updated" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "token_open_position" table
CREATE TABLE "public"."token_open_position" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "transaction_id" bigint NULL,
  "token_id" bigint NULL,
  "seller_address" text NULL,
  "amount" bigint NULL,
  "ppt" bigint NULL,
  "total" bigint NULL,
  "is_filled" boolean NULL,
  "is_cancelled" boolean NULL,
  "date_filled" timestamptz NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "token_trade_history" table
CREATE TABLE "public"."token_trade_history" (
  "id" bigserial NOT NULL,
  "chain_id" text NULL,
  "transaction_id" bigint NULL,
  "token_id" bigint NULL,
  "seller_address" text NULL,
  "buyer_address" text NULL,
  "amount_quote" bigint NULL,
  "amount_base" bigint NULL,
  "rate" bigint NULL,
  "total_usd" numeric NULL,
  "date_created" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create "transaction" table
CREATE TABLE "public"."transaction" (
  "id" bigserial NOT NULL,
  "height" bigint NULL,
  "hash" text NULL,
  "content" text NULL,
  "gas_used" bigint NULL,
  "fees" text NULL,
  "content_length" bigint NULL,
  "date_created" timestamptz NULL,
  "status_message" text NULL,
  PRIMARY KEY ("id")
);
