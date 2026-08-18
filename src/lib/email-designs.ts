/**
 * Ready-made HTML email DESIGNS (as opposed to the Markdown letter templates in
 * email-templates.ts). These are complete, email-safe HTML documents that are
 * sent STANDALONE, without the Joy letterhead/badges/footer shell (body_format
 * 'html_standalone'). Each carries its own footer with a real unsubscribe link
 * via the {{unsubscribe_url}} merge token, and personalizes with {{first_name}}.
 *
 * Fill the [bracketed placeholders] (resident name, day/date, time) before
 * sending, or let the birthday design generator fill them from your details.
 */

/**
 * The Joy birthday party invitation: confetti strips, a warm hero, and a
 * dashed party-details card. Pronoun-neutral and em-dash-free (house rules).
 */
export const BIRTHDAY_INVITE_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>You're invited to [resident's name]'s birthday party</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf6ec;">
<span style="display:none;font-size:1px;color:#fdf6ec;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Cake, ice cream, and good company. Join us to celebrate [resident's name]! 🎉</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fdf6ec;">
<tbody><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

<!-- Confetti top strip -->
<tbody><tr><td align="center" style="padding:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1;letter-spacing:6px;">
<span style="color:#e85d75;">●</span><span style="color:#f7b32b;">◆</span><span style="color:#4ea5a2;">●</span><span style="color:#9b6bc9;">▲</span><span style="color:#e85d75;">◆</span><span style="color:#f7b32b;">●</span><span style="color:#4ea5a2;">▲</span><span style="color:#9b6bc9;">●</span><span style="color:#e85d75;">▲</span><span style="color:#f7b32b;">◆</span><span style="color:#4ea5a2;">●</span>
</td></tr>

<!-- Hero -->
<tr><td style="padding:0 0 8px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e85d75;border-radius:16px 16px 0 0;">
<tbody><tr><td align="center" style="padding:36px 24px 8px 24px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#ffd9e0;font-weight:bold;mso-line-height-rule:exactly;line-height:1.4;">💙 You're invited 💙</div>
</td></tr>
<tr><td align="center" style="padding:6px 24px 4px 24px;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:44px;line-height:1.15;color:#ffffff;font-weight:bold;mso-line-height-rule:exactly;">[resident's name]'s Birthday Party!</div>
</td></tr>
<tr><td align="center" style="padding:8px 24px 32px 24px;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.5;color:#ffe9ed;font-style:italic;mso-line-height-rule:exactly;">Another year young, and that calls for cake 🎂</div>
</td></tr>
</tbody></table>
<!-- Bunting strip -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tbody><tr>
<td width="20%" height="10" style="background-color:#f7b32b;font-size:1px;line-height:1px;">&nbsp;</td>
<td width="20%" height="10" style="background-color:#4ea5a2;font-size:1px;line-height:1px;">&nbsp;</td>
<td width="20%" height="10" style="background-color:#9b6bc9;font-size:1px;line-height:1px;">&nbsp;</td>
<td width="20%" height="10" style="background-color:#f7b32b;font-size:1px;line-height:1px;">&nbsp;</td>
<td width="20%" height="10" style="background-color:#4ea5a2;font-size:1px;line-height:1px;">&nbsp;</td>
</tr>
</tbody></table>
</td></tr>

<!-- Body copy -->
<tr><td style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:0 0 16px 16px;">
<tbody><tr><td style="padding:32px 36px 0 36px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.6;color:#2b2b33;mso-line-height-rule:exactly;">Hi {{first_name}},</td></tr>
<tr><td style="padding:14px 36px 0 36px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.6;color:#55555f;mso-line-height-rule:exactly;">It's party time here at Joy! Our wonderful [resident's name] has a birthday, and we would love nothing more than to celebrate with a room full of friendly faces (yours included).</td></tr>
<tr><td style="padding:14px 36px 26px 36px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.6;color:#55555f;mso-line-height-rule:exactly;">Come for the cake, stay for the ice cream, and help us make [resident's name]'s day one to remember.</td></tr>

<!-- Party details card -->
<tr><td style="padding:0 28px 26px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff6e3;border-radius:14px;border:2px dashed #f7b32b;">
<tbody><tr><td style="padding:24px 26px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#c98a2c;font-weight:bold;padding-bottom:14px;mso-line-height-rule:exactly;line-height:1.4;">🎊 The party plan 🎊</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tbody><tr>
<td width="34" valign="top" style="font-size:20px;line-height:1.5;padding:4px 0;">📅</td>
<td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.5;color:#2b2b33;padding:4px 0;mso-line-height-rule:exactly;"><strong style="color:#e85d75;">When:</strong> [day and date] at [time]</td>
</tr>
<tr>
<td width="34" valign="top" style="font-size:20px;line-height:1.5;padding:4px 0;">🏠</td>
<td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.5;color:#2b2b33;padding:4px 0;mso-line-height-rule:exactly;"><strong style="color:#4ea5a2;">Where:</strong> Joy Senior Living in Loganville</td>
</tr>
<tr>
<td width="34" valign="top" style="font-size:20px;line-height:1.5;padding:4px 0;">🍦</td>
<td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.5;color:#2b2b33;padding:4px 0;mso-line-height-rule:exactly;"><strong style="color:#9b6bc9;">Treats:</strong> Birthday cake and ice cream, of course!</td>
</tr>
</tbody></table>
</td></tr>
</tbody></table>
</td></tr>

<tr><td align="center" style="padding:0 36px 26px 36px;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.5;color:#8a8a94;mso-line-height-rule:exactly;">Questions? Mellissa Daniel and our team are happy to help you plan your visit.</td></tr>

<tr><td style="padding:0 36px 6px 36px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.6;color:#2b2b33;mso-line-height-rule:exactly;">We can't wait to see you there!</td></tr>
<tr><td style="padding:0 36px 34px 36px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.6;color:#2b2b33;mso-line-height-rule:exactly;">Warmly,<br>Mellissa Daniel and the team at Joy Senior Living 💙</td></tr>
</tbody></table>
</td></tr>

<!-- Confetti bottom strip -->
<tr><td align="center" style="padding:16px 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1;letter-spacing:6px;">
<span style="color:#4ea5a2;">▲</span><span style="color:#e85d75;">●</span><span style="color:#f7b32b;">◆</span><span style="color:#9b6bc9;">●</span><span style="color:#4ea5a2;">◆</span><span style="color:#e85d75;">▲</span><span style="color:#f7b32b;">●</span>
</td></tr>

<!-- Footer (standalone: this is the only footer, so it carries the unsubscribe) -->
<tr><td align="center" style="padding:10px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#a5a5ad;mso-line-height-rule:exactly;">
<span style="font-size:16px;">💙</span> Joy Senior Living • Loganville, GA<br>
You're receiving this because you're part of the Joy family. <a href="{{unsubscribe_url}}" style="color:#a5a5ad;text-decoration:underline;">Unsubscribe</a>
</td></tr>

</tbody></table>
</td></tr>
</tbody></table>
</body></html>`;

/** Named HTML designs for the composer's design picker. */
export const EMAIL_DESIGNS: {
  id: string;
  label: string;
  subject: string;
  html: string;
  format: "html_standalone";
}[] = [
  {
    id: "birthday-invite",
    label: "🎂 Birthday party invite",
    subject: "You're invited to [resident's name]'s birthday party",
    html: BIRTHDAY_INVITE_HTML,
    format: "html_standalone",
  },
];
