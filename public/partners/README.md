# Partner downloads (`/partners`)

Drop the three partner PDFs into **this folder** (`public/partners/`). Next.js
serves everything in `public/` from the site root, so a file here is reachable
at `https://www.joyseniorcare.com/partners/<filename>`.

Expected filenames (kebab-case, exact):

| File | Shown on the page as | URL when live |
| --- | --- | --- |
| `partner-fact-sheet.pdf` | Partner Fact Sheet | `/partners/partner-fact-sheet.pdf` |
| `rate-card.pdf` | Rate Card | `/partners/rate-card.pdf` |
| `photo-tour.pdf` | Photo Tour | `/partners/photo-tour.pdf` |

Notes:

- The `/partners` page checks whether each file exists at build time. Until a
  file is dropped in, its card shows a quiet "being finalized" note instead of a
  broken download link. Add the file and redeploy and the "Download PDF" button
  appears automatically. No code change needed.
- The fact sheet may arrive named `partner-packet.pdf`; the page also accepts
  that name for the fact sheet. Prefer `partner-fact-sheet.pdf` if you can rename.
- Keep the exact filenames above so the links stay stable.
