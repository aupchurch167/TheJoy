import type { Metadata } from "next";
import "react-easy-crop/react-easy-crop.css";
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
        {/* Nav is hidden when printing so report pages export clean. */}
        <div className="print:hidden">
          <AdminNav email={session?.user?.email} />
        </div>
        {/* Sidebar is 15rem (w-60) on desktop; offset the content to match. */}
        <div className="lg:pl-60 print:pl-0">
          <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10 print:max-w-none print:py-0">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
