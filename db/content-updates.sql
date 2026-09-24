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
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$At The Joy Senior Living, we make it easy for families to stay connected$md$ THEN $md$How families stay close to loved ones at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$How families stay close to loved ones at The Joy in Loganville, GA: flexible visiting hours, shared meals, birthday parties, holiday events, and game nights.$md$
    ELSE meta_description
  END,
  updated_at = now()
WHERE slug = $md$how-families-stay-connected-at-the-joy$md$
  AND btrim(coalesce(nullif(btrim(meta_description), ''), excerpt, '')) = $md$At The Joy Senior Living, we make it easy for families to stay connected$md$;

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

-- we-just-received-our-2026-best-of-senior-living-award-from-a-place-for-mom (75 -> 155)
UPDATE posts SET
  excerpt = CASE
    WHEN excerpt IS NULL OR btrim(excerpt) = '' OR btrim(excerpt) = $md$We just received our 2026 Best of Senior Living award from A Place for Mom.$md$ THEN $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, RN, who leads our Loganville, GA home every day.$md$
    ELSE excerpt
  END,
  meta_description = CASE
    WHEN nullif(btrim(meta_description), '') IS NOT NULL THEN $md$Our 2026 Best of Senior Living award from A Place for Mom comes from family reviews. Meet Mellissa Daniel, RN, who leads our Loganville, GA home every day.$md$
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
