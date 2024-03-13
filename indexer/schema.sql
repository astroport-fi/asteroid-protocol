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


-- public.inscription definition

-- Drop table

-- DROP TABLE public.inscription;

CREATE TABLE public.inscription (
    id serial4 NOT NULL,
    chain_id varchar(32) NOT NULL,
    height int4 NOT NULL,
    "version" varchar(32) NOT NULL,
    transaction_id int4 NOT NULL,
    content_hash varchar(128) NOT NULL,
    creator varchar(255) NOT NULL,
    current_owner varchar(128) NOT NULL,
    "type" varchar(128) NOT NULL,
    metadata json NOT NULL,
    content_path varchar(255) NOT NULL,
    content_size_bytes int4 NOT NULL,
    date_created timestamp NOT NULL,
    is_explicit bool NULL DEFAULT false,
    CONSTRAINT inscription_content_hash_key UNIQUE (content_hash),
    CONSTRAINT inscription_pkey PRIMARY KEY (id),
    CONSTRAINT inscription_tx_id UNIQUE (transaction_id),
    CONSTRAINT inscription_transaction_fk FOREIGN KEY (transaction_id) REFERENCES public."transaction"(id)
);
CREATE INDEX idx_inscriptions_owner_date ON public.inscription USING btree (date_created);
CREATE INDEX "idx_inscription_current_owner" ON "public"."inscription" USING btree ("current_owner");
CREATE INDEX idx_trgm_inscription_metadata_name ON inscription USING gin ((metadata -> 'metadata' ->>'name') gin_trgm_ops);

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
    CONSTRAINT inscription_history_un UNIQUE (transaction_id),
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
    CONSTRAINT tth_tx_id UNIQUE (transaction_id),
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
    CONSTRAINT ith_tx_id UNIQUE (transaction_id),
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