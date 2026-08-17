import { query } from "./db";

/**
 * A Message is the reusable content of an email (subject + body). Each dispatch
 * is a broadcast (a Send) that points at one Message. The database enforces that
 * a contact receives a given Message at most once, ever, across every Send of
 * it (broadcast_recipients unique on (message_id, lead_id)). To deliberately
 * re-send the same copy, you DUPLICATE the Message: a new id, marked as a copy,
 * which the once-per-Message rule treats as distinct.
 */

export type Message = {
  id: string;
  subject: string;
  body: string;
  template_of: string | null;
  is_template: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function createMessage(input: {
  subject: string;
  body: string;
  createdBy?: string | null;
  isTemplate?: boolean;
  templateOf?: string | null;
}): Promise<Message> {
  const rows = await query<Message>(
    `INSERT INTO messages (subject, body, created_by, is_template, template_of)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.subject ?? "",
      input.body ?? "",
      input.createdBy ?? null,
      input.isTemplate ?? false,
      input.templateOf ?? null,
    ]
  );
  return rows[0];
}

export async function getMessageById(id: string): Promise<Message | null> {
  const rows = await query<Message>(`SELECT * FROM messages WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Keep a Message's content in sync with its (still-editable) broadcast. */
export async function updateMessageContent(
  id: string,
  subject: string,
  body: string
): Promise<void> {
  await query(
    `UPDATE messages SET subject = $2, body = $3, updated_at = now() WHERE id = $1`,
    [id, subject, body]
  );
}

/**
 * Duplicate a Message into a new one (marked as a copy). The copy has a fresh id,
 * so sending it is NOT blocked by the once-per-Message rule on the original.
 */
export async function duplicateMessage(
  sourceId: string,
  createdBy?: string | null
): Promise<Message | null> {
  const src = await getMessageById(sourceId);
  if (!src) return null;
  return createMessage({
    subject: src.subject,
    body: src.body,
    createdBy: createdBy ?? null,
    templateOf: src.id,
  });
}

/** Saved templates (is_template), newest first. */
export async function listTemplates(): Promise<Message[]> {
  return query<Message>(
    `SELECT * FROM messages WHERE is_template = TRUE ORDER BY updated_at DESC`
  );
}

export async function setMessageTemplate(
  id: string,
  isTemplate: boolean
): Promise<void> {
  await query(`UPDATE messages SET is_template = $2, updated_at = now() WHERE id = $1`, [
    id,
    isTemplate,
  ]);
}
