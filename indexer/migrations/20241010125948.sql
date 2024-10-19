-- Create enum type "price_curve"
CREATE TYPE "public"."price_curve" AS ENUM ('fixed', 'linear');
-- Modify "launchpad_stage" table
ALTER TABLE "public"."launchpad_stage" ADD COLUMN "price_curve" "public"."price_curve" NOT NULL DEFAULT 'fixed';