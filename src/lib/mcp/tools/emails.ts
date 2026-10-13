import { z } from "zod";
import {
  createBroadcast,
  forceUnsentBackToDraft,
  getBroadcastById,
  listChannelDrafts,
  updateDraftBroadcast,
  type Broadcast,
} from "../../broadcasts";
import { EMAIL_THEMES, type EmailTheme } from "../../email-model";
import { countSubscribers, type LeadSegment } from "../../leads";
import { composeEmailDraft, mergeEmailDraft } from "../email-draft";
import { McpToolError } from "../errors";
import type { McpTool, ToolSuccess } from "../execute";
import { assertDraftRow, guardCreatedDraft } from "../guard";

const THEME_IDS = EMAIL_THEMES.map((theme) => theme.id) as [EmailTheme, ...EmailTheme[]];

const audienceField = z
  .string()
  .trim()
  .max(40)
  .optional()
  .describe(
    "Must be families. leads is rejected. partners is rejected until partner broadcasts exist."
  );

const photoField = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .describe("Optional http(s) photo URL.");

const idempotencyField = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .optional()
  .describe("Optional. A retry with the same key returns the first draft.");

export const emailCreateSchema = z
  .object({
    subject: z.string().trim().min(1, "A subject is required.").max(200),
    body: z
      .string()
      .trim()
      .min(1, "Write the email body first.")
      .max(20_000)
      .describe("Markdown or plain text. Blank lines start paragraphs."),
    audience: audienceField,
    theme: z.enum(THEME_IDS).optional().describe("Studio theme. Omit for a Markdown letter."),
    photo_url: photoField,
    idempotency_key: idempotencyField,
  })
  .strict();

export const emailUpdateSchema = z
  .object({
    id: z.string().uuid(),
    subject: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(20_000).optional(),
    audience: audienceField,
    theme: z.enum(THEME_IDS).optional(),
    photo_url: photoField,
  })
  .strict();

export const emailListSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const emailGetSchema = z.object({ id: z.string().uuid() }).strict();

export const emailPreviewSchema = z
  .object({
    id: z
      .string()
      .uuid()
      .optional()
      .describe("A family email id. Omit to count the whole families audience."),
  })
  .strict();

export type EmailRow = Pick<
  Broadcast,
  | "id"
  | "subject"
  | "body"
  | "audience"
  | "channel"
  | "status"
  | "scheduled_at"
  | "body_format"
  | "model_json"
  | "filters"
  | "updated_at"
>;

export type EmailDeps = {
  create: (
    subject: string,
    body: string,
    format: "markdown" | "html_standalone",
    modelJson: unknown | null
  ) => Promise<EmailRow>;
  update: (
    id: string,
    fields: {
      subject: string;
      body: string;
      format: "markdown" | "html_standalone";
      modelJson: unknown | null;
    }
  ) => Promise<EmailRow | null>;
  getById: (id: string) => Promise<EmailRow | null>;
  listDrafts: (limit: number) => Promise<EmailRow[]>;
  countRecipients: (filters?: LeadSegment) => Promise<number>;
  revert: (id: string) => Promise<void>;
};

function asSegment(filters: unknown): LeadSegment | undefined {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) return undefined;
  return filters as LeadSegment;
}

export const defaultEmailDeps: EmailDeps = {
  async create(subject, body, format, modelJson) {
    // Status and scheduled_at are left to the database default (draft, null).
    return createBroadcast(subject, body, "families", "email", null, null, {
      format,
      modelJson,
    });
  },
  async update(id, fields) {
    return updateDraftBroadcast(id, {
      ...fields,
      audience: "families",
      channel: "email",
    });
  },
  getById: (id) => getBroadcastById(id),
  listDrafts: (limit) =>
    listChannelDrafts("email", limit, { excludeAudience: "leads" }),
  countRecipients: (filters) => countSubscribers("families", filters),
  revert: (id) => forceUnsentBackToDraft(id),
};

function view(row: EmailRow, withBody: boolean) {
  return {
    id: row.id,
    subject: row.subject,
    audience: row.audience,
    channel: row.channel,
    status: row.status,
    scheduled_at: row.scheduled_at,
    body_format: row.body_format,
    updated_at: row.updated_at,
    ...(withBody ? { body: row.body } : { snippet: row.body.slice(0, 180) }),
  };
}

function requireEmail(row: EmailRow | null, idLabel = "email"): EmailRow {
  if (!row || row.channel !== "email") {
    throw new McpToolError(`No ${idLabel} with that id.`);
  }
  if (row.audience === "leads") throw new McpToolError("Leads are out of scope.");
  if (row.audience !== "families") {
    throw new McpToolError("Audience must be families.");
  }
  return row;
}

