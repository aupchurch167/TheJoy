/**
 * Partner outreach email templates for the Partners CRM email composer.
 * Pure/client-safe (no DB). Bodies are Markdown (the composer renders Markdown)
 * and follow the Joy voice: competent operator to a busy clinician, one ask,
 * short, no em-dashes (parentheses/commas instead), no banned words.
 *
 * [BRACKETS] are fill-ins the sender completes. A few are auto-filled from the
 * partner record via applyTemplateTokens(): [Name] -> contact first name,
 * [hospital]/[facility] -> the partner's organization. Everything else stays a
 * bracket so the sender reviews it.
 */

export type PartnerEmailTemplate = {
  id: string;
  category: string;
  name: string;
  subject: string;
  body: string;
};

const SIG_ADAM = `Adam Upchurch
The Joy Senior Living of Loganville
(470) 684-3569 · joyseniorcare.com`;

export const PARTNER_EMAIL_TEMPLATES: PartnerEmailTemplate[] = [
  {
    id: "cold-hospital",
    category: "Cold outreach",
    name: "Hospital discharge planner / case manager",
    subject:
      "Same-day PCH assessments near [Walton/Eastside] (24-suite home in Loganville)",
    body: `[Name],

I'm Adam, owner of The Joy Senior Living in Loganville, a 24-suite licensed personal care home about [15] minutes from [hospital]. Our Executive Director, Mellissa Daniel, RN, has 20+ years, and our nurse is Marla Allen. They do our assessments, bedside if that's easier for you.

Two things that make us useful for tough discharges:

- **Respite stays** (a few days to a few weeks, full care) for when the family isn't ready to commit to anything permanent but the discharge can't wait.
- **Fast, honest answers.** Describe the patient and Mellissa will tell you within hours if it's a fit. If it's not, she'll say so and point you somewhere that is.

Personal care, memory care, private suites, 24/7 staff. I've attached a one-page fact sheet with our clinical fit criteria.

Can I drop off a packet this week, or would 15 minutes work better?

${SIG_ADAM}`,
  },
  {
    id: "cold-rehab-snf",
    category: "Cold outreach",
    name: "Rehab / SNF discharge coordinator",
    subject: "Step-down option for patients who can't return home (Loganville PCH)",
    body: `[Name],

When a patient finishes rehab at [facility] but can't safely go home and doesn't need skilled nursing, we can help.

The Joy is a 24-suite personal care home in Loganville. Private suites, 24/7 awake staff, medication management. We take personal care, memory care, and respite.

We're equally quick to say no: no vents, IVs, or two-person transfers. Fit criteria are on the attached one-pager, so you can rule us in or out in 30 seconds.

Who's the right person to keep in the loop on placements, you or someone on your team? Happy to bring lunch for the group and give you faces to put with the phone number.

Adam`,
  },
  {
    id: "cold-home-health",
    category: "Cold outreach",
    name: "Home health / private-duty agency (reciprocal)",
    subject: "Referral relationship both directions (Joy Senior Living, Loganville)",
    body: `[Name],

Short version: I think we can send each other business.

I'm with The Joy Senior Living, a 24-suite personal care home in Loganville. Families call us constantly who are ready to find a small, well-equipped community.

When your clients' needs outgrow what's safe at home, we're a small-home option where your team is welcome to keep serving them in-house. We like continuity, and outside agencies work inside The Joy every week.

Worth a 15-minute call?

Adam
(470) 684-3569`,
  },
  {
    id: "cold-elder-law",
    category: "Cold outreach",
    name: "Elder law attorney / senior-focused professional",
    subject: "A straight-answer senior living resource for your clients (Loganville)",
    body: `[Name],

Your clients ask you where mom should live, and it's not your job to know, but handing them a good answer makes you look good.

The Joy is a 24-suite personal care home in Loganville (personal care, memory care, respite). One thing your clients will care about: pricing is published on our site, from $5,000/month.

I just wanted to introduce our community in case a client ever has a need that fits with us. Can I send a few packets for your office?

Adam Upchurch · The Joy Senior Living · joyseniorcare.com/cost`,
  },
  {
    id: "followup-no-response",
    category: "Follow-up",
    name: "No response to cold email (day 6-8)",
    subject: "Re: [original subject]",
    body: `[Name], following up once.

The 10-second version: 24-suite personal care home in Loganville, director does bedside assessments, respite available when families can't decide.

If discharge placements aren't your lane, could you point me to the right person? Either way I'll stop cluttering your inbox.

(470) 684-3569, Adam`,
  },
  {
    id: "invite-lunch-tour",
    category: "Invite",
    name: "Lunch-and-tour (for a department)",
    subject: "Lunch at The Joy for your team, pick a date",
    body: `[Name],

I'd like to host you and your team for lunch here at The Joy: see the home, meet Mellissa, and put faces to the place before you ever need to send someone.

We'll feed you well (everything's cooked in-house, and it's really good), walk you through in 20 minutes, and you'll leave knowing exactly which patients to think of us for and which not to.

Any day work in the next few weeks? We'll work around your schedule.

Adam & Mellissa
434 Conyers Rd, Loganville`,
  },
  {
    id: "warm-followup-meeting",
    category: "Follow-up",
    name: "After a meeting, tour, or drop-in",
    subject: "Good meeting you, [Name], what to keep on file",
    body: `[Name],

Thanks for the time today. Keeping it short since you're busy:

- **Fit:** personal care, memory care, respite. Not skilled nursing (no vents, IVs, two-person transfers).
- **Census line:** (470) 684-3569, call or text for today's availability.
- Packet attached again so it's in your email, not just your desk drawer.

The next hard discharge you have that might fit, call before you've solved it, not after. Worst case Mellissa says no fast and you've lost five minutes.

Adam`,
  },
  {
    id: "thankyou-referral",
    category: "Referral outcome",
    name: "Thank you, referral received (same day)",
    subject: "Got your referral, thank you",
    body: `[Name],

Thank you for thinking of us for [patient first name]. Mellissa [is scheduling the assessment for tomorrow / did the assessment this afternoon / is reaching out to the family today].

I'll close the loop with you either way. If it's not a fit, you'll hear that from us fast with a reason, not silence.

Appreciate the trust. It won't be wasted.

Adam
(470) 684-3569`,
  },
  {
    id: "outcome-movein",
    category: "Referral outcome",
    name: "Placement happened (move-in)",
    subject: "Update on [patient first name], settled in",
    body: `[Name], wanted you to know [patient first name] moved in [Tuesday]. Family seemed relieved, and Mellissa's team has the care plan running. Thank you again for the referral. This is what we're for.

Adam`,
  },
  {
    id: "outcome-30day",
    category: "Referral outcome",
    name: "Placement 30-day update",
    subject: "30 days in: [patient first name]",
    body: `[Name], quick 30-day note on [patient first name]: [one genuine specific, HIPAA-safe, e.g. "she's claimed the porch rocker and runs the puzzle table" / "his meds are stabilized and his daughter says he's eating again"]. The point is they didn't disappear into a building.

You made a good call. Send us the next hard one.

Adam`,
  },
  {
    id: "outcome-declined",
    category: "Referral outcome",
    name: "Referral we declined",
    subject: "Your referral, not a fit, here's why and where to try",
    body: `[Name],

Thank you for sending [patient first name] our way. After Mellissa's review, not a safe fit for us: [reason at appropriate generality, e.g. "the transfer needs are beyond a one-person assist" / "the care level is skilled nursing, not PCH"].

Rather than leave you hanging: [alternative, e.g. "this profile usually needs an SNF; X and Y are closest to the family" / "a larger AL with lift equipment might work, Z takes two-person transfers"].

Send the next one. The fast no is part of the service.

Mellissa Daniel, RN
Executive Director, The Joy Senior Living`,
  },
  {
    id: "census-availability",
    category: "Census",
    name: "Availability broadcast (max ~1/month, only when true)",
    subject: "The Joy: [2] suites open as of [date]",
    body: `Quick census note for your files: we have [two private suites] available as of [date] ([one in personal care, one in the memory care wing]). In a 24-suite home these don't stay open long.

Profiles that fit best right now: [e.g., "ambulatory or one-person assist, personal care or early-to-mid memory care"]. Respite also available.

Need an assessment: (470) 684-3569.

Mellissa & Adam`,
  },
  {
    id: "reengagement-quiet",
    category: "Re-engagement",
    name: "Partner gone quiet 60-90 days",
    subject: "Still here, still fast, one thing worth knowing",
    body: `[Name],

It's been a couple months, no ask, just keeping us findable.

One update worth having on file: [pick ONE true thing, e.g. "we've had good outcomes lately with post-hospital respite stays that turned permanent once the family exhaled" / "Mellissa's now doing bedside assessments at [hospital] within hours of a call" / "we just published our rates publicly, from $4,500 all-in, which makes the family conversation easier"].

Census line's the same: (470) 684-3569.

Adam`,
  },
];

/**
 * Fill the tokens we can resolve from the partner record. [Name] becomes the
 * contact's first name; [hospital]/[facility] become the organization. Other
 * [BRACKETS] are intentionally left for the sender to complete.
 */
export function applyTemplateTokens(
  text: string,
  ctx: { contactName?: string | null; organization?: string | null }
): string {
  let out = text;
  const first = (ctx.contactName || "").trim().split(/\s+/)[0];
  if (first) out = out.split("[Name]").join(first);
  if (ctx.organization) {
    out = out.split("[hospital]").join(ctx.organization);
    out = out.split("[facility]").join(ctx.organization);
  }
  return out;
}
