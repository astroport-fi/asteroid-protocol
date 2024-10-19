-- Create extensions

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- public.status definition

-- Drop table

-- DROP TABLE public.status;

CREATE TABLE public.status (
    id serial4 NOT NULL,
    chain_id varchar(100) NOT NULL,
    last_processed_height int4 NOT NULL,
    base_token varchar(12) NOT NULL,
    base_token_usd float4 NOT NULL,
    date_updated timestamp NOT NULL,
    last_known_height int4 NULL DEFAULT 0,
    CONSTRAINT status_pkey PRIMARY KEY (id)
);


-- public."transaction" definition

-- Drop table

-- DROP TABLE public."transaction";

CREATE TABLE public."transaction" (
    id serial4 NOT NULL,
    height int4 NOT NULL,
    hash varchar(100) NOT NULL,
    "content" text NOT NULL,
    gas_used int4 NOT NULL,
    fees varchar(100) NOT NULL,
    content_length int4 NOT NULL,
    status_message varchar(255) NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT transaction_hash_key UNIQUE (hash),
    CONSTRAINT transaction_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tx_hash ON public.transaction USING btree (hash);

-- public."collection" definition

-- Drop table

-- DROP TABLE public."collection";

CREATE TABLE public."collection" (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    "version" varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    content_hash varchar(128) NOT NULL,
    creator varchar(128) NOT NULL,
    minter varchar(128) NULL,
    "name" varchar(32) NOT NULL,
    symbol varchar(10) NOT NULL,
    royalty_percentage decimal(5, 4) NULL,
    payment_address varchar(128) NULL,
    metadata jsonb NOT NULL,
    content_path varchar(255) NULL DEFAULT NULL::character varying,
    content_size_bytes int4 NULL,
    is_explicit bool NULL DEFAULT false,
    date_created timestamp NOT NULL,
    CONSTRAINT collection_pkey PRIMARY KEY (id),
    CONSTRAINT collection_content_hash_key UNIQUE (content_hash),
    CONSTRAINT collection_symbol_key UNIQUE (symbol),
    CONSTRAINT collection_name_key UNIQUE ("name"),
    CONSTRAINT collection_tx_id UNIQUE (transaction_id),
    CONSTRAINT collection_transaction_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_collection_creator" ON "public"."collection" USING btree ("creator");
CREATE INDEX "idx_collection_name" ON "public"."collection" USING btree ("name");
CREATE INDEX "idx_collection_symbol" ON "public"."collection" USING btree ("symbol");
CREATE INDEX "idx_collection_transaction_id" ON "public"."collection" USING btree ("transaction_id");
CREATE INDEX idx_trgm_collection_name ON "public"."collection" USING gin (("name") gin_trgm_ops);

-- public.collection_stats definition

-- Drop table

-- DROP TABLE public.collection_stats;

CREATE TABLE "public"."collection_stats" (
    id int4 NOT NULL,
    "listed" bigint NOT NULL,
    "supply" bigint NOT NULL,
    "owners" bigint NOT NULL,
    "volume" numeric NOT NULL,
    "volume_24h" numeric NOT NULL,
    "volume_7d" numeric NOT NULL,
    "floor_price" bigint NOT NULL,
    "floor_price_1d_change" decimal(5,4),
    "floor_price_1w_change" decimal(5,4),
    CONSTRAINT collection_stats_id UNIQUE ("id"),
    CONSTRAINT collection_stats_id_fk FOREIGN KEY ("id") REFERENCES public."collection"(id)
);

CREATE INDEX "idx_collection_stats_id" ON "public"."collection_stats" USING btree ("id");

-- public.collection_traits definition

-- Drop table

-- DROP TABLE public.collection_traits;

CREATE TABLE "public"."collection_traits" (
    "collection_id" int4 NOT NULL,
    "trait_type" jsonb NOT NULL,
    "trait_value" jsonb NOT NULL,
    "count" bigint NOT NULL,
    "rarity_score" numeric NOT NULL,
    CONSTRAINT collection_traits_id_fk FOREIGN KEY (collection_id) REFERENCES public."collection"(id),
    CONSTRAINT "collection_traits_type_value" UNIQUE ("collection_id", "trait_type", "trait_value")
);

CREATE INDEX "idx_collection_traits_collection_id" ON "public"."collection_traits" USING btree ("collection_id");

-- public.inscription definition

-- Drop table

-- DROP TABLE public.inscription;

CREATE TABLE public.inscription (
    id serial4 NOT NULL,
    inscription_number int4 NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    "version" varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    collection_id int4 NULL,
    token_id int4 NULL,
    content_hash varchar(128) NOT NULL,
    creator varchar(255) NOT NULL,
    current_owner varchar(128) NOT NULL,
    "type" varchar(128) NOT NULL,
    metadata jsonb NOT NULL,
    content_path varchar(255) NOT NULL,
    content_size_bytes int4 NOT NULL,
    date_created timestamp NOT NULL,
    is_explicit bool NULL DEFAULT false,
    CONSTRAINT inscription_content_hash_key UNIQUE (content_hash),
    CONSTRAINT inscription_pkey PRIMARY KEY (id),
    CONSTRAINT inscription_tx_id UNIQUE (transaction_id),
    CONSTRAINT inscription_number UNIQUE (inscription_number),
    CONSTRAINT inscription_collection_token_id UNIQUE ("collection_id", "token_id"),
    CONSTRAINT inscription_transaction_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id),
    CONSTRAINT inscription_collection_fk FOREIGN KEY (collection_id) REFERENCES public."collection"(id)
);
CREATE INDEX idx_inscriptions_owner_date ON public.inscription USING btree (date_created);
CREATE INDEX "idx_inscription_current_owner" ON "public"."inscription" USING btree ("current_owner");
CREATE INDEX idx_trgm_inscription_metadata_name ON inscription USING gin ((metadata -> 'metadata' ->>'name') gin_trgm_ops);
CREATE INDEX "idx_inscription_collection_id" ON "public"."inscription" USING btree ("collection_id");
CREATE INDEX "idx_inscription_creator" ON "public"."inscription" USING btree ("creator");
CREATE INDEX "idx_inscription_number" ON "public"."inscription" USING btree ("inscription_number");

-- public.inscription_rarity definition

-- Drop table

-- DROP TABLE public.inscription_rarity;

CREATE TABLE "public"."inscription_rarity" (
    "id" int4 NOT NULL,
    "rarity_score" numeric NOT NULL,
    "rarity_rank" int4 NOT NULL,
    CONSTRAINT inscription_rarity_id UNIQUE ("id"),
    CONSTRAINT inscription_rarity_id_fk FOREIGN KEY ("id") REFERENCES public."inscription"(id)
);

CREATE INDEX "idx_inscription_rarity_id" ON "public"."inscription_rarity" USING btree ("id");

-- public.inscription_history definition

-- Drop table

-- DROP TABLE public.inscription_history;

CREATE TABLE public.inscription_history (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    transaction_id int4 NOT NULL,
    inscription_id int4 NOT NULL,
    sender varchar(128) NOT NULL,
    receiver varchar(128) NULL,
    "action" varchar(32) NOT NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT inscription_history_pkey PRIMARY KEY (id),
    CONSTRAINT inscription_id_fk FOREIGN KEY (inscription_id) REFERENCES public.inscription(id),
    CONSTRAINT transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);


-- public.marketplace_listing definition

-- Drop table

-- DROP TABLE public.marketplace_listing;

CREATE TABLE public.marketplace_listing (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    seller_address varchar(128) NOT NULL,
    total int8 NOT NULL,
    deposit_total int8 NOT NULL,
    deposit_timeout int4 NOT NULL,
    depositor_address varchar(128) NULL,
    depositor_timedout_block int4 NULL,
    is_deposited bool NOT NULL DEFAULT false,
    is_filled bool NOT NULL DEFAULT false,
    is_cancelled bool NOT NULL DEFAULT false,
    date_updated timestamp NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT marketplace_listing_pkey PRIMARY KEY (id),
    CONSTRAINT marketplace_listing_tx_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_marketplace_listing_depositor_address" ON "public"."marketplace_listing" USING btree ("depositor_address");
CREATE INDEX "idx_marketplace_listing_depositor_timedout_block" ON "public"."marketplace_listing" USING btree ("depositor_timedout_block");
CREATE INDEX "idx_marketplace_listing_seller_address" ON "public"."marketplace_listing" USING btree ("seller_address");


-- public.marketplace_listing_history definition

-- Drop table

-- DROP TABLE public.marketplace_listing_history;

CREATE TABLE public.marketplace_listing_history (
    id serial4 NOT NULL,
    listing_id int4 NOT NULL,
    transaction_id int4 NOT NULL,
    sender_address varchar(128) NOT NULL,
    "action" varchar(64) NOT NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT marketplace_listing_history_pkey PRIMARY KEY (id),
    CONSTRAINT marketplace_listing_history_ls_fk FOREIGN KEY (listing_id) REFERENCES public.marketplace_listing(id),
    CONSTRAINT marketplace_listing_history_tx_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);


-- public."token" definition

-- Drop table

-- DROP TABLE public."token";

CREATE TABLE public."token" (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    "version" varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    creator varchar(128) NOT NULL,
    current_owner varchar(128) NOT NULL,
    "name" varchar(32) NOT NULL,
    ticker varchar(10) NOT NULL,
    decimals int2 NOT NULL,
    max_supply numeric NOT NULL,
    per_mint_limit int8 NOT NULL,
    pre_mint numeric NULL,
    launch_timestamp int8 NOT NULL,
    mint_page varchar(128) NOT NULL DEFAULT 'default'::character varying,
    metadata text NULL,
    content_path varchar(255) NULL DEFAULT NULL::character varying,
    content_size_bytes int4 NULL,
    circulating_supply int8 NOT NULL DEFAULT 0,
    last_price_base int8 NOT NULL DEFAULT 0,
    volume_24_base int8 NOT NULL DEFAULT 0,
    date_created timestamp NOT NULL,
    is_explicit bool NULL DEFAULT false,
    CONSTRAINT token_pkey PRIMARY KEY (id),
    CONSTRAINT token_ticker_key UNIQUE (ticker),
    CONSTRAINT token_tx_id UNIQUE (transaction_id),
    CONSTRAINT token_transaction_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_token_current_owner" ON "public"."token" USING btree ("current_owner");
CREATE INDEX idx_trgm_token_name ON "public"."token" USING gin (("name") gin_trgm_ops);
CREATE INDEX idx_trgm_token_ticker ON "public"."token" USING gin (("ticker") gin_trgm_ops);


-- public.token_address_history definition

-- Drop table

-- DROP TABLE public.token_address_history;

CREATE TABLE public.token_address_history (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    transaction_id int4 NOT NULL,
    token_id int4 NOT NULL,
    sender varchar(128) NOT NULL,
    "action" varchar(32) NOT NULL,
    amount int8 NOT NULL,
    receiver varchar(128) NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT token_address_history_pkey PRIMARY KEY (id),
    CONSTRAINT token_id_fk FOREIGN KEY (token_id) REFERENCES public."token"(id),
    CONSTRAINT token_tx_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_token_address_history_receiver" ON "public"."token_address_history" USING btree ("receiver");
CREATE INDEX "idx_token_address_history_sender" ON "public"."token_address_history" USING btree ("sender");


-- public.token_holder definition

-- Drop table

-- DROP TABLE public.token_holder;

CREATE TABLE public.token_holder (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    token_id int4 NOT NULL,
    address varchar(128) NOT NULL,
    amount int8 NOT NULL,
    date_updated timestamp NOT NULL,
    CONSTRAINT token_holder_pkey PRIMARY KEY (id),
    CONSTRAINT token_id_fk FOREIGN KEY (token_id) REFERENCES public."token"(id)
);
CREATE INDEX token_holder_ticker_idx ON public.token_holder USING btree (token_id);
CREATE INDEX "idx_token_holder_address" ON "public"."token_holder" USING btree ("address");


-- public.token_open_position definition

-- Drop table

-- DROP TABLE public.token_open_position;

CREATE TABLE public.token_open_position (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    token_id int4 NOT NULL,
    seller_address varchar(128) NOT NULL,
    amount int8 NOT NULL,
    ppt int8 NOT NULL,
    total int8 NOT NULL,
    is_filled bool NOT NULL DEFAULT false,
    is_cancelled bool NOT NULL DEFAULT false,
    date_filled timestamp NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT token_open_position_pkey PRIMARY KEY (id),
    CONSTRAINT token_id_fk FOREIGN KEY (token_id) REFERENCES public."token"(id),
    CONSTRAINT transactionid_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);


-- public.token_trade_history definition

-- Drop table

-- DROP TABLE public.token_trade_history;

CREATE TABLE public.token_trade_history (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    token_id int4 NOT NULL,
    seller_address varchar(128) NOT NULL,
    buyer_address varchar(128) NULL,
    amount_base int8 NOT NULL,
    amount_quote int8 NOT NULL,
    rate int4 NOT NULL DEFAULT 0,
    total_usd float4 NOT NULL DEFAULT 0,
    date_created timestamp NOT NULL,
    CONSTRAINT tth_key PRIMARY KEY (id),
    CONSTRAINT token_id_fk FOREIGN KEY (token_id) REFERENCES public."token"(id),
    CONSTRAINT transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_token_trade_history_seller_address" ON "public"."token_trade_history" USING btree ("seller_address");
CREATE INDEX "idx_token_trade_history_buyer_address" ON "public"."token_trade_history" USING btree ("buyer_address");

-- public.marketplace_inscription_detail definition

-- Drop table

-- DROP TABLE public.marketplace_inscription_detail;

CREATE TABLE public.marketplace_inscription_detail (
    id serial4 NOT NULL,
    listing_id int4 NOT NULL,
    inscription_id int4 NOT NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT marketplace_inscription_detail_pkey PRIMARY KEY (id),
    CONSTRAINT marketplace_inscription_detail_ls_fk FOREIGN KEY (listing_id) REFERENCES public.marketplace_listing(id),
    CONSTRAINT marketplace_inscription_detail_ik_fk FOREIGN KEY (inscription_id) REFERENCES public."inscription"(id)
);

-- public.inscription_trade_history definition

-- Drop table

-- DROP TABLE public.inscription_trade_history;

CREATE TABLE public.inscription_trade_history (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    inscription_id int4 NOT NULL,
    seller_address varchar(128) NOT NULL,
    buyer_address varchar(128) NULL,
    amount_quote int8 NOT NULL,
    total_usd float4 NOT NULL DEFAULT 0,
    date_created timestamp NOT NULL,
    CONSTRAINT ith_key PRIMARY KEY (id),
    CONSTRAINT inscription_id_fk FOREIGN KEY (inscription_id) REFERENCES public."inscription"(id),
    CONSTRAINT transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_inscription_trade_history_seller_address" ON "public"."inscription_trade_history" USING btree ("seller_address");
CREATE INDEX "idx_inscription_trade_history_buyer_address" ON "public"."inscription_trade_history" USING btree ("buyer_address");


-- public.marketplace_cft20_detail definition

-- Drop table

-- DROP TABLE public.marketplace_cft20_detail;

CREATE TABLE public.marketplace_cft20_detail (
    id serial4 NOT NULL,
    listing_id int4 NOT NULL,
    token_id int4 NOT NULL,
    amount int8 NOT NULL,
    ppt int8 NOT NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT marketplace_cft20_detail_pkey PRIMARY KEY (id),
    CONSTRAINT marketplace_cft20_detail_ls_fk FOREIGN KEY (listing_id) REFERENCES public.marketplace_listing(id),
    CONSTRAINT marketplace_cft20_detail_tk_fk FOREIGN KEY (token_id) REFERENCES public."token"(id)
);


-- public.marketplace_cft20_trade_history definition

-- Drop table

-- DROP TABLE public.marketplace_cft20_trade_history;

CREATE TABLE public.marketplace_cft20_trade_history (
    id serial4 NOT NULL,
    transaction_id int4 NOT NULL,
    token_id int4 NOT NULL,
    listing_id int4 NOT NULL,
    seller_address varchar(128) NOT NULL,
    buyer_address varchar(128) NULL,
    amount_quote int8 NOT NULL,
    amount_base int8 NOT NULL,
    rate int4 NOT NULL DEFAULT 0,
    total_usd float4 NOT NULL DEFAULT 0,
    date_created timestamp NOT NULL,
    CONSTRAINT mtth_key PRIMARY KEY (id),
    CONSTRAINT mtth_tx_id UNIQUE (transaction_id),
    CONSTRAINT marketplace_cft20_history_ls_fk FOREIGN KEY (listing_id) REFERENCES public.marketplace_listing(id),
    CONSTRAINT marketplace_cft20_history_tk_fk FOREIGN KEY (token_id) REFERENCES public."token"(id),
    CONSTRAINT marketplace_cft20_history_tx_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE TABLE public.migration_permission_grant (
    id serial NOT NULL,
    inscription_id int4 NOT NULL,
    granter varchar(128) NOT NULL,
    grantee varchar(128) NOT NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT migration_permission_grant_pkey PRIMARY KEY (id),
    CONSTRAINT inscription_id_fk FOREIGN KEY (inscription_id) REFERENCES public."inscription"(id)
);

CREATE INDEX "idx_migration_permission_grant_inscription_id" ON "public"."migration_permission_grant" USING btree ("inscription_id");

-- public.bridge_history definition

-- Drop table

-- DROP TABLE public.bridge_history;

CREATE TABLE public.bridge_history (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    transaction_id int4 NOT NULL,
    token_id int4 NOT NULL,
    sender varchar(128) NOT NULL,
    "action" varchar(32) NOT NULL,
    amount int8 NOT NULL,
    remote_chain_id varchar(32) NOT NULL,
    remote_contract varchar(128) NOT NULL,
    receiver varchar(128) NOT NULL,
    "signature" varchar(256) NOT NULL,
    date_created timestamp NOT NULL,
    CONSTRAINT bridge_history_pkey PRIMARY KEY (id),
    CONSTRAINT bridge_history_tk_id_fk FOREIGN KEY (token_id) REFERENCES public."token"(id),
    CONSTRAINT bridge_history_tx_id_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);

CREATE INDEX "idx_bridge_history_transaction_id" ON "public"."bridge_history" USING btree ("transaction_id");
CREATE INDEX "idx_bridge_history_token_id" ON "public"."bridge_history" USING btree ("token_id");


-- public.bridge_remote_chain definition

-- Drop Table

-- Drop Table public.bridge_remote_chain;

CREATE TABLE public.bridge_remote_chain (
    id serial4 NOT NULL, 
    chain_id varchar(32) NOT NULL, 
    remote_chain_id varchar(32) NOT NULL, 
    remote_contract varchar(128) NOT NULL, 
    ibc_channel varchar(32) NOT NULL, 
    date_created timestamp NOT NULL, 
    date_modified timestamp NOT NULL, 
    CONSTRAINT bridge_remote_chain_id PRIMARY KEY (id)
);


-- public.bridge_token definition

-- Drop Table

-- DROP TABLE public.bridge_token;

CREATE TABLE public.bridge_token (
    id serial4 NOT NULL,
    remote_chain_id int4 NOT NULL,
    token_id int4 NOT NULL,
    "enabled" boolean NOT NULL,
    "signature" varchar(256) NOT NULL,
    date_created timestamp NOT NULL,
    date_modified timestamp NOT NULL, 
    CONSTRAINT bridge_token_id PRIMARY KEY ("id"),
    CONSTRAINT bridge_token_remote_chain_id_fkey FOREIGN KEY (remote_chain_id) REFERENCES public.bridge_remote_chain (id),
    CONSTRAINT bridge_token_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.token (id),
    CONSTRAINT "bridge_token_remote_chain_id_token_id" UNIQUE ("remote_chain_id", "token_id")
);

CREATE INDEX "idx_bridge_token_token_id" ON "public"."bridge_token" USING btree ("token_id");

-- public."launchpad" definition

-- Drop table

-- DROP TABLE public."launchpad";

CREATE TABLE public."launchpad" (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    "version" varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    collection_id int4 NOT NULL,
    max_supply numeric NOT NULL,
    minted_supply numeric NOT NULL DEFAULT 0,
    "start_date" timestamp NULL DEFAULT NULL,
    finish_date timestamp NULL DEFAULT NULL,
    reveal_date timestamp NULL DEFAULT NULL,
    reveal_immediately bool NOT NULL DEFAULT true,
    date_created timestamp NOT NULL,
    CONSTRAINT launchpad_pkey PRIMARY KEY (id),
    CONSTRAINT launchpad_tx_id UNIQUE (transaction_id),
    CONSTRAINT launchpad_transaction_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id),
    CONSTRAINT launchpad_collection_fk FOREIGN KEY (collection_id) REFERENCES public."collection"(id)
);

CREATE INDEX "idx_launchpad_transaction_id" ON "public"."launchpad" USING btree ("transaction_id");
CREATE INDEX "idx_launchpad_collection_id" ON "public"."launchpad" USING btree ("collection_id");

-- public."launchpad_stage" definition

-- Drop table

-- DROP TABLE public."launchpad_stage";

CREATE TYPE price_curve AS ENUM ('fixed', 'linear');

CREATE TABLE public."launchpad_stage" (
    id serial4 NOT NULL,
    collection_id int4 NOT NULL,
    launchpad_id int4 NOT NULL,
    "name" varchar(32) NULL DEFAULT NULL,
    description text NULL DEFAULT NULL,
    "start_date" timestamp NULL DEFAULT NULL,
    finish_date timestamp NULL DEFAULT NULL,
    price int8 NOT NULL,
    price_curve price_curve NOT NULL default 'fixed',
    per_user_limit int8 NOT NULL,
    has_whitelist bool NOT NULL default false,
    CONSTRAINT launchpad_stage_pkey PRIMARY KEY (id),
    CONSTRAINT launchpad_stage_collection_fk FOREIGN KEY (collection_id) REFERENCES public."collection"(id),
    CONSTRAINT launchpad_stage_launchpad_fk FOREIGN KEY (launchpad_id) REFERENCES public."launchpad"(id)
);

CREATE INDEX "idx_launchpad_stage_collection_id" ON "public"."launchpad_stage" USING btree ("collection_id");
CREATE INDEX "idx_launchpad_stage_launchpad_id" ON "public"."launchpad_stage" USING btree ("launchpad_id");

-- public."launchpad_whitelist" definition

-- Drop table

-- DROP TABLE public."launchpad_whitelist";

CREATE TABLE public."launchpad_whitelist" (
    id serial4 NOT NULL,
    collection_id int4 NOT NULL,
    launchpad_id int4 NOT NULL,
    stage_id int4 NOT NULL,
    "address" varchar(128) NOT NULL,
    CONSTRAINT launchpad_whitelist_pkey PRIMARY KEY (id),
    CONSTRAINT launchpad_whitelist_collection_fk FOREIGN KEY (collection_id) REFERENCES public."collection"(id),
    CONSTRAINT launchpad_whitelist_launchpad_fk FOREIGN KEY (launchpad_id) REFERENCES public."launchpad"(id),
    CONSTRAINT launchpad_whitelist_stage_fk FOREIGN KEY (stage_id) REFERENCES public."launchpad_stage"(id)
);

CREATE INDEX "idx_launchpad_whitelist_collection_id" ON "public"."launchpad_whitelist" USING btree ("collection_id");
CREATE INDEX "idx_launchpad_whitelist_launchpad_id" ON "public"."launchpad_whitelist" USING btree ("launchpad_id");
CREATE INDEX "idx_launchpad_whitelist_stage_id" ON "public"."launchpad_whitelist" USING btree ("stage_id");
CREATE INDEX "idx_launchpad_whitelist_address" ON "public"."launchpad_whitelist" USING btree ("address");

-- public."launchpad_mint_reservation" definition

-- Drop table

-- DROP TABLE public."launchpad_mint_reservation";

CREATE TABLE public."launchpad_mint_reservation" (
    id serial4 NOT NULL,
    collection_id int4 NOT NULL,
    launchpad_id int4 NOT NULL,
    stage_id int4 NOT NULL,
    "address" varchar(128) NOT NULL,
    metadata jsonb NULL,
    token_id int4 NOT NULL,
    is_random bool NULL DEFAULT true,
    is_minted bool NULL DEFAULT false,
    is_expired bool NULL DEFAULT false,
    date_created timestamp NOT NULL,
    CONSTRAINT launchpad_mint_reservation_pkey PRIMARY KEY (id),
    CONSTRAINT launchpad_mint_reservation_collection_fk FOREIGN KEY (collection_id) REFERENCES public."collection"(id),
    CONSTRAINT launchpad_mint_reservation_launchpad_fk FOREIGN KEY (launchpad_id) REFERENCES public."launchpad"(id),
    CONSTRAINT launchpad_mint_reservation_stage_fk FOREIGN KEY (stage_id) REFERENCES public."launchpad_stage"(id),
    CONSTRAINT launchpad_mint_reservation_token_id UNIQUE ("collection_id", "token_id")
);

CREATE INDEX "idx_launchpad_mint_reservation_collection_id" ON "public"."launchpad_mint_reservation" USING btree ("collection_id");
CREATE INDEX "idx_launchpad_mint_reservation_launchpad_id" ON "public"."launchpad_mint_reservation" USING btree ("launchpad_id");
CREATE INDEX "idx_launchpad_mint_reservation_stage_id" ON "public"."launchpad_mint_reservation" USING btree ("stage_id");
CREATE INDEX "idx_launchpad_mint_reservation_token_id" ON "public"."launchpad_mint_reservation" USING btree ("token_id");

-- public."troll_post" definition

-- Drop table

-- DROP TABLE public."troll_post";

CREATE TABLE public."troll_post" (
    id int4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    "version" varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    launchpad_id int4 NULL DEFAULT NULL,
    content_hash varchar(128) NOT NULL,
    creator varchar(128) NOT NULL,
    "text" text NOT NULL,
    content_path varchar(255) NULL DEFAULT NULL::character varying,
    content_size_bytes int4 NULL,
    is_explicit bool NULL DEFAULT false,
    date_created timestamp NOT NULL,
    CONSTRAINT troll_post_pkey PRIMARY KEY (id),
    CONSTRAINT troll_post_content_hash_key UNIQUE (content_hash),
    CONSTRAINT troll_post_tx_id UNIQUE (transaction_id),
    CONSTRAINT troll_post_transaction_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id),
    CONSTRAINT troll_post_launchpad_fk FOREIGN KEY (launchpad_id) REFERENCES public."launchpad"(id)
);

CREATE INDEX "idx_troll_post_creator" ON "public"."troll_post" USING btree ("creator");
CREATE INDEX "idx_troll_post_transaction_id" ON "public"."troll_post" USING btree ("transaction_id");
CREATE INDEX "idx_troll_post_launchpad_id" ON "public"."troll_post" USING btree ("launchpad_id");
CREATE INDEX idx_trgm_troll_post_text ON "public"."troll_post" USING gin (("text") gin_trgm_ops);

-- public.inscription_market view definition

CREATE OR REPLACE VIEW public.inscription_market AS 
    SELECT DISTINCT i.id, ml.id AS listing_id
    FROM inscription i
        LEFT JOIN marketplace_inscription_detail mid ON i.id = mid.inscription_id
        LEFT JOIN marketplace_listing ml ON mid.listing_id = ml.id AND (ml.is_cancelled IS FALSE AND ml.is_filled IS FALSE)
    WHERE ml.id IS NULL OR (ml.is_cancelled IS FALSE AND ml.is_filled IS FALSE);

-- public.trade_history view definition

CREATE OR REPLACE VIEW public.trade_history AS
    SELECT
        id,
        seller_address,
        buyer_address,
        total_usd,
        date_created,
        inscription_id,
        NULL AS token_id,
        amount_quote,
        1 AS amount_base
    FROM
        inscription_trade_history
    UNION ALL
    SELECT
        id,
        seller_address,
        buyer_address,
        total_usd,
        date_created,
        NULL AS inscription_id,
        token_id,
        amount_quote,
        amount_base
    FROM
        token_trade_history;

-- public.collection_traits_view view definition

CREATE OR REPLACE VIEW public.collection_traits_view AS 
SELECT r.collection_id,
    (obj.value -> 'trait_type'::text) AS trait_type,
    (obj.value -> 'value'::text) AS trait_value,
    count(*) AS count,
    (1::decimal / count(*)::decimal / (SELECT count(id) FROM inscription WHERE collection_id = r.collection_id)::decimal) as rarity_score
FROM inscription r,
    LATERAL jsonb_array_elements(((r.metadata -> 'metadata'::text) -> 'attributes'::text)) obj(value)
    WHERE (r.collection_id IS NOT NULL)
    GROUP BY 
        r.collection_id,
        (obj.value -> 'trait_type'::text),
        (obj.value -> 'value'::text);

-- public.inscription_traits view definition

CREATE OR REPLACE VIEW "public"."inscription_traits" AS
SELECT
    r.id,
    r.collection_id,
    (obj.value -> 'trait_type' :: text) AS trait_type,
    (obj.value -> 'value' :: text) AS trait_value 
FROM 
    inscription r,
    LATERAL jsonb_array_elements(((r.metadata -> 'metadata'::text) -> 'attributes'::text)) obj(value);

-- public.collection_floor_weekly view definition

CREATE OR REPLACE VIEW "public"."collection_floor_weekly" AS
WITH collection_floor_price AS (
    SELECT 
        date_trunc('WEEK', mid.date_created)::date - (date_part('dow', NOW())::int) as date, 
        i.collection_id,
        COALESCE(MIN(ml.total), 0) AS floor_price,
        LEAD(COALESCE(MIN(ml.total), 0)) OVER () AS prev_floor_price
    FROM marketplace_inscription_detail mid
    INNER JOIN marketplace_listing ml ON ml.id = mid.listing_id
    INNER JOIN inscription i ON i.id = mid.inscription_id
    WHERE i.collection_id is not null
    GROUP BY i.collection_id, 1
    ORDER BY i.collection_id, 1 desc
)
SELECT *, ((floor_price - prev_floor_price)::decimal / prev_floor_price::decimal)::decimal(5,4) as change from collection_floor_price;

-- public.collection_floor_daily view definition

CREATE OR REPLACE VIEW "public"."collection_floor_daily" AS
WITH collection_floor_price AS (
    SELECT 
        date_trunc('day', mid.date_created) as date,
        i.collection_id,
        COALESCE(MIN(ml.total), 0) AS floor_price,
        LEAD(COALESCE(MIN(ml.total), 0)) OVER () AS prev_floor_price
    FROM marketplace_inscription_detail mid
    INNER JOIN marketplace_listing ml ON ml.id = mid.listing_id
    INNER JOIN inscription i ON i.id = mid.inscription_id
    WHERE i.collection_id is not null
    GROUP BY i.collection_id, 1
    ORDER BY i.collection_id, 1 desc
)
SELECT *, ((floor_price - prev_floor_price)::decimal / prev_floor_price::decimal)::decimal(5,4) as change from collection_floor_price;

-- public.inscription_rarity_view view definition

CREATE OR REPLACE VIEW "public"."inscription_rarity_view" AS
SELECT 
    it.id,
    SUM(ct.rarity_score) AS rarity_score,
    row_number() over (partition by it.collection_id ORDER BY SUM(ct.rarity_score) DESC, it.id) as rarity_rank
FROM inscription_traits it
INNER JOIN collection_traits ct ON it.collection_id = ct.collection_id AND it.trait_type = ct.trait_type AND it.trait_value = ct.trait_value
GROUP BY it.id, it.collection_id;

-- inscription number initial value

UPDATE inscription
SET inscription_number = s.row_number
FROM (select i.id, row_number() over () from inscription i order by i.id asc) AS s
WHERE inscription.id = s.id;

-- fill collection traits table

INSERT INTO collection_traits (collection_id, trait_type, trait_value, count, rarity_score)
SELECT collection_id, trait_type, trait_value, count, rarity_score FROM collection_traits_view ctv
ON CONFLICT (collection_id, trait_type, trait_value) DO UPDATE SET rarity_score = EXCLUDED.rarity_score, count = EXCLUDED.count;


-- fill inscription rarity table

INSERT INTO inscription_rarity (id, rarity_score, rarity_rank)
SELECT id, rarity_score, rarity_rank
FROM inscription_rarity_view
ON CONFLICT (id) DO UPDATE SET rarity_score = EXCLUDED.rarity_score, rarity_rank = EXCLUDED.rarity_rank;

-- public.empty_collections view definition

CREATE OR REPLACE VIEW public.empty_collections AS 
SELECT c.id
FROM collection c
LEFT JOIN collection_stats cs ON c.id = cs.id
LEFT JOIN launchpad l ON c.id = l.collection_id
WHERE cs.id IS NULL AND l.collection_id IS NULL;

-- public.minted_out_launches view definition

CREATE OR REPLACE VIEW public.minted_out_launches AS 
SELECT * FROM launchpad WHERE minted_supply = max_supply OR finish_date < NOW();

------------------ RIVER ---------------------

-- River migration 002 [up]
CREATE TYPE river_job_state AS ENUM(
  'available',
  'cancelled',
  'completed',
  'discarded',
  'retryable',
  'running',
  'scheduled'
);

CREATE TABLE river_job(
  -- 8 bytes
  id bigserial PRIMARY KEY,

  -- 8 bytes (4 bytes + 2 bytes + 2 bytes)
  --
  -- `state` is kept near the top of the table for operator convenience -- when
  -- looking at jobs with `SELECT *` it'll appear first after ID. The other two
  -- fields aren't as important but are kept adjacent to `state` for alignment
  -- to get an 8-byte block.
  state river_job_state NOT NULL DEFAULT 'available' ::river_job_state,
  attempt smallint NOT NULL DEFAULT 0,
  max_attempts smallint NOT NULL,

  -- 8 bytes each (no alignment needed)
  attempted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  finalized_at timestamptz,
  scheduled_at timestamptz NOT NULL DEFAULT NOW(),

  -- 2 bytes (some wasted padding probably)
  priority smallint NOT NULL DEFAULT 1,

  -- types stored out-of-band
  args jsonb,
  attempted_by text[],
  errors jsonb[],
  kind text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}' ::jsonb,
  queue text NOT NULL DEFAULT 'default' ::text,
  tags varchar(255)[],

  CONSTRAINT finalized_or_finalized_at_null CHECK ((state IN ('cancelled', 'completed', 'discarded') AND finalized_at IS NOT NULL) OR finalized_at IS NULL),
  CONSTRAINT max_attempts_is_positive CHECK (max_attempts > 0),
  CONSTRAINT priority_in_range CHECK (priority >= 1 AND priority <= 4),
  CONSTRAINT queue_length CHECK (char_length(queue) > 0 AND char_length(queue) < 128),
  CONSTRAINT kind_length CHECK (char_length(kind) > 0 AND char_length(kind) < 128)
);

-- We may want to consider adding another property here after `kind` if it seems
-- like it'd be useful for something.
CREATE INDEX river_job_kind ON river_job USING btree(kind);

CREATE INDEX river_job_state_and_finalized_at_index ON river_job USING btree(state, finalized_at) WHERE finalized_at IS NOT NULL;

CREATE INDEX river_job_prioritized_fetching_index ON river_job USING btree(state, queue, priority, scheduled_at, id);

CREATE INDEX river_job_args_index ON river_job USING GIN(args);

CREATE INDEX river_job_metadata_index ON river_job USING GIN(metadata);

CREATE OR REPLACE FUNCTION river_job_notify()
  RETURNS TRIGGER
  AS $$
DECLARE
  payload json;
BEGIN
  IF NEW.state = 'available' THEN
    -- Notify will coalesce duplicate notificiations within a transaction, so
    -- keep these payloads generalized:
    payload = json_build_object('queue', NEW.queue);
    PERFORM
      pg_notify('river_insert', payload::text);
  END IF;
  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER river_notify
  AFTER INSERT ON river_job
  FOR EACH ROW
  EXECUTE PROCEDURE river_job_notify();

CREATE UNLOGGED TABLE river_leader(
  -- 8 bytes each (no alignment needed)
  elected_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,

  -- types stored out-of-band
  leader_id text NOT NULL,
  name text PRIMARY KEY,

  CONSTRAINT name_length CHECK (char_length(name) > 0 AND char_length(name) < 128),
  CONSTRAINT leader_id_length CHECK (char_length(leader_id) > 0 AND char_length(leader_id) < 128)
);

-- River migration 003 [up]
ALTER TABLE river_job ALTER COLUMN tags SET DEFAULT '{}';
UPDATE river_job SET tags = '{}' WHERE tags IS NULL;
ALTER TABLE river_job ALTER COLUMN tags SET NOT NULL;
