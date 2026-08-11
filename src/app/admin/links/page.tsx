import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { getLinkInBio } from "@/lib/linkinbio";
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

  const content = await getLinkInBio();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Link in bio"
        description="The page your Instagram and Facebook bio links point to (joyseniorcare.com/links). Edit the links and one-line notes here. Changes show on the page within a moment."
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
      <LinkInBioForm initial={content} />
    </div>
  );
}
