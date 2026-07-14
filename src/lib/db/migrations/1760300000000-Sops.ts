import { MigrationInterface, QueryRunner } from "typeorm";

export class Sops1760300000000 implements MigrationInterface {
  name = "Sops1760300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "sops" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(160) NOT NULL,
      "description" text NOT NULL, "departmentId" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_sops" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_sops_department_name" UNIQUE ("departmentId", "name"),
      CONSTRAINT "FK_sops_department" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_sops_department" ON "sops" ("departmentId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sops_department"`);
    await queryRunner.query(`DROP TABLE "sops"`);
  }
}
