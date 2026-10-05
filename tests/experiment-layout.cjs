const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
const dir = process.env.TEST_ARTIFACT_DIR || "/tmp/hina-layout";
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ hasTouch: true, isMobile: true });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 768, height: 1024 },
    { width: 960, height: 600 },
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(base);
    await page.evaluate(() =>
      localStorage.setItem(
        "hiragana-asobi-v1",
        JSON.stringify({ totalPoints: 5, totalCoinsSpent: 0, sound: false }),
      ),
    );
    await page.reload();
    async function layout(label) {
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `horizontal ${label} ${viewport.width}`,
      );
      if (viewport.width >= 900)
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
          `vertical ${label} ${viewport.width}: ${await page.evaluate(() => document.documentElement.scrollHeight)}`,
        );
      const tiny = await page
        .locator("button:visible")
        .evaluateAll((bs) =>
          bs
            .filter((b) => b.getBoundingClientRect().height < 44)
            .map((b) => b.id || b.className),
        );
      assert.deepEqual(tiny, [], `small touch targets ${label}`);
      await page.screenshot({
        path: `${dir}/${viewport.width}-${label}.png`,
        fullPage: true,
      });
    }
    await layout("home");
    await page.locator("#start").tap();
    await layout("categories");
    await page.locator('[data-category-page="1"]').tap();
    await layout("extra-categories");
    await page.locator('[data-go="park-menu"]').tap();
    await layout("park-stages");
    await page.locator('[data-play-stage="1"]').tap();
    await layout("park");
    await page.locator(".coin-hud").tap();
    await layout("reward");
    await page.locator("#crane-start").tap();
    await layout("crane-playing");
    await page.locator(".brand").tap();
    await page.locator("#start").tap();
    await page.locator('[data-go="shapes"]').tap();
    await layout("shape-stages");
    await page.locator('[data-play-stage="1"]').tap();
    await page.locator('[data-shape-mode="rotate"]').tap();
    await layout("rotation");
    assert.ok((await page.locator("#turn-left").boundingBox()).height >= 56);
    assert.ok((await page.locator("#turn-right").boundingBox()).height >= 56);
    await page.locator(".brand").tap();
    await page.locator('[data-go="logs"]').tap();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "parent page overflow",
    );
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(base);
  await page.evaluate(() =>
    localStorage.setItem(
      "hiragana-asobi-v1",
      JSON.stringify({ totalPoints: 4, sound: false }),
    ),
  );
  await page.reload();
  await page.locator("#start").tap();
  await page.locator('[data-go="shapes"]').tap();
  await page.locator('[data-play-stage="0"]').tap();
  await page.locator('[data-shape-mode="rotate"]').tap();
  await page.locator("#turn-right").tap();
  await page.locator("#shape-next").waitFor({ state: "visible" });
  assert.match(await page.locator("#coin-count").textContent(), /0/);
  await page.locator("#shape-retry").tap();
  assert.match(
    await page.locator("#coin-count").textContent(),
    /1/,
    "interrupting a coin animation must restore the saved balance",
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("hiragana-asobi-v1")).totalPoints,
    ),
    5,
  );
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS experiment layout: 320/768/960/1024/1180, stage menus, category paging, park, crane, 56px rotation and logs.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
