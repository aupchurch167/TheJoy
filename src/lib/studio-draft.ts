import type { EmailModel } from "./email-model";

/**
 * A new email the operator writes themselves. Same fields the studio editor
 * already saves. Greeting and sign-off have safe defaults so a blank draft
 * still previews. Subject, headline, and message stay empty until they type.
 * Send checks those (see studioSendBlockReason). Create and save do not.
 */
export function blankEmailModel(): EmailModel {
  return {
    theme: "classic",
    eyebrow: "",
    heroTitle: "",
    heroSub: "",
    greeting: "Hi {{first_name}},",
    intro: "",
    plan: null,
    cta: null,
    rsvpUrl: null,
    photoUrl: null,
    bodyPhotoUrl: null,
    bodyPhotoUrls: null,
    closing: "Warmly,\nMellissa and the Joy team",
  };
}

/** Payload for saveStudioDraft. Empty subject is stored as "(no subject yet)". */
export function blankStudioSaveInput(): {
  subject: string;
  audience: "families";
  model: EmailModel;
} {
  return {
    subject: "",
    audience: "families",
    model: blankEmailModel(),
  };
}

/** True once there is a headline or a message. Greeting and sign-off do not count. */
export function studioModelHasWords(m: {
  heroTitle?: string | null;
  intro?: string | null;
}): boolean {
  return !!(m.heroTitle?.trim() || m.intro?.trim());
}

/**
 * Why a studio email cannot be sent or scheduled yet. Null means the content
 * checks pass. Saving a draft does not use this.
 */
export function studioSendBlockReason(
  subject: string,
  model: { heroTitle?: string | null; intro?: string | null }
): string | null {
  if (!subject.trim()) return "Add a subject before sending.";
  if (!studioModelHasWords(model))
    return "Write a headline or a message before sending.";
  return null;
}
