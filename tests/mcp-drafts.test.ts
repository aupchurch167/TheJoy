import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { segmentWhere, SMS_RECIPIENT_WHERE } from "../src/lib/leads";
import {
  createEmailDraft,
  previewEmailRecipients,
  updateEmailDraft,
  type EmailDeps,
  type EmailRow,
} from "../src/lib/mcp/tools/emails";
import {
  createTextDraft,
  previewTextRecipients,
  updateTextDraft,
  type TextDeps,
  type TextRow,
} from "../src/lib/mcp/tools/texts";
import { smsFullContent, SMS_OPT_OUT_LINE } from "../src/lib/mcp/text-draft";
import { McpToolError } from "../src/lib/mcp/errors";

function emailRow(overrides: Partial<EmailRow> = {}): EmailRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    subject: "Tuesday lunch",
    body: "Soup at noon.",
    audience: "families",
    channel: "email",
    status: "draft",
    scheduled_at: null,
    body_format: "markdown",
    model_json: null,
    filters: null,
    updated_at: "2026-10-13T00:00:00.000Z",
    ...overrides,
  };
}

function textRow(overrides: Partial<TextRow> = {}): TextRow {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    subject: "",
    body: "Lunch is at noon.",
    audience: "families",
    channel: "sms",
    status: "draft",
    scheduled_at: null,
    updated_at: "2026-10-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("email drafts", () => {
  it("creates an unscheduled family draft and never a lead", async () => {
    const created: unknown[] = [];
    let reverted = false;
    const deps: EmailDeps = {
      async create(subject, body, format, modelJson) {
        created.push({ subject, body, format, modelJson });
        return emailRow({ subject, body, body_format: format, model_json: modelJson });
      },
      update: async () => null,
      getById: async () => null,
      listDrafts: async () => [],
      countRecipients: async () => 0,
      revert: async () => {
        reverted = true;
      },
    };
    const result = await createEmailDraft(
      { subject: "Tuesday lunch", body: "Soup at noon.\n\nSee you then." },
      deps
    );
    assert.equal(result.ref, emailRow().id);
    const data = result.data as { status: string; scheduled_at: string | null; audience: string };
    assert.equal(data.status, "draft");
    assert.equal(data.scheduled_at, null);
    assert.equal(data.audience, "families");
    assert.equal(reverted, false);
    const saved = created[0] as { format: string; modelJson: unknown };
    assert.equal(saved.format, "markdown");
    assert.equal(saved.modelJson, null);

    await assert.rejects(
      () =>
        createEmailDraft(
          { subject: "Hi", body: "Hello", audience: "leads" },
          deps
        ),
      (err: unknown) => err instanceof McpToolError && /Leads are out of scope/.test(err.message)
    );
    await assert.rejects(
      () =>
        createEmailDraft(
          { subject: "Hi", body: "Hello", audience: "partners" },
          deps
        ),
      (err: unknown) =>
        err instanceof McpToolError && /Partner broadcasts are not set up/.test(err.message)
    );
  });

  it("reverts a create that does not come back as a draft", async () => {
    let reverted = "";
    const deps: EmailDeps = {
      async create() {
        return emailRow({ status: "scheduled", scheduled_at: "2026-10-13T12:00:00.000Z" });
      },
      update: async () => null,
      getById: async () => null,
      listDrafts: async () => [],
      countRecipients: async () => 0,
      revert: async (id) => {
        reverted = id;
      },
    };
    await assert.rejects(
      () => createEmailDraft({ subject: "Hi", body: "Hello there." }, deps),
      /unscheduled draft/
    );
    assert.equal(reverted, emailRow().id);
  });

  it("refuses to update anything that is not a draft", async () => {
    const deps: EmailDeps = {
      create: async () => emailRow(),
      update: async () => {
        throw new Error("update should not run");
      },
      getById: async () => emailRow({ status: "scheduled", scheduled_at: "2026-10-13T12:00:00.000Z" }),
      listDrafts: async () => [],
      countRecipients: async () => 0,
      revert: async () => {},
    };
    await assert.rejects(
      () =>
        updateEmailDraft(
          { id: emailRow().id, subject: "Changed" },
          deps
        ),
      /Only drafts can be updated/
    );
  });

  it("counts family recipients with the app's opt-out rules", async () => {
    const calls: unknown[] = [];
    const deps: EmailDeps = {
      create: async () => emailRow(),
      update: async () => null,
      getById: async () => null,
      listDrafts: async () => [],
      countRecipients: async (filters) => {
        calls.push(filters ?? null);
        return 7;
      },
      revert: async () => {},
    };
    const result = await previewEmailRecipients({}, deps);
    assert.deepEqual(result.data, {
      count: 7,
      audience: "families",
      opt_outs_applied: true,
    });
    assert.equal("email" in (result.data as object), false);
    const where = segmentWhere("families").where;
    assert.match(where, /unsubscribed_at IS NULL/);
    assert.match(where, /consent = TRUE/);
    assert.match(where, /active = TRUE/);
    assert.match(where, /suppressions/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0] ?? null, null);
  });
});