export async function createEmailDraft(
  input: z.infer<typeof emailCreateSchema>,
  deps: EmailDeps
): Promise<ToolSuccess> {
  const composed = composeEmailDraft({
    subject: input.subject,
    body: input.body,
    audience: input.audience,
    theme: input.theme,
    photoUrl: input.photo_url || undefined,
  });
  const row = await deps.create(
    composed.subject,
    composed.body,
    composed.format,
    composed.modelJson
  );
  await guardCreatedDraft(row, deps.revert);
  return {
    ref: row.id,
    data: view(row, false),
  };
}

export async function updateEmailDraft(
  input: z.infer<typeof emailUpdateSchema>,
  deps: EmailDeps
): Promise<ToolSuccess> {
  if (!input.subject && !input.body && !input.audience && !input.theme && !input.photo_url) {
    throw new McpToolError("Provide a field to change.");
  }
  const existing = requireEmail(await deps.getById(input.id));
  if (existing.status !== "draft") {
    throw new McpToolError("Only drafts can be updated.");
  }
  const composed = mergeEmailDraft(existing, {
    subject: input.subject,
    body: input.body,
    audience: input.audience,
    theme: input.theme,
    photoUrl: input.photo_url || undefined,
  });
  const updated = await deps.update(existing.id, {
    subject: composed.subject,
    body: composed.body,
    format: composed.format,
    modelJson: composed.modelJson,
  });
  if (!updated) throw new McpToolError("Only drafts can be updated.");
  assertDraftRow(updated);
  return { ref: updated.id, data: view(updated, false) };
}

export async function listEmailDrafts(
  input: z.infer<typeof emailListSchema>,
  deps: EmailDeps
): Promise<ToolSuccess> {
  const rows = await deps.listDrafts(input.limit ?? 50);
  return {
    ref: `count:${rows.length}`,
    data: { drafts: rows.map((row) => view(row, false)) },
  };
}

export async function getEmail(
  input: z.infer<typeof emailGetSchema>,
  deps: EmailDeps
): Promise<ToolSuccess> {
  const row = requireEmail(await deps.getById(input.id));
  return { ref: row.id, data: view(row, true) };
}

export async function previewEmailRecipients(
  input: z.infer<typeof emailPreviewSchema>,
  deps: EmailDeps
): Promise<ToolSuccess> {
  let filters: LeadSegment | undefined;
  if (input.id) {
    const row = requireEmail(await deps.getById(input.id));
    filters = asSegment(row.filters);
  }
  const count = await deps.countRecipients(filters);
  return {
    ref: `count:${count}`,
    data: {
      count,
      audience: "families",
      opt_outs_applied: true,
    },
  };
}

export function emailTools(deps: EmailDeps = defaultEmailDeps): McpTool[] {
  const bind =
    <T,>(fn: (input: T, deps: EmailDeps) => Promise<ToolSuccess>) =>
    (args: unknown) => fn(args as T, deps);

  return [
    {
      name: "emails_list_drafts",
      description:
        "List family email drafts (status draft). Lead emails are omitted. Does not send.",
      scope: "emails",
      schema: emailListSchema,
      annotations: { readOnlyHint: true },
      handler: bind(listEmailDrafts),
    },
    {
      name: "emails_get",
      description:
        "Read one family email by id. Does not send. Lead emails are refused.",
      scope: "emails",
      schema: emailGetSchema,
      annotations: { readOnlyHint: true },
      handler: bind(getEmail),
    },
    {
      name: "emails_create_draft",
      description:
        "Create a family email draft. Saves status draft with no scheduled time. Does not send, schedule, or test-send. Audience must be families.",
      scope: "emails",
      schema: emailCreateSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      idempotent: true,
      handler: bind(createEmailDraft),
    },
    {
      name: "emails_update_draft",
      description:
        "Update a family email while its status is draft. Refuses any other status. Does not send or schedule.",
      scope: "emails",
      schema: emailUpdateSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      handler: bind(updateEmailDraft),
    },
    {
      name: "emails_preview_recipients",
      description:
        "Count family recipients the app would email, with unsubscribes, missing consent, inactive residents, and the suppression list applied. Does not send.",
      scope: "emails",
      schema: emailPreviewSchema,
      annotations: { readOnlyHint: true },
      handler: bind(previewEmailRecipients),
    },
  ];
}
