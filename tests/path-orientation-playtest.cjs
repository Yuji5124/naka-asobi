const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
const artifacts = process.env.TEST_ARTIFACT_DIR || "/tmp/path-orientation-playtest";
fs.mkdirSync(artifacts, { recursive: true });

const placements = {
  "1-1": [["H", 1], ["LD", 2], ["V", 5]],
  "1-2": [["V", 3], ["UR", 6], ["H", 7]],
  "1-3": [["UR", 3], ["H", 4], ["LD", 5]],
  "2-1": [["V", 4], ["UR", 8], ["H", 9], ["LD", 10], ["UR", 14]],
  "2-2": [["H", 1], ["H", 2], ["LD", 3], ["V", 7], ["V", 11]],
  "2-3": [["V", 4], ["V", 8], ["UR", 12], ["H", 13], ["H", 14]],
};

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const level of [1, 2]) {
    for (const stage of [1, 2, 3]) {
      const key = `${level}-${stage}`;
      await page.goto(base);
      await page.evaluate(({ level, stage }) => {
        localStorage.setItem(
          "hiragana-asobi-v1",
          JSON.stringify({
            sound: false,
            totalPoints: 0,
            stageProgress: { [`path:${level}`]: stage },
          }),
        );
      }, { level, stage });
      await page.reload();
      await page.locator("#start").tap();
      await page.locator('[data-stage="2"]').tap();
      await page.locator('[data-go="path-level"]').tap();
      await page.locator(`[data-level-game="path"][data-level="${level}"]`).tap();

      await page.screenshot({
        path: `${artifacts}/level-${level}-stage-${stage}-board.png`,
        fullPage: true,
      });
      for (const [piece, slot] of placements[key]) {
        if (key === "1-3" && slot === 3) {
          await page.locator('[data-piece="V"]').first().tap();
          await page.locator('[data-slot="3"]').tap();
          assert.equal(
            await page.locator('[data-slot="3"].empty').count(),
            1,
            "a vertical piece must not fill the corner from above to the right",
          );
        }
        await page.locator(`[data-piece="${piece}"]`).first().tap();
        await page.locator(`[data-slot="${slot}"]`).tap();
      }
      assert.equal(
        await page.locator(".path-cell.empty").count(),
        0,
        `all correct pieces should be accepted in level ${level}, stage ${stage}`,
      );
      if (stage < 3)
        await page.locator("#next").waitFor({ state: "visible", timeout: 5000 });
      else
        await page.waitForFunction(() =>
          JSON.parse(localStorage.getItem("hiragana-asobi-v1")).totalPoints === 1,
        );
      await page.locator(".reward-overlay").waitFor({ state: "detached" });
      await page.screenshot({
        path: `${artifacts}/level-${level}-stage-${stage}-solved.png`,
        fullPage: true,
      });
      console.log(`PASS: level ${level}, stage ${stage}`);
    }
  }

  assert.deepEqual(errors, [], "no browser errors");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