describe("text drafts", () => {
  it("stores the message without the opt-out line and reports the line that would send", async () => {
    let stored = "";
    const deps: TextDeps = {
      async create(body) {
        stored = body;
        return textRow({ body });
      },
      update: async () => null,
      getById: async () => null,
      listDrafts: async () => [],
      countRecipients: async () => 0,
      revert: async () => {},
    };
    const result = await createTextDraft(
      { body: `Lunch is at noon.\n\n${SMS_OPT_OUT_LINE}` },
      deps
    );
    assert.equal(stored, "Lunch is at noon.");
    assert.equal(stored.includes(SMS_OPT_OUT_LINE), false);
    const data = result.data as { status: string; scheduled_at: null; full_body: string };
    assert.equal(data.status, "draft");
    assert.equal(data.scheduled_at, null);
    assert.equal(data.full_body, smsFullContent("Lunch is at noon."));
    assert.match(data.full_body, /Reply STOP to opt out\.$/);
  });

  it("updates only drafts and previews the consent query", async () => {
    let nextBody = "";
    const deps: TextDeps = {
      create: async () => textRow(),
      update: async (_id, body) => {
        nextBody = body;
        return textRow({ body });
      },
      getById: async () => textRow(),
      listDrafts: async () => [],
      countRecipients: async () => 3,
      revert: async () => {},
    };
    const updated = await updateTextDraft(
      { id: textRow().id, body: "Pie at 3." },
      deps
    );
    assert.equal(nextBody, "Pie at 3.");
    assert.equal((updated.data as { status: string }).status, "draft");

    const sent = {
      ...deps,
      getById: async () => textRow({ status: "sent" }),
      update: async () => {
        throw new Error("update should not run");
      },
    };
    await assert.rejects(
      () => updateTextDraft({ id: textRow().id, body: "Nope" }, sent),
      /Only drafts can be updated/
    );

    const preview = await previewTextRecipients({ body: "Pie at 3." }, deps);
    const data = preview.data as {
      count: number;
      full_body: string;
      sms_consent: boolean;
    };
    assert.equal(data.count, 3);
    assert.equal(data.sms_consent, true);
    assert.match(data.full_body, /Reply STOP to opt out\.$/);
    assert.equal("phone" in data, false);
    assert.match(SMS_RECIPIENT_WHERE, /sms_consent = TRUE/);
    assert.match(SMS_RECIPIENT_WHERE, /sms_opt_out_at IS NULL/);
    assert.match(SMS_RECIPIENT_WHERE, /active = TRUE/);
    assert.match(SMS_RECIPIENT_WHERE, /audience = 'families'/);
    assert.match(SMS_RECIPIENT_WHERE, /phone IS NOT NULL AND phone <> ''/);
  });
});
