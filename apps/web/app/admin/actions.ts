"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function approveUser(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) return;

  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("profiles")
    .update({ approval_status: "approved" })
    .eq("id", profileId);

  revalidatePath("/app/admin");
}

export async function rejectUser(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) return;

  const adminSupabase = createAdminClient();
  await adminSupabase
    .from("profiles")
    .update({ approval_status: "rejected" })
    .eq("id", profileId);

  // Optionally, you might want to delete the user from auth.users as well,
  // but keeping them as rejected prevents them from re-registering with the same email
  // without admin intervention.

  revalidatePath("/app/admin");
}
