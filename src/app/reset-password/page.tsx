import { AuthForm } from "@/components/ui/AuthForm";
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AuthForm mode="reset" token={token} />;
}
