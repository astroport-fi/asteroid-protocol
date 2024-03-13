-- Create index "idx_trgm_inscription_metadata_name" to table: "inscription"
CREATE INDEX "idx_trgm_inscription_metadata_name" ON "public"."inscription" USING gin ((((metadata -> 'metadata'::text) ->> 'name'::text)) gin_trgm_ops);
-- Create index "idx_inscription_trade_history_buyer_address" to table: "inscription_trade_history"
CREATE INDEX "idx_inscription_trade_history_buyer_address" ON "public"."inscription_trade_history" ("buyer_address");
-- Create index "idx_inscription_trade_history_seller_address" to table: "inscription_trade_history"
CREATE INDEX "idx_inscription_trade_history_seller_address" ON "public"."inscription_trade_history" ("seller_address");
-- Create index "idx_trgm_token_name" to table: "token"
CREATE INDEX "idx_trgm_token_name" ON "public"."token" USING gin ("name" gin_trgm_ops);
-- Create index "idx_trgm_token_ticker" to table: "token"
CREATE INDEX "idx_trgm_token_ticker" ON "public"."token" USING gin ("ticker" gin_trgm_ops);
-- Create index "idx_token_trade_history_buyer_address" to table: "token_trade_history"
CREATE INDEX "idx_token_trade_history_buyer_address" ON "public"."token_trade_history" ("buyer_address");
-- Create index "idx_token_trade_history_seller_address" to table: "token_trade_history"
CREATE INDEX "idx_token_trade_history_seller_address" ON "public"."token_trade_history" ("seller_address");
