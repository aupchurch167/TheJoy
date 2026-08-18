import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import EmailStudio from "../EmailStudio";
import { loadStudioEvents, defaultTestAddress } from "../studio-data";
import { aiEnabled } from "@/lib/ai";
import { emailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function NewEmailPage() {
  await requireAdmin();
  const db = hasDatabase();
  const events = db ? await loadStudioEvents() : [];
  return (
    <EmailStudio
      events={events}
      defaultTestTo={defaultTestAddress()}
      aiEnabled={aiEnabled()}
      emailReady={emailEnabled()}
    />
  );
}
