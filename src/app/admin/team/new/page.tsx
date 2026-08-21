import { requireAdmin } from "@/lib/require-admin";
import { PageHeader, BackLink } from "@/components/admin/ui";
import { DEFAULT_QUESTIONS } from "@/lib/employee-feedback";
import SurveyComposer from "./SurveyComposer";

export const dynamic = "force-dynamic";

export default async function NewSurveyPage() {
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <BackLink href="/admin/team">Team feedback</BackLink>
      </div>
      <PageHeader title="New pulse survey" />
      <SurveyComposer defaultQuestions={DEFAULT_QUESTIONS} />
    </div>
  );
}
