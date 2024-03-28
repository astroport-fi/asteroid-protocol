-- Create "migration_permission_grant" table
CREATE TABLE "public"."migration_permission_grant" (
  "id" serial NOT NULL,
  "inscription_id" integer NOT NULL,
  "granter" character varying(128) NOT NULL,
  "grantee" character varying(128) NOT NULL,
  "date_created" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "inscription_id_fk" FOREIGN KEY ("inscription_id") REFERENCES "public"."inscription" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "idx_migration_permission_grant_inscription_id" to table: "migration_permission_grant"
CREATE INDEX "idx_migration_permission_grant_inscription_id" ON "public"."migration_permission_grant" ("inscription_id");
