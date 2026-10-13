import {
  PHOTO_THEMES,
  renderEmailModel,
  type EmailModel,
  type EmailTheme,
} from "../email-model";
import { stripMarkdown } from "../markdown";
import { McpToolError } from "./errors";

/**
 * Audiences MCP may draft. `partners` stays off until `broadcasts.audience`
 * allows it (the check constraint in db/schema.sql). Leads are never allowed.
 */
export const MCP_EMAIL_AUDIENCES = ["families"] as const;
export type McpEmailAudience = (typeof MCP_EMAIL_AUDIENCES)[number];

export function assertMcpEmailAudience(value: string | undefined): McpEmailAudience {
  const audience = value ?? "families";
  if ((MCP_EMAIL_AUDIENCES as readonly string[]).includes(audience)) {
    return audience as McpEmailAudience;
  }
  if (audience === "leads") {
    throw new McpToolError("Leads are out of scope.");
  }
  if (audience === "partners") {
    throw new McpToolError(
      "Partner broadcasts are not set up. Use audience families."
    );
  }
  throw new McpToolError("Audience must be families.");
}

export function assertPhotoUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new McpToolError("Photo URL must be an http(s) URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new McpToolError("Photo URL must be an http(s) URL.");
  }
  if (/[\s()]/.test(url)) {
    throw new McpToolError("Photo URL cannot contain spaces or parentheses.");
  }
  return url;
}

export type ComposedEmail = {
  subject: string;
  body: string;
  audience: McpEmailAudience;
  format: "markdown" | "html_standalone";
  modelJson: EmailModel | null;
};

function themed(
  subject: string,
  body: string,
  theme: EmailTheme,
  photoUrl: string | undefined,
  audience: McpEmailAudience
): ComposedEmail {
  const text = stripMarkdown(body);
  const parts = text.split(/\n\n+/).filter((part) => part.length > 0);
  const greeting = parts[0] ?? "";
  const intro = parts.slice(1).join("\n\n");
  const spotlight = PHOTO_THEMES.includes(theme);
  const model: EmailModel = {
    theme,
    greeting,
    intro,
    closing: "",
    photoUrl: spotlight ? (photoUrl ?? null) : null,
    bodyPhotoUrls: !spotlight && photoUrl ? [photoUrl] : null,
  };
  return {
    subject,
    body: renderEmailModel(model),
    audience,
    format: "html_standalone",
    modelJson: model,
  };
}

function withMarkdownPhoto(body: string, photoUrl: string | undefined): string {
  const stripped = body.replace(/\n*!\[\]\([^)\n]*\)\s*$/, "").trim();
  if (!photoUrl) return stripped;
  return `${stripped}\n\n![](${photoUrl})`;
}

/**
 * Turn MCP input into the same shapes the admin stores: Markdown for the
 * letter composer, or a studio model (rendered with renderEmailModel) when a
 * theme is set. A photo without a theme is a Markdown image, which the letter
 * shell already renders.
 */
export function composeEmailDraft(input: {
  subject: string;
  body: string;
  audience?: string;
  theme?: EmailTheme;
  photoUrl?: string;
}): ComposedEmail {
  const audience = assertMcpEmailAudience(input.audience);
  const subject = input.subject.trim();
  const photoUrl = input.photoUrl ? assertPhotoUrl(input.photoUrl) : undefined;
  if (!subject) throw new McpToolError("A subject is required.");
  if (!input.body.trim()) throw new McpToolError("Write the email body first.");
  if (input.theme) {
    return themed(subject, input.body, input.theme, photoUrl, audience);
  }
  return {
    subject,
    body: withMarkdownPhoto(input.body.trim(), photoUrl),
    audience,
    format: "markdown",
    modelJson: null,
  };
}

type StoredEmail = {
  subject: string;
  body: string;
  body_format: string;
  model_json: unknown;
};

function modelTheme(model: unknown): EmailTheme | undefined {
  if (!model || typeof model !== "object" || !("theme" in model)) return undefined;
  const theme = (model as { theme?: unknown }).theme;
  return typeof theme === "string" ? (theme as EmailTheme) : undefined;
}

function modelPhoto(model: unknown): string | undefined {
  if (!model || typeof model !== "object") return undefined;
  const row = model as { photoUrl?: unknown; bodyPhotoUrls?: unknown };
  if (typeof row.photoUrl === "string" && row.photoUrl) return row.photoUrl;
  if (Array.isArray(row.bodyPhotoUrls)) {
    const first = row.bodyPhotoUrls.find((url) => typeof url === "string" && url);
    if (typeof first === "string") return first;
  }
  return undefined;
}

/** Prefer the studio's plain fields over the rendered HTML when rewriting. */
function textFromStored(existing: StoredEmail, patchBody?: string): string {
  if (patchBody != null) return patchBody;
  const model = existing.model_json;
  if (model && typeof model === "object" && ("greeting" in model || "intro" in model)) {
    const row = model as { greeting?: unknown; intro?: unknown };
    const greeting = typeof row.greeting === "string" ? row.greeting : "";
    const intro = typeof row.intro === "string" ? row.intro : "";
    return [greeting, intro].filter((part) => part.trim()).join("\n\n");
  }
  return existing.body;
}

/**
 * Apply a partial update. Subject-only edits keep the body. A theme, body, or
 * photo rebuilds the draft. Themed drafts stay themed.
 */
export function mergeEmailDraft(
  existing: StoredEmail,
  patch: {
    subject?: string;
    body?: string;
    audience?: string;
    theme?: EmailTheme;
    photoUrl?: string;
  }
): ComposedEmail {
  const audience = assertMcpEmailAudience(patch.audience ?? "families");
  const subject = (patch.subject ?? existing.subject).trim();
  if (!subject) throw new McpToolError("A subject is required.");

  const theme = patch.theme ?? modelTheme(existing.model_json);
  const existingPhoto = modelPhoto(existing.model_json);
  const photoUrl = patch.photoUrl
    ? assertPhotoUrl(patch.photoUrl)
    : existingPhoto;

  const rebuild = Boolean(patch.theme || patch.body || patch.photoUrl);
  if (rebuild && theme) {
    return themed(subject, textFromStored(existing, patch.body), theme, photoUrl, audience);
  }
  if (rebuild) {
    const body = patch.body ?? existing.body;
    if (!body.trim()) throw new McpToolError("Write the email body first.");
    return {
      subject,
      body: withMarkdownPhoto(body, patch.photoUrl ? photoUrl : undefined),
      audience,
      format: "markdown",
      modelJson: null,
    };
  }
  return {
    subject,
    body: existing.body,
    audience,
    format: existing.body_format === "html_standalone" ? "html_standalone" : "markdown",
    modelJson:
      existing.model_json && typeof existing.model_json === "object"
        ? (existing.model_json as EmailModel)
        : null,
  };
}
