import type { Metadata } from "next";
import { auth } from "@/auth";
import { isAllowedAdmin } from "@/lib/access";
import AdminNav from "./AdminNav";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = isAllowedAdmin(session?.user?.email, true);

  // Login page (not signed in): render bare, centered, no chrome.
  if (!isAdmin) {
    return <div className="min-h-full bg-paper">{children}</div>;
  }

  return (
    <ToastProvider>
      <div className="min-h-full bg-paper">
        <AdminNav email={session?.user?.email} />
        {/* Sidebar is 15rem (w-60) on desktop; offset the content to match. */}
        <div className="lg:pl-60">
          <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
