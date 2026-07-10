import { AuthForm } from "@/components/ui/AuthForm";
export const metadata = { title: "Forgot password" };
export default function ForgotPage() {
  return <AuthForm mode="forgot" />;
}
