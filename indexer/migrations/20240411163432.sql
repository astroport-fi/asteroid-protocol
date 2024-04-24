-- Drop index "inscription_history_un" from table: "inscription_history"
ALTER TABLE inscription_history DROP CONSTRAINT inscription_history_un;
-- Drop index "ith_tx_id" from table: "inscription_trade_history"
ALTER TABLE inscription_trade_history DROP CONSTRAINT ith_tx_id;
-- Drop index "tth_tx_id" from table: "token_trade_history"
ALTER TABLE token_trade_history DROP CONSTRAINT tth_tx_id;