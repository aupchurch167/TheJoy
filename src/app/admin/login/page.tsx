import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedAdmin } from "@/lib/access";
import { ALLOWED_DOMAIN } from "@/lib/access";
import AdminSignInButton from "./AdminSignInButton";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (isAllowedAdmin(session?.user?.email, true)) {
    redirect("/admin");
  }

  const { error } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Joy Admin
      </h1>
      <p className="mt-4 text-ink-soft">
        Sign in with your <strong>@{ALLOWED_DOMAIN}</strong> Google account.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-clay/10 px-4 py-3 text-sm text-clay-dark"
        >
          That account is not allowed. Only verified @{ALLOWED_DOMAIN} accounts
          can sign in.
        </p>
      )}

      <div className="mt-8">
        <AdminSignInButton />
      </div>
    </div>
  );
}
