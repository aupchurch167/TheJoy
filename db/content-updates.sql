-- One-time copy updates for the Bing "meta description too short" flags.
-- Applied on boot with the schema (see src/instrumentation.ts). Safe to re-run:
-- a row is updated only while its public description is still the short text
-- Bing reported. Later edits in Admin are left alone.
--
-- Posts live in Postgres. The public description is meta_description when that
-- column is set, otherwise excerpt. The Webflow import only fills excerpt, and
-- the blog cards, meta description, og:description, and Article JSON-LD all
-- read that same value. These statements write the new text into excerpt, and
-- into meta_description only when that override is already non-blank, so a
-- short override cannot keep winning over the new excerpt.

-- budgeting-for-senior-care-how-to-prepare-for-the-ever-raising-cost-of-senior-care (77 -> 155)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$Are you Prepared for rising senior care costs? Download our budget guide now!$md$ THEN $md$Planning for a parent's care? Our free workbook compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Planning for a parent's care? Our free workbook compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$budgeting-for-senior-care-how-to-prepare-for-the-ever-raising-cost-of-senior-care$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Are you Prepared for rising senior care costs? Download our budget guide now!$md$;

-- what-to-look-for-in-an-assisted-living-community-from-people-who-run-one (74 -> 157)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$ THEN $md$Touring assisted living for Mom or Dad? The team behind a 24-resident personal care home in Loganville, GA shares what to look for in staff, size, red flags.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Touring assisted living for Mom or Dad? The team behind a 24-resident personal care home in Loganville, GA shares what to look for in staff, size, red flags.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$;

-- 10-questions-youll-wish-you-asked-your-parents-sooner (54 -> 159)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$10 Questions You'll Wish You Asked Your Parents Sooner$md$ THEN $md$Ten questions to ask your parents now, from the biggest risk they ever took to family stories nobody tells anymore, plus easy ways to ask and save the answers.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Ten questions to ask your parents now, from the biggest risk they ever took to family stories nobody tells anymore, plus easy ways to ask and save the answers.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$10-questions-youll-wish-you-asked-your-parents-sooner$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$10 Questions You'll Wish You Asked Your Parents Sooner$md$;

-- hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy (51 -> 157)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$What Our Families Are Sharing About Life at The Joy$md$ THEN $md$Read what families say about life at The Joy in Loganville, GA: staff who feel like family, home-cooked meals, memory care, and a small home of 24 residents.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Read what families say about life at The Joy in Loganville, GA: staff who feel like family, home-cooked meals, memory care, and a small home of 24 residents.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$What Our Families Are Sharing About Life at The Joy$md$;

-- you-dont-have-to-be-falling-apart-to-take-a-break (71 -> 157)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$You Don't Have to Be Falling Apart to Take a Break - Respite at the Joy$md$ THEN $md$Caring for a parent and running on empty? Learn how a few days of respite care at The Joy in Loganville, GA lets caregivers rest while Mom is safe and known.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Caring for a parent and running on empty? Learn how a few days of respite care at The Joy in Loganville, GA lets caregivers rest while Mom is safe and known.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$you-dont-have-to-be-falling-apart-to-take-a-break$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$You Don't Have to Be Falling Apart to Take a Break - Respite at the Joy$md$;

-- how-families-stay-connected-at-the-joy (72 -> 157)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$At The Joy Senior Living, we make it easy for families to stay connected$md$ THEN $md$How families stay close to Mom or Dad at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$How families stay close to Mom or Dad at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$how-families-stay-connected-at-the-joy$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$At The Joy Senior Living, we make it easy for families to stay connected$md$;

-- how-families-stay-connected-at-the-joy, voice-guide follow-up (157 -> 157)
-- Databases that already ran the statement above hold the first rewrite
-- ("...close to loved ones..."). Move that exact text to the voice-guide
-- wording. A row whose public description was edited in Admin is left alone.
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$How families stay close to loved ones at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$ THEN $md$How families stay close to Mom or Dad at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN btrim(meta_description) = $md$How families stay close to loved ones at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$ THEN $md$How families stay close to Mom or Dad at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$how-families-stay-connected-at-the-joy$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$How families stay close to loved ones at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$;

-- nourishing-the-golden-years-the-vital-role-of-nutrition-in-senior-living (33 -> 158)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$Nourish seniors with joy and care$md$ THEN $md$Why nutrition matters more with age, including for seniors with dementia, and how home-style meals at our Loganville personal care home nourish body and soul.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Why nutrition matters more with age, including for seniors with dementia, and how home-style meals at our Loganville personal care home nourish body and soul.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$nourishing-the-golden-years-the-vital-role-of-nutrition-in-senior-living$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Nourish seniors with joy and care$md$;

-- the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga (85 -> 154)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$The Joy Senior Living celebrates the Best of Senior Living award from A Place for Mom$md$ THEN $md$Our Loganville, GA home earned A Place for Mom's Best of Senior Living award, based on family reviews. A thank-you to our caregivers, cooks, and families.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Our Loganville, GA home earned A Place for Mom's Best of Senior Living award, based on family reviews. A thank-you to our caregivers, cooks, and families.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$The Joy Senior Living celebrates the Best of Senior Living award from A Place for Mom$md$;

-- we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom (75 -> 158)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$We just received our 2026 Best of Senior Living award from A Place for Mom.$md$ THEN $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, who leads our Loganville, GA home every single day.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, who leads our Loganville, GA home every single day.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$We just received our 2026 Best of Senior Living award from A Place for Mom.$md$;

-- maybe-its-time-for-a-little-more-joy (37 -> 159)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$Maybe It's Time for a Little More Joy$md$ THEN $md$Noticing unopened mail, missed pills, or an empty fridge at Mom's house? Learn the signs a parent may need more support and what a caring next step looks like.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Noticing unopened mail, missed pills, or an empty fridge at Mom's house? Learn the signs a parent may need more support and what a caring next step looks like.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$maybe-its-time-for-a-little-more-joy$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Maybe It's Time for a Little More Joy$md$;

-- understand-dementia-what-why-how-to-care-for-loved-ones (56 -> 158)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$Practical tips and strategies for Alzheimer's caregivers$md$ THEN $md$New to dementia caregiving? Learn the common symptoms, types like Alzheimer's and vascular dementia, how it's diagnosed, and how to plan routines and support.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$New to dementia caregiving? Learn the common symptoms, types like Alzheimer's and vascular dementia, how it's diagnosed, and how to plan routines and support.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$understand-dementia-what-why-how-to-care-for-loved-ones$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Practical tips and strategies for Alzheimer's caregivers$md$;

-- the-first-two-weeks-what-really-happens-when-someone-moves-into-assisted-living (95 -> 159)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$What really happens after move-in day? The first two weeks are hard. But they're not the story.$md$ THEN $md$What happens after move-in day? A look at a parent's first two weeks in senior living, from wobbly early days to feeling at home, and what families can expect.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$What happens after move-in day? A look at a parent's first two weeks in senior living, from wobbly early days to feeling at home, and what families can expect.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$the-first-two-weeks-what-really-happens-when-someone-moves-into-assisted-living$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$What really happens after move-in day? The first two weeks are hard. But they're not the story.$md$;

-- a-senior-living-owners-guide-to-keeping-your-parents-out-of-assisted-living (79 -> 156)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$What an Assisted Living Owner Wants You to Know About Keeping Your Parents Home$md$ THEN $md$Want your parents to stay independent at home longer? A senior living owner explains why strength training, purpose, home safety, and support really matter.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Want your parents to stay independent at home longer? A senior living owner explains why strength training, purpose, home safety, and support really matter.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$a-senior-living-owners-guide-to-keeping-your-parents-out-of-assisted-living$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$What an Assisted Living Owner Wants You to Know About Keeping Your Parents Home$md$;

-- Leftover scheduling placeholder in the move-in post. The imported Markdown
-- escapes the brackets, so both the escaped and plain forms are replaced.
-- Anchor text continues the sentence: "Schedule a visit or call us...".
UPDATE posts SET
  body = replace(
    replace(
      replace(
        replace(
          body,
          'Schedule a visit: ' || chr(92) || '[' || 'calendly link' || chr(92) || ']',
          '[Schedule a visit](https://www.joyseniorcare.com/#/further/55)'
        ),
        'Schedule a visit: ' || '[' || 'calendly link' || ']',
        '[Schedule a visit](https://www.joyseniorcare.com/#/further/55)'
      ),
      chr(92) || '[' || 'calendly link' || chr(92) || ']',
      '[Schedule a visit](https://www.joyseniorcare.com/#/further/55)'
    ),
    '[' || 'calendly link' || ']',
    '[Schedule a visit](https://www.joyseniorcare.com/#/further/55)'
  ),
  updated_at = now()
WHERE body LIKE '%' || 'calendly link' || '%';

-- Correction (2026-09-27): Mellissa Daniel is not a registered nurse. Remove
-- every RN / nurse claim about her from post copy. Idempotent: each statement
-- only matches while the incorrect text is still present.

-- we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom:
-- force the corrected description (guard: not already the new text), since the
-- live excerpt carried an RN claim.
UPDATE posts SET
  excerpt = $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, who leads our Loganville, GA home every single day.$md$,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, who leads our Loganville, GA home every single day.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$md$
  AND (excerpt IS DISTINCT FROM $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, who leads our Loganville, GA home every single day.$md$
       OR (nullif(btrim(meta_description), '') IS NOT NULL AND meta_description IS DISTINCT FROM $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, who leads our Loganville, GA home every single day.$md$));

-- Any post body that still names her with the RN credential.
UPDATE posts SET
  body = replace(replace(body, $md$Mellissa Daniel, RN,$md$, $md$Mellissa Daniel,$md$), $md$Mellissa Daniel, RN$md$, $md$Mellissa Daniel$md$),
  updated_at = now()
WHERE body LIKE $md$%Mellissa Daniel, RN%$md$;

-- what-mellissa-notices-in-the-first-10-minutes-of-a-tour: description.
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(excerpt) = $md$Mellissa Daniel is a nurse first. See what her eye reads in the first ten minutes of a tour at Joy, our personal care home in Loganville, GA.$md$ THEN $md$Mellissa Daniel gives every tour herself. See what her eye reads in the first ten minutes of a tour at Joy, our personal care home in Loganville, GA.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN btrim(meta_description) = $md$Mellissa Daniel is a nurse first. See what her eye reads in the first ten minutes of a tour at Joy, our personal care home in Loganville, GA.$md$ THEN $md$Mellissa Daniel gives every tour herself. See what her eye reads in the first ten minutes of a tour at Joy, our personal care home in Loganville, GA.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$what-mellissa-notices-in-the-first-10-minutes-of-a-tour$md$
  AND (btrim(excerpt) = $md$Mellissa Daniel is a nurse first. See what her eye reads in the first ten minutes of a tour at Joy, our personal care home in Loganville, GA.$md$ OR btrim(meta_description) = $md$Mellissa Daniel is a nurse first. See what her eye reads in the first ten minutes of a tour at Joy, our personal care home in Loganville, GA.$md$);

