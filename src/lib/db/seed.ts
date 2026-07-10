import "reflect-metadata";
import { hash } from "bcryptjs";
import { AppDataSource } from "./data-source";
import {
  AccessLevel,
  Journal,
  JournalCategory,
  KpiDefinition,
  Role,
  RoleKpiAssignment,
  User,
  UserKpiPerformance,
  UserStatus,
} from "./entities";

async function seed() {
  const db = await AppDataSource.initialize();
  const roleRepo = db.getRepository(Role);
  const kpiRepo = db.getRepository(KpiDefinition);
  const userRepo = db.getRepository(User);
  const roleTitles = ["Leadership", "Amazon Account Manager", "Performance Marketing", "Content Strategy"];
  const roles: Record<string, Role> = {};
  for (const title of roleTitles) {
    let role = await roleRepo.findOneBy({ title });
    if (!role) role = await roleRepo.save({ title });
    roles[title] = role;
  }
  const definitions = [
    ["Revenue Growth", "PKR", "Monthly revenue generated across assigned accounts"],
    ["Account Health Score", "%", "Composite account quality and policy health"],
    ["Client Satisfaction", "/10", "Average monthly client rating"],
    ["Campaign ROAS", "x", "Return on advertising spend"],
    ["On-time Delivery", "%", "Work delivered by the agreed date"],
  ] as const;
  const kpis: KpiDefinition[] = [];
  for (const [name, unit, description] of definitions) {
    let kpi = await kpiRepo.findOneBy({ name });
    if (!kpi) kpi = await kpiRepo.save({ name, unit, description });
    kpis.push(kpi);
  }
  const assignmentRepo = db.getRepository(RoleKpiAssignment);
  const targetMap: Record<string, number[]> = {
    Leadership: [500000, 95, 9, 4, 95],
    "Amazon Account Manager": [350000, 90, 8.5, 3.5, 92],
    "Performance Marketing": [300000, 88, 8, 4.2, 90],
    "Content Strategy": [200000, 92, 8.5, 2.5, 95],
  };
  for (const title of roleTitles)
    for (let i = 0; i < kpis.length; i++)
      await assignmentRepo.upsert({ roleId: roles[title].id, kpiId: kpis[i].id, target: String(targetMap[title][i]) }, [
        "roleId",
        "kpiId",
      ]);
  const password = await hash(process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!", 12);
  async function upsertUser(
    name: string,
    email: string,
    roleTitle: string,
    accessLevel: AccessLevel,
    managerId: string | null = null,
  ) {
    let user = await userRepo.findOneBy({ email });
    if (!user)
      user = await userRepo.save({
        name,
        email,
        password,
        emailVerified: true,
        roleId: roles[roleTitle].id,
        accessLevel,
        managerId,
        status: UserStatus.ACTIVE,
      });
    return user;
  }
  const admin = await upsertUser(
    "Ayesha Khan",
    process.env.SEED_ADMIN_EMAIL || "admin@example.com",
    "Leadership",
    AccessLevel.ADMIN,
  );
  const manager = await upsertUser(
    "Kashan Ali",
    "manager@example.com",
    "Performance Marketing",
    AccessLevel.MANAGER,
    admin.id,
  );
  const team = [
    await upsertUser("Ali Raza", "ali@example.com", "Amazon Account Manager", AccessLevel.EMPLOYEE, manager.id),
    await upsertUser("Fatima Malik", "fatima@example.com", "Content Strategy", AccessLevel.EMPLOYEE, manager.id),
    await upsertUser("Khizer Ahmed", "khizer@example.com", "Performance Marketing", AccessLevel.EMPLOYEE, manager.id),
  ];
  const all = [admin, manager, ...team];
  const performanceRepo = db.getRepository(UserKpiPerformance);
  const months = ["2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01"];
  for (let u = 0; u < all.length; u++) {
    const assignments = await assignmentRepo.findBy({ roleId: all[u].roleId });
    for (let m = 0; m < months.length; m++)
      for (let k = 0; k < assignments.length; k++) {
        const target = Number(assignments[k].target);
        const factor = 0.68 + u * 0.04 + m * 0.055 + (k % 2) * 0.035;
        await performanceRepo.upsert(
          {
            userId: all[u].id,
            kpiId: assignments[k].kpiId,
            period: months[m],
            current: String(Math.round(target * factor * 100) / 100),
            target: String(target),
          },
          ["userId", "kpiId", "period"],
        );
      }
  }
  const journalRepo = db.getRepository(Journal);
  if (!(await journalRepo.count()))
    await journalRepo.save([
      {
        userId: manager.id,
        description: "Scaled the flagship client portfolio while keeping ROAS above the quarterly target.",
        category: JournalCategory.GOOD,
        impact: "18",
        period: "2026-07-01",
      },
      {
        userId: manager.id,
        description: "Weekly stakeholder reporting ran behind schedule during the campaign launch.",
        category: JournalCategory.BAD,
        impact: "8",
        period: "2026-06-01",
      },
      {
        userId: team[0].id,
        description: "Recovered a suspended Amazon account and protected the client's peak-season revenue.",
        category: JournalCategory.GOOD,
        impact: "15",
        period: "2026-07-01",
      },
      {
        userId: team[1].id,
        description: "Published the full content calendar two weeks ahead of schedule.",
        category: JournalCategory.GOOD,
        impact: "12",
        period: "2026-07-01",
      },
      {
        userId: team[2].id,
        description: "Creative testing volume was limited by delayed asset approvals.",
        category: JournalCategory.BAD,
        impact: "7",
        period: "2026-07-01",
      },
    ]);
  console.log(`Seed complete. Admin: ${admin.email}`);
  await db.destroy();
}
seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
