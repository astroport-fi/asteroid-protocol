-- Create "bridge_history" table
CREATE TABLE "public"."bridge_history" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "height" integer NOT NULL,
  "transaction_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "sender" character varying(128) NOT NULL,
  "action" character varying(32) NOT NULL,
  "amount" bigint NOT NULL,
  "remote_chain_id" character varying(32) NOT NULL,
  "remote_contract" character varying(128) NOT NULL,
  "receiver" character varying(128) NOT NULL,
  "signature" character varying(256) NOT NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "bridge_history_tk_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "bridge_history_tx_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_bridge_history_token_id" to table: "bridge_history"
CREATE INDEX "idx_bridge_history_token_id" ON "public"."bridge_history" ("token_id");
-- Create index "idx_bridge_history_transaction_id" to table: "bridge_history"
CREATE INDEX "idx_bridge_history_transaction_id" ON "public"."bridge_history" ("transaction_id");
-- Create "bridge_remote_chain" table
CREATE TABLE "public"."bridge_remote_chain" (
  "id" serial NOT NULL,
  "chain_id" character varying(32) NOT NULL,
  "remote_chain_id" character varying(32) NOT NULL,
  "remote_contract" character varying(128) NOT NULL,
  "ibc_channel" character varying(32) NOT NULL,
  "date_created" timestamp NOT NULL,
  "date_modified" timestamp NOT NULL,
  PRIMARY KEY ("id")
);
-- Create "bridge_token" table
CREATE TABLE "public"."bridge_token" (
  "id" serial NOT NULL,
  "remote_chain_id" integer NOT NULL,
  "token_id" integer NOT NULL,
  "enabled" boolean NOT NULL,
  "signature" character varying(256) NOT NULL,
  "date_created" timestamp NOT NULL,
  "date_modified" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "bridge_token_remote_chain_id_fkey" FOREIGN KEY ("remote_chain_id") REFERENCES "public"."bridge_remote_chain" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "bridge_token_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "public"."token" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "bridge_token_remote_chain_id_token_id" to table: "bridge_token"
CREATE UNIQUE INDEX "bridge_token_remote_chain_id_token_id" ON "public"."bridge_token" ("remote_chain_id", "token_id");
-- Create index "idx_bridge_token_token_id" to table: "bridge_token"
CREATE INDEX "idx_bridge_token_token_id" ON "public"."bridge_token" ("token_id");

-- public.empty_collections view definition

CREATE OR REPLACE VIEW public.empty_collections AS 
SELECT c.id
FROM collection c
LEFT JOIN collection_stats cs ON c.id = cs.id
LEFT JOIN launchpad l ON c.id = l.collection_id
WHERE cs.id IS NULL AND l.collection_id IS NULL