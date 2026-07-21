import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedAdmin } from "./access";

/**
 * Server-side guard for admin pages, server actions, and admin API routes.
 * Middleware already protects /admin, but every admin data operation calls
 * this too (defense in depth): never rely on a single gate.
 * Redirects to login if the caller is not an allowed admin.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAllowedAdmin(email, true)) {
    redirect("/admin/login");
  }
  return { email: email as string };
}

/** Same check but returns a boolean instead of redirecting (for API routes). */
export async function isAdminRequest(): Promise<boolean> {
  const session = await auth();
  return isAllowedAdmin(session?.user?.email, true);
}
