-- Modify "inscription" table
ALTER TABLE "public"."inscription" ADD COLUMN "token_id" integer NULL;
-- Create index "inscription_collection_token_id" to table: "inscription"
CREATE UNIQUE INDEX "inscription_collection_token_id" ON "public"."inscription" ("collection_id", "token_id");
