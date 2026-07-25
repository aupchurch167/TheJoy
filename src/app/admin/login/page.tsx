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
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Joy Admin
            </h1>
            {googleEnabled ? (
              <p className="mt-2 text-sm text-ink-soft">
                Sign in with your <strong>@{ALLOWED_DOMAIN}</strong> Google
                account.
              </p>
            ) : passwordEnabled ? (
              <p className="mt-2 text-sm text-ink-soft">
                Sign in to manage the site.
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                Sign-in is not set up yet. Set <code>ADMIN_PASSWORD</code> (or
                Google OAuth) and redeploy.
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              That account is not allowed. Only verified @{ALLOWED_DOMAIN}{" "}
              accounts can sign in.
            </p>
          )}

          {googleEnabled && (
            <div className="mt-6 flex justify-center">
              <AdminSignInButton />
            </div>
          )}

          {passwordEnabled && (
            <div className="mt-6">
              {googleEnabled && (
                <div className="mb-4 flex items-center gap-3 text-xs text-ink-faint">
                  <span className="h-px flex-1 bg-line" />
                  or
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              <AdminPasswordForm />
              {googleEnabled && (
                <p className="mt-3 text-center text-xs text-ink-faint">
                  Temporary password access, until Google sign-in is set up.
                </p>
              )}
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Joy Senior Living · Loganville, GA
        </p>
      </div>
    </div>
  );
}
