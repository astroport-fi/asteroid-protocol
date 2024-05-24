-- Drop index "inscription_history_un" from table: "inscription_history"
ALTER TABLE inscription_history DROP CONSTRAINT IF EXISTS inscription_history_un;
-- Drop index "ith_tx_id" from table: "inscription_trade_history"
ALTER TABLE inscription_trade_history DROP CONSTRAINT IF EXISTS ith_tx_id;
-- Drop index "tth_tx_id" from table: "token_trade_history"
ALTER TABLE token_trade_history DROP CONSTRAINT IF EXISTS tth_tx_id;

-- Drop index "inscription_history_un" from table: "inscription_history"
DROP INDEX "public"."inscription_history_un";
-- Drop index "ith_tx_id" from table: "inscription_trade_history"
DROP INDEX "public"."ith_tx_id";
-- Drop index "tth_tx_id" from table: "token_trade_history"
DROP INDEX "public"."tth_tx_id";