const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const artifacts = process.env.TEST_ARTIFACT_DIR || "/tmp/hiragana-playtest";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
fs.mkdirSync(artifacts, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: JSON.parse(
      process.env.TEST_VIEWPORT || '{"width":390,"height":844}',
    ),
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(() => {
    window.__audio = { contexts: [], oscillators: 0, speech: [] };
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        window.__audio.contexts.push(this);
      }
      createOscillator() {
        window.__audio.oscillators++;
        return super.createOscillator();
      }
    };
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (utterance) => {
      window.__audio.speech.push({
        text: utterance.text,
        lang: utterance.lang,
      });
      speak(utterance);
    };
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  async function visible(selector) {
    await page.locator(selector).waitFor({ state: "visible" });
  }
  async function screenshot(name) {
    await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
  }
  async function noOverflow() {
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "horizontal overflow",
    );
  }
  async function drag(from, to) {
    const a = await from.boundingBox(),
      b = await to.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
    await page.mouse.up();
  }
  async function pathPoints(d) {
    return page.evaluate((d) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      const l = p.getTotalLength();
      return Array.from({ length: 61 }, (_, i) => {
        const q = p.getPointAtLength((l * i) / 60);
        return { x: q.x, y: q.y };
      });
    }, d);
  }
  async function draw(points, touch = false) {
    const r = await page.locator("#drawing").boundingBox();
    const pp = points.map((p) => ({
      x: r.x + (p.x * r.width) / 400,
      y: r.y + (p.y * r.height) / 400,
    }));
    if (touch) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...pp[0], id: 1 }],
      });
      for (const p of pp.slice(1))
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ ...p, id: 1 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    } else {
      await page.mouse.move(pp[0].x, pp[0].y);
      await page.mouse.down();
      for (const p of pp.slice(1)) await page.mouse.move(p.x, p.y);
      await page.mouse.up();
    }
  }
  await page.goto(base);
  await visible("#start");
  await noOverflow();
  await screenshot("home-mobile");
  await page.locator("#hero-letter").tap();
  await page.waitForFunction(
    () => window.__audio.contexts[0]?.state === "running",
  );
  assert(
    await page.evaluate(
      () =>
        window.__audio.oscillators > 0 && window.__audio.speech.length === 0,
    ),
    "music and sound output without speech",
  );
  await page.locator("#sound").tap();
  const mutedCounts = await page.evaluate(() => [
    window.__audio.oscillators,
    window.__audio.speech.length,
  ]);
  await page.locator("#hero-letter").tap();
  assert.deepEqual(
    await page.evaluate(() => [
      window.__audio.oscillators,
      window.__audio.speech.length,
    ]),
    mutedCounts,
    "muted actions create no sound or speech",
  );
  await page.locator("#sound").tap();
  assert(
    await page.evaluate(
      () =>
        typeof AudioContext === "function" &&
        typeof speechSynthesis === "object",
    ),
    "audio APIs available",
  );
  await page.locator("#start").tap();
  await screenshot("select-mobile");
  await page.locator('[data-stage="0"]').tap();
  await page.locator('[data-play-stage="0"]').tap();
  await page.locator(".letter-card").filter({ hasText: "お" }).tap();
  assert.equal(await page.locator("#message").textContent(), "もういちど！");
  assert.equal(await page.locator(".found").count(), 0);
  const targets = page.locator(".letter-card").filter({ hasText: "あ" });
  await targets.nth(0).tap();
  await targets.nth(0).tap();
  assert.equal(await page.locator(".done").count(), 1);
  await targets.nth(1).tap();
  await targets.nth(2).tap();
  await visible("#next");
  await screenshot("find-success");
  await page.locator("#next").tap();
  await draw([
    { x: 15, y: 15 },
    { x: 320, y: 25 },
    { x: 310, y: 325 },
  ]);
  assert(
    await page.locator("#next").isHidden(),
    "off-path trace must not succeed",
  );
  for (const c of ["し", "つ", "く", "へ"]) {
    await page.locator(`[data-trace="${c}"]`).tap();
    assert.equal(
      await page.locator("[data-trace].selected").textContent(),
      c,
      "selected trace character",
    );
    assert(
      await page.locator("#next").isHidden(),
      "new trace starts incomplete",
    );
    const d = await page.locator(".trace-guide").getAttribute("d");
    await draw(await pathPoints(d), c === "し");
    await visible("#next");
    assert(
      await page.evaluate(
        (c) =>
          JSON.parse(localStorage.getItem("hiragana-asobi-v1")).played.includes(
            c,
          ),
        c,
      ),
      "trace completion records " + c,
    );
  }
  await screenshot("trace-success");
  await page.locator("#next").tap();
  await page.locator('[data-piece="T"]').tap();
  await page.locator('[data-slot="1"]').tap();
  assert.equal(await page.locator(".path-cell.empty").count(), 3);
  assert.equal(
    await page.locator("#message").textContent(),
    "べつの みちも ためそう",
  );
  await drag(page.locator('[data-piece="H"]'), page.locator('[data-slot="1"]'));
  await drag(
    page.locator('[data-piece="LD"]'),
    page.locator('[data-slot="2"]'),
  );
  await page.locator('[data-piece="V"]').tap();
  await page.locator('[data-slot="5"]').tap();
  await visible("#next");
  assert.equal(await page.locator(".path-cell.empty").count(), 0);
  await screenshot("path-success");
  await page.locator("#next").tap();
  await page.locator("#finish-writing").tap();
  assert(
    await page.locator("#next").isHidden(),
    "blank drawing must not succeed",
  );
  for (const d of [
    "M98 69 Q72 169 90 303 L113 276",
    "M168 103 Q244 100 297 93",
    "M166 159 Q239 157 303 149",
    "M243 72 L250 262 C252 314 163 322 159 278 C157 234 259 238 306 292",
  ])
    await draw(await pathPoints(d));
  await page.locator("#finish-writing").tap();
  await visible("#next");
  assert(await page.locator("#draw-board.alive").count());
  await screenshot("write-alive");
  await page.locator("#next").tap();
  await visible(".result-art");
  await screenshot("result");
  await page
    .getByRole("button", { name: "ホームへ", exact: false })
    .last()
    .tap();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiragana-asobi-v1")),
  );
  assert.deepEqual(
    [...saved.played].sort(),
    ["あ", "し", "つ", "く", "へ", "ほ"].sort(),
  );
  assert.equal(saved.cleared.length, 4);
  assert.equal(saved.stamps.length, 4);
  await page.locator("#sound").tap();
  await page.reload();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "false",
  );
  await page.locator('[data-go="book"]').tap();
  await page.locator('[data-letter="あ"]').tap();
  await visible(".stroke-preview");
  assert.equal(
    await page.locator(".book-detail h2").textContent(),
    "あ・あひる",
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".stroke-preview path")].every(
      (p) => parseFloat(getComputedStyle(p).strokeDashoffset) === 0,
    ),
  );
  await screenshot("book");
  for (const size of [
    { width: 320, height: 640 },
    { width: 960, height: 600 },
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.locator(".brand").tap();
    await noOverflow();
    await screenshot(`home-${size.width}`);
    await page.locator("#start").tap();
    await noOverflow();
    if (size.width >= 900 && size.height >= 600 && size.width > size.height) {
      assert(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
        "tablet stage selection fits without scrolling",
      );
    }
    for (const n of [0, 1, 2, 3]) {
      await page.locator(`[data-stage="${n}"]`).tap();
      await page.locator('[data-play-stage="0"]').tap();
      await noOverflow();
      await screenshot(`stage-${n}-${size.width}`);
      if (size.width >= 900 && size.height >= 600 && size.width > size.height) {
        assert(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight,
          ),
          "tablet play screen must fit without scrolling",
        );
        assert(
          await page.locator("#retry").evaluate((b) => {
            const r = b.getBoundingClientRect();
            return r.top >= 0 && r.bottom <= innerHeight;
          }),
          "retry stays inside tablet screen",
        );
        if ((n === 1 || n === 3) && size.width >= 1000 && size.height >= 740) {
          assert(
            (await page.locator("#drawing").boundingBox()).width >= 400,
            "tablet drawing area must be at least 400 CSS pixels",
          );
        }
      }
      const buttons = await page
        .locator("button:visible")
        .evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height));
      assert(
        buttons.every((h) => h >= 44),
        "small touch target",
      );
      await page.locator(".back").tap();
    }
  }
  await page.locator(".brand").tap();
  await page.locator('[data-go="logs"]').tap();
  await page.locator('[data-go="record"]').tap();
  assert.equal(await page.locator(".sticker").count(), 4);
  // A direct-touch puzzle drag, independent of mouse fallback.
  await page.locator(".brand").tap();
  await page.locator("#start").tap();
  await page.locator('[data-stage="2"]').tap();
  await page.locator('[data-play-stage="0"]').tap();
  const p = await page.locator('[data-piece="H"]').boundingBox(),
    s = await page.locator('[data-slot="1"]').boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: p.x + p.width / 2, y: p.y + p.height / 2, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: s.x + s.width / 2, y: s.y + s.height / 2, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
  assert.equal(await page.locator(".path-cell.empty").count(), 2);
  // Storage unavailable: the play loop still boots.
  const isolated = await browser.newContext();
  await isolated.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("storage blocked");
    };
  });
  const q = await isolated.newPage();
  await q.goto(base);
  await q.locator("#start").click();
  await q.locator('[data-stage="0"]').click();
  await q.locator('[data-play-stage="0"]').click();
  assert.equal(await q.locator(".letter-card").count(), 8);
  await isolated.close();
  assert.deepEqual(errors, [], "browser console errors");
  await browser.close();
  console.log(
    "PASS: complete play loop, incorrect inputs, 4 traces (touch + mouse), puzzle drag/tap, free writing, collection, reload persistence, sound toggle, 320/390/768/960/1024/1180/1440 layouts, tablet screen fit, touch drag, blocked-storage fallback, and no console errors.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
