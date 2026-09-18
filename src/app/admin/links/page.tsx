import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getLinkInBio, getClickCounts } from "@/lib/linkinbio";
import LinkInBioForm from "./LinkInBioForm";
import { PageHeader, ButtonLink, NotConnected } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="Link in bio" />
        <NotConnected what="The link-in-bio editor" />
      </>
    );
  }

  const [content, clicks] = await Promise.all([getLinkInBio(), getClickCounts()]);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Link in bio"
        description="The page your Instagram and Facebook bio links point to (joyseniorcare.com/links). Reorder, style and schedule blocks below. The preview updates as you go."
        actions={
          <ButtonLink
            href="/links"
            variant="secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            View page
          </ButtonLink>
        }
      />
      <LinkInBioForm initial={content} clicks={clicks} />
    </div>
  );
}
