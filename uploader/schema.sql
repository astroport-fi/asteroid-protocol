CREATE TABLE "public"."launchpad" (
  "hash" character(64) NOT NULL,
  "creator" character(45) NOT NULL,
  "folder" character(25) NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "launchpad_pkey" PRIMARY KEY ("hash")
);

CREATE INDEX "idx_launchpad_creator" ON "public"."launchpad" USING btree ("creator");

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

CREATE TABLE "public"."session" (
  "address" character(45) NOT NULL,
  "hash" character(25) NOT NULL,
  "date_created" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified" boolean NOT NULL DEFAULT false,
  CONSTRAINT "session_pkey" PRIMARY KEY ("address")
);

CREATE INDEX "idx_session" ON "public"."session" USING btree ("hash");
