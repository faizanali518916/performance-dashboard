import { AuthForm } from "@/components/ui/AuthForm";
export const metadata = { title: "Sign in" };
export default function LoginPage() {
  return <AuthForm mode="login" />;
}
