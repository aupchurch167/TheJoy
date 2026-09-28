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
