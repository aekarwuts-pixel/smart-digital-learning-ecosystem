import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminOverride } from "./lib/admin-auth";


/** Supabase renamed the anon key — support both names */
function getAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getAnonKey();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const path = request.nextUrl.pathname;

  // ── No Supabase env → demo mode, skip all auth checks ────────
  if (!supabaseUrl || !anonKey) {
    return NextResponse.next({ request });
  }

  // ── SSR client — handles cookie refresh (official pattern) ────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof supabaseResponse.cookies.set>[2] }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      }
    }
  });

  // Validate session — MUST call getUser() to refresh token
  const { data: { user } } = await supabase.auth.getUser();

  // ── Protect /app routes ───────────────────────────────────────
  if (path.startsWith("/app")) {

    // 1. Student cookie session
    const studentSession = request.cookies.get("student_session_id")?.value;
    if (studentSession) {
      if (!path.startsWith("/app/student")) {
        return NextResponse.redirect(new URL("/app/student", request.url));
      }
      return supabaseResponse;
    }

    // 2. No authenticated user → redirect to login
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 3. Use service role to bypass RLS for profile lookup
    //    (middleware needs to read profiles to make routing decisions)
    const adminSb = serviceKey
      ? createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
      : null;

    const { data: profile } = adminSb
      ? await adminSb
          .from("profiles")
          .select("role, approval_status")
          .eq("auth_user_id", user.id)
          .maybeSingle()
      : { data: null };

    // No profile found → allow pass-through (will show generic error if needed)
    if (!profile) {
      if (path.startsWith("/app/admin")) {
        const overrideCookie = request.cookies.get("admin_override")?.value;
        const hasOverride = await verifyAdminOverride(overrideCookie);
        if (!hasOverride) {
          return NextResponse.redirect(new URL("/app/admin-login", request.url));
        }
      }
      return supabaseResponse;
    }

    // 4. Approval check (admin is always approved, check override for teachers)
    const overrideCookie = request.cookies.get("admin_override")?.value;
    const hasOverride = await verifyAdminOverride(overrideCookie);

    if (profile.role !== "admin" && !hasOverride) {
      if (profile.approval_status === "pending") {
        return NextResponse.redirect(new URL("/login?reason=pending", request.url));
      }
      if (profile.approval_status === "rejected") {
        return NextResponse.redirect(new URL("/login?reason=rejected", request.url));
      }
    }

    // 5. Admin-only route guard
    if (path.startsWith("/app/admin") && profile.role !== "admin" && !hasOverride) {
      return NextResponse.redirect(new URL("/app/admin-login", request.url));
    }
  }

  // ── Old /admin URL → redirect to /app/admin ──────────────────
  if (path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/app/admin", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
