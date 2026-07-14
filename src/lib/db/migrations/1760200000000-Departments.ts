import { MigrationInterface, QueryRunner } from "typeorm";

export class Departments1760200000000 implements MigrationInterface {
  name = "Departments1760200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "departments" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_departments" PRIMARY KEY ("id"), CONSTRAINT "UQ_departments_name" UNIQUE ("name")
    )`);
    await queryRunner.query(`ALTER TABLE "users" ADD "departmentId" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_users_department" ON "users" ("departmentId")`);
    await queryRunner.query(`CREATE TABLE "department_managers" (
      "departmentId" uuid NOT NULL, "managerId" uuid NOT NULL,
      CONSTRAINT "PK_department_managers" PRIMARY KEY ("departmentId", "managerId"),
      CONSTRAINT "FK_department_managers_department" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_department_managers_manager" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "IDX_department_managers_manager" ON "department_managers" ("managerId")`);
    await queryRunner.query(`CREATE FUNCTION enforce_department_manager_access() RETURNS trigger AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = NEW."managerId" AND "accessLevel" = 'MANAGER') THEN
          RAISE EXCEPTION 'Department managers must have MANAGER access';
        END IF;
        RETURN NEW;
      END;
    $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE TRIGGER "TR_department_manager_access"
      BEFORE INSERT OR UPDATE ON "department_managers"
      FOR EACH ROW EXECUTE FUNCTION enforce_department_manager_access()`);
    await queryRunner.query(`CREATE FUNCTION protect_assigned_manager_access() RETURNS trigger AS $$
      BEGIN
        IF OLD."accessLevel" = 'MANAGER' AND NEW."accessLevel" <> 'MANAGER'
          AND EXISTS (SELECT 1 FROM "department_managers" WHERE "managerId" = OLD."id") THEN
          RAISE EXCEPTION 'Remove the manager from all departments before changing access';
        END IF;
        RETURN NEW;
      END;
    $$ LANGUAGE plpgsql`);
    await queryRunner.query(`CREATE TRIGGER "TR_protect_assigned_manager_access"
      BEFORE UPDATE OF "accessLevel" ON "users"
      FOR EACH ROW EXECUTE FUNCTION protect_assigned_manager_access()`);

    await queryRunner.query(`INSERT INTO "departments" ("id", "name")
      SELECT manager."id", manager."name" || ' Department ' || left(manager."id"::text, 8)
      FROM "users" manager
      WHERE manager."accessLevel" = 'MANAGER'`);
    await queryRunner.query(`INSERT INTO "department_managers" ("departmentId", "managerId")
      SELECT "id", "id" FROM "users"
      WHERE "accessLevel" = 'MANAGER' AND EXISTS (SELECT 1 FROM "departments" WHERE "departments"."id" = "users"."id")`);
    await queryRunner.query(`UPDATE "users" member SET "departmentId" = member."managerId"
      WHERE EXISTS (SELECT 1 FROM "departments" WHERE "departments"."id" = member."managerId")`);
    await queryRunner.query(`DROP INDEX "IDX_users_manager"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_manager"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "managerId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "managerId" uuid`);
    await queryRunner.query(`UPDATE "users" member SET "managerId" = (
      SELECT dm."managerId" FROM "department_managers" dm
      WHERE dm."departmentId" = member."departmentId" AND dm."managerId" <> member."id"
      ORDER BY dm."managerId" LIMIT 1
    )`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_manager"
      FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_users_manager" ON "users" ("managerId")`);
    await queryRunner.query(`DROP TRIGGER "TR_protect_assigned_manager_access" ON "users"`);
    await queryRunner.query(`DROP FUNCTION protect_assigned_manager_access`);
    await queryRunner.query(`DROP TRIGGER "TR_department_manager_access" ON "department_managers"`);
    await queryRunner.query(`DROP FUNCTION enforce_department_manager_access`);
    await queryRunner.query(`DROP TABLE "department_managers"`);
    await queryRunner.query(`DROP INDEX "IDX_users_department"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_department"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "departmentId"`);
    await queryRunner.query(`DROP TABLE "departments"`);
  }
}
