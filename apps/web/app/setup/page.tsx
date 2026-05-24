import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type SetupStatus = {
  envReady: boolean;
  authUserId: string | null;
  email: string | null;
  profileId: string | null;
  profileRole: string | null;
  profileAuthUserId: string | null;
  profileEmail: string | null;
  error: string | null;
};

async function getSetupStatus(): Promise<SetupStatus> {
  const envReady = hasSupabaseEnv();

  if (!envReady) {
    return {
      envReady,
      authUserId: null,
      email: null,
      profileId: null,
      profileRole: null,
      profileAuthUserId: null,
      profileEmail: null,
      error: "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY"
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const authUserId = user?.id ?? null;
    const email = user?.email ?? null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, auth_user_id, email")
      .eq("email", email ?? "")
      .maybeSingle<{ auth_user_id: string | null; email: string | null; id: string; role: string }>();

    return {
      envReady,
      authUserId,
      email,
      profileId: profile?.id ?? null,
      profileRole: profile?.role ?? null,
      profileAuthUserId: profile?.auth_user_id ?? null,
      profileEmail: profile?.email ?? null,
      error: null
    };
  } catch (error) {
    return {
      envReady,
      authUserId: null,
      email: null,
      profileId: null,
      profileRole: null,
      profileAuthUserId: null,
      profileEmail: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export default async function SetupPage() {
  const status = await getSetupStatus();
  const canMap = status.authUserId && status.email;
  const sql = canMap
    ? `update profiles\nset auth_user_id = '${status.authUserId}'\nwhere email = '${status.email}';`
    : "-- ล็อกอินก่อน แล้วหน้านี้จะสร้าง SQL mapping ให้อัตโนมัติ";

  return (
    <main className="landing-root">
      <section className="landing-shell">
        <p className="eyebrow">Supabase Setup Check</p>
        <h1>ตรวจสอบการเชื่อม Supabase และบัญชีผู้ใช้</h1>
        <p>ใช้หน้านี้เพื่อตรวจ env, สถานะ auth และ profile mapping ก่อนเริ่มใช้งานจริง</p>

        <div className="setup-grid">
          <div className="setup-item">
            <strong>ENV พร้อมใช้งาน</strong>
            <span>{status.envReady ? "พร้อม" : "ยังไม่พร้อม"}</span>
          </div>
          <div className="setup-item">
            <strong>Auth User ID</strong>
            <span>{status.authUserId ?? "-"}</span>
          </div>
          <div className="setup-item">
            <strong>Email ที่ล็อกอิน</strong>
            <span>{status.email ?? "-"}</span>
          </div>
          <div className="setup-item">
            <strong>Profile ID</strong>
            <span>{status.profileId ?? "-"}</span>
          </div>
          <div className="setup-item">
            <strong>Profile Role</strong>
            <span>{status.profileRole ?? "-"}</span>
          </div>
          <div className="setup-item">
            <strong>Profile auth_user_id</strong>
            <span>{status.profileAuthUserId ?? "-"}</span>
          </div>
        </div>

        {status.error ? <p className="form-message">{status.error}</p> : null}

        <h2 className="setup-heading">SQL สำหรับ map auth_user_id</h2>
        <pre className="sql-box">{sql}</pre>
      </section>
    </main>
  );
}
