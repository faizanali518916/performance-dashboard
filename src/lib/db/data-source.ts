import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import {
  AuthRateLimit,
  AuthToken,
  Journal,
  KpiDefinition,
  Role,
  RoleKpiAssignment,
  Session,
  User,
  UserKpiPerformance,
} from "./entities";
import { InitialSchema1760000000000 } from "./migrations/1760000000000-InitialSchema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

export const AppDataSource = new DataSource({
  type: "postgres",
  url,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  entities: [
    Role,
    User,
    KpiDefinition,
    RoleKpiAssignment,
    UserKpiPerformance,
    Journal,
    Session,
    AuthToken,
    AuthRateLimit,
  ],
  migrations: [InitialSchema1760000000000],
});

declare global {
  var __pgtsDataSources: DataSource[] | undefined;
}

export async function getDataSource() {
  if (AppDataSource.isInitialized) return AppDataSource;
  // Next.js can load route bundles independently in development. A DataSource
  // created by another bundle may contain different class identities, so only
  // reuse a cached pool when its metadata matches this bundle's entities.
  const compatible = global.__pgtsDataSources?.find(
    (dataSource) =>
      dataSource.isInitialized &&
      dataSource.hasMetadata(User) &&
      dataSource.hasMetadata(Session) &&
      dataSource.hasMetadata(Role),
  );
  if (compatible) return compatible;
  const initialized = await AppDataSource.initialize();
  if (process.env.NODE_ENV !== "production") {
    global.__pgtsDataSources ??= [];
    global.__pgtsDataSources.push(initialized);
  }
  return initialized;
}
