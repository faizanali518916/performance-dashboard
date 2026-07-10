import { AuthForm } from "@/components/ui/AuthForm";

export const metadata = { title: "Resend verification email" };

export default function ResendVerificationPage() {
  return <AuthForm mode="resend" />;
}
