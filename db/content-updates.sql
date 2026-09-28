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
          '[Schedule a visit](/tour)'
        ),
        'Schedule a visit: ' || '[' || 'calendly link' || ']',
        '[Schedule a visit](/tour)'
      ),
      chr(92) || '[' || 'calendly link' || chr(92) || ']',
      '[Schedule a visit](/tour)'
    ),
    '[' || 'calendly link' || ']',
    '[Schedule a visit](/tour)'
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

Book a tour at [joyseniorcare.com/tour](/tour) or call [(470) 684-3569](tel:+14706843569). Bring this list and ask Mellissa every question on it. Then take it to the next home and ask them too.

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

-- New post (2026-09-28): what a dementia caregiver support group is like.
-- Staged for the owner to review. The posts table can store status 'draft',
-- but this row is 'published' so that merging to main puts it on /blog and in
-- the sitemap the same way the other posts go live. Until this file runs on
-- the live database, the post stays off the site.
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
  $sgpost$Adam Upchurch$sgpost$,
  $sgpost$articles$sgpost$,
  $sgpost$published$sgpost$,
  $sgpost$Caring for a parent with dementia? Here's what a caregiver support group is, what happens at a meeting, and how to tell if one is right for you. Plain answers.$sgpost$,
  TIMESTAMPTZ '2026-09-28 12:00:00 America/New_York'
WHERE NOT EXISTS (
  SELECT 1 FROM posts WHERE slug = $sgpost$dementia-caregiver-support-group$sgpost$
);
