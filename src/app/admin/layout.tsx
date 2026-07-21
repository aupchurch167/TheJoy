import type { Metadata } from "next";
import { auth } from "@/auth";
import { isAllowedAdmin } from "@/lib/access";
import AdminBar from "./AdminBar";

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

  return (
    <div className="flex min-h-full flex-col bg-paper">
      {/* Nav only shows once signed in (hidden on the login page). */}
      {isAdmin && <AdminBar email={session?.user?.email} />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
