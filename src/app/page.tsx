import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
export default async function Home() {
  redirect((await getCurrentUser()) ? "/dashboard" : "/login");
}
