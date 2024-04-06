-- DROP collection traits view
DROP VIEW collection_traits;

-- Create "collection_stats" table
CREATE TABLE "public"."collection_stats" (
  "id" integer NOT NULL,
  "listed" bigint NOT NULL,
  "supply" bigint NOT NULL,
  "owners" bigint NOT NULL,
  "volume" numeric NOT NULL,
  "volume_24h" numeric NOT NULL,
  "volume_7d" numeric NOT NULL,
  "floor_price" bigint NOT NULL,
  "floor_price_1d_change" decimal(5,4),
  "floor_price_1w_change" decimal(5,4),
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

-- fill collection stats table

INSERT INTO collection_stats(id, listed, floor_price, floor_price_1d_change, floor_price_1w_change, owners, supply, volume, volume_24h, volume_7d)
		SELECT 
			i.collection_id,
			COUNT(mid.id) as listed, 
			COALESCE(MIN(ml.total), 0) as floor_price,
			(SELECT change FROM collection_floor_daily WHERE collection_id = i.collection_id LIMIT 1) as floor_price_1d_change,
			(SELECT change FROM collection_floor_weekly WHERE collection_id = i.collection_id LIMIT 1) as floor_price_1w_change,
			(SELECT COUNT(DISTINCT current_owner) as owners FROM inscription WHERE collection_id = i.collection_id),
			(SELECT COUNT(id) as supply FROM inscription WHERE collection_id = i.collection_id),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume FROM inscription_trade_history ith INNER JOIN inscription r ON r.id = ith.inscription_id WHERE collection_id = i.collection_id),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume_24h FROM inscription_trade_history ith INNER JOIN inscription r ON r.id = ith.inscription_id WHERE collection_id = i.collection_id and NOW() - ith.date_created <= interval '24 HOURS'),
			(SELECT COALESCE(SUM(amount_quote), 0) as volume_7d FROM inscription_trade_history ith INNER JOIN inscription r ON r.id = ith.inscription_id WHERE collection_id = i.collection_id and NOW() - ith.date_created <= interval '7 DAYS')
		FROM inscription i
		LEFT JOIN marketplace_inscription_detail mid ON i.id = mid.inscription_id
		LEFT JOIN marketplace_listing ml ON ml.id = mid.listing_id
		WHERE i.collection_id IS NOT NULL and (ml.id IS NULL OR (ml.is_cancelled IS FALSE AND ml.is_filled IS FALSE))
		GROUP BY i.collection_id
	ON CONFLICT (id) DO UPDATE SET listed = EXCLUDED.listed, supply = EXCLUDED.supply, owners = EXCLUDED.owners, volume = EXCLUDED.volume, volume_24h = EXCLUDED.volume_24h, volume_7d = EXCLUDED.volume_7d, floor_price = EXCLUDED.floor_price, floor_price_1w_change = EXCLUDED.floor_price_1w_change, floor_price_1d_change = EXCLUDED.floor_price_1d_change;