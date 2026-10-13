import { z } from "zod";
import {
  createBroadcast,
  forceUnsentBackToDraft,
  getBroadcastById,
  listChannelDrafts,
  updateDraftBroadcast,
  type Broadcast,
} from "../../broadcasts";
import { countSmsRecipients } from "../../leads";
import { McpToolError } from "../errors";
import type { McpTool, ToolSuccess } from "../execute";
import { assertDraftRow, guardCreatedDraft } from "../guard";
import { smsFullContent, SMS_OPT_OUT_LINE, stripSmsOptOut } from "../text-draft";

const idempotencyField = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .optional()
  .describe("Optional. A retry with the same key returns the first draft.");

const bodyField = z
  .string()
  .trim()
  .min(1, "Write a message first.")
  .max(1000, "Keep texts short (under 1000 characters).")
  .describe(
    "The message. Reply STOP to opt out. is appended automatically and is not stored on the draft."
  );

export const textCreateSchema = z
  .object({
    body: bodyField,
    idempotency_key: idempotencyField,
  })
  .strict();

export const textUpdateSchema = z
  .object({
    id: z.string().uuid(),
    body: bodyField,
  })
  .strict();

export const textListSchema = z
  .object({
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const textPreviewSchema = z
  .object({
    body: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .describe("Optional message. When set, the result includes it with the opt-out line."),
  })
  .strict();

export type TextRow = Pick<
  Broadcast,
  | "id"
  | "subject"
  | "body"
  | "audience"
  | "channel"
  | "status"
  | "scheduled_at"
  | "updated_at"
>;

export type TextDeps = {
  create: (body: string) => Promise<TextRow>;
  update: (id: string, body: string) => Promise<TextRow | null>;
  getById: (id: string) => Promise<TextRow | null>;
  listDrafts: (limit: number) => Promise<TextRow[]>;
  countRecipients: () => Promise<number>;
  revert: (id: string) => Promise<void>;
};

export const defaultTextDeps: TextDeps = {
  async create(body) {
    return createBroadcast("", body, "families", "sms");
  },
  async update(id, body) {
    return updateDraftBroadcast(id, {
      subject: "",
      body,
      format: "markdown",
      modelJson: null,
      audience: "families",
      channel: "sms",
    });
  },
  getById: (id) => getBroadcastById(id),
  listDrafts: (limit) => listChannelDrafts("sms", limit, { audience: "families" }),
  countRecipients: () => countSmsRecipients(),
  revert: (id) => forceUnsentBackToDraft(id),
};

function storedBody(body: string): string {
  const core = stripSmsOptOut(body);
  if (!core) throw new McpToolError("Write a message first.");
  if (core.length > 1000) {
    throw new McpToolError("Keep texts short (under 1000 characters).");
  }
  return core;
}

function view(row: TextRow) {
  return {
    id: row.id,
    audience: row.audience,
    channel: row.channel,
    status: row.status,
    scheduled_at: row.scheduled_at,
    updated_at: row.updated_at,
    body: row.body,
    full_body: smsFullContent(row.body),
    opt_out_line: SMS_OPT_OUT_LINE,
  };
}

function requireText(row: TextRow | null): TextRow {
  if (!row || row.channel !== "sms") throw new McpToolError("No text with that id.");
  if (row.audience !== "families") throw new McpToolError("Audience must be families.");
  return row;
}

export async function createTextDraft(
  input: z.infer<typeof textCreateSchema>,
  deps: TextDeps
): Promise<ToolSuccess> {
  const body = storedBody(input.body);
  const row = await deps.create(body);
  await guardCreatedDraft(row, deps.revert);
  return { ref: row.id, data: view(row) };
}

export async function updateTextDraft(
  input: z.infer<typeof textUpdateSchema>,
  deps: TextDeps
): Promise<ToolSuccess> {
  const existing = requireText(await deps.getById(input.id));
  if (existing.status !== "draft") throw new McpToolError("Only drafts can be updated.");
  const body = storedBody(input.body);
  const updated = await deps.update(existing.id, body);
  if (!updated) throw new McpToolError("Only drafts can be updated.");
  assertDraftRow(updated);
  return { ref: updated.id, data: view(updated) };
}

export async function listTextDrafts(
  input: z.infer<typeof textListSchema>,
  deps: TextDeps
): Promise<ToolSuccess> {
  const rows = await deps.listDrafts(input.limit ?? 50);
  return {
    ref: `count:${rows.length}`,
    data: { drafts: rows.map(view) },
  };
}

export async function previewTextRecipients(
  input: z.infer<typeof textPreviewSchema>,
  deps: TextDeps
): Promise<ToolSuccess> {
  const count = await deps.countRecipients();
  return {
    ref: `count:${count}`,
    data: {
      count,
      audience: "families",
      sms_consent: true,
      opted_out_excluded: true,
      active_only: true,
      opt_out_line: SMS_OPT_OUT_LINE,
      ...(input.body ? { full_body: smsFullContent(input.body) } : {}),
    },
  };
}

export function textTools(deps: TextDeps = defaultTextDeps): McpTool[] {
  const bind =
    <T,>(fn: (input: T, deps: TextDeps) => Promise<ToolSuccess>) =>
    (args: unknown) => fn(args as T, deps);

  return [
    {
      name: "texts_create_draft",
      description:
        "Create a family text draft. Stores the message without the opt-out line. Does not send. Reply STOP to opt out. is appended automatically when a person sends from the admin.",
      scope: "texts",
      schema: textCreateSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      idempotent: true,
      handler: bind(createTextDraft),
    },
    {
      name: "texts_update_draft",
      description:
        "Update a family text draft while its status is draft. Does not send or schedule.",
      scope: "texts",
      schema: textUpdateSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      handler: bind(updateTextDraft),
    },
    {
      name: "texts_list_drafts",
      description: "List family text drafts (status draft). Does not send.",
      scope: "texts",
      schema: textListSchema,
      annotations: { readOnlyHint: true },
      handler: bind(listTextDrafts),
    },
    {
      name: "texts_preview_recipients",
      description:
        "Count family text recipients: audience families, active, sms_consent true, sms_opt_out_at null, and a non-empty phone. Does not send.",
      scope: "texts",
      schema: textPreviewSchema,
      annotations: { readOnlyHint: true },
      handler: bind(previewTextRecipients),
    },
  ];
}
