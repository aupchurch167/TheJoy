import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, passwordLoginEnabled, googleLoginEnabled } from "@/auth";
import { ALLOWED_DOMAIN, isAllowedAdmin } from "@/lib/access";
import AdminSignInButton from "./AdminSignInButton";
import AdminPasswordForm from "./AdminPasswordForm";

export const dynamic = "force-dynamic";

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
  const passwordEnabled = passwordLoginEnabled();
  const googleEnabled = googleLoginEnabled();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">Joy Admin</h1>

      {googleEnabled ? (
        <p className="mt-4 text-ink-soft">
          Sign in with your <strong>@{ALLOWED_DOMAIN}</strong> Google account.
        </p>
      ) : passwordEnabled ? (
        <p className="mt-4 text-ink-soft">Sign in with the admin password.</p>
      ) : (
        <p className="mt-4 text-ink-soft">
          Sign-in is not set up yet. Set <code>ADMIN_PASSWORD</code> (or Google
          OAuth) and redeploy.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-clay/10 px-4 py-3 text-sm text-clay-dark"
        >
          That account is not allowed. Only verified @{ALLOWED_DOMAIN} accounts
          can sign in.
        </p>
      )}

      {googleEnabled && (
        <div className="mt-8">
          <AdminSignInButton />
        </div>
      )}

      {passwordEnabled && (
        <div className="mt-8 w-full max-w-xs">
          {googleEnabled && (
            <div className="flex items-center gap-3 text-xs text-ink-faint">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
          )}
          <AdminPasswordForm />
          {googleEnabled && (
            <p className="mt-3 text-xs text-ink-faint">
              Temporary password access, until Google sign-in is set up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
