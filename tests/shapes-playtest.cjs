const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
const dir = process.env.TEST_ARTIFACT_DIR || "/tmp/hina-shapes-test";
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
      JSON.stringify({
        played: ["あ"],
        cleared: [0],
        recent: ["あ"],
        stamps: ["みつけた"],
        sound: false,
      }),
    ),
  );
  await page.reload();
  assert.equal(await page.title(), "ひなあそび");
  assert.equal(await page.locator(".home h1").textContent(), "ひなあそび");
  async function shot(name) {
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  }
  async function shapes() {
    await page.locator(".brand").tap();
    await page.locator("#start").tap();
    await page.locator('[data-go="shapes"]').tap();
    await page.locator('[data-play-stage="0"]').tap();
  }
  async function touchDrag(from, to) {
    const c = await context.newCDPSession(page);
    await c.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ ...from, id: 1 }],
    });
    for (let i = 1; i <= 12; i++)
      await c.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * i) / 12,
            y: from.y + ((to.y - from.y) * i) / 12,
            id: 1,
          },
        ],
      });
    await c.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await c.detach();
  }
  const center = async (locator) => {
    const r = await locator.boundingBox();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  await shot("home");
  await shapes();
  await shot("menu");
  await page.locator('[data-shape-mode="rotate"]').tap();
  const model = await page.locator("#shape-model").innerHTML(),
    before = await page.locator("#shape-world").innerHTML();
  await page.locator("#turn-left").tap();
  await page.waitForTimeout(380);
  assert.notEqual(await page.locator("#shape-world").innerHTML(), before);
  assert.equal(await page.locator("#shape-model").innerHTML(), model);
  assert(
    await page.locator("#shape-next").isHidden(),
    "wrong direction is not solved",
  );
  await page.locator("#shape-retry").tap();
  const r = await page.locator("#shape-world").boundingBox();
  await touchDrag(
    { x: r.x + r.width * 0.3, y: r.y + r.height * 0.6 },
    { x: r.x + r.width * 0.3 + 131, y: r.y + r.height * 0.6 },
  );
  await page.locator("#shape-next").waitFor({ state: "visible" });
  await shot("rotate-success");
  await page.locator("#shape-next").tap();
  assert(await page.locator("#shape-next").isHidden());
  await page.locator("#turn-left").tap();
  await page.locator("#shape-next").waitFor({ state: "visible" });
  await shapes();
  await page.locator('[data-shape-mode="build"]').tap();
  async function cell(x, z) {
    return page.locator(`#shape-world polygon[data-cell="${x},${z}"]`).last();
  }
  async function add(color, x, z, drag = false) {
    await page.locator(`[data-shape-piece="${color}"]`).tap();
    const target = await cell(x, z);
    if (drag)
      await touchDrag(
        await center(page.locator(`[data-shape-piece="${color}"]`)),
        await center(target),
      );
    else await target.tap();
  }
  await add("blue", 0, 0);
  assert(await page.locator("#shape-next").isHidden());
  await page.locator("#shape-undo").tap();
  assert.equal(await page.locator("#shape-world [data-cube]").count(), 0);
  await add("gold", 0, 0, true);
  await add("blue", 1, 0);
  await add("gold", 1, 0);
  await add("green", 1, 1);
  await page.locator("#shape-next").waitFor({ state: "visible" });
  await shot("build-success");
  await page.locator("#turn-right").tap();
  await page.waitForTimeout(380);
  assert(
    await page.locator("#shape-next").isVisible(),
    "a solved building stays playable while rotated",
  );
  await page.locator("#shape-undo").tap();
  assert(await page.locator("#shape-next").isHidden(), "undo reopens the task");
  await shapes();
  await page.locator('[data-shape-mode="arrange"]').tap();
  await page.locator('[data-shape-piece="circle"]').tap();
  await page.locator('[data-flat-slot="1"]').tap();
  assert.equal(await page.locator(".flat-slot.filled").count(), 0);
  await page.locator("#piece-turn").tap();
  await page.locator('[data-flat-slot="1"]').tap();
  assert.equal(
    await page.locator(".flat-slot.filled").count(),
    0,
    "wrong orientation is not accepted",
  );
  await page.locator("#shape-retry").tap();
  await page.locator('[data-shape-piece="triangle"]').tap();
  await page.locator('[data-flat-slot="1"]').tap();
  await page.locator('[data-shape-piece="square"]').tap();
  await page.locator('[data-flat-slot="4"]').tap();
  await page.locator('[data-flat-slot="7"]').tap();
  for (let i = 0; i < 3; i++) await page.locator("#piece-turn").tap();
  await page.locator('[data-flat-slot="6"]').tap();
  for (let i = 0; i < 2; i++) await page.locator("#piece-turn").tap();
  await touchDrag(
    await center(page.locator('[data-shape-piece="triangle"]')),
    await center(page.locator('[data-flat-slot="8"]')),
  );
  await page.locator("#shape-next").waitFor({ state: "visible" });
  assert.equal(await page.locator(".flat-slot.filled").count(), 5);
  await shot("arrange-success");
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiragana-asobi-v1")),
  );
  assert.deepEqual(saved.shapes.sort(), ["arrange", "build", "rotate"]);
  assert.deepEqual(saved.played, ["あ"]);
  assert.deepEqual(saved.stamps, ["みつけた"]);
  await page.locator('[data-go="logs"]').tap();
  await page.locator('[data-go="record"]').tap();
  assert(
    (await page.locator("main").textContent()).includes(
      "まわす・つむ・ならべる",
    ),
  );
  const comparison = await page.evaluate(async () => {
    const { sameConstruction } = await import("./shapes.js");
    const a = [
      { x: 0, y: 0, z: 0, color: "gold" },
      { x: 0, y: 1, z: 0, color: "blue" },
    ];
    return [
      sameConstruction(
        a,
        a.map((c) => ({ ...c, x: c.x + 1, z: c.z + 1 })),
      ),
      sameConstruction(
        a,
        a.map((c) => ({ ...c, color: "green" })),
      ),
      sameConstruction(a, a.slice(0, 1)),
    ];
  });
  assert.deepEqual(comparison, [true, false, false]);
  for (const v of [
    { width: 320, height: 640 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 960, height: 600 },
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(v);
    await shapes();
    if (v.width >= 900 && v.width > v.height)
      assert(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
        "shape menu fits tablet",
      );
    for (const mode of ["rotate", "build", "arrange"]) {
      await page.locator(`[data-shape-mode="${mode}"]`).tap();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "no horizontal overflow",
      );
      if (v.width >= 900 && v.width > v.height)
        assert(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
          "shape task fits tablet",
        );
      const small = await page
        .locator("button:visible")
        .evaluateAll((bs) =>
          bs.some((b) => b.getBoundingClientRect().height < 44),
        );
      assert(!small, "touch targets at least 44px");
      await shot(`${mode}-${v.width}`);
      await page.locator(".back").tap();
    }
  }
  // Navigate away mid-rotation; the old animation must not repaint a new screen.
  await page.locator('[data-shape-mode="rotate"]').tap();
  await page.locator("#turn-right").tap();
  await page.locator(".home-button").tap();
  await page.waitForTimeout(400);
  assert.equal(await page.locator(".home h1").textContent(), "ひなあそび");
  assert.equal(await page.locator("#shape-world").count(), 0);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: title, 3D rotation/drag, correct and incorrect orientations, cube stacking/undo/drag, triangle rotation, flat puzzle/drag, new and existing save data, translation-independent match, mobile/portrait/landscape layouts, touch targets, navigation cleanup, and no console errors.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
