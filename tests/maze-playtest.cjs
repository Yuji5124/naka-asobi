const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
const dir = process.env.TEST_ARTIFACT_DIR || "/tmp/hina-maze-test";
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(base);
  await page.evaluate(() =>
    localStorage.setItem(
      "hiragana-asobi-v1",
      JSON.stringify({ played: ["あ"], shapes: ["build"], sound: false }),
    ),
  );
  await page.reload();
  async function open() {
    await page.locator(".brand").tap();
    await page.locator("#start").tap();
    await page.locator('[data-go="maze"]').tap();
    await page.locator('[data-play-stage="0"]').tap();
  }
  async function token() {
    return page.locator("#maze-token").evaluate((n) => ({
      x: +n.getAttribute("cx"),
      y: +n.getAttribute("cy"),
    }));
  }
  async function coordinates(points) {
    return page.locator("#maze-svg").evaluate(
      (svg, pts) =>
        pts.map((p) => {
          const t = new DOMPoint(p.x, p.y).matrixTransform(svg.getScreenCTM());
          return { x: t.x, y: t.y };
        }),
      points,
    );
  }
  async function drag(points) {
    const c = await context.newCDPSession(page),
      pts = await coordinates(points);
    await c.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...pts[0], id: 1 }],
    });
    for (const p of pts.slice(1))
      await c.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ ...p, id: 1 }],
      });
    await c.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await c.detach();
  }
  await open();
  let model = await page.evaluate(async () =>
    (await import("./maze.js")).mazeModel("acorn"),
  );
  // Tapping the goal cannot clear. Nor can a single fast drag cross walls.
  await drag([model.goal, model.goal]);
  assert.equal(await page.locator("#maze-next").isVisible(), false);
  await drag([model.start, { x: model.start.x + 160, y: model.start.y - 45 }]);
  assert.equal(await page.locator("#maze-next").isVisible(), false);
  const stopped = await token();
  assert.ok(
    Math.hypot(stopped.x - model.start.x, stopped.y - model.start.y) < 40,
  );
  assert.match(await page.locator("#message").textContent(), /かべ/);
  await page.locator("#maze-retry").tap();
  assert.deepEqual(await token(), { x: model.start.x, y: model.start.y });
  await page.screenshot({ path: `${dir}/acorn.png`, fullPage: true });
  // Real touch input, lift midway, resume from the token, then reach the goal.
  const mid = Math.floor(model.route.length / 2);
  await drag(model.route.slice(0, mid + 1));
  assert.equal(await page.locator("#maze-next").isVisible(), false);
  await drag(model.route.slice(mid));
  assert.equal(await page.locator("#maze-next").isVisible(), true);
  await page.screenshot({ path: `${dir}/acorn-cleared.png`, fullPage: true });
  await page.locator("#maze-next").tap();
  assert.equal(
    await page.locator('[data-maze="butterfly"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.locator("#maze-next").isVisible(), false);
  model = await page.evaluate(async () =>
    (await import("./maze.js")).mazeModel("butterfly"),
  );
  // Try a dead end, backtrack, and continue; lifting at any point is supported.
  const branch = model.edges.find(
    ([a, b]) => a.id === model.start.id || b.id === model.start.id,
  );
  const near = branch[0].id === model.start.id ? branch[1] : branch[0];
  await drag([model.start, near, model.start]);
  await drag(model.route);
  assert.equal(await page.locator("#maze-next").isVisible(), true);
  await page.screenshot({
    path: `${dir}/butterfly-cleared.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 960, height: 600 });
  const feedbackBox = await page.locator("#message").boundingBox();
  const actionsBox = await page.locator(".maze-actions").boundingBox();
  assert.ok(
    feedbackBox.y + feedbackBox.height <= actionsBox.y,
    "success controls must not overlap feedback",
  );
  await page.screenshot({ path: `${dir}/cleared-960x600.png`, fullPage: true });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiragana-asobi-v1")),
  );
  assert.deepEqual(saved.mazes, ["acorn", "butterfly"]);
  assert.deepEqual(saved.played, ["あ"]);
  assert.deepEqual(saved.shapes, ["build"]);
  await page.locator('[data-go="logs"]').tap();
  await page.locator('[data-go="record"]').tap();
  assert.match(
    await page.locator(".record-screen").textContent(),
    /どんぐりの めいろ・ちょうちょの めいろ/,
  );
  for (const size of [
    { width: 320, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 960, height: 600 },
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(size);
    await page.locator(".brand").tap();
    await page.locator("#start").tap();
    const select = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    assert.ok(
      select.w <= size.width,
      `select horizontal ${JSON.stringify(size)}`,
    );
    if (size.width >= 900 && size.width > size.height)
      assert.ok(
        select.h <= size.height,
        `select vertical ${JSON.stringify(size)} ${select.h}`,
      );
    await page.locator('[data-go="maze"]').tap();
    await page.locator('[data-play-stage="0"]').tap();
    const dimensions = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    assert.ok(
      dimensions.w <= size.width,
      `maze horizontal ${JSON.stringify(size)}`,
    );
    if (size.width >= 900 && size.width > size.height)
      assert.ok(
        dimensions.h <= size.height,
        `maze vertical ${JSON.stringify(size)} ${dimensions.h}`,
      );
    assert.ok((await page.locator("#maze-retry").boundingBox()).height >= 44);
    await page.screenshot({
      path: `${dir}/maze-${size.width}x${size.height}.png`,
      fullPage: true,
    });
  }
  // Keyboard follows corridors and rejects wall traversal, too.
  await page.setViewportSize({ width: 1024, height: 768 });
  await open();
  await page.locator("#maze-svg").focus();
  model = await page.evaluate(async () =>
    (await import("./maze.js")).mazeModel("acorn"),
  );
  const second = model.route[1];
  const key =
    second.x > model.start.x
      ? "ArrowRight"
      : second.x < model.start.x
        ? "ArrowLeft"
        : second.y > model.start.y
          ? "ArrowDown"
          : "ArrowUp";
  for (let i = 0; i < 8; i++) await page.keyboard.press(key);
  assert.deepEqual(await token(), { x: second.x, y: second.y });
  await page.locator(".brand").tap();
  assert.equal(await page.locator("#maze-svg").count(), 0);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "Maze playtest passed: touch, walls, resume, two goals, retry, records, keyboard, six viewports.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
