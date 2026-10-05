const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8000";
const dir = process.env.TEST_ARTIFACT_DIR || "/tmp/hina-experiment";
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    const context = await browser.newContext({
      viewport,
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
    const saved = () =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("hiragana-asobi-v1")),
      );
    async function shot(name) {
      await page.screenshot({
        path: `${dir}/${viewport.width}-${name}.png`,
        fullPage: true,
      });
    }
    async function home() {
      await page.locator(".brand").tap();
    }
    async function stage(game, n = 0, mode) {
      await home();
      await page.locator("#start").tap();
      if (typeof game === "number")
        await page.locator(`[data-stage="${game}"]`).tap();
      else await page.locator(`[data-go="${game}"]`).tap();
      await page.locator(`[data-play-stage="${n}"]`).tap();
      if (mode) await page.locator(`[data-shape-mode="${mode}"]`).tap();
    }
    async function finishFind() {
      const buttons = page.locator(".letter-card").filter({ hasText: /^あ$/ });
      for (let i = 0; i < 3; i++) await buttons.nth(i).tap();
      await page.locator("#next").waitFor({ state: "visible" });
    }
    async function touch(points) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ ...points[0], id: 1 }],
      });
      for (const p of points.slice(1))
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ ...p, id: 1 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    }
    async function drawPath(d) {
      const pts = await page.evaluate((d) => {
        const p = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        p.setAttribute("d", d);
        return Array.from({ length: 61 }, (_, i) => {
          const q = p.getPointAtLength((p.getTotalLength() * i) / 60);
          return { x: q.x, y: q.y };
        });
      }, d);
      const r = await page.locator("#drawing").boundingBox();
      await touch(
        pts.map((p) => ({
          x: r.x + (p.x * r.width) / 400,
          y: r.y + (p.y * r.height) / 400,
        })),
      );
    }
    async function fixedEffect(n) {
      await page.evaluate((n) => {
        window.__originalRandom ||= Math.random;
        Math.random = () => n;
      }, n);
    }
    async function restoreRandom() {
      await page.evaluate(() => {
        if (window.__originalRandom) Math.random = window.__originalRandom;
      });
    }
    // Locked reward, including old saves, cannot spend or create coins.
    await page.locator(".coin-hud").tap();
    assert.equal(await page.locator("#crane-start").isDisabled(), true);
    assert.equal((await saved()).coinBalance, 0);
    await stage(0);
    await fixedEffect(0.1);
    await finishFind();
    await restoreRandom();
    assert.equal((await saved()).totalPoints, 1);
    assert.equal(await page.locator(".hanamaru-stamp").count(), 1);
    await shot("hanamaru");
    await page.locator("#retry").tap();
    assert.equal((await saved()).effects.hanamaru.retries, 1);
    await home();
    await stage(1, 1);
    assert.equal(
      await page.locator("[data-trace].selected").textContent(),
      "の",
    );
    await fixedEffect(0.9);
    await drawPath(await page.locator(".trace-guide").getAttribute("d"));
    await page.locator("#next").waitFor({ state: "visible" });
    await restoreRandom();
    assert.equal(await page.locator(".fireworks").count(), 1);
    await shot("fireworks");
    await page.locator("#retry").tap();
    assert.equal((await saved()).effects.fireworks.retries, 1);
    await stage(2, 1);
    await page.locator('[data-piece="T"]').tap();
    await page.locator('[data-slot="3"]').tap();
    assert.equal(await page.locator(".path-cell.empty").count(), 3);
    for (const [type, slot] of [
      ["V", 3],
      ["UR", 6],
      ["H", 7],
    ]) {
      await page.locator(`[data-piece="${type}"]`).tap();
      await page.locator(`[data-slot="${slot}"]`).tap();
    }
    await page.locator("#next").waitFor({ state: "visible" });
    await shot("path-2");
    await stage(3, 1);
    await page.locator("#finish-writing").tap();
    assert.equal(await page.locator("#next").isHidden(), true);
    await drawPath("M62 234 L186 115 Q204 99 223 118 L337 206");
    await page.locator("#finish-writing").tap();
    await page.locator("#next").waitFor({ state: "visible" });
    await shot("write-2");
    assert.equal((await saved()).totalPoints, 4);
    assert.equal((await saved()).coinBalance, 0);
    await stage("shapes", 1, "rotate");
    assert.ok((await page.locator("#turn-left").boundingBox()).height >= 56);
    assert.match(
      await page.locator("#turn-right").textContent(),
      /みぎに まわす/,
    );
    await page.locator("#turn-right").tap();
    await page.locator("#shape-next").waitFor({ state: "visible" });
    let state = await saved();
    assert.equal(state.totalPoints, 5);
    assert.equal(state.totalCoinsEarned, 1);
    assert.equal(state.coinBalance, 1);
    await page.locator(".coin-flight").waitFor({ state: "visible" });
    assert.match(await page.locator("#coin-count").textContent(), /0/);
    await shot("coin-get");
    await page.locator(".coin-flight").waitFor({ state: "detached" });
    assert.match(await page.locator("#coin-count").textContent(), /1/);
    await stage("maze", 2);
    assert.equal(
      await page.locator('[data-maze="rocket"]').getAttribute("aria-pressed"),
      "true",
    );
    const route = await page.evaluate(async () => {
      const m = (await import("./maze.js")).mazeModel("rocket");
      const matrix = document.querySelector("#maze-svg").getScreenCTM();
      return m.route.map((p) => {
        const q = new DOMPoint(p.x, p.y).matrixTransform(matrix);
        return { x: q.x, y: q.y };
      });
    });
    await touch(route);
    await page.locator("#maze-next").waitFor({ state: "visible" });
    await shot("maze-3");
    await stage(0, 1);
    const firstLayout = await page
      .locator("[data-park-coin]")
      .evaluateAll((bs) => bs.map((b) => b.dataset.parkCoin).sort());
    const coin = page.locator("[data-park-coin]").first();
    await coin.tap();
    assert.match(await page.locator("#park-progress").textContent(), /^1/);
    assert.equal((await saved()).totalPoints, 6);
    await page.locator("#park-retry").tap();
    const nextLayout = await page
      .locator("[data-park-coin]")
      .evaluateAll((bs) => bs.map((b) => b.dataset.parkCoin).sort());
    assert.notDeepEqual(firstLayout, nextLayout);
    await shot("park");
    for (let i = 0; i < 5; i++)
      await page.locator("[data-park-coin]").nth(i).tap();
    assert.equal((await saved()).totalPoints, 7);
    await page.locator("#park-next").tap();
    assert.match(
      await page.locator(".stage-label").textContent(),
      /こうえん 2/,
    );
    await home();
    // Play start spends exactly once. Taking and rapid repeat clicks never spend again.
    await page.locator(".coin-hud").tap();
    await page.locator("#crane-start").tap();
    assert.equal(
      await page.locator("#crane-position").inputValue(),
      "50",
      "start tap must not move the newly revealed slider",
    );
    assert.equal((await saved()).coinBalance, 0);
    assert.equal((await saved()).totalCoinsSpent, 1);
    await page.locator("#crane-take").tap();
    await page.locator("#crane-start").waitFor({ state: "visible" });
    assert.match(await page.locator("#crane-result").textContent(), /おしい/);
    assert.equal((await saved()).collection.length, 0);
    assert.equal((await saved()).totalPoints, 7);
    assert.equal(await page.locator("#crane-start").isDisabled(), true);
    await shot("crane-miss");
    for (let i = 0; i < 3; i++) {
      await stage(0);
      await finishFind();
    }
    state = await saved();
    assert.equal(state.totalPoints, 10);
    assert.equal(state.totalCoinsEarned, 2);
    assert.equal(state.coinBalance, 1);
    await home();
    await page.locator(".coin-hud").tap();
    await page.locator("#crane-start").tap();
    await page.locator("#crane-position").focus();
    await page.keyboard.press("Home");
    for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
    await page.locator("#crane-take").tap();
    await page.locator("#crane-start").waitFor({ state: "visible" });
    state = await saved();
    assert.equal(state.coinBalance, 0);
    assert.equal(state.totalCoinsSpent, 2);
    assert.equal(state.collection.length, 1);
    assert.equal(state.collection[0].id, "rabbit");
    assert.ok(state.collection[0].sessionId);
    assert.equal(state.totalPoints, 10);
    await shot("crane-prize");
    // New construction can actually be built with supported stacks.
    await stage("shapes", 1, "build");
    for (const [color, x, z] of [
      ["blue", 0, 0],
      ["gold", 0, 0],
      ["blue", 1, 0],
      ["gold", 1, 0],
      ["green", 2, 0],
      ["gold", 2, 0],
    ]) {
      await page.locator(`[data-shape-piece="${color}"]`).tap();
      await page
        .locator(`#shape-world polygon[data-cell="${x},${z}"]`)
        .last()
        .tap();
    }
    await page.locator("#shape-next").waitFor({ state: "visible" });
    const once = (await saved()).totalPoints;
    await page.locator("#shape-undo").tap();
    await page.locator('[data-shape-piece="gold"]').tap();
    await page.locator('#shape-world polygon[data-cell="2,0"]').last().tap();
    await page.locator("#shape-next").waitFor({ state: "visible" });
    assert.equal(
      (await saved()).totalPoints,
      once,
      "undo and replace must not duplicate reward",
    );
    await shot("build-2");
    await stage("shapes", 1, "arrange");
    await page.locator('[data-shape-piece="triangle"]').tap();
    await page.locator('[data-flat-slot="1"]').tap();
    await page.locator('[data-shape-piece="square"]').tap();
    await page.locator('[data-flat-slot="4"]').tap();
    await page.locator('[data-flat-slot="7"]').tap();
    await page.locator("#piece-turn-left").tap();
    await page.locator("#piece-turn-left").tap();
    await page.locator('[data-flat-slot="6"]').tap();
    await page.locator('[data-flat-slot="8"]').tap();
    await page.locator("#shape-next").waitFor({ state: "visible" });
    await shot("arrange-2");
    for (let i = 0; i < 3; i++) {
      await stage(0);
      await finishFind();
    }
    state = await saved();
    assert.equal(state.totalPoints, 15);
    assert.equal(state.totalCoinsEarned, 3);
    assert.equal(state.coinBalance, 1);
    await home();
    await page.locator(".coin-hud").tap();
    await page.locator("#crane-start").tap();
    await page.waitForTimeout(350);
    await page.reload();
    state = await saved();
    assert.equal(state.coinBalance, 0);
    assert.equal(state.totalCoinsSpent, 3);
    assert.equal(state.sessions.at(-1).gameId, "crane");
    assert.equal(state.sessions.at(-1).completed, false);
    assert.ok(state.sessions.at(-1).endedAt);
    // Navigation, checkpoint, reload restoration and no fabricated time while away.
    await stage(0);
    await page.waitForTimeout(350);
    await page.reload();
    state = await saved();
    const abandoned = state.sessions.at(-1);
    assert.equal(abandoned.completed, false);
    assert.ok(abandoned.endedAt);
    assert.ok(abandoned.durationSec >= 0.3);
    assert.equal(state.totalPoints, 15);
    assert.equal(
      state.effects.hanamaru.shown + state.effects.fireworks.shown,
      state.totalPoints,
    );
    assert.equal(state.totalCoinsEarned, Math.floor(state.totalPoints / 5));
    assert.equal(
      state.coinBalance,
      state.totalCoinsEarned - state.totalCoinsSpent,
    );
    assert.equal(
      state.coinTransactions.filter((t) => t.type === "spent").length,
      3,
    );
    assert.equal(
      state.coinTransactions.filter((t) => t.type === "earned").length,
      3,
    );
    assert.ok(state.played.includes("あ"));
    assert.ok(state.played.includes("の"));
    assert.ok(state.stamps.includes("みつけた"));
    await page.locator(".coin-hud").tap();
    await page.locator('[data-go="collection"]').tap();
    assert.equal(await page.locator(".treasure").count(), 1);
    await home();
    await page.locator('[data-go="logs"]').tap();
    await shot("logs");
    assert.equal(
      await page.locator(".parent-log tbody").first().locator("tr").count(),
      8,
    );
    const rows = await page.evaluate(async () => {
      const { gameStats } = await import("./experiment.js");
      return gameStats(JSON.parse(localStorage.getItem("hiragana-asobi-v1")));
    });
    for (const row of rows) {
      assert.ok(row.playCount >= 1);
      assert.ok(row.totalPlayTime > 0);
      assert.equal(row.averagePlayTime, row.totalPlayTime / row.playCount);
      assert.equal(row.completionRate, row.completedCount / row.playCount);
    }
    assert.equal(rows.find((r) => r.gameId === "crane").playCount, 3);
    const download = page.waitForEvent("download");
    await page.locator("#export-log").tap();
    assert.match((await download).suggestedFilename(), /hina-asobi-log/);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      `PASS new experiment flow ${viewport.width}: all additional stages, both effects, 5pt coins, crane miss/success, logs, reload and export`,
    );
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
