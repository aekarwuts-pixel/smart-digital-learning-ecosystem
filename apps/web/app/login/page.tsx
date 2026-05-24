import { hasSupabaseEnv } from "@/lib/env";
import { LoginForm } from "@/app/login/login-form";

type SearchParams = Promise<{ reason?: string }>;

export default async function LoginPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      isDemoMode={!hasSupabaseEnv()}
      reason={params.reason}
    />
  );
}
