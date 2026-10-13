import { requireAdmin } from "@/lib/require-admin";
import { hasDatabase } from "@/lib/db";
import { listRecentMcpAudit } from "@/lib/mcp/audit";
import { formatDateTime } from "@/lib/format";
import {
  PageHeader,
  Breadcrumb,
  Badge,
  EmptyState,
  NotConnected,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function McpActivityPage() {
  await requireAdmin();

  if (!hasDatabase()) {
    return (
      <>
        <PageHeader title="MCP activity" />
        <NotConnected what="MCP activity" />
      </>
    );
  }

  let rows: Awaited<ReturnType<typeof listRecentMcpAudit>> = [];
  let failed = false;
  try {
    rows = await listRecentMcpAudit(100);
  } catch (err) {
    console.error("[mcp] audit list failed", err);
    failed = true;
  }

  return (
    <div>
      <PageHeader
        title="MCP activity"
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Settings", href: "/admin/settings" },
              { label: "MCP activity" },
            ]}
          />
        }
        description="Recent calls from Joy's bots. These keys cannot send mail or texts, and they do not sign in as an admin. Denied calls are listed too."
      />

      {failed ? (
        <EmptyState
          title="Audit log is not ready"
          description="Redeploy so the schema applies, then refresh this page."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No bot calls yet"
          description="When a bot uses /api/mcp, the call shows up here."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Tool</th>
                <th className="px-4 py-3 font-semibold">Result</th>
                <th className="px-4 py-3 font-semibold">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {formatDateTime(row.at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {row.key_name || "unknown"}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <div>{row.tool || "unknown"}</div>
                    {row.args != null &&
                    typeof row.args === "object" &&
                    Object.keys(row.args).length > 0 ? (
                      <details className="mt-1 text-ink-soft">
                        <summary className="cursor-pointer text-xs">args</summary>
                        <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap text-xs">
                          {JSON.stringify(row.args, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                    {row.error && (
                      <p className="mt-1 max-w-md text-xs text-danger">{row.error}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={row.ok ? "success" : "danger"}>
                      {row.ok ? "ok" : "denied"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{row.result_ref || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
