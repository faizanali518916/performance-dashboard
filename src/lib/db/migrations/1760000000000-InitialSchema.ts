import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760000000000 implements MigrationInterface {
  name = "InitialSchema1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive')`);
    await queryRunner.query(`CREATE TYPE "access_level_enum" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN')`);
    await queryRunner.query(`CREATE TYPE "journal_category_enum" AS ENUM ('GOOD', 'BAD')`);
    await queryRunner.query(`CREATE TYPE "auth_token_purpose_enum" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD')`);

    await queryRunner.query(`CREATE TABLE "roles" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" varchar(120) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_roles" PRIMARY KEY ("id"), CONSTRAINT "UQ_roles_title" UNIQUE ("title")
    )`);
    await queryRunner.query(`CREATE TABLE "users" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL,
      "email" varchar(320) NOT NULL, "password" varchar(100) NOT NULL,
      "emailVerified" boolean NOT NULL DEFAULT false, "managerId" uuid,
      "roleId" uuid NOT NULL, "status" "user_status_enum" NOT NULL DEFAULT 'active',
      "accessLevel" "access_level_enum" NOT NULL DEFAULT 'EMPLOYEE',
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_users" PRIMARY KEY ("id"), CONSTRAINT "UQ_users_email" UNIQUE ("email"),
      CONSTRAINT "FK_users_manager" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_users_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_users_manager" ON "users" ("managerId")`);
    await queryRunner.query(`CREATE TABLE "kpi_definitions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(160) NOT NULL,
      "description" text, "unit" varchar(40), "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_kpi_definitions" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "role_kpi_assignments" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "roleId" uuid NOT NULL, "kpiId" uuid NOT NULL,
      "target" numeric(14,2) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_role_kpis" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_role_kpi" UNIQUE ("roleId", "kpiId"),
      CONSTRAINT "FK_role_kpi_role" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_role_kpi_kpi" FOREIGN KEY ("kpiId") REFERENCES "kpi_definitions"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE "user_kpi_performance" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "kpiId" uuid NOT NULL,
      "period" date NOT NULL, "current" numeric(14,2) NOT NULL, "target" numeric(14,2) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_user_performance" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_user_kpi_period" UNIQUE ("userId", "kpiId", "period"),
      CONSTRAINT "FK_performance_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_performance_kpi" FOREIGN KEY ("kpiId") REFERENCES "kpi_definitions"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_performance_user_period" ON "user_kpi_performance" ("userId", "period")`,
    );
    await queryRunner.query(`CREATE TABLE "journals" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "description" text NOT NULL,
      "category" "journal_category_enum" NOT NULL, "impact" numeric(8,2) NOT NULL, "period" date NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_journals" PRIMARY KEY ("id"),
      CONSTRAINT "FK_journals_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_journals_user_period" ON "journals" ("userId", "period")`);
    await queryRunner.query(`CREATE TABLE "sessions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "tokenHash" char(64) NOT NULL, "userId" uuid NOT NULL,
      "expiresAt" timestamptz NOT NULL, "userAgent" varchar(500), "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_sessions" PRIMARY KEY ("id"), CONSTRAINT "UQ_sessions_token" UNIQUE ("tokenHash"),
      CONSTRAINT "FK_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_expires" ON "sessions" ("expiresAt")`);
    await queryRunner.query(`CREATE TABLE "auth_tokens" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "tokenHash" char(64) NOT NULL,
      "purpose" "auth_token_purpose_enum" NOT NULL, "expiresAt" timestamptz NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_auth_tokens" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_auth_token_hash" UNIQUE ("tokenHash"), CONSTRAINT "UQ_auth_user_purpose" UNIQUE ("userId", "purpose"),
      CONSTRAINT "FK_auth_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE "auth_rate_limits" (
      "key" varchar(320) NOT NULL, "attempts" integer NOT NULL DEFAULT 0,
      "windowStartedAt" timestamptz NOT NULL, "blockedUntil" timestamptz,
      "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_auth_rate_limits" PRIMARY KEY ("key")
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_rate_limits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "journals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_kpi_performance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_kpi_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kpi_definitions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "auth_token_purpose_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "journal_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "access_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
  }
}