-- what-mellissa-notices-in-the-first-10-minutes-of-a-tour: body sentence.
UPDATE posts SET
  body = replace(replace(replace(body,
    $md$Because she's a nurse, Mellissa clocks$md$, $md$Mellissa clocks$md$),
    $md$Because she’s a nurse, Mellissa clocks$md$, $md$Mellissa clocks$md$),
    $md$Because she&#x27;s a nurse, Mellissa clocks$md$, $md$Mellissa clocks$md$),
  updated_at = now()
WHERE slug = $md$what-mellissa-notices-in-the-first-10-minutes-of-a-tour$md$
  AND (body LIKE $md$%Because she's a nurse, Mellissa clocks%$md$
       OR body LIKE $md$%Because she’s a nurse, Mellissa clocks%$md$
       OR body LIKE $md$%Because she&#x27;s a nurse, Mellissa clocks%$md$);

-- what-mellissa-notices-in-the-first-10-minutes-of-a-tour: the excerpt (blog
-- card) carries its own "nurse first" line, separate from meta_description.
UPDATE posts SET
  excerpt = replace(excerpt, $md$Mellissa Daniel is a nurse first.$md$, $md$Mellissa Daniel gives every tour herself.$md$),
  updated_at = now()
WHERE slug = $md$what-mellissa-notices-in-the-first-10-minutes-of-a-tour$md$
  AND excerpt LIKE $md$%Mellissa Daniel is a nurse first.%$md$;

-- Compliance (2026-09-28): ratings and "assisted living" self-descriptions.
-- Each statement changes a row only while the old wording is still present,
-- so a later edit in Admin is left alone. Re-running is a no-op.
-- Slugs are not renamed.

-- Google 4.9 -> 4.5 (24 reviews). Caring.com 5.0 -> 4.8 (5 reviews).
-- A Place for Mom 4.9 is already accurate and is not rewritten.
UPDATE review_sources SET
  rating_value = '4.5 (24 reviews)',
  updated_at = now()
WHERE btrim(rating_value) IN ('4.9', '4.90')
  AND (source = 'google' OR lower(btrim(label)) = 'google');

UPDATE review_sources SET
  rating_value = '4.8 (5 reviews)',
  updated_at = now()
WHERE btrim(rating_value) IN ('5', '5.0', '5.00')
  AND (source = 'caring' OR lower(label) LIKE '%caring%');

-- spring-fun-activities: do not list Joy as an assisted living setting.
UPDATE posts SET
  body = replace(body,
    $md$personal care or assisted living settings like The Joy Senior Living$md$,
    $md$a personal care home like The Joy Senior Living$md$),
  updated_at = now()
WHERE slug = $md$spring-fun-activities-to-enjoy-with-loved-ones-in-senior-living$md$
  AND body LIKE $md$%personal care or assisted living settings like The Joy Senior Living%$md$;

-- balancing-caregiving: the section was naming Joy as assisted living or a personal care home.
UPDATE posts SET
  body = replace(replace(body,
    $md$Assisted Living/Personal Care Homes$md$,
    $md$Personal care homes$md$),
    $md$Assisted living facilities or personal care homes, like The Joy of Loganville, provide a more permanent solution.$md$,
    $md$A personal care home like The Joy of Loganville provides a more permanent solution.$md$),
  updated_at = now()
WHERE slug = $md$balancing-caregiving-for-aging-parents$md$
  AND (body LIKE $md$%Assisted Living/Personal Care Homes%$md$
       OR body LIKE $md$%Assisted living facilities or personal care homes, like The Joy of Loganville, provide a more permanent solution.%$md$);

-- hearts-full-of-gratitude: Joy's own programs were called assisted living.
UPDATE posts SET
  body = replace(replace(body,
    $md$whether in assisted living's lively social circles or the secure, sensory-rich spaces of our memory care neighborhood$md$,
    $md$whether in our personal care home or the quieter spaces of our memory care neighborhood$md$),
    $md$or the vibrant independence of assisted living$md$,
    $md$or daily life in our personal care home$md$),
  updated_at = now()
WHERE slug = $md$hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$md$
  AND (body LIKE $md$%whether in assisted living's lively social circles or the secure, sensory-rich spaces of our memory care neighborhood%$md$
       OR body LIKE $md$%or the vibrant independence of assisted living%$md$);

-- nourishing: "our community" was described as assisted living and memory care.
UPDATE posts SET
  body = replace(replace(body,
    $md$especially those in assisted living or memory care$md$,
    $md$especially those in a personal care home or memory care$md$),
    $md$In both assisted living and memory care, we emphasize$md$,
    $md$In both personal care and memory care, we emphasize$md$),
  updated_at = now()
WHERE slug = $md$nourishing-the-golden-years-the-vital-role-of-nutrition-in-senior-living$md$
  AND (body LIKE $md$%especially those in assisted living or memory care%$md$
       OR body LIKE $md$%In both assisted living and memory care, we emphasize%$md$);

-- resident council: "our assisted living and memory care neighborhoods".
UPDATE posts SET
  body = replace(body,
    $md$both our assisted living and memory care neighborhoods$md$,
    $md$both personal care and memory care$md$),
  updated_at = now()
WHERE slug = $md$the-heart-of-our-community-how-resident-council-meetings-bring-joy-to-life-at-the-joy-senior-living$md$
  AND body LIKE $md$%both our assisted living and memory care neighborhoods%$md$;

-- award post: the closing line called Joy a 24-bed assisted living community.
UPDATE posts SET
  body = replace(body,
    $md$24-bed assisted living and memory care community$md$,
    $md$24-bed personal care home with memory care$md$),
  hero_image_alt = replace(hero_image_alt,
    $md$24-bed assisted living and memory care community$md$,
    $md$24-bed personal care home with memory care$md$),
  updated_at = now()
WHERE slug = $md$we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$md$
  AND (body LIKE $md$%24-bed assisted living and memory care community%$md$
       OR hero_image_alt LIKE $md$%24-bed assisted living and memory care community%$md$);

-- what-to-look-for: title and body said the authors run an assisted living community.
-- The slug stays. Generic lines about "considering assisted living" are left as-is.
UPDATE posts SET
  title = replace(title,
    $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$,
    $md$What to Look for in a Personal Care Home (From People Who Run One)$md$),
  meta_title = replace(meta_title,
    $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$,
    $md$What to Look for in a Personal Care Home (From People Who Run One)$md$),
  excerpt = replace(excerpt,
    $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$,
    $md$What to Look for in a Personal Care Home (From People Who Run One)$md$),
  meta_description = replace(meta_description,
    $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$,
    $md$What to Look for in a Personal Care Home (From People Who Run One)$md$),
  body = replace(replace(body,
    $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$,
    $md$What to Look for in a Personal Care Home (From People Who Run One)$md$),
    $md$We run a 24-bed assisted living community in Loganville, Georgia.$md$,
    $md$We run a 24-bed personal care home in Loganville, Georgia.$md$),
  hero_image_alt = replace(hero_image_alt,
    $md$What to Look for in an Assisted Living Community (From People Who Run One)$md$,
    $md$What to Look for in a Personal Care Home (From People Who Run One)$md$),
  updated_at = now()
WHERE slug = $md$what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$md$
  AND (title LIKE $md$%What to Look for in an Assisted Living Community (From People Who Run One)%$md$
       OR meta_title LIKE $md$%What to Look for in an Assisted Living Community (From People Who Run One)%$md$
       OR excerpt LIKE $md$%What to Look for in an Assisted Living Community (From People Who Run One)%$md$
       OR meta_description LIKE $md$%What to Look for in an Assisted Living Community (From People Who Run One)%$md$
       OR body LIKE $md$%What to Look for in an Assisted Living Community (From People Who Run One)%$md$
       OR body LIKE $md$%We run a 24-bed assisted living community in Loganville, Georgia.%$md$
       OR hero_image_alt LIKE $md$%What to Look for in an Assisted Living Community (From People Who Run One)%$md$);

-- small-enough: the post used "small assisted living in Loganville" for Joy itself.
UPDATE posts SET
  title = replace(title,
    $md$Small Assisted Living in Loganville$md$,
    $md$Small Personal Care Home in Loganville$md$),
  meta_title = replace(meta_title,
    $md$Small Assisted Living in Loganville$md$,
    $md$Small Personal Care Home in Loganville$md$),
  excerpt = replace(replace(excerpt,
    $md$What a small assisted living in Loganville actually feels like on a Tuesday — the aide who knows your dad's coffee, the cook who remembers, the tradeoffs.$md$,
    $md$What a small personal care home in Loganville actually feels like on a Tuesday (the aide who knows your dad's coffee, the cook who remembers, the tradeoffs).$md$),
    $md$small assisted living in Loganville$md$,
    $md$small personal care home in Loganville$md$),
  meta_description = replace(replace(meta_description,
    $md$What a small assisted living in Loganville actually feels like on a Tuesday — the aide who knows your dad's coffee, the cook who remembers, the tradeoffs.$md$,
    $md$What a small personal care home in Loganville actually feels like on a Tuesday (the aide who knows your dad's coffee, the cook who remembers, the tradeoffs).$md$),
    $md$What a small assisted living in Loganville actually feels like on a Tuesday — with honest tradeoffs.$md$,
    $md$What a small personal care home in Loganville actually feels like on a Tuesday (with honest tradeoffs).$md$),
  body = replace(body,
    $md$small assisted living in Loganville$md$,
    $md$small personal care home in Loganville$md$),
  hero_image_alt = replace(replace(hero_image_alt,
    $md$Small Assisted Living in Loganville$md$,
    $md$Small Personal Care Home in Loganville$md$),
    $md$small assisted living in Loganville$md$,
    $md$small personal care home in Loganville$md$),
  updated_at = now()
WHERE slug = $md$small-enough-to-know-your-parent-by-name$md$
  AND (title LIKE $md$%Small Assisted Living in Loganville%$md$
       OR meta_title LIKE $md$%Small Assisted Living in Loganville%$md$
       OR excerpt LIKE $md$%small assisted living in Loganville%$md$
       OR meta_description LIKE $md$%small assisted living in Loganville%$md$
       OR body LIKE $md$%small assisted living in Loganville%$md$
       OR hero_image_alt LIKE $md$%ssisted Living in Loganville%$md$
       OR hero_image_alt LIKE $md$%small assisted living in Loganville%$md$);

-- Leftover lowercase phrase in meta/excerpt after the full-sentence rewrite above,
-- and the "with honest tradeoffs" variant if it was the stored description.
UPDATE posts SET
  excerpt = replace(excerpt,
    $md$small assisted living in Loganville$md$,
    $md$small personal care home in Loganville$md$),
  meta_description = replace(replace(meta_description,
    $md$small assisted living in Loganville$md$,
    $md$small personal care home in Loganville$md$),
    $md$What a small personal care home in Loganville actually feels like on a Tuesday — with honest tradeoffs.$md$,
    $md$What a small personal care home in Loganville actually feels like on a Tuesday (with honest tradeoffs).$md$),
  updated_at = now()
WHERE slug = $md$small-enough-to-know-your-parent-by-name$md$
  AND (excerpt LIKE $md$%small assisted living in Loganville%$md$
       OR meta_description LIKE $md$%small assisted living in Loganville%$md$
       OR meta_description LIKE $md$%Tuesday — with honest tradeoffs.%$md$);

-- cost article: Joy's own voice was attached to "the cost of assisted living".
-- The title still discusses assisted living cost as a category families compare
-- with personal care, and the slug is unchanged.
UPDATE posts SET
  body = replace(body,
    $md$The cost of assisted living is real, and we will always be honest with you about it.$md$,
    $md$The cost of a personal care home is real, and we will always be honest with you about it.$md$),
  updated_at = now()
WHERE slug = $md$cost-of-assisted-living-and-personal-care$md$
  AND body LIKE $md$%The cost of assisted living is real, and we will always be honest with you about it.%$md$;

-- New post (2026-09-27): tour questions, owner-approved.
-- Insert once. A later boot does not update the row, so an edit in Admin
-- (title, body, excerpt, or anything else) is left alone.
INSERT INTO posts (
  slug,
  title,
  excerpt,
  body,
  author,
  category,
  status,
  meta_description,
  published_at
)
SELECT
  $tourpost$questions-to-ask-personal-care-home-tour$tourpost$,
  $tourpost$Questions to Ask The Joy on a Tour (and Our Honest Answers)$tourpost$,
  $tourpost$Touring personal care homes for Mom or Dad? Print these questions for every tour. Here are The Joy's straight answers, including the ones that aren't perfect.$tourpost$,
  $tourpost$You'll probably sit in the car for a minute before you walk in. Most people do. You've got a list on your phone or on the back of an envelope, and you're afraid you'll forget the one question that matters.

So here's a list. These are the questions I'd want a family to ask any personal care home, including ours. Under each one is The Joy's straight answer. Where I don't have a verified answer written down, I've said so. Ask Mellissa in person.

Print it. Bring it to every home you tour. Write their answers in the margins and compare.

## Staffing and nursing

### What's the overnight staff-to-resident ratio, and is a nurse on site at night?

At The Joy, two staff are on shift every night for up to 24 residents. A nurse is in the house 24 hours a week, spread across three days. A nurse is not on site overnight. A certified medication aide is on staff 24 hours a day, including every night.

I'd rather you hear that from me now than find out later. Here's the context. Georgia requires a certified memory care home to have at least two caregivers on site at all times, and to have 8 to 16 hours of licensed nurse time a week, depending on how many memory care residents live there. Our two overnight staff meet the first rule. Our 24 nurse hours a week go past the second.

Georgia also requires a nurse or a certified medication aide in the building at all times. Our certified medication aide covers that, day and night.

Ask every home the same question in the same words. Ask whether the overnight staff are awake. Write the numbers down.

### What dementia training do your caregivers get?

Georgia requires caregivers in a certified memory care home to get 4 hours of dementia orientation and 16 hours of specialized dementia training, then 8 more hours every year. That's the floor. A good answer tells you how the home meets it and what it adds.

The Joy's answer: our caregivers get regular dementia training. We also host dementia caregiver support groups here at the home, so the families of people with dementia are in our building too.

### Who gives the medications?

In a Georgia memory care home, medications have to be given by a trained proxy caregiver, a nurse, or a certified medication aide. Ask who does it on each shift and how mistakes get caught.

The Joy's answer: a certified medication aide is on staff 24 hours a day. Medications are counted at the end of every shift and again at the start of the next one. That's a double check at every shift change.

## Memory care and safety

### Is memory care a separate locked area, or mixed in with everyone else?

The whole home is secured, and all 24 of our beds are licensed for memory care. So residents with dementia live alongside everyone else. There's no separate wing.

In a home our size, that matters. If your mom moves in today and her memory gets worse next year, she doesn't get moved to a locked wing full of new faces. She stays where she is, with the people she already knows.

## The home itself

### Isn't a 24-suite home too small?

Small is the point. With 24 suites, your dad sees the same faces every day. The staff know him by name, by habit, and by what his bad afternoons look like. It's hard to get lost in a crowd when there isn't one.

It's still a fair question. A small home won't have everything a big building has. Ask us, and every small home you tour, what a normal day looks like.

### You're new. Why should I trust you?

We opened in 2024. The Walton County Chamber held our ribbon cutting on May 10 that year. That's more than two years of families and four state inspections (more on those below).

In 2026, A Place for Mom gave us its Best of Senior Living award, which is based on reviews from families. We didn't write those reviews. You can read them yourself.

### Where exactly are you?

434 Conyers Rd in Loganville. We're in Walton County, right on the edge of Gwinnett. That makes us close for Gwinnett families in Snellville, Grayson, Lawrenceville, and Dacula, as well as families in Walton and Monroe.

Close matters more than people expect. It decides whether you stop by on the way home from work or only on Sundays.

### Are pets allowed? The websites don't agree.

Yes. Some listing sites say we don't allow pets. They're wrong. Residents can have pets, pets are welcome to visit, and we have regular pet therapy visits with the Humane Society of Walton County. Ask us about the details for your parent's pet.

## The state record

### Can I see your most recent state inspection report?

Yes. And you don't have to take our word for what's in it.

The Joy is licensed by the Georgia Department of Community Health as a personal care home, license PCH012341, for 24 beds. We've been in compliance at every inspection. Our public inspection reports show no rule violations. There are four on file, from December 2024 through April 2026.

To pull them yourself:

1. Go to forms.dch.georgia.gov/HFRD, the state's Healthcare Facility Regulation site.
2. Click "Search Inspection Reports."
3. Search for "Joy Senior Living of Loganville."
4. Open each report and read it.

Do this for every home on your list. It doesn't take long, and the state wrote those reports, not us.

## Family, money, and the hard limits

### How will you keep me updated, and who do I call?

A few families have told us it was hard to reach someone by phone for an update. That's fair, and we heard it.

Here's how to reach us. Our main line is [(470) 684-3569](tel:+14706843569), and more than one person on staff answers it. Families also get the owners' phone numbers. If you can't reach one of us, you can reach another.

Mellissa Daniel, our Executive Director, gives every tour herself. The person you meet on your tour is the person running the home.

Ask every home you visit the same thing. Who picks up when you call, and what do you do if they don't?

### What does admission involve, and what's included in the monthly rate?

Our monthly rate includes all care, meals, and help with daily living. Call us for current rates. We'd rather give you a real number for your parent than a range that doesn't fit.

Ask every home for its full paperwork list up front, in writing. Ask how it handles price increases, too. Georgia requires a personal care home to give 30 days' notice before raising prices for personal services and 60 days' notice for room and board.

### What care can't you provide, and when would someone need to move?

Every personal care home has limits. Georgia doesn't allow a personal care home to provide continuous medical or nursing care. A home that says it can handle anything isn't being straight with you.

Ask us where our line is when you tour, and ask every home the same question. Get the answer in writing before you sign anything.

### Do you work with hospice?

Yes. We coordinate with hospice and home health providers. Our Dementia Caregiver Support Group meets at The Joy with our hospice partners.

## The short list

1. What's the overnight staff-to-resident ratio? Is a nurse on site at night?
2. What dementia training do caregivers get?
3. Who gives the medications?
4. Is memory care separate, or mixed in with everyone else?
5. What will my parent give up in a small home?
6. How long have you been open, and what do families say?
7. How close are you to where I live and work?
8. Are pets allowed?
9. Can I see your most recent state inspection report?
10. How will you keep me updated, and who do I call?
11. What does admission involve, and what does the monthly rate include?
12. What care can't you provide, and when would someone need to move?
13. Do you work with hospice?

## Come see us

Book a tour at [joyseniorcare.com](https://www.joyseniorcare.com/#/further/55) or call [(470) 684-3569](tel:+14706843569). Bring this list and ask Mellissa every question on it. Then take it to the next home and ask them too.

Adam Upchurch\
Owner, The Joy Senior Living
$tourpost$,
  $tourpost$Adam Upchurch$tourpost$,
  $tourpost$articles$tourpost$,
  $tourpost$published$tourpost$,
  $tourpost$Touring personal care homes for Mom or Dad? Print these questions for every tour. Here are The Joy's straight answers, including the ones that aren't perfect.$tourpost$,
  TIMESTAMPTZ '2026-09-27 12:00:00 America/New_York'
WHERE NOT EXISTS (
  SELECT 1 FROM posts WHERE slug = $tourpost$questions-to-ask-personal-care-home-tour$tourpost$
);

-- Typo: "She's an caregiver at heart." -> "She's a caregiver at heart."
-- Guarded to this slug, and only while the typo is still in the body.
UPDATE posts SET
  body = replace(body, $md$an caregiver at heart$md$, $md$a caregiver at heart$md$),
  updated_at = now()
WHERE slug = $md$what-mellissa-notices-in-the-first-10-minutes-of-a-tour$md$
  AND body LIKE $md$%an caregiver at heart%$md$;

-- Draft post (2026-09-28): what a dementia caregiver support group is like.
-- Inserted once, as a draft, so it shows in Admin > Posts under Drafts. The
-- owner reviews and publishes it there. This statement does not publish it.
--
-- applied_content_updates (created in schema.sql) records that this update
-- already ran. A later boot skips the block entirely, so it never overwrites
-- an edit or a publish, and it never recreates the row after a delete.
-- The slug check avoids a duplicate if that slug is already present.
-- Columns match createPost for a draft: hero_image, hero_image_alt, and
-- meta_title are null; published_at is null; id, created_at, and updated_at
-- are left to the table defaults.
DO $apply_sgpost$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates
    WHERE id = 'dementia-caregiver-support-group-2026-09-28'
  ) THEN
    INSERT INTO posts (
      slug,
      title,
      excerpt,
      body,
      hero_image,
      hero_image_alt,
      author,
      category,
      status,
      meta_title,
      meta_description,
      published_at
    )
    SELECT
      $sgpost$dementia-caregiver-support-group$sgpost$,
      $sgpost$What a Dementia Caregiver Support Group Is Like$sgpost$,
      $sgpost$Caring for a parent with dementia? Here's what a caregiver support group is, what happens at a meeting, and how to tell if one is right for you. Plain answers.$sgpost$,
      $sgpost$It's 4:30 in the afternoon and Mom asks where her car is. She hasn't driven in three years. You tell her it's at the shop. That's the fourth time today.

You don't correct her anymore. You learned that the hard way. You've also stopped telling friends about days like this. They say "that must be so hard" and change the subject. They mean well. They just don't know.

Some people do know. They meet in support groups.

## What a caregiver support group is

A dementia caregiver support group is a regular meeting for the people doing the caring. The son who moved Dad into the spare bedroom. The daughter who drives over every morning before work to make sure Mom took her pills. The spouse, the grandchild, the neighbor who ended up doing more than anyone planned.

It isn't therapy, and it isn't a class. Nobody's there to diagnose your parent or grade how you're doing. It's a group of people in the same situation, usually with a facilitator who keeps the conversation moving and makes sure everyone who wants to talk gets the chance.

Groups meet at churches, hospitals, libraries, and senior care homes. Some meet online. The Alzheimer's Association runs and lists groups across Georgia, and its website has a search by zip code.

## Why it helps

**You stop being the only one.** Dementia care is lonely in a specific way. Your parent may not remember the hard day you both just had. Your friends can't picture it. A group is a room where you don't have to explain the basics. Say "she accused me of stealing her purse again," and nobody flinches.

**You get tips that actually work.** Someone in the room has already dealt with what you're facing this week. The refusing to bathe. The 3 a.m. wandering. The fight over the car keys. They'll tell you what they tried, what failed, and what finally worked. That's hard to find in a pamphlet.

**The stress has somewhere to go.** Caregivers carry a lot they don't say out loud: frustration, guilt about the frustration, fear about money, resentment toward the sibling who calls once a month with advice. Saying it to people who get it takes some of the weight off. It won't all go away, but some of it will.

**You can grieve while your parent is still here.** Dementia takes a person a little at a time. Many caregivers mourn the mom or dad they used to talk to while caring for the one in front of them, and feel strange about it. A group is one of the few places where that grief makes sense to everyone listening.

## What happens at a meeting

Most groups follow a loose pattern. People arrive, get a cup of coffee, and sit in a circle. The facilitator opens, and people go around and say how things have been. Sometimes the whole hour stays there. Sometimes one person's week turns into the conversation.

Some groups bring in a guest now and then. That might be a hospice nurse, an elder law attorney, or someone from a local agency who can explain what help is out there.

You can talk as much as you want. You can also just listen. That's allowed, especially the first time. Nobody will push you to share.

What's said in the room stays in the room. Most groups say that out loud at the start.

## How to know if one is right for you

A group might help if:

- You haven't told anyone how hard this really is.
- You keep searching online at night for answers to the same problems.
- You feel short-tempered with your parent and guilty afterward.
- Your own doctor's appointments keep getting pushed back.
- You're starting to wonder what comes next, and you don't know who to ask.

Try a group more than once before you decide. The first meeting can feel awkward. The second is usually easier, because now you know a face or two.

If a group isn't for you, that's fine too. Some people do better one on one with a counselor. Some prefer an online group they can join after bedtime. The Alzheimer's Association also runs a free 24/7 Helpline at [800-272-3900](tel:+18002723900), staffed by people trained in dementia care. What matters is that you're not carrying this alone.

## If you can't get away

For a lot of caregivers, the hardest part is leaving the house. Somebody has to be with Mom.

Ask a sibling or a friend for one afternoon a month. Be specific about the day and the time. People who say "let me know if you need anything" often mean it. They just need to be told what to do.

Some senior care homes also offer respite stays, a short stay where your parent is cared for while you rest or handle your own life for a few days. It's worth asking about, even if you're not ready to use it yet.

## A group that meets near you

The Joy Senior Living is a licensed personal care home in Loganville, right on the Gwinnett edge. We host a Dementia Caregiver Support Group on site on the third Thursday of every month at 2pm.

It's free and open to anyone caring for someone with dementia. You don't need a parent living with us, and you don't need to be thinking about a move. If you live in Walton or Gwinnett County and you're doing this at home, you're welcome.

For details, call [(470) 684-3569](tel:+14706843569) or email [hello@joyseniorcare.com](mailto:hello@joyseniorcare.com). You don't need to bring anything or prepare anything.

Mom will probably ask about her car again tomorrow. Come tell us what you said.

Adam Upchurch\
Owner, The Joy Senior Living
$sgpost$,
      NULL,
      NULL,
      $sgpost$Adam Upchurch$sgpost$,
      $sgpost$articles$sgpost$,
      $sgpost$draft$sgpost$,
      NULL,
      $sgpost$Caring for a parent with dementia? Here's what a caregiver support group is, what happens at a meeting, and how to tell if one is right for you. Plain answers.$sgpost$,
      NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM posts WHERE slug = $sgpost$dementia-caregiver-support-group$sgpost$
    );

    INSERT INTO applied_content_updates (id)
    VALUES ('dementia-caregiver-support-group-2026-09-28');
  END IF;
END
$apply_sgpost$;

-- Broken worksheet links. Exact markdown anchors only, so a later edit to the
-- surrounding sentence is left alone. A no-op once the old link is gone.
-- Anchor text promised a download that does not exist. The page it points at
-- now is /cost. Surrounding sentences are not rewritten.
UPDATE posts SET
  body = replace(
    body,
    $md$[Download the workbook here](http://www.joyseniorcare.com/senior-living-expense-worksheet)$md$,
    $md$[What it costs](/cost)$md$
  ),
  updated_at = now()
WHERE slug = $md$budgeting-for-senior-care-how-to-prepare-for-the-ever-raising-cost-of-senior-care$md$
  AND strpos(
    body,
    $md$[Download the workbook here](http://www.joyseniorcare.com/senior-living-expense-worksheet)$md$
  ) > 0;

UPDATE posts SET
  body = replace(
    body,
    $md$[download our workbook](https://www.joyseniorcare.com/senior-living-expense-worksheet)$md$,
    $md$[see what it costs](/cost)$md$
  ),
  updated_at = now()
WHERE slug = $md$understand-dementia-what-why-how-to-care-for-loved-ones$md$
  AND strpos(
    body,
    $md$[download our workbook](https://www.joyseniorcare.com/senior-living-expense-worksheet)$md$
  ) > 0;

-- Homepage link that 301s twice (http apex, then www). Point it at /.
UPDATE posts SET
  body = replace(
    body,
    $md$[joyseniorcare.com](http://joyseniorcare.com/)$md$,
    $md$[joyseniorcare.com](/)$md$
  ),
  updated_at = now()
WHERE slug = $md$welcome-to-the-joy$md$
  AND strpos(body, $md$[joyseniorcare.com](http://joyseniorcare.com/)$md$) > 0;

-- Old Calendly URL (a previous director). The tour path is TalkFurther.
UPDATE posts SET
  body = replace(
    body,
    $md$[Schedule a consultation for personal care](https://calendly.com/peppur/tour-the-joy-of-loganville?month=2024-05)$md$,
    $md$[Schedule a consultation for personal care](https://www.joyseniorcare.com/#/further/55)$md$
  ),
  updated_at = now()
WHERE slug = $md$balancing-caregiving-for-aging-parents$md$
  AND strpos(
    body,
    $md$[Schedule a consultation for personal care](https://calendly.com/peppur/tour-the-joy-of-loganville?month=2024-05)$md$
  ) > 0;

-- the-talk meta description is missing its first letter ("he families...").
-- The sentence is otherwise complete, so the missing character is "T".
-- Only an exact match of that truncated summary is rewritten.
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(excerpt) = $talk$he families who start early, listen more than they talk, and let it take time almost always get somewhere everyone can live with. Here's what that looks like.$talk$
      THEN $talk$The families who start early, listen more than they talk, and let it take time almost always get somewhere everyone can live with. Here's what that looks like.$talk$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN btrim(meta_description) = $talk$he families who start early, listen more than they talk, and let it take time almost always get somewhere everyone can live with. Here's what that looks like.$talk$
      THEN $talk$The families who start early, listen more than they talk, and let it take time almost always get somewhere everyone can live with. Here's what that looks like.$talk$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $talk$the-talk$talk$
  AND (
    btrim(excerpt) = $talk$he families who start early, listen more than they talk, and let it take time almost always get somewhere everyone can live with. Here's what that looks like.$talk$
    OR btrim(meta_description) = $talk$he families who start early, listen more than they talk, and let it take time almost always get somewhere everyone can live with. Here's what that looks like.$talk$
  );

-- Approved copy pass (2026-09-28). One marker per change so a later boot
-- does not overwrite an edit made in Admin. Exact strings only.

-- Community wording. Each statement replaces one stored sentence. Rows whose
-- new text equals the old text, and rows marked SKIP, are not here.
-- The Dacula FAQ is updated in code (src/lib/landing.ts).
DO $community_pass$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates WHERE id = 'community-replacements-2026-09-28'
  ) THEN

UPDATE posts SET
  title = replace(title, $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$, $c1$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$, $c1$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$, $c1$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$, $c1$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$, $c1$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$) END,
  body = replace(body, $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$, $c1$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c1$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$c1$) > 0;

UPDATE posts SET
  title = replace(title, $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$, $c2$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$, $c2$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$, $c2$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$, $c2$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$, $c2$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$) END,
  body = replace(body, $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$, $c2$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c2$The Heart of Our Community: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living of Loganville$c2$) > 0;

UPDATE posts SET
  title = replace(title, $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$, $c3$Learn to identify the signs that your parent might benefit from the supportive, small-home personal care offered at The Joy Senior Living.$c3$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$, $c3$Learn to identify the signs that your parent might benefit from the supportive, small-home personal care offered at The Joy Senior Living.$c3$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$, $c3$Learn to identify the signs that your parent might benefit from the supportive, small-home personal care offered at The Joy Senior Living.$c3$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$, $c3$Learn to identify the signs that your parent might benefit from the supportive, small-home personal care offered at The Joy Senior Living.$c3$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$, $c3$Learn to identify the signs that your parent might benefit from the supportive, small-home personal care offered at The Joy Senior Living.$c3$) END,
  body = replace(body, $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$, $c3$Learn to identify the signs that your parent might benefit from the supportive, small-home personal care offered at The Joy Senior Living.$c3$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c3$Learn to identify the signs that your loved one might benefit from the supportive, community-based care offered at The Joy Senior Living.$c3$) > 0;

UPDATE posts SET
  title = replace(title, $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$, $c4$Personalized attention, engaging activities, and serene surroundings await!$c4$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$, $c4$Personalized attention, engaging activities, and serene surroundings await!$c4$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$, $c4$Personalized attention, engaging activities, and serene surroundings await!$c4$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$, $c4$Personalized attention, engaging activities, and serene surroundings await!$c4$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$, $c4$Personalized attention, engaging activities, and serene surroundings await!$c4$) END,
  body = replace(body, $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$, $c4$Personalized attention, engaging activities, and serene surroundings await!$c4$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c4$Personalized attention, vibrant community activities, and serene surroundings await!$c4$) > 0;

UPDATE posts SET
  title = replace(title, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small home over a large campus.$c5$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small home over a large campus.$c5$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small home over a large campus.$c5$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small home over a large campus.$c5$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small home over a large campus.$c5$) END,
  body = replace(body, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$, $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small home over a large campus.$c5$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c5$Joy is a 24-bed personal care home in Loganville, GA. Here is the honest case for choosing a small senior living community over a large campus.$c5$) > 0;

UPDATE posts SET
  title = replace(title, $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$, $c6$We asked ourselves what we hear most often from the families who tour our home.$c6$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$, $c6$We asked ourselves what we hear most often from the families who tour our home.$c6$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$, $c6$We asked ourselves what we hear most often from the families who tour our home.$c6$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$, $c6$We asked ourselves what we hear most often from the families who tour our home.$c6$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$, $c6$We asked ourselves what we hear most often from the families who tour our home.$c6$) END,
  body = replace(body, $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$, $c6$We asked ourselves what we hear most often from the families who tour our home.$c6$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c6$We asked ourselves what we hear most often from the families who tour our community.$c6$) > 0;

UPDATE posts SET
  title = replace(title, $c7$A community that will actually just talk with you.$c7$, $c7$A personal care home that will actually just talk with you.$c7$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c7$A community that will actually just talk with you.$c7$, $c7$A personal care home that will actually just talk with you.$c7$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c7$A community that will actually just talk with you.$c7$, $c7$A personal care home that will actually just talk with you.$c7$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c7$A community that will actually just talk with you.$c7$, $c7$A personal care home that will actually just talk with you.$c7$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c7$A community that will actually just talk with you.$c7$, $c7$A personal care home that will actually just talk with you.$c7$) END,
  body = replace(body, $c7$A community that will actually just talk with you.$c7$, $c7$A personal care home that will actually just talk with you.$c7$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c7$A community that will actually just talk with you.$c7$) > 0;

UPDATE posts SET
  title = replace(title, $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$, $c8$In a smaller home like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$, $c8$In a smaller home like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$, $c8$In a smaller home like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$, $c8$In a smaller home like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$, $c8$In a smaller home like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$) END,
  body = replace(body, $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$, $c8$In a smaller home like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c8$In a smaller community like ours, the same caregiver walks in, and by the end of week one, she has learned that your dad hates ice in his water and that your mom likes to be the last one dressed for dinner because she wants time to put on her lipstick.$c8$) > 0;

UPDATE posts SET
  title = replace(title, $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$, $c9$A 24-bed home like Joy does not have hundreds of residents to spread its fixed costs across.$c9$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$, $c9$A 24-bed home like Joy does not have hundreds of residents to spread its fixed costs across.$c9$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$, $c9$A 24-bed home like Joy does not have hundreds of residents to spread its fixed costs across.$c9$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$, $c9$A 24-bed home like Joy does not have hundreds of residents to spread its fixed costs across.$c9$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$, $c9$A 24-bed home like Joy does not have hundreds of residents to spread its fixed costs across.$c9$) END,
  body = replace(body, $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$, $c9$A 24-bed home like Joy does not have hundreds of residents to spread its fixed costs across.$c9$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c9$A 24-bed community like Joy does not have hundreds of residents to spread its fixed costs across.$c9$) > 0;

UPDATE posts SET
  title = replace(title, $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$, $c10$As someone who runs a personal care home, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$, $c10$As someone who runs a personal care home, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$, $c10$As someone who runs a personal care home, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$, $c10$As someone who runs a personal care home, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$, $c10$As someone who runs a personal care home, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$) END,
  body = replace(body, $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$, $c10$As someone who runs a personal care home, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c10$As someone who runs an senior living community, I've seen what separates the people who age at home successfully from those who face a crisis that forces a sudden move.$c10$) > 0;

UPDATE posts SET
  title = replace(title, $c11$Running a small community like ours means there's nowhere to hide.$c11$, $c11$Running a small home like ours means there's nowhere to hide.$c11$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c11$Running a small community like ours means there's nowhere to hide.$c11$, $c11$Running a small home like ours means there's nowhere to hide.$c11$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c11$Running a small community like ours means there's nowhere to hide.$c11$, $c11$Running a small home like ours means there's nowhere to hide.$c11$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c11$Running a small community like ours means there's nowhere to hide.$c11$, $c11$Running a small home like ours means there's nowhere to hide.$c11$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c11$Running a small community like ours means there's nowhere to hide.$c11$, $c11$Running a small home like ours means there's nowhere to hide.$c11$) END,
  body = replace(body, $c11$Running a small community like ours means there's nowhere to hide.$c11$, $c11$Running a small home like ours means there's nowhere to hide.$c11$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c11$Running a small community like ours means there's nowhere to hide.$c11$) > 0;

UPDATE posts SET
  title = replace(title, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our home.$c12$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our home.$c12$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our home.$c12$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our home.$c12$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our home.$c12$) END,
  body = replace(body, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$, $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our home.$c12$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c12$At The Joy Senior Living in Loganville, we believe that our residents are the true heart of our community.$c12$) > 0;

UPDATE posts SET
  title = replace(title, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a home where joy is woven into every detail.$c13$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a home where joy is woven into every detail.$c13$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a home where joy is woven into every detail.$c13$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a home where joy is woven into every detail.$c13$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a home where joy is woven into every detail.$c13$) END,
  body = replace(body, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$, $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a home where joy is woven into every detail.$c13$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c13$Resident Council Meetings are the compass that guides us at The Joy Senior Living, ensuring we not only meet expectations but exceed them by creating a community where joy is woven into every detail.$c13$) > 0;

UPDATE posts SET
  title = replace(title, $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$, $c14$Reach out to schedule a visit and see how our residents celebrate life every day.$c14$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$, $c14$Reach out to schedule a visit and see how our residents celebrate life every day.$c14$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$, $c14$Reach out to schedule a visit and see how our residents celebrate life every day.$c14$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$, $c14$Reach out to schedule a visit and see how our residents celebrate life every day.$c14$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$, $c14$Reach out to schedule a visit and see how our residents celebrate life every day.$c14$) END,
  body = replace(body, $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$, $c14$Reach out to schedule a visit and see how our residents celebrate life every day.$c14$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c14$Reach out to schedule a visit and see how our community celebrates life every day.$c14$) > 0;

UPDATE posts SET
  title = replace(title, $c15$Communities like ours?$c15$, $c15$Homes like ours?$c15$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c15$Communities like ours?$c15$, $c15$Homes like ours?$c15$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c15$Communities like ours?$c15$, $c15$Homes like ours?$c15$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c15$Communities like ours?$c15$, $c15$Homes like ours?$c15$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c15$Communities like ours?$c15$, $c15$Homes like ours?$c15$) END,
  body = replace(body, $c15$Communities like ours?$c15$, $c15$Homes like ours?$c15$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c15$Communities like ours?$c15$) > 0;

UPDATE posts SET
  title = replace(title, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our home into a sanctuary.$c16$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our home into a sanctuary.$c16$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our home into a sanctuary.$c16$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our home into a sanctuary.$c16$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our home into a sanctuary.$c16$) END,
  body = replace(body, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$, $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our home into a sanctuary.$c16$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c16$Whether it's our director sharing a weekend walkthrough to ease a move-in or caregivers sitting among residents in our cozy common areas, answering questions with patience and a smile, it's this genuine care that turns our community into a sanctuary.$c16$) > 0;

UPDATE posts SET
  title = replace(title, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how The Joy makes mealtime one of the best parts of the day.$c17$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how The Joy makes mealtime one of the best parts of the day.$c17$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how The Joy makes mealtime one of the best parts of the day.$c17$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how The Joy makes mealtime one of the best parts of the day.$c17$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how The Joy makes mealtime one of the best parts of the day.$c17$) END,
  body = replace(body, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$, $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how The Joy makes mealtime one of the best parts of the day.$c17$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c17$In this post, we’ll explore why thoughtful dining matters so much for seniors, especially those in a personal care home or memory care, and how our community makes mealtime one of the best parts of the day.$c17$) > 0;

UPDATE posts SET
  title = replace(title, $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$, $c18$We invite you to discover how The Joy brings warmth, flavor, and care to every table.$c18$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$, $c18$We invite you to discover how The Joy brings warmth, flavor, and care to every table.$c18$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$, $c18$We invite you to discover how The Joy brings warmth, flavor, and care to every table.$c18$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$, $c18$We invite you to discover how The Joy brings warmth, flavor, and care to every table.$c18$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$, $c18$We invite you to discover how The Joy brings warmth, flavor, and care to every table.$c18$) END,
  body = replace(body, $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$, $c18$We invite you to discover how The Joy brings warmth, flavor, and care to every table.$c18$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c18$We invite you to discover how our community brings warmth, flavor, and care to every table.$c18$) > 0;

UPDATE posts SET
  title = replace(title, $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$, $c19$At The Joy, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$, $c19$At The Joy, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$, $c19$At The Joy, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$, $c19$At The Joy, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$, $c19$At The Joy, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$) END,
  body = replace(body, $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$, $c19$At The Joy, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c19$At our community, our beautifully designed porches are equipped with cozy seating and shade, making it easy for residents to breathe in the crisp spring air.$c19$) > 0;

UPDATE posts SET
  title = replace(title, $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$, $c20$The Joy encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$, $c20$The Joy encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$, $c20$The Joy encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$, $c20$The Joy encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$, $c20$The Joy encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$) END,
  body = replace(body, $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$, $c20$The Joy encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c20$Our senior living community encourages residents to unwind on the porch, whether they’re chatting away or simply enjoying the moment.$c20$) > 0;

UPDATE posts SET
  title = replace(title, $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$, $c21$We organize porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$, $c21$We organize porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$, $c21$We organize porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$, $c21$We organize porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$, $c21$We organize porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$) END,
  body = replace(body, $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$, $c21$We organize porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c21$Our community organizes porch-based activities like group chats and light exercise sessions to keep residents engaged and connected.$c21$) > 0;

UPDATE posts SET
  title = replace(title, $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$, $c22$To make the most of front porch sitting, The Joy offers spring activities tailored for seniors:$c22$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$, $c22$To make the most of front porch sitting, The Joy offers spring activities tailored for seniors:$c22$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$, $c22$To make the most of front porch sitting, The Joy offers spring activities tailored for seniors:$c22$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$, $c22$To make the most of front porch sitting, The Joy offers spring activities tailored for seniors:$c22$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$, $c22$To make the most of front porch sitting, The Joy offers spring activities tailored for seniors:$c22$) END,
  body = replace(body, $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$, $c22$To make the most of front porch sitting, The Joy offers spring activities tailored for seniors:$c22$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c22$To make the most of front porch sitting, our senior living community offers spring activities tailored for seniors:$c22$) > 0;

UPDATE posts SET
  title = replace(title, $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$, $c23$Our home is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$, $c23$Our home is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$, $c23$Our home is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$, $c23$Our home is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$, $c23$Our home is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$) END,
  body = replace(body, $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$, $c23$Our home is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c23$Our senior living community is designed with seniors in mind, offering safe, accessible outdoor spaces that prioritize comfort and enjoyment.$c23$) > 0;

UPDATE posts SET
  title = replace(title, $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$, $c24$This spring, we invite you to visit The Joy and see our beautiful porches for yourself.$c24$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$, $c24$This spring, we invite you to visit The Joy and see our beautiful porches for yourself.$c24$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$, $c24$This spring, we invite you to visit The Joy and see our beautiful porches for yourself.$c24$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$, $c24$This spring, we invite you to visit The Joy and see our beautiful porches for yourself.$c24$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$, $c24$This spring, we invite you to visit The Joy and see our beautiful porches for yourself.$c24$) END,
  body = replace(body, $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$, $c24$This spring, we invite you to visit The Joy and see our beautiful porches for yourself.$c24$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c24$This spring, we invite you to visit our senior living community and see our beautiful porches for yourself.$c24$) > 0;

UPDATE posts SET
  title = replace(title, $c25$Our caregivers are the heartbeat of our community.$c25$, $c25$Our caregivers are the heartbeat of our home.$c25$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c25$Our caregivers are the heartbeat of our community.$c25$, $c25$Our caregivers are the heartbeat of our home.$c25$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c25$Our caregivers are the heartbeat of our community.$c25$, $c25$Our caregivers are the heartbeat of our home.$c25$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c25$Our caregivers are the heartbeat of our community.$c25$, $c25$Our caregivers are the heartbeat of our home.$c25$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c25$Our caregivers are the heartbeat of our community.$c25$, $c25$Our caregivers are the heartbeat of our home.$c25$) END,
  body = replace(body, $c25$Our caregivers are the heartbeat of our community.$c25$, $c25$Our caregivers are the heartbeat of our home.$c25$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c25$Our caregivers are the heartbeat of our community.$c25$) > 0;

UPDATE posts SET
  title = replace(title, $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$, $c26$That means flexible visitation so families can drop by anytime, events like bingo nights and holiday feasts that spark laughter, and a home where every resident feels like they belong.$c26$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$, $c26$That means flexible visitation so families can drop by anytime, events like bingo nights and holiday feasts that spark laughter, and a home where every resident feels like they belong.$c26$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$, $c26$That means flexible visitation so families can drop by anytime, events like bingo nights and holiday feasts that spark laughter, and a home where every resident feels like they belong.$c26$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$, $c26$That means flexible visitation so families can drop by anytime, events like bingo nights and holiday feasts that spark laughter, and a home where every resident feels like they belong.$c26$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$, $c26$That means flexible visitation so families can drop by anytime, events like bingo nights and holiday feasts that spark laughter, and a home where every resident feels like they belong.$c26$) END,
  body = replace(body, $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$, $c26$That means flexible visitation so families can drop by anytime, events like bingo nights and holiday feasts that spark laughter, and a home where every resident feels like they belong.$c26$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c26$That means flexible visitation so families can drop by anytime, vibrant events like bingo nights and holiday feasts that spark laughter, and a community where every resident feels like they belong.$c26$) > 0;

UPDATE posts SET
  title = replace(title, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with activities for our residents.$c27$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with activities for our residents.$c27$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with activities for our residents.$c27$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with activities for our residents.$c27$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with activities for our residents.$c27$) END,
  body = replace(body, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$, $c27$At The Joy Senior Living in Loganville, GA, spring bursts with activities for our residents.$c27$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c27$At The Joy Senior Living in Loganville, GA, spring bursts with vibrant activities for our senior living community.$c27$) > 0;

UPDATE posts SET
  title = replace(title, $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$, $c28$The ceremony marked not just the opening of our new home but also the beginning of a new chapter for Loganville.$c28$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$, $c28$The ceremony marked not just the opening of our new home but also the beginning of a new chapter for Loganville.$c28$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$, $c28$The ceremony marked not just the opening of our new home but also the beginning of a new chapter for Loganville.$c28$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$, $c28$The ceremony marked not just the opening of our new home but also the beginning of a new chapter for Loganville.$c28$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$, $c28$The ceremony marked not just the opening of our new home but also the beginning of a new chapter for Loganville.$c28$) END,
  body = replace(body, $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$, $c28$The ceremony marked not just the opening of our new home but also the beginning of a new chapter for Loganville.$c28$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c28$The ceremony marked not just the inauguration of our new community but also the beginning of a new chapter for Loganville.$c28$) > 0;

UPDATE posts SET
  title = replace(title, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected The Joy’s values and vision.$c29$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected The Joy’s values and vision.$c29$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected The Joy’s values and vision.$c29$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected The Joy’s values and vision.$c29$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected The Joy’s values and vision.$c29$) END,
  body = replace(body, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$, $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected The Joy’s values and vision.$c29$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c29$Our staff at The Joy of Loganville showed true professionalism and enthusiasm, helping put together an event that reflected our community’s values and vision.$c29$) > 0;

UPDATE posts SET
  title = replace(title, $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$, $c30$It was a pleasure to show off their home, and their enthusiasm was contagious, spreading joy among all who attended.$c30$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$, $c30$It was a pleasure to show off their home, and their enthusiasm was contagious, spreading joy among all who attended.$c30$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$, $c30$It was a pleasure to show off their home, and their enthusiasm was contagious, spreading joy among all who attended.$c30$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$, $c30$It was a pleasure to show off their home, and their enthusiasm was contagious, spreading joy among all who attended.$c30$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$, $c30$It was a pleasure to show off their home, and their enthusiasm was contagious, spreading joy among all who attended.$c30$) END,
  body = replace(body, $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$, $c30$It was a pleasure to show off their home, and their enthusiasm was contagious, spreading joy among all who attended.$c30$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c30$It was a pleasure to show off the vibrant community that they are a part of, and their enthusiasm was contagious, spreading joy among all who attended.$c30$) > 0;

UPDATE posts SET
  title = replace(title, $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$, $c31$We are grateful for your support and look forward to growing together here at The Joy of Loganville.$c31$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$, $c31$We are grateful for your support and look forward to growing together here at The Joy of Loganville.$c31$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$, $c31$We are grateful for your support and look forward to growing together here at The Joy of Loganville.$c31$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$, $c31$We are grateful for your support and look forward to growing together here at The Joy of Loganville.$c31$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$, $c31$We are grateful for your support and look forward to growing together here at The Joy of Loganville.$c31$) END,
  body = replace(body, $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$, $c31$We are grateful for your support and look forward to growing together here at The Joy of Loganville.$c31$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c31$We are grateful for your support and look forward to growing together as a community here at The Joy of Loganville.$c31$) > 0;

UPDATE posts SET
  title = replace(title, $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$, $c32$We officially opened our doors to Loganville with a grand ribbon cutting ceremony. The ceremony marked not just the opening of our new home$c32$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$, $c32$We officially opened our doors to Loganville with a grand ribbon cutting ceremony. The ceremony marked not just the opening of our new home$c32$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$, $c32$We officially opened our doors to Loganville with a grand ribbon cutting ceremony. The ceremony marked not just the opening of our new home$c32$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$, $c32$We officially opened our doors to Loganville with a grand ribbon cutting ceremony. The ceremony marked not just the opening of our new home$c32$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$, $c32$We officially opened our doors to Loganville with a grand ribbon cutting ceremony. The ceremony marked not just the opening of our new home$c32$) END,
  body = replace(body, $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$, $c32$We officially opened our doors to Loganville with a grand ribbon cutting ceremony. The ceremony marked not just the opening of our new home$c32$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c32$We officially opened our doors to the community with a grand ribbon cutting ceremony. The ceremony marked not just the inauguration of our new community$c32$) > 0;

UPDATE posts SET
  title = replace(title, $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$, $c33$For more information about our specialized dementia care programs, please contact us or visit The Joy.$c33$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$, $c33$For more information about our specialized dementia care programs, please contact us or visit The Joy.$c33$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$, $c33$For more information about our specialized dementia care programs, please contact us or visit The Joy.$c33$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$, $c33$For more information about our specialized dementia care programs, please contact us or visit The Joy.$c33$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$, $c33$For more information about our specialized dementia care programs, please contact us or visit The Joy.$c33$) END,
  body = replace(body, $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$, $c33$For more information about our specialized dementia care programs, please contact us or visit The Joy.$c33$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c33$For more information about our specialized dementia care programs, please contact us or visit our community.$c33$) > 0;

UPDATE posts SET
  title = replace(title, $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$, $c34$Once a month at The Joy of Loganville, something magical happens.$c34$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$, $c34$Once a month at The Joy of Loganville, something magical happens.$c34$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$, $c34$Once a month at The Joy of Loganville, something magical happens.$c34$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$, $c34$Once a month at The Joy of Loganville, something magical happens.$c34$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$, $c34$Once a month at The Joy of Loganville, something magical happens.$c34$) END,
  body = replace(body, $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$, $c34$Once a month at The Joy of Loganville, something magical happens.$c34$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c34$Nestled in the heart of our community at The Joy of Loganville, something magical happens once a month.$c34$) > 0;

UPDATE posts SET
  title = replace(title, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls The Joy home.$c35$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls The Joy home.$c35$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls The Joy home.$c35$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls The Joy home.$c35$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls The Joy home.$c35$) END,
  body = replace(body, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$, $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls The Joy home.$c35$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c35$Pet therapy is just one of the many ways we strive to create a joyful, engaging, and compassionate environment for everyone who calls our community home.$c35$) > 0;

UPDATE posts SET
  title = replace(title, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our home, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our home, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our home, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our home, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our home, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$) END,
  body = replace(body, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$, $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our home, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c36$Stay tuned for more updates and delightful tales from our pet therapy sessions, and if you wish to experience the joy and tranquility of our community, we invite you to visit us and see firsthand the difference love on four paws can make.$c36$) > 0;

UPDATE posts SET
  title = replace(title, $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$, $c37$In Loganville, Georgia, The Joy Senior Living is a licensed personal care home that offers a personal touch in elder care.$c37$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$, $c37$In Loganville, Georgia, The Joy Senior Living is a licensed personal care home that offers a personal touch in elder care.$c37$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$, $c37$In Loganville, Georgia, The Joy Senior Living is a licensed personal care home that offers a personal touch in elder care.$c37$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$, $c37$In Loganville, Georgia, The Joy Senior Living is a licensed personal care home that offers a personal touch in elder care.$c37$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$, $c37$In Loganville, Georgia, The Joy Senior Living is a licensed personal care home that offers a personal touch in elder care.$c37$) END,
  body = replace(body, $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$, $c37$In Loganville, Georgia, The Joy Senior Living is a licensed personal care home that offers a personal touch in elder care.$c37$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c37$Nestled in Loganville, Georgia, The Joy Senior Living is more than just a senior care facility; it's a community that offers a personal touch in elder care.$c37$) > 0;

UPDATE posts SET
  title = replace(title, $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$, $c38$Our home is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$, $c38$Our home is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$, $c38$Our home is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$, $c38$Our home is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$, $c38$Our home is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$) END,
  body = replace(body, $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$, $c38$Our home is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c38$Our community is built on the bonds that our residents and staff develop with each other, creating a warm, family-like atmosphere.$c38$) > 0;

UPDATE posts SET
  title = replace(title, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, engaging activities, and serene surroundings await!$c39$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, engaging activities, and serene surroundings await!$c39$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, engaging activities, and serene surroundings await!$c39$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, engaging activities, and serene surroundings await!$c39$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, engaging activities, and serene surroundings await!$c39$) END,
  body = replace(body, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$, $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, engaging activities, and serene surroundings await!$c39$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c39$Discover intimate senior care at The Joy of Loganville. Personalized attention, vibrant community activities, and serene surroundings await!$c39$) > 0;

UPDATE posts SET
  title = replace(title, $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$, $c40$Our personal care home in Loganville, GA, offers a happy place to live.$c40$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$, $c40$Our personal care home in Loganville, GA, offers a happy place to live.$c40$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$, $c40$Our personal care home in Loganville, GA, offers a happy place to live.$c40$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$, $c40$Our personal care home in Loganville, GA, offers a happy place to live.$c40$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$, $c40$Our personal care home in Loganville, GA, offers a happy place to live.$c40$) END,
  body = replace(body, $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$, $c40$Our personal care home in Loganville, GA, offers a happy place to live.$c40$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c40$Our **senior living community in Loganville, GA**, offers **personal care** and a happy place to live.$c40$) > 0;

UPDATE posts SET
  title = replace(title, $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$, $c41$Our Commitment to Your Wellbeing The Joy Senior Living of Loganville is a home that puts joy, respect, and dignity first.$c41$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$, $c41$Our Commitment to Your Wellbeing The Joy Senior Living of Loganville is a home that puts joy, respect, and dignity first.$c41$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$, $c41$Our Commitment to Your Wellbeing The Joy Senior Living of Loganville is a home that puts joy, respect, and dignity first.$c41$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$, $c41$Our Commitment to Your Wellbeing The Joy Senior Living of Loganville is a home that puts joy, respect, and dignity first.$c41$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$, $c41$Our Commitment to Your Wellbeing The Joy Senior Living of Loganville is a home that puts joy, respect, and dignity first.$c41$) END,
  body = replace(body, $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$, $c41$Our Commitment to Your Wellbeing The Joy Senior Living of Loganville is a home that puts joy, respect, and dignity first.$c41$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c41$**Our Commitment to Your Wellbeing**The Joy Senior Living of Loganville isn’t just a place to live; it's a vibrant community that prioritizes joy, respect, and dignity.$c41$) > 0;

UPDATE posts SET
  title = replace(title, $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$, $c42$$c42$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$, $c42$$c42$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$, $c42$$c42$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$, $c42$$c42$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$, $c42$$c42$) END,
  body = replace(body, $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$, $c42$$c42$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c42$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success. Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c42$) > 0;

UPDATE posts SET
  title = replace(title, $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$, $c43$$c43$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$, $c43$$c43$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$, $c43$$c43$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$, $c43$$c43$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$, $c43$$c43$) END,
  body = replace(body, $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$, $c43$$c43$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c43$ Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c43$) > 0;

UPDATE posts SET
  title = replace(title, $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$, $c44$$c44$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$, $c44$$c44$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$, $c44$$c44$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$, $c44$$c44$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$, $c44$$c44$) END,
  body = replace(body, $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$, $c44$$c44$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c44$Peppur’s vision and energy inspire us all to strive for excellence, and we’re endlessly grateful for her ability to hold our community together with grace and warmth.$c44$) > 0;

UPDATE posts SET
  title = replace(title, $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$, $c45$$c45$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$, $c45$$c45$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$, $c45$$c45$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$, $c45$$c45$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$, $c45$$c45$) END,
  body = replace(body, $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$, $c45$$c45$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c45$ Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c45$) > 0;

UPDATE posts SET
  title = replace(title, $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$, $c46$$c46$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$, $c46$$c46$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$, $c46$$c46$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$, $c46$$c46$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$, $c46$$c46$) END,
  body = replace(body, $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$, $c46$$c46$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c46$Peppur, our amazing Executive Director, deserves special acknowledgment for her leadership and vision, which have been central to our community’s ethos and success.$c46$) > 0;

UPDATE posts SET
  title = replace(title, $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$, $c47$$c47$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$, $c47$$c47$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$, $c47$$c47$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$, $c47$$c47$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$, $c47$$c47$) END,
  body = replace(body, $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$, $c47$$c47$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c47$ Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c47$) > 0;

UPDATE posts SET
  title = replace(title, $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$, $c48$$c48$),
  excerpt = CASE WHEN excerpt IS NULL THEN excerpt ELSE replace(excerpt, $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$, $c48$$c48$) END,
  meta_title = CASE WHEN meta_title IS NULL THEN meta_title ELSE replace(meta_title, $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$, $c48$$c48$) END,
  meta_description = CASE WHEN meta_description IS NULL THEN meta_description ELSE replace(meta_description, $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$, $c48$$c48$) END,
  hero_image_alt = CASE WHEN hero_image_alt IS NULL THEN hero_image_alt ELSE replace(hero_image_alt, $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$, $c48$$c48$) END,
  body = replace(body, $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$, $c48$$c48$),
  updated_at = now()
WHERE strpos(coalesce(title,'') || E'\n' || coalesce(excerpt,'') || E'\n' || coalesce(meta_title,'') || E'\n' || coalesce(meta_description,'') || E'\n' || coalesce(hero_image_alt,'') || E'\n' || coalesce(body,''), $c48$Her guidance and dedication have inspired us all and have set a strong foundation for the future of The Joy!$c48$) > 0;


    INSERT INTO applied_content_updates (id) VALUES ('community-replacements-2026-09-28');
  END IF;
END
$community_pass$;


-- Award consolidation: one paragraph naming both the 2025 and 2026 awards,
-- placed after the paragraph that ends "wrote about how it went."
DO $award_para$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates WHERE id = 'award-2025-paragraph-2026-09-28'
  ) THEN
    UPDATE posts SET
      body = replace(
        body,
        $ap$wrote about how it went.$ap$,
        $ap$wrote about how it went.

A Place for Mom also gave The Joy its Best of Senior Living award in 2025, so 2026 makes two years in a row. Both times, the award came from reviews families wrote on A Place for Mom. Nothing we sent in had anything to do with it. The credit belongs to the caregivers and cooks who do the daily work, and to Mellissa Daniel, who leads them.$ap$
      ),
      updated_at = now()
    WHERE slug = $ap$what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$ap$
      AND strpos(body, $ap$wrote about how it went.$ap$) > 0
      AND strpos(body, $ap$A Place for Mom also gave The Joy its Best of Senior Living award in 2025$ap$) = 0;

    INSERT INTO applied_content_updates (id) VALUES ('award-2025-paragraph-2026-09-28');
  END IF;
END
$award_para$;


-- Redirected posts leave /blog, the sitemap, and Related reading.
-- Runs once. A later publish in Admin is left alone.
DO $unpublish_redirects$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates WHERE id = 'unpublish-redirected-posts-2026-09-28'
  ) THEN
    UPDATE posts SET status = 'draft', updated_at = now()
    WHERE slug IN ($un$welcome-to-the-joy$un$, $un$a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$un$, $un$hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$un$, $un$what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$un$, $un$the-talk$un$, $un$fall-prevention-seniors-home-starts-now$un$, $un$is-it-time-for-senior-living-a-guide-to-knowing-when$un$, $un$maybe-its-time-for-a-little-more-joy$un$, $un$the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga$un$, $un$we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$un$)
      AND status IS DISTINCT FROM 'draft';

    INSERT INTO applied_content_updates (id) VALUES ('unpublish-redirected-posts-2026-09-28');
  END IF;
END
$unpublish_redirects$;


-- Internal links that pointed at posts now redirected. Exact URL text only.
-- Also covers the https://www form. A later edit that removes the old URL is left alone.

UPDATE posts SET
  body = replace(body, $lk0$/blog/welcome-to-the-joy$lk0$, $lk0$/about$lk0$),
  updated_at = now()
WHERE strpos(body, $lk0$/blog/welcome-to-the-joy$lk0$) > 0;

UPDATE posts SET
  body = replace(body, $lk0$https://www.joyseniorcare.com/blog/welcome-to-the-joy$lk0$, $lk0$https://www.joyseniorcare.com/about$lk0$),
  updated_at = now()
WHERE strpos(body, $lk0$https://www.joyseniorcare.com/blog/welcome-to-the-joy$lk0$) > 0;

UPDATE posts SET
  body = replace(body, $lk1$/blog/a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$lk1$, $lk1$/about$lk1$),
  updated_at = now()
WHERE strpos(body, $lk1$/blog/a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$lk1$) > 0;

UPDATE posts SET
  body = replace(body, $lk1$https://www.joyseniorcare.com/blog/a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$lk1$, $lk1$https://www.joyseniorcare.com/about$lk1$),
  updated_at = now()
WHERE strpos(body, $lk1$https://www.joyseniorcare.com/blog/a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$lk1$) > 0;

UPDATE posts SET
  body = replace(body, $lk2$/blog/hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$lk2$, $lk2$/reviews$lk2$),
  updated_at = now()
WHERE strpos(body, $lk2$/blog/hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$lk2$) > 0;

UPDATE posts SET
  body = replace(body, $lk2$https://www.joyseniorcare.com/blog/hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$lk2$, $lk2$https://www.joyseniorcare.com/reviews$lk2$),
  updated_at = now()
WHERE strpos(body, $lk2$https://www.joyseniorcare.com/blog/hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$lk2$) > 0;

UPDATE posts SET
  body = replace(body, $lk3$/blog/what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$lk3$, $lk3$/blog/questions-to-ask-personal-care-home-tour$lk3$),
  updated_at = now()
WHERE strpos(body, $lk3$/blog/what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$lk3$) > 0;

UPDATE posts SET
  body = replace(body, $lk3$https://www.joyseniorcare.com/blog/what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$lk3$, $lk3$https://www.joyseniorcare.com/blog/questions-to-ask-personal-care-home-tour$lk3$),
  updated_at = now()
WHERE strpos(body, $lk3$https://www.joyseniorcare.com/blog/what-to-look-for-in-an-assisted-living-community-from-people-who-run-one$lk3$) > 0;

UPDATE posts SET
  body = replace(body, $lk4$/blog/the-talk$lk4$, $lk4$/blog/how-to-have-the-it-might-be-time-conversation$lk4$),
  updated_at = now()
WHERE strpos(body, $lk4$/blog/the-talk$lk4$) > 0;

UPDATE posts SET
  body = replace(body, $lk4$https://www.joyseniorcare.com/blog/the-talk$lk4$, $lk4$https://www.joyseniorcare.com/blog/how-to-have-the-it-might-be-time-conversation$lk4$),
  updated_at = now()
WHERE strpos(body, $lk4$https://www.joyseniorcare.com/blog/the-talk$lk4$) > 0;

UPDATE posts SET
  body = replace(body, $lk5$/blog/fall-prevention-seniors-home-starts-now$lk5$, $lk5$/blog/room-by-room-the-fall-prevention-walkthrough-every-adult-child-should-do$lk5$),
  updated_at = now()
WHERE strpos(body, $lk5$/blog/fall-prevention-seniors-home-starts-now$lk5$) > 0;

UPDATE posts SET
  body = replace(body, $lk5$https://www.joyseniorcare.com/blog/fall-prevention-seniors-home-starts-now$lk5$, $lk5$https://www.joyseniorcare.com/blog/room-by-room-the-fall-prevention-walkthrough-every-adult-child-should-do$lk5$),
  updated_at = now()
WHERE strpos(body, $lk5$https://www.joyseniorcare.com/blog/fall-prevention-seniors-home-starts-now$lk5$) > 0;

UPDATE posts SET
  body = replace(body, $lk6$/blog/is-it-time-for-senior-living-a-guide-to-knowing-when$lk6$, $lk6$/when-its-time$lk6$),
  updated_at = now()
WHERE strpos(body, $lk6$/blog/is-it-time-for-senior-living-a-guide-to-knowing-when$lk6$) > 0;

UPDATE posts SET
  body = replace(body, $lk6$https://www.joyseniorcare.com/blog/is-it-time-for-senior-living-a-guide-to-knowing-when$lk6$, $lk6$https://www.joyseniorcare.com/when-its-time$lk6$),
  updated_at = now()
WHERE strpos(body, $lk6$https://www.joyseniorcare.com/blog/is-it-time-for-senior-living-a-guide-to-knowing-when$lk6$) > 0;

UPDATE posts SET
  body = replace(body, $lk7$/blog/maybe-its-time-for-a-little-more-joy$lk7$, $lk7$/when-its-time$lk7$),
  updated_at = now()
WHERE strpos(body, $lk7$/blog/maybe-its-time-for-a-little-more-joy$lk7$) > 0;

UPDATE posts SET
  body = replace(body, $lk7$https://www.joyseniorcare.com/blog/maybe-its-time-for-a-little-more-joy$lk7$, $lk7$https://www.joyseniorcare.com/when-its-time$lk7$),
  updated_at = now()
WHERE strpos(body, $lk7$https://www.joyseniorcare.com/blog/maybe-its-time-for-a-little-more-joy$lk7$) > 0;

UPDATE posts SET
  body = replace(body, $lk8$/blog/the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga$lk8$, $lk8$/blog/what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$lk8$),
  updated_at = now()
WHERE strpos(body, $lk8$/blog/the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga$lk8$) > 0;

UPDATE posts SET
  body = replace(body, $lk8$https://www.joyseniorcare.com/blog/the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga$lk8$, $lk8$https://www.joyseniorcare.com/blog/what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$lk8$),
  updated_at = now()
WHERE strpos(body, $lk8$https://www.joyseniorcare.com/blog/the-joy-senior-living-wins-best-of-senior-living-award-in-loganville-ga$lk8$) > 0;

UPDATE posts SET
  body = replace(body, $lk9$/blog/we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$lk9$, $lk9$/blog/what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$lk9$),
  updated_at = now()
WHERE strpos(body, $lk9$/blog/we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$lk9$) > 0;

UPDATE posts SET
  body = replace(body, $lk9$https://www.joyseniorcare.com/blog/we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$lk9$, $lk9$https://www.joyseniorcare.com/blog/what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$lk9$),
  updated_at = now()
WHERE strpos(body, $lk9$https://www.joyseniorcare.com/blog/we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom$lk9$) > 0;


-- Budgeting post: drop the promise of a workbook that does not exist.
-- Exact-match only. Worksheet headings are not touched.
UPDATE posts SET
  body = replace(
    replace(
      body,
      $wb$Use this workbook as a guide to navigate the complexities of senior care costs and develop a sustainable financial plan.$wb$,
      $wb$Use this guide to navigate the complexities of senior care costs and develop a sustainable financial plan.$wb$
    ),
    $wb$This comprehensive workbook will guide you through the process of understanding costs, assessing financial resources, and developing a realistic budget for senior care.$wb$,
    $wb$This guide will walk you through the process of understanding costs, assessing financial resources, and developing a realistic budget for senior care.$wb$
  ),
  excerpt = CASE
    WHEN btrim(excerpt) = $wb$Planning for a parent's care? Our free workbook compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$wb$
      THEN $wb$Planning for a parent's care? This guide compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$wb$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN btrim(meta_description) = $wb$Planning for a parent's care? Our free workbook compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$wb$
      THEN $wb$Planning for a parent's care? This guide compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$wb$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $wb$budgeting-for-senior-care-how-to-prepare-for-the-ever-raising-cost-of-senior-care$wb$
  AND (
    strpos(body, $wb$Use this workbook as a guide to navigate the complexities of senior care costs and develop a sustainable financial plan.$wb$) > 0
    OR strpos(body, $wb$This comprehensive workbook will guide you through the process of understanding costs, assessing financial resources, and developing a realistic budget for senior care.$wb$) > 0
    OR btrim(excerpt) = $wb$Planning for a parent's care? Our free workbook compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$wb$
    OR btrim(meta_description) = $wb$Planning for a parent's care? Our free workbook compares in-home care, personal care home, and nursing home costs so you can build a realistic care budget.$wb$
  );


-- Gallery captions and alt text. Matches by filename so a host prefix still hits.
-- Inserts a row only when that file is not already in the gallery.
DO $gallery_caps$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates WHERE id = 'gallery-captions-2026-09-28'
  ) THEN


    UPDATE photos SET
      caption = $g0$Holding hands and sharing a smile.$g0$,
      image_alt = $g0$An older woman with white hair and glasses, a green knit wrap around her shoulders, smiles at a bearded man in a yellow cap. His arm is around her shoulders, and she holds his hand.$g0$
    WHERE image_url LIKE $g0$%gallery-1157686.jpg$g0$;

    INSERT INTO photos (image_url, caption, image_alt, posted_at)
    SELECT $g0$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/gallery-1157686.jpg$g0$, $g0$Holding hands and sharing a smile.$g0$, $g0$An older woman with white hair and glasses, a green knit wrap around her shoulders, smiles at a bearded man in a yellow cap. His arm is around her shoulders, and she holds his hand.$g0$,
           TIMESTAMPTZ '2026-09-01 18:00:00+00' + (6 || ' minutes')::interval
    WHERE NOT EXISTS (
      SELECT 1 FROM photos WHERE image_url LIKE $g0$%gallery-1157686.jpg$g0$
    );


    UPDATE photos SET
      caption = $g1$A cookout under the covered patio.$g1$,
      image_alt = $g1$A large group eats at long tables under a covered wooden patio. Red cups sit on the tables, a walker and a wheelchair are parked nearby, and trees and parked cars fill the background.$g1$
    WHERE image_url LIKE $g1$%gallery-474265.jpg$g1$;

    INSERT INTO photos (image_url, caption, image_alt, posted_at)
    SELECT $g1$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/gallery-474265.jpg$g1$, $g1$A cookout under the covered patio.$g1$, $g1$A large group eats at long tables under a covered wooden patio. Red cups sit on the tables, a walker and a wheelchair are parked nearby, and trees and parked cars fill the background.$g1$,
           TIMESTAMPTZ '2026-09-01 18:00:00+00' + (5 || ' minutes')::interval
    WHERE NOT EXISTS (
      SELECT 1 FROM photos WHERE image_url LIKE $g1$%gallery-474265.jpg$g1$
    );


    UPDATE photos SET
      caption = $g2$Red, white and blue on a summer day.$g2$,
      image_alt = $g2$Six adults and a young boy pose on a concrete walkway in patriotic clothes, including flag-print overalls and a USA T-shirt. The boy stands on a white cooler. Trees, parked cars and a stone planter are behind them.$g2$
    WHERE image_url LIKE $g2$%gallery-519567.jpg$g2$;

    INSERT INTO photos (image_url, caption, image_alt, posted_at)
    SELECT $g2$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/gallery-519567.jpg$g2$, $g2$Red, white and blue on a summer day.$g2$, $g2$Six adults and a young boy pose on a concrete walkway in patriotic clothes, including flag-print overalls and a USA T-shirt. The boy stands on a white cooler. Trees, parked cars and a stone planter are behind them.$g2$,
           TIMESTAMPTZ '2026-09-01 18:00:00+00' + (4 || ' minutes')::interval
    WHERE NOT EXISTS (
      SELECT 1 FROM photos WHERE image_url LIKE $g2$%gallery-519567.jpg$g2$
    );


    UPDATE photos SET
      caption = $g3$A hug on the couch.$g3$,
      image_alt = $g3$Three older women sit close together on a dark gray couch. Two of them hug, and the third, wearing glasses and a green plaid pajama top, smiles at the camera.$g3$
    WHERE image_url LIKE $g3$%gallery-403657.jpg$g3$;

    INSERT INTO photos (image_url, caption, image_alt, posted_at)
    SELECT $g3$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/gallery-403657.jpg$g3$, $g3$A hug on the couch.$g3$, $g3$Three older women sit close together on a dark gray couch. Two of them hug, and the third, wearing glasses and a green plaid pajama top, smiles at the camera.$g3$,
           TIMESTAMPTZ '2026-09-01 18:00:00+00' + (3 || ' minutes')::interval
    WHERE NOT EXISTS (
      SELECT 1 FROM photos WHERE image_url LIKE $g3$%gallery-403657.jpg$g3$
    );


    UPDATE photos SET
      caption = $g4$A fall meal at the table.$g4$,
      image_alt = $g4$Two women sit at a table with a white cloth and paper autumn leaves. The older woman in the middle has a plate of food in front of her. A third woman in a mustard-colored top leans in beside her and smiles. A fall wreath hangs on the glass doors behind them.$g4$
    WHERE image_url LIKE $g4$%gallery-550456.jpg$g4$;

    INSERT INTO photos (image_url, caption, image_alt, posted_at)
    SELECT $g4$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/gallery-550456.jpg$g4$, $g4$A fall meal at the table.$g4$, $g4$Two women sit at a table with a white cloth and paper autumn leaves. The older woman in the middle has a plate of food in front of her. A third woman in a mustard-colored top leans in beside her and smiles. A fall wreath hangs on the glass doors behind them.$g4$,
           TIMESTAMPTZ '2026-09-01 18:00:00+00' + (2 || ' minutes')::interval
    WHERE NOT EXISTS (
      SELECT 1 FROM photos WHERE image_url LIKE $g4$%gallery-550456.jpg$g4$
    );


    UPDATE photos SET
      caption = $g5$Gathered around the table during the holidays.$g5$,
      image_alt = $g5$A group gathers around a table indoors. A smiling man in a white T-shirt sits in front, and a woman behind him holds up a peace sign. Beside him are an older woman in a black top with a red necklace and a woman in a pink embroidered top. Another woman in a gray jacket stands behind them, and small holiday decorations sit on the counter in the background.$g5$
    WHERE image_url LIKE $g5$%gallery-415613.jpg$g5$;

    INSERT INTO photos (image_url, caption, image_alt, posted_at)
    SELECT $g5$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/gallery-415613.jpg$g5$, $g5$Gathered around the table during the holidays.$g5$, $g5$A group gathers around a table indoors. A smiling man in a white T-shirt sits in front, and a woman behind him holds up a peace sign. Beside him are an older woman in a black top with a red necklace and a woman in a pink embroidered top. Another woman in a gray jacket stands behind them, and small holiday decorations sit on the counter in the background.$g5$,
           TIMESTAMPTZ '2026-09-01 18:00:00+00' + (1 || ' minutes')::interval
    WHERE NOT EXISTS (
      SELECT 1 FROM photos WHERE image_url LIKE $g5$%gallery-415613.jpg$g5$
    );


    INSERT INTO applied_content_updates (id) VALUES ('gallery-captions-2026-09-28');
  END IF;
END
$gallery_caps$;

-- Row 46 of the community pass is a crawl of two adjacent sentences. The second
-- sentence is replaced on its own (the "inauguration of our new community"
-- sentence). This applies the first sentence, which is what remains in the post.
DO $ribbon_doors$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates WHERE id = 'ribbon-doors-sentence-2026-09-28'
  ) THEN
    UPDATE posts SET
      body = replace(
        body,
        $rd$We officially opened our doors to the community with a grand ribbon cutting ceremony.$rd$,
        $rd$We officially opened our doors to Loganville with a grand ribbon cutting ceremony.$rd$
      ),
      updated_at = now()
    WHERE slug = $rd$a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$rd$
      AND strpos(body, $rd$We officially opened our doors to the community with a grand ribbon cutting ceremony.$rd$) > 0;

    INSERT INTO applied_content_updates (id) VALUES ('ribbon-doors-sentence-2026-09-28');
  END IF;
END
$ribbon_doors$;



-- Publish the dementia caregiver support group post (2026-09-28).
-- One marker. A later boot does not run this block, so an edit in Admin
-- after this publish is left alone.
--
-- The earlier draft block records its marker even when the INSERT matches
-- nothing (the slug is already there). A row that is published with no
-- publish time is not on the site (404) and is not status draft, so
-- Admin > Posts > Drafts does not list it, and the marker stops any retry.
-- This block does not depend on that marker. If the slug is missing, insert
-- the same post. If the row is already there, change only status, the
-- publish time, and the hero image.
-- The marker is written only after that row is actually published with this
-- date and image, so a failed insert is tried again on the next boot.
DO $publish_sgpost$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates
    WHERE id = 'publish-dementia-caregiver-support-group-2026-09-28'
  ) THEN
    INSERT INTO posts (
      slug,
      title,
      excerpt,
      body,
      hero_image,
      hero_image_alt,
      author,
      category,
      status,
      meta_title,
      meta_description,
      published_at
    )
    SELECT
      $pubsg$dementia-caregiver-support-group$pubsg$,
      $pubsg$What a Dementia Caregiver Support Group Is Like$pubsg$,
      $pubsg$Caring for a parent with dementia? Here's what a caregiver support group is, what happens at a meeting, and how to tell if one is right for you. Plain answers.$pubsg$,
      $pubsg$It's 4:30 in the afternoon and Mom asks where her car is. She hasn't driven in three years. You tell her it's at the shop. That's the fourth time today.

You don't correct her anymore. You learned that the hard way. You've also stopped telling friends about days like this. They say "that must be so hard" and change the subject. They mean well. They just don't know.

Some people do know. They meet in support groups.

## What a caregiver support group is

A dementia caregiver support group is a regular meeting for the people doing the caring. The son who moved Dad into the spare bedroom. The daughter who drives over every morning before work to make sure Mom took her pills. The spouse, the grandchild, the neighbor who ended up doing more than anyone planned.

It isn't therapy, and it isn't a class. Nobody's there to diagnose your parent or grade how you're doing. It's a group of people in the same situation, usually with a facilitator who keeps the conversation moving and makes sure everyone who wants to talk gets the chance.

Groups meet at churches, hospitals, libraries, and senior care homes. Some meet online. The Alzheimer's Association runs and lists groups across Georgia, and its website has a search by zip code.

## Why it helps

**You stop being the only one.** Dementia care is lonely in a specific way. Your parent may not remember the hard day you both just had. Your friends can't picture it. A group is a room where you don't have to explain the basics. Say "she accused me of stealing her purse again," and nobody flinches.

**You get tips that actually work.** Someone in the room has already dealt with what you're facing this week. The refusing to bathe. The 3 a.m. wandering. The fight over the car keys. They'll tell you what they tried, what failed, and what finally worked. That's hard to find in a pamphlet.

**The stress has somewhere to go.** Caregivers carry a lot they don't say out loud: frustration, guilt about the frustration, fear about money, resentment toward the sibling who calls once a month with advice. Saying it to people who get it takes some of the weight off. It won't all go away, but some of it will.

**You can grieve while your parent is still here.** Dementia takes a person a little at a time. Many caregivers mourn the mom or dad they used to talk to while caring for the one in front of them, and feel strange about it. A group is one of the few places where that grief makes sense to everyone listening.

## What happens at a meeting

Most groups follow a loose pattern. People arrive, get a cup of coffee, and sit in a circle. The facilitator opens, and people go around and say how things have been. Sometimes the whole hour stays there. Sometimes one person's week turns into the conversation.

Some groups bring in a guest now and then. That might be a hospice nurse, an elder law attorney, or someone from a local agency who can explain what help is out there.

You can talk as much as you want. You can also just listen. That's allowed, especially the first time. Nobody will push you to share.

What's said in the room stays in the room. Most groups say that out loud at the start.

## How to know if one is right for you

A group might help if:

- You haven't told anyone how hard this really is.
- You keep searching online at night for answers to the same problems.
- You feel short-tempered with your parent and guilty afterward.
- Your own doctor's appointments keep getting pushed back.
- You're starting to wonder what comes next, and you don't know who to ask.

Try a group more than once before you decide. The first meeting can feel awkward. The second is usually easier, because now you know a face or two.

If a group isn't for you, that's fine too. Some people do better one on one with a counselor. Some prefer an online group they can join after bedtime. The Alzheimer's Association also runs a free 24/7 Helpline at [800-272-3900](tel:+18002723900), staffed by people trained in dementia care. What matters is that you're not carrying this alone.

## If you can't get away

For a lot of caregivers, the hardest part is leaving the house. Somebody has to be with Mom.

Ask a sibling or a friend for one afternoon a month. Be specific about the day and the time. People who say "let me know if you need anything" often mean it. They just need to be told what to do.

Some senior care homes also offer respite stays, a short stay where your parent is cared for while you rest or handle your own life for a few days. It's worth asking about, even if you're not ready to use it yet.

## A group that meets near you

The Joy Senior Living is a licensed personal care home in Loganville, right on the Gwinnett edge. We host a Dementia Caregiver Support Group on site on the third Thursday of every month at 2pm.

It's free and open to anyone caring for someone with dementia. You don't need a parent living with us, and you don't need to be thinking about a move. If you live in Walton or Gwinnett County and you're doing this at home, you're welcome.

For details, call [(470) 684-3569](tel:+14706843569) or email [hello@joyseniorcare.com](mailto:hello@joyseniorcare.com). You don't need to bring anything or prepare anything.

Mom will probably ask about her car again tomorrow. Come tell us what you said.

Adam Upchurch\
Owner, The Joy Senior Living
$pubsg$,
      $pubsg$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/community-6-256645.jpg$pubsg$,
      $pubsg$The garden and grounds at Joy Senior Living$pubsg$,
      $pubsg$Adam Upchurch$pubsg$,
      $pubsg$articles$pubsg$,
      $pubsg$published$pubsg$,
      NULL,
      $pubsg$Caring for a parent with dementia? Here's what a caregiver support group is, what happens at a meeting, and how to tell if one is right for you. Plain answers.$pubsg$,
      TIMESTAMPTZ '2026-09-28 12:00:00 America/New_York'
    WHERE NOT EXISTS (
      SELECT 1 FROM posts WHERE slug = $pubsg$dementia-caregiver-support-group$pubsg$
    );

    UPDATE posts SET
      status = 'published',
      published_at = TIMESTAMPTZ '2026-09-28 12:00:00 America/New_York',
      hero_image = $pubsg$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/community-6-256645.jpg$pubsg$,
      hero_image_alt = $pubsg$The garden and grounds at Joy Senior Living$pubsg$,
      updated_at = now()
    WHERE slug = $pubsg$dementia-caregiver-support-group$pubsg$;

    IF EXISTS (
      SELECT 1 FROM posts
      WHERE slug = $pubsg$dementia-caregiver-support-group$pubsg$
        AND status = 'published'
        AND published_at = TIMESTAMPTZ '2026-09-28 12:00:00 America/New_York'
        AND hero_image = $pubsg$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/community-6-256645.jpg$pubsg$
    ) THEN
      INSERT INTO applied_content_updates (id)
      VALUES ('publish-dementia-caregiver-support-group-2026-09-28');
    END IF;
  END IF;
END
$publish_sgpost$;

-- In-post tour CTAs that still point at /tour (including rows an older
-- version of this file pointed at /tour). TalkFurther instance 55. The match
-- includes the closing paren, so /tour-checklist is left alone. The phone
-- link stays.
UPDATE posts SET
  body = replace(
    replace(
      replace(
        body,
        $md$[Schedule a visit](/tour)$md$,
        $md$[Schedule a visit](https://www.joyseniorcare.com/#/further/55)$md$
      ),
      $md$[Schedule a consultation for personal care](/tour)$md$,
      $md$[Schedule a consultation for personal care](https://www.joyseniorcare.com/#/further/55)$md$
    ),
    $md$[joyseniorcare.com/tour](/tour)$md$,
    $md$[joyseniorcare.com](https://www.joyseniorcare.com/#/further/55)$md$
  ),
  updated_at = now()
WHERE strpos(body, $md$[Schedule a visit](/tour)$md$) > 0
   OR strpos(body, $md$[Schedule a consultation for personal care](/tour)$md$) > 0
   OR strpos(body, $md$[joyseniorcare.com/tour](/tour)$md$) > 0;

-- Published post (2026-10-02): memory care in Loganville, when home care
-- isn't enough. Owner-approved companion to /memory-care.
-- One marker. A later boot skips this block, so an edit in Admin is left
-- alone. The slug check avoids a duplicate. The marker is written only once
-- the row exists, so a failed insert is tried again on the next boot.
DO $apply_mcl$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates
    WHERE id = 'memory-care-loganville-what-to-look-for-2026-10-02'
  ) THEN
    INSERT INTO posts (
      slug,
      title,
      excerpt,
      body,
      hero_image,
      hero_image_alt,
      author,
      category,
      status,
      meta_title,
      meta_description,
      published_at
    )
    SELECT
      $mcl$memory-care-loganville-what-to-look-for$mcl$,
      $mcl$When Home Care Isn't Enough: Memory Care for a Parent in Loganville$mcl$,
      $mcl$Signs home care may not be enough, what a good memory care tour covers, and how a small personal care home in Loganville approaches dementia care.$mcl$,
      $mcl$There's a week when the old plan stops working. Mom walks out the front door looking for a house she left in 1987. Dad takes his morning pills at lunch and again after dinner because he forgot the first round. Late afternoon turns sharp. The aide leaves at 6. You're still awake at midnight listening for footsteps.

Home care can be excellent. Many families run it longer than anyone thought possible. Then the gaps show up in the hours nobody covers, and safety stops being theoretical.

Skip the lecture about when you "should" move your parent. What follows is a plain look at where home care hits its limits, what a memory care tour should cover, and how a small personal care home in Loganville runs dementia care day to day.

## Home care vs memory care

Home care usually means a caregiver comes to the house for set hours. One person. One schedule. Your mom stays in familiar rooms. That can work for a long time, especially early on.

It starts to fall short when needs don't fit a clock:

- Wandering or exit-seeking, especially evenings and nights
- Missed or double-dosed medications despite reminders
- Sundowning that turns the late day into conflict or fear
- Falls when nobody is there to steady a transfer
- Care hours stacking up until you're paying for near-constant coverage and still filling the overnight yourself

Memory care is a setting built around those risks. In Georgia, that often means a licensed personal care home with memory care certification, secured doors, staff trained for dementia, and routines that hold steady when your parent's memory doesn't.

Home care is still the right tool for some families. Memory care is the next step when one-on-one hours at home can't keep your parent safe through a full day and night. You don't have to hate home care to admit it isn't enough anymore.

If you're comparing options around Loganville, ask each place the same questions. Write the answers down. The differences show up in staffing, medications, and how the building is secured, not in the lobby flowers.

## What to look for on a memory care tour

A tour should feel like an interview you run, not a sales pitch you sit through. Bring a short list. Ask the same questions at every home.

**Overnight staffing.** Who is awake at 2 a.m.? How many people are on the floor? Is a nurse on site overnight, or is overnight coverage handled another way? Get numbers, not adjectives.

**Medications.** Who gives meds on each shift? How do they catch mistakes? Ask whether meds are counted at shift change.

**Secured home.** Is memory care a locked wing, or is the whole home secured? What happens if your parent's needs change a year from now? Do they move to a different unit with new faces, or stay where they are?

**Dementia training.** What training do caregivers get beyond the state minimum? How often is it refreshed?

**Family communication.** Who calls you when something changes? How fast? What does a normal update look like?

We've written a fuller list of **[questions to ask on a tour](/blog/questions-to-ask-personal-care-home-tour)** in the tour-questions guide on joyseniorcare.com. Print it. Use it at every stop, including ours. Compare answers side by side when you get home.

Also watch the ordinary things. How staff talk to residents when they think you're not listening. Whether people look rushed. Whether your dad would know which faces to expect tomorrow morning. Those details rarely make the brochure.

## What memory care means at a personal care home like The Joy

The Joy is a licensed personal care home at [434 Conyers Rd in Loganville](/serving/loganville) (Walton County, on the Gwinnett edge). We are not a large assisted living campus. Georgia licenses us as a personal care home (PCH012341), with 24 beds and suites. Memory care is licensed throughout the home. The whole home is secured.

That structure matters for dementia. If your mom moves in now and her memory worsens later, she doesn't get relocated to a separate locked floor full of strangers. She stays in the house she already knows, with caregivers who already know her habits.

A few facts about how we staff and run the day, once, without turning this into a pitch sheet:

- Two staff overnight
- A nurse on site 24 hours a week across three days (not overnight)
- A certified medication aide on staff 24 hours a day, including overnight
- Medications counted each shift
- Dementia training for caregivers, plus on-site support groups for families

Routines do a lot of the quiet work. Same mealtimes. Same faces on the same shifts. Help with ADLs, meals, and care wrapped into the monthly rate (we don't list prices here; call for current numbers). Pets and pet therapy are part of life in the house when it fits the resident.

Executive Director Mellissa Daniel can walk you through whether that model matches what your parent needs. She is not a nurse. Ask clinical questions of the clinical staff. Ask her about the house, the team, and how families stay in the loop.

For the service-page overview of how we approach dementia care, see [memory care](/memory-care) on joyseniorcare.com. This post is the companion: home care limits, tour checklist, Loganville context.

## Soft next step

If home care still covers the nights and your parent is safe, keep going. Revisit the question when the gaps show up.

If you're already past that point, tour with a list. Use the [tour-questions guide](/blog/questions-to-ask-personal-care-home-tour) on joyseniorcare.com so every home answers the same things. When you want to talk about The Joy specifically, call [(470) 684-3569](tel:+14706843569).

Take the time you need. This decision sticks. Better to ask the hard questions now than to wonder about them after the move.
$mcl$,
      $mcl$https://pub-6e43e90472054fe3880f53e8c0ca3b60.r2.dev/blog/664633a85061d1ce12331725-11-217278-217278.jpg$mcl$,
      $mcl$The building at Joy Senior Living, a small senior living home in Loganville, Georgia$mcl$,
      $mcl$Adam Upchurch$mcl$,
      $mcl$articles$mcl$,
      $mcl$published$mcl$,
      NULL,
      $mcl$Signs home care may not be enough, what a good memory care tour covers, and how a small personal care home in Loganville approaches dementia care.$mcl$,
      TIMESTAMPTZ '2026-10-02 12:00:00 America/New_York'
    WHERE NOT EXISTS (
      SELECT 1 FROM posts WHERE slug = $mcl$memory-care-loganville-what-to-look-for$mcl$
    );

    IF EXISTS (
      SELECT 1 FROM posts
      WHERE slug = $mcl$memory-care-loganville-what-to-look-for$mcl$
        AND status = 'published'
    ) THEN
      INSERT INTO applied_content_updates (id)
      VALUES ('memory-care-loganville-what-to-look-for-2026-10-02');
    END IF;
  END IF;
END
$apply_mcl$;


-- SEO audit (2026-10-05): meta descriptions over 165 characters as served
-- (apostrophes count as 5 once encoded), plus three that broke the voice
-- rules (em-dashes, "loved ones"). Same guard as the Bing block at the top:
-- a row changes only while its public description is still the old text, so
-- a later edit in Admin is left alone.
-- questions-to-ask-personal-care-home-tour
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$Touring personal care homes for Mom or Dad? Print these questions for every tour. Here are The Joy's straight answers, including the ones that aren't perfect.$md$ THEN $md$Touring personal care homes for Mom or Dad? Print these questions for every tour, plus The Joy's straight answers (including the imperfect ones).$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Touring personal care homes for Mom or Dad? Print these questions for every tour, plus The Joy's straight answers (including the imperfect ones).$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$questions-to-ask-personal-care-home-tour$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Touring personal care homes for Mom or Dad? Print these questions for every tour. Here are The Joy's straight answers, including the ones that aren't perfect.$md$;
-- when-you-and-your-siblings-cant-agree-about-moms-care
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$Fighting with your siblings about Mom's care? Honest, plainspoken advice from Joy Senior Living in Loganville on having the hard conversation and keeping the family whole.$md$ THEN $md$Fighting with your siblings about Mom's care? Plain advice from Joy Senior Living in Loganville on the hard conversation and keeping the family whole.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Fighting with your siblings about Mom's care? Plain advice from Joy Senior Living in Loganville on the hard conversation and keeping the family whole.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$when-you-and-your-siblings-cant-agree-about-moms-care$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Fighting with your siblings about Mom's care? Honest, plainspoken advice from Joy Senior Living in Loganville on having the hard conversation and keeping the family whole.$md$;
-- its-college-football-season-so-heres-how-to-make-football-season-one-to-remember
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$College football season means the world to a lot of seniors. Here's how to keep game day special with your parent, from a small personal care home in Loganville, GA.$md$ THEN $md$College football means the world to a lot of seniors. How to keep game day special with your parent, from a small personal care home in Loganville, GA.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$College football means the world to a lot of seniors. How to keep game day special with your parent, from a small personal care home in Loganville, GA.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$its-college-football-season-so-heres-how-to-make-football-season-one-to-remember$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$College football season means the world to a lot of seniors. Here's how to keep game day special with your parent, from a small personal care home in Loganville, GA.$md$;
-- what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$Curious about the 2026 Best of Senior Living award? Here's what it's really based on and what earns it at Joy, a small personal care home in Loganville, GA.$md$ THEN $md$Curious about the 2026 Best of Senior Living award? What it is really based on, and what earns it at Joy, a small personal care home in Loganville, GA.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Curious about the 2026 Best of Senior Living award? What it is really based on, and what earns it at Joy, a small personal care home in Loganville, GA.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Curious about the 2026 Best of Senior Living award? Here's what it's really based on and what earns it at Joy, a small personal care home in Loganville, GA.$md$;
-- understand-dementia-what-why-how-to-care-for-loved-ones
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$New to dementia caregiving? Learn the common symptoms, types like Alzheimer's and vascular dementia, how it's diagnosed, and how to plan routines and support.$md$ THEN $md$New to dementia caregiving? Learn the common symptoms, types like Alzheimer's and vascular dementia, how it is diagnosed, and how to plan routines.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$New to dementia caregiving? Learn the common symptoms, types like Alzheimer's and vascular dementia, how it is diagnosed, and how to plan routines.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$understand-dementia-what-why-how-to-care-for-loved-ones$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$New to dementia caregiving? Learn the common symptoms, types like Alzheimer's and vascular dementia, how it's diagnosed, and how to plan routines and support.$md$;
-- after-the-summer-visit-signs-aging-parent-needs-help
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$The quiet signs your aging parent needs help — the ones you notice after a summer visit and can't unsee. What they mean and what to do next.$md$ THEN $md$The quiet signs your aging parent needs help (the ones you notice after a summer visit and can't unsee). What they mean and what to do next.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$The quiet signs your aging parent needs help (the ones you notice after a summer visit and can't unsee). What they mean and what to do next.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$after-the-summer-visit-signs-aging-parent-needs-help$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$The quiet signs your aging parent needs help — the ones you notice after a summer visit and can't unsee. What they mean and what to do next.$md$;
-- how-to-have-the-it-might-be-time-conversation
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$How to talk to a parent about assisted living without it ending in silence — the phrases that shut it down, the ones that open it back up, and what to try next.$md$ THEN $md$How to talk to a parent about assisted living without it ending in silence: the phrases that shut it down, the ones that open it back up, what to try next.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$How to talk to a parent about assisted living without it ending in silence: the phrases that shut it down, the ones that open it back up, what to try next.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$how-to-have-the-it-might-be-time-conversation$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$How to talk to a parent about assisted living without it ending in silence — the phrases that shut it down, the ones that open it back up, and what to try next.$md$;
-- spring-fun-activities-to-enjoy-with-loved-ones-in-senior-living
UPDATE posts SET
  excerpt = CASE
    WHEN btrim(coalesce(excerpt, '')) = $md$Discover fun springtime activities to enjoy with loved ones, from gardening and picnics to nature walks—perfect for seniors in senior living$md$ THEN $md$Spring activities to share with a parent in senior living, from gardening and picnics to slow walks outside. Simple ideas from Joy in Loganville, GA.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Spring activities to share with a parent in senior living, from gardening and picnics to slow walks outside. Simple ideas from Joy in Loganville, GA.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$spring-fun-activities-to-enjoy-with-loved-ones-in-senior-living$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$Discover fun springtime activities to enjoy with loved ones, from gardening and picnics to nature walks—perfect for seniors in senior living$md$;

-- What We Cooked at Joy This Week: four body photos had no alt text. Only an
-- empty alt is filled (`![](...)`), so alt text written in Admin is kept and
-- a re-run changes nothing.
UPDATE posts SET
  body = regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    body,
    $re$!\[[[:space:]]*\]\(([^)[:space:]]*/cafd45d8114769c0e0137388588a3a61-original-429483\.jpg)$re$, $re$![Grilled cheese on wheat bread, cut in half, beside a bowl of tomato soup with a swirl of cream](\1$re$, 'g'),
    $re$!\[[[:space:]]*\]\(([^)[:space:]]*/41d772532d36c12f99fd3ee787d293c2-original-237667\.jpg)$re$, $re$![A thick milkshake in a tall cup, topped with whipped cream and chocolate syrup, with a straw](\1$re$, 'g'),
    $re$!\[[[:space:]]*\]\(([^)[:space:]]*/65414149102b79b3af64b688121b47c7-original-518709\.jpg)$re$, $re$![Quesadilla wedges with pinto beans, salsa, and sour cream on a blue plate](\1$re$, 'g'),
    $re$!\[[[:space:]]*\]\(([^)[:space:]]*/acfee759e87a06e6b644e3dda5af7f6d-original-539840\.jpg)$re$, $re$![Two plates of roast over mashed potatoes with mixed vegetables and a dinner roll, ready to serve](\1$re$, 'g'),
  updated_at = now()
WHERE slug = $md$what-we-cooked-at-joy-this-week$md$
  AND body ~ $re$!\[[[:space:]]*\]\([^)[:space:]]*/(cafd45d8114769c0e0137388588a3a61-original-429483|41d772532d36c12f99fd3ee787d293c2-original-237667|65414149102b79b3af64b688121b47c7-original-518709|acfee759e87a06e6b644e3dda5af7f6d-original-539840)\.jpg$re$;


-- Blog title audit (2026-10-05, owner-approved): 19 page titles over 70
-- characters or using "loved ones". Written to meta_title only, so the tab
-- title and og:title change and the on-page H1 and Article headline stay.
-- A row changes only while its page title is still the crawled text, so a
-- later edit in Admin is left alone and a re-run changes nothing.
UPDATE posts SET meta_title = $t$College Football Season: Keeping Game Day Special for a Parent$t$, updated_at = now()
WHERE slug = $t$its-college-football-season-so-heres-how-to-make-football-season-one-to-remember$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$It's College Football Season: so here's how to make football season one to remember with a Senior.$t$;
UPDATE posts SET meta_title = $t$What Our 2026 Best of Senior Living Award Actually Means$t$, updated_at = now()
WHERE slug = $t$what-the-2026-best-of-senior-living-award-actually-means-for-loganville-families$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$What the 2026 Best of Senior Living Award Actually Means for Loganville Families$t$;
UPDATE posts SET meta_title = $t$Talking With a Parent Who Has Dementia (Without a Quiz)$t$, updated_at = now()
WHERE slug = $t$how-to-talk-with-a-parent-who-has-dementia-without-it-feeling-like-a-quiz$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$How to Talk With a Parent Who Has Dementia (Without It Feeling Like a Quiz)$t$;
UPDATE posts SET meta_title = $t$Room by Room: A Fall Prevention Walkthrough for Mom's House$t$, updated_at = now()
WHERE slug = $t$room-by-room-the-fall-prevention-walkthrough-every-adult-child-should-do$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Room-by-Room: The Fall Prevention Walkthrough Every Adult Child Should Do$t$;
UPDATE posts SET meta_title = $t$The Summer Heat Talk to Have With Your Aging Parent in Georgia$t$, updated_at = now()
WHERE slug = $t$the-summer-heat-talk-you-need-to-have-with-your-aging-parent-in-georgia$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$The Summer Heat Talk You Need to Have With Your Aging Parent in Georgia$t$;
UPDATE posts SET meta_title = $t$After the Summer Visit: Signs Your Parent Hoped You'd Miss$t$, updated_at = now()
WHERE slug = $t$after-the-summer-visit-signs-aging-parent-needs-help$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$After the Summer Visit: The Signs Your Aging Parent Was Hoping You Wouldn't See$t$;
UPDATE posts SET meta_title = $t$How to Have the 'It Might Be Time' Talk Without the Silence$t$, updated_at = now()
WHERE slug = $t$how-to-have-the-it-might-be-time-conversation$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$How to Actually Have the 'It Might Be Time' Conversation Without It Ending in Silence$t$;
UPDATE posts SET meta_title = $t$Small Enough to Know Your Parent by Name, in Loganville$t$, updated_at = now()
WHERE slug = $t$small-enough-to-know-your-parent-by-name$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Small Enough to Know Your Parent by Name: What a Small Personal Care Home in Loganville Actually Looks Like$t$;
UPDATE posts SET meta_title = $t$Why Assisted Living Costs So Much (and Where the Money Goes)$t$, updated_at = now()
WHERE slug = $t$cost-of-assisted-living-and-personal-care$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Why Is the Cost of Assisted Living So High? Where the Money Actually Goes$t$;
UPDATE posts SET meta_title = $t$Keeping Your Parents Out of Assisted Living: An Owner's Guide$t$, updated_at = now()
WHERE slug = $t$a-senior-living-owners-guide-to-keeping-your-parents-out-of-assisted-living$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$A Senior Living Owner's Guide to Keeping Your Parents Out of Assisted Living$t$;
UPDATE posts SET meta_title = $t$The First Two Weeks After a Parent Moves Into Senior Living$t$, updated_at = now()
WHERE slug = $t$the-first-two-weeks-what-really-happens-when-someone-moves-into-assisted-living$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$The First Two Weeks: What Really Happens When Someone Moves Into Senior Living$t$;
UPDATE posts SET meta_title = $t$The Heart of Our Home: Resident Council Meetings at The Joy$t$, updated_at = now()
WHERE slug = $t$the-heart-of-our-community-how-resident-council-meetings-bring-joy-to-life-at-the-joy-senior-living$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$The Heart of Our Home: How Resident Council Meetings Bring Joy to Life at The Joy Senior Living$t$;
UPDATE posts SET meta_title = $t$Nourishing the Golden Years: Why Nutrition Matters for Seniors$t$, updated_at = now()
WHERE slug = $t$nourishing-the-golden-years-the-vital-role-of-nutrition-in-senior-living$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Nourishing the Golden Years: The Vital Role of Nutrition in Senior Living$t$;
UPDATE posts SET meta_title = $t$Celebrate Spring: Activities to Share With Your Parent$t$, updated_at = now()
WHERE slug = $t$spring-fun-activities-to-enjoy-with-loved-ones-in-senior-living$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Celebrate Spring: Fun Activities to Enjoy with Loved Ones in Senior Living$t$;
UPDATE posts SET meta_title = $t$Indoor Winter Activities to Enjoy With Your Aging Parent$t$, updated_at = now()
WHERE slug = $t$heartwarming-indoor-activities-to-enjoy-with-your-senior-loved-one-this-winter$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Heartwarming Indoor Activities to Enjoy with Your Senior Loved One This Winter$t$;
UPDATE posts SET meta_title = $t$Budgeting for Senior Care: Preparing for Rising Costs$t$, updated_at = now()
WHERE slug = $t$budgeting-for-senior-care-how-to-prepare-for-the-ever-raising-cost-of-senior-care$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Budgeting for Senior Care: How to prepare for the ever raising cost of Senior Care$t$;
UPDATE posts SET meta_title = $t$Talking About Memory Care: A Family's Guide to the Move$t$, updated_at = now()
WHERE slug = $t$navigating-conversations-a-familys-guide-to-transitioning-a-loved-one-to-memory-care$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Navigating Conversations: A Family’s Guide to Transitioning a Loved One to Memory Care$t$;
UPDATE posts SET meta_title = $t$Understanding Dementia: What It Is and How to Help a Parent$t$, updated_at = now()
WHERE slug = $t$understand-dementia-what-why-how-to-care-for-loved-ones$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$Understand Dementia: What, Why & How to Care for Loved Ones$t$;
UPDATE posts SET meta_title = $t$Assisted Living vs. Personal Care Homes in Georgia$t$, updated_at = now()
WHERE slug = $t$whats-the-difference-between-assisted-living-vs-personal-care-homes-in-georgia$t$
  AND coalesce(nullif(btrim(meta_title), ''), title) = $t$What's the difference between Assisted Living vs. Personal Care Homes in Georgia?$t$;

-- The ribbon cutting and hearts full of gratitude posts were unpublished on
-- 2026-09-28 (both 301 elsewhere) but were published again, so /blog linked
-- to redirects. Runs once. A later publish in Admin is left alone.
DO $unpublish_again$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM applied_content_updates WHERE id = 'unpublish-redirected-posts-2026-10-05'
  ) THEN
    UPDATE posts SET status = 'draft', updated_at = now()
    WHERE slug IN ($un$a-joyous-beginning-celebrating-the-grand-ribbon-cutting-at-the-joy-of-loganville$un$, $un$hearts-full-of-gratitude-what-our-families-are-sharing-about-life-at-the-joy$un$)
      AND status = 'published';

    INSERT INTO applied_content_updates (id) VALUES ('unpublish-redirected-posts-2026-10-05');
  END IF;
END
$unpublish_again$;
