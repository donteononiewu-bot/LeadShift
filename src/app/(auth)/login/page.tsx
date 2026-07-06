import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmEmail?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm confirmEmail={params.confirmEmail === "1"} />;
}
