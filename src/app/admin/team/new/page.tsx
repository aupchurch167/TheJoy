import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { PageHeader, BackLink } from "@/components/admin/ui";
import { DEFAULT_QUESTIONS } from "@/lib/employee-feedback";
import { listReachableEmployees, listEmployeeTitles } from "@/lib/employees";
import SurveyComposer from "./SurveyComposer";

export const dynamic = "force-dynamic";

export default async function NewSurveyPage() {
  await requireAdmin();
  const [employees, titles] = hasDatabase()
    ? await Promise.all([listReachableEmployees(), listEmployeeTitles()])
    : [[], []];

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <BackLink href="/admin/team">Team feedback</BackLink>
      </div>
      <PageHeader title="New pulse survey" />
      <SurveyComposer
        defaultQuestions={DEFAULT_QUESTIONS}
        employees={employees.map((e) => ({
          id: e.id,
          name: e.name,
          title: e.title,
        }))}
        titles={titles}
      />
    </div>
  );
}
