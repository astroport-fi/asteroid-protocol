CREATE TABLE "public"."launchpad" (
  "hash" character(64) NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "public"."launchpad_inscription" (
    "id" serial4 NOT NULL,
    "launchpad_hash" character(64) NOT NULL,
    "inscription_number" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "uploaded" boolean NOT NULL DEFAULT false,
    CONSTRAINT "launchpad_inscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT launchpad_inscription_number UNIQUE ("launchpad_hash", "inscription_number")
);

CREATE INDEX "idx_launchpad_inscription_launchpad_hash" ON "public"."launchpad_inscription" USING btree ("launchpad_hash");
