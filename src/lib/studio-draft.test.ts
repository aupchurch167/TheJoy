import assert from "node:assert/strict";
import test from "node:test";
import {
  blankEmailModel,
  blankStudioSaveInput,
  studioModelHasWords,
  studioSendBlockReason,
} from "./studio-draft.ts";

test("a blank email starts empty where the writer fills in", () => {
  const input = blankStudioSaveInput();
  const model = input.model;
  assert.equal(input.subject, "");
  assert.equal(input.audience, "families");
  assert.equal(model.theme, "classic");
  assert.equal(model.heroTitle, "");
  assert.equal(model.heroSub, "");
  assert.equal(model.eyebrow, "");
  assert.equal(model.intro, "");
  assert.equal(model.plan, null);
  assert.equal(model.cta, null);
  assert.equal(model.rsvpUrl, null);
  assert.equal(model.photoUrl, null);
  assert.equal(model.bodyPhotoUrl, null);
  assert.equal(model.bodyPhotoUrls, null);
  assert.match(model.greeting, /\{\{first_name\}\}/);
  assert.match(model.closing, /Mellissa/);
  assert.equal(studioModelHasWords(model), false);
  const joined = [
    model.eyebrow,
    model.heroTitle,
    model.heroSub,
    model.greeting,
    model.intro,
    model.closing,
    input.subject,
  ].join("\n");
  assert.equal(joined.includes("["), false);
});

test("create allows an empty draft; send waits for a subject and words", () => {
  const blank = blankEmailModel();
  assert.equal(
    studioSendBlockReason("", blank),
    "Add a subject before sending."
  );
  assert.equal(
    studioSendBlockReason("  Garden party  ", blank),
    "Write a headline or a message before sending."
  );
  assert.equal(
    studioSendBlockReason("Garden party", { ...blank, intro: "Come by Friday." }),
    null
  );
  assert.equal(
    studioSendBlockReason("Garden party", { ...blank, heroTitle: "This Friday" }),
    null
  );
  assert.equal(
    studioModelHasWords({ ...blank, intro: "   ", heroTitle: "  " }),
    false
  );
});
