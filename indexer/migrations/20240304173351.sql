-- Create index "idx_inscription_current_owner" to table: "inscription"
CREATE INDEX "idx_inscription_current_owner" ON "public"."inscription" ("current_owner");
-- Create index "idx_marketplace_listing_depositor_address" to table: "marketplace_listing"
CREATE INDEX "idx_marketplace_listing_depositor_address" ON "public"."marketplace_listing" ("depositor_address");
-- Create index "idx_marketplace_listing_depositor_timedout_block" to table: "marketplace_listing"
CREATE INDEX "idx_marketplace_listing_depositor_timedout_block" ON "public"."marketplace_listing" ("depositor_timedout_block");
-- Create index "idx_marketplace_listing_seller_address" to table: "marketplace_listing"
CREATE INDEX "idx_marketplace_listing_seller_address" ON "public"."marketplace_listing" ("seller_address");
-- Create index "idx_token_current_owner" to table: "token"
CREATE INDEX "idx_token_current_owner" ON "public"."token" ("current_owner");
-- Create index "idx_token_address_history_receiver" to table: "token_address_history"
CREATE INDEX "idx_token_address_history_receiver" ON "public"."token_address_history" ("receiver");
-- Create index "idx_token_address_history_sender" to table: "token_address_history"
CREATE INDEX "idx_token_address_history_sender" ON "public"."token_address_history" ("sender");
-- Create index "idx_token_holder_address" to table: "token_holder"
CREATE INDEX "idx_token_holder_address" ON "public"."token_holder" ("address");
