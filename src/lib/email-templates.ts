/**
 * Ready-made email templates for the admin composer. Pick one from the dropdown
 * to fill the subject + message, then customize it for the lead or family.
 *
 * Placeholders:
 *   {{first_name}}  the recipient's first name (personalized per send)
 *   {{name}}        the recipient's full name
 *   [square]        details YOU fill in (a date, a time), left blank on purpose
 *   [[button:Label|https://…]]  renders as a filled call-to-action button
 *
 * VOICE (§2) and COMPLIANCE (§4) apply: no banned words, no em-dashes, Joy is a
 * personal care home (never "assisted living"), and nothing about an individual
 * resident goes to the families list. The letter shell (letterhead, badges,
 * footer, unsubscribe) is added automatically, so bodies start at the greeting.
 *
 * This file is pure data (client-safe): no server imports.
 */

export type TemplateAudience = "leads" | "families" | "any";

export type EmailTemplate = {
  id: string;
  label: string;
  audience: TemplateAudience;
  subject: string;
  body: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "leads-welcome",
    label: "New inquiry — welcome letter",
    audience: "leads",
    subject: "A note from Joy about your mother",
    body: `Dear {{first_name}},

# You can go back to being a daughter.

Thank you for reaching out about your mother. I know the asking is the hard part, so I will keep this plain.

Joy is a personal care home in Loganville with room for twenty-four residents. That number is the whole design. It is what lets us learn how your mother takes her coffee, and which chair your father claims after breakfast. And it is why, when something shifts (a harder night, a lost appetite) someone notices that day, because they knew what normal looked like yesterday.

Below is the house itself. No stock photos, no wide-angle lens making four rooms look like forty.

![The building at Joy Senior Living in Loganville](https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/the-joy/blog/664633a85061d1ce12331725-11-217278.jpg)

> "Walking into The Joy with my dad was like walking into a sanctuary of caring and calm."

Mike S., resident's son

You will want to know what it costs. The honest answer is that it depends on the room and the level of care, so it is a short conversation rather than a number on a page. Call and ask for me, and I will walk you through it. If Joy is not the right level of care for your mother, I will tell you that plainly and help you find where is.

[[button:Call (470) 684-3569|tel:+14706843569]]

Or simply reply to this email. It comes straight to me.

Warmly,

Mellissa Daniel
Executive Director, Joy Senior Living

*P.S.* If you are still in the "is it time?" part of this, we wrote something that may help: [the signs your parent was hoping you would not see](https://www.joyseniorcare.com/blog/after-the-summer-visit-signs-aging-parent-needs-help). No pressure in it, I promise.`,
  },
  {
    id: "leads-tour-invite",
    label: "Invite to a tour",
    audience: "leads",
    subject: "Come see Joy for yourself",
    body: `Dear {{first_name}},

The best way to understand a small home is to stand in it. Come by, meet me, and see the rooms, the kitchen, and the porch for yourself. A visit takes about an hour, and there is nothing to sign.

I can usually work around your schedule, including evenings and weekends. Tell me a day that works and I will hold a time for you.

[[button:Book a tour|https://www.joyseniorcare.com/tour]]

Or call and ask for me at (470) 684-3569.

Warmly,

Mellissa Daniel
Executive Director, Joy Senior Living`,
  },
  {
    id: "leads-check-in",
    label: "Gentle check-in (following up)",
    audience: "leads",
    subject: "Checking in from Joy",
    body: `Dear {{first_name}},

I wanted to check in, with no agenda. When you reached out about your parent, you were somewhere in the middle of a hard decision, and those do not move on anyone else's timeline.

If things have changed and you would like to talk, I am here. If they have not, that is fine too. Keep my number, and call whenever the moment is right.

Warmly,

Mellissa Daniel
Executive Director, Joy Senior Living

*P.S.* If it would help to read something honest while you think, here is [how to know when it is time](https://www.joyseniorcare.com/blog/is-it-time-for-senior-living-a-guide-to-knowing-when).`,
  },
  {
    id: "families-event",
    label: "Family event invitation",
    audience: "families",
    subject: "You are invited to Joy",
    body: `Dear {{first_name}},

We would love to have you at Joy for [event name] on [date] at [time]. [One or two plain sentences about what to expect: the food, the music, who will be there.]

No need to bring anything. Just come and spend a little time in the home.

If you can let us know you are coming, it helps us set enough places. Reply to this email or call (470) 684-3569.

Warmly,

Mellissa Daniel
Executive Director, Joy Senior Living`,
  },
  {
    id: "families-monthly",
    label: "Monthly note to families",
    audience: "families",
    subject: "This month at Joy",
    body: `Dear {{first_name}},

A short note on what the month held at Joy. [A sentence or two about a shared moment: a meal, an afternoon on the porch, a visitor, the change of season. Community-wide only, nothing about any one resident.]

Thank you for trusting us with your family. Our door is always open, and I am always glad to hear from you.

Warmly,

Mellissa Daniel
Executive Director, Joy Senior Living`,
  },
];

/** Templates offered for a given audience (plus the audience-agnostic ones). */
export function templatesForAudience(
  audience: "leads" | "families"
): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter(
    (t) => t.audience === audience || t.audience === "any"
  );
}
