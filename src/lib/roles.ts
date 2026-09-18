import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { homeFor, type Role } from "@/lib/role-labels";

export { homeFor, ROLE_LABEL, type Role } from "@/lib/role-labels";
export type Account = { id: string; email: string | null; full_name: string | null; avatar_url: string | null; role: Role };

/** Emails that become admins on their next visit (the first admin has no one to appoint them). */
const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/**
 * The signed-in account with its role. A listed admin email is promoted here through the
 * service role; nobody can change their own role through the Data API.
 */
export const getAccountWithRole = cache(async (userId: string): Promise<Account> => {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("email, full_name, avatar_url, role").eq("id", userId).maybeSingle();
  const account: Account = { id: userId, email: data?.email ?? null, full_name: data?.full_name ?? null, avatar_url: data?.avatar_url ?? null, role: (data?.role as Role) ?? "student" };

  if (account.role !== "admin" && account.email && adminEmails().includes(account.email.toLowerCase())) {
    const admin = createAdminClient();
    if (admin && !(await admin.from("users").update({ role: "admin" }).eq("id", userId)).error) account.role = "admin";
  }
  return account;
});

/** Pages for one role: others go to their own start page. */
export async function requireRole(roles: Role[], next: string): Promise<Account> {
  const userId = await requireUserId(next);
  const account = await getAccountWithRole(userId);
  if (!roles.includes(account.role)) redirect(homeFor(account.role));
  return account;
}
