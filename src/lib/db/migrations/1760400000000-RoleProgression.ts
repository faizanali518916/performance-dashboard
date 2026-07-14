import { MigrationInterface, QueryRunner } from "typeorm";

export class RoleProgression1760400000000 implements MigrationInterface {
  name = "RoleProgression1760400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "roles" ADD "nextRoleId" uuid`);
    await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_next_role"
      FOREIGN KEY ("nextRoleId") REFERENCES "roles"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_roles_next_role" ON "roles" ("nextRoleId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_roles_next_role"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_roles_next_role"`);
    await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "nextRoleId"`);
  }
}
