import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardShell } from "@/components/Dashboard/DashboardShell";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const actor = await requireUser();
  const data = await getDashboardData(actor);
  return <DashboardShell data={data} />;
}
