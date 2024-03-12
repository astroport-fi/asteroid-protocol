-- Create index "idx_inscription_trade_history_buyer_address" to table: "inscription_trade_history"
CREATE INDEX "idx_inscription_trade_history_buyer_address" ON "public"."inscription_trade_history" ("buyer_address");
-- Create index "idx_inscription_trade_history_seller_address" to table: "inscription_trade_history"
CREATE INDEX "idx_inscription_trade_history_seller_address" ON "public"."inscription_trade_history" ("seller_address");
-- Create index "idx_token_trade_history_buyer_address" to table: "token_trade_history"
CREATE INDEX "idx_token_trade_history_buyer_address" ON "public"."token_trade_history" ("buyer_address");
-- Create index "idx_token_trade_history_seller_address" to table: "token_trade_history"
CREATE INDEX "idx_token_trade_history_seller_address" ON "public"."token_trade_history" ("seller_address");
