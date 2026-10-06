// Reusable trace → world change → choice stages for the gentle detective game.
export const COIN_THIEF_STAGES = {
  1: [
    { title: "あしあと", prompt: "どっちに いった？", traceType: "footprints", scene: "🌳　　🌼　　　 🌳", choices: [{ id: "left", art: "🌿\n🌿", text: "ひだり" }, { id: "right", art: "👣 👣", text: "みぎ" }], answer: "right" },
    { title: "おちた コイン", prompt: "コインは どっち？", traceType: "dropped-coin", scene: "🌳　　🛤️　　🌳", choices: [{ id: "left", art: "🪙", text: "ひだり" }, { id: "right", art: "🌼", text: "みぎ" }], answer: "left" },
    { title: "ゆれる くさ", prompt: "くさが ゆれてるのは？", traceType: "moving-grass", scene: "🌳　　🌼　　　 🌳", choices: [{ id: "left", art: "🌿", text: "しずか" }, { id: "right", art: "🌾〰️", text: "ゆらゆら" }], answer: "right" },
  ],
  2: [
    { title: "はこが うごいた", prompt: "なにが かわった？", traceType: "moved-box", before: "🌳　 📦　 🪑", after: "🌳　　　 📦 🪑", target: "📦", choices: [{ id: "tree", art: "🌳", text: "き" }, { id: "box", art: "📦", text: "はこ" }, { id: "bench", art: "🪑", text: "ベンチ" }], answer: "box" },
    { title: "ドアが あいた", prompt: "なにが かわった？", traceType: "opened-door", before: "🌳　 🏠🚪　 🌷", after: "🌳　 🏠🚪↗️　 🌷", target: "🚪", choices: [{ id: "tree", art: "🌳", text: "き" }, { id: "door", art: "🚪", text: "ドア" }, { id: "flower", art: "🌷", text: "おはな" }], answer: "door" },
    { title: "みずたまり", prompt: "あとが ついたのは？", traceType: "puddle-footprints", before: "🌳　 💧　 🌿", after: "🌳　 💧👣👣　 🌿", target: "👣", choices: [{ id: "tree", art: "🌳", text: "き" }, { id: "tracks", art: "👣", text: "あしあと" }, { id: "grass", art: "🌿", text: "くさ" }], answer: "tracks" },
  ],
  3: [
    { title: "どろんこを よけよう", prompt: "どっちを とおる？", traceType: "mud-avoidance", scene: "🚓　　🛣️　　🌳", choices: [{ id: "dry", art: "☀️　🛤️", text: "かわいた みち" }, { id: "mud", art: "🟤👣", text: "どろみち" }], answer: "dry", selectedPath: true },
    { title: "おとを たてない", prompt: "しずかなのは どっち？", traceType: "quiet-path", scene: "🚓　　🛣️　　🌳", choices: [{ id: "plain", art: "📦", text: "ふつうの はこ" }, { id: "bell", art: "🔔📦", text: "すずの はこ" }], answer: "plain", selectedPath: true },
    { title: "コインを とりすぎない", prompt: "しずかに いこう！", traceType: "coin-noise", scene: "🚓　　🛣️　　🌳", choices: [{ id: "one", art: "🪙", text: "1まい", count: 1 }, { id: "three", art: "🪙🪙🪙", text: "3まい", count: 3 }, { id: "five", art: "🪙🪙🪙🪙🪙", text: "5まい", count: 5 }], answer: "one", selectedPath: true },
  ],
};

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function coinThiefView(level, stage) {
  const item = COIN_THIEF_STAGES[level][stage - 1];
  const changing = !!item.before;
  const instruction = level === 1
    ? "👀 あとを みつけたら タッチ！"
    : level === 2
      ? "🖼️ まえと くらべて、かわった ものを タッチ！"
      : "🤫 しずかに すすめる ほうを タッチ！";
  return `<main class="coin-thief-screen level-${level}">
    <div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><div class="steps">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">コインどろぼう！ · ${level}-${stage}</span></div>
    <div class="thief-heading"><span class="tiny-police">👮🚓</span><div><span class="thief-kicker">${level === 1 ? "あとを みつけよう！" : level === 2 ? "なにが かわった？" : "コインを しずかに はこぼう"}</span><h1>${escape(item.prompt)}</h1></div><span class="tiny-thief" aria-hidden="true">👣✨</span></div>
    ${level === 1 && stage === 1 ? `<div class="coin-missing-callout">たいへん！ コインが ない！</div>` : ""}
    <section class="thief-world ${changing ? "changing" : ""}" aria-label="${escape(item.title)}">
      <div class="world-sky"><span>☁️</span><span>☀️</span></div><div class="world-ground"><div class="world-park-art">${changing ? `<div class="comparison-world"><div class="before-world"><small>まえ</small><strong>${item.before}</strong></div><span class="compare-arrow" hidden>➡️</span><div class="after-world" hidden><small class="change-caption">いま</small><strong>${item.after}</strong></div></div>` : `<span class="police-car" aria-hidden="true">👮🚓</span>${level === 1 ? `<div class="forked-path" aria-hidden="true"><span>🌳　↖<br>🛤️　🌿</span><span>🌿　🛤️<br>↗　🌳</span></div>` : `<strong>${item.scene}</strong>`}<span class="world-bush">🌷　🌱　🌼</span>`}</div>${changing ? `<div class="thief-shadow" aria-hidden="true">💨　💨</div>` : level === 1 && stage === 1 ? "" : `<div class="tiny-coin" aria-hidden="true">🪙</div>`}</div>
    </section>
    <p class="thief-instruction">${instruction}</p>
    <div class="thief-choices" role="group" aria-label="こたえを えらぶ">${item.choices.map((c, i) => `<button class="thief-choice" data-choice="${c.id}" ${changing ? "disabled" : ""}><span class="choice-order">${level === 1 ? i === 0 ? "⬅️" : "➡️" : "ここ！"}</span><span class="choice-art ${item.traceType === "moving-grass" && c.id === "right" ? "grass-sway" : ""}">${c.art.split("\\n").join("<br>")}</span><strong>${escape(c.text)}</strong></button>`).join("")}</div>
    <div class="thief-feedback" aria-live="polite">${changing ? "まずは まえの ようすを みよう" : level === 1 ? "あやしい あとを えらんでね" : level === 2 ? "かわった ものは どれかな？" : "どの みちが しずかかな？"}</div>
  </main>`;
}

export function bindCoinThief({ level, stage, activate, tone, message, onMistake, onChoice, onSuccess }) {
  const item = COIN_THIEF_STAGES[level][stage - 1];
  let done = false, timer = 0, successTimer = 0;
  const answerButtons = [...document.querySelectorAll(".thief-choice")];
  function showChangedWorld() {
    document.querySelector(".after-world")?.removeAttribute("hidden");
    document.querySelector(".compare-arrow")?.removeAttribute("hidden");
    document.querySelector(".thief-shadow")?.classList.add("rush-away");
    document.querySelectorAll(".thief-choice").forEach((b) => b.disabled = false);
    document.querySelector(".thief-feedback").textContent = "まえと くらべて、かわった ものを タッチ！";
    tone();
  }
  if (item.before) timer = window.setTimeout(showChangedWorld, 2300);
  answerButtons.forEach((button) => activate(button, () => {
    if (done || button.disabled) return;
    const selected = item.choices.find((c) => c.id === button.dataset.choice);
    onChoice?.({ traceType: item.traceType, selectedPath: selected.id, coinsSelected: selected.count || null });
    if (button.dataset.choice !== item.answer) {
      onMistake(); tone(false);
      button.classList.remove("gentle-shake"); void button.offsetWidth; button.classList.add("gentle-shake");
      document.querySelector(".thief-feedback").textContent = level === 3 && item.traceType === "coin-noise" ? "チャリン！ みつかりそう！" : "ん？ もういちど みてみよう";
      if (item.traceType === "mud-avoidance" && selected.id === "mud") {
        document.querySelector(".thief-feedback").innerHTML = "👣 あしあとが ついたよ！ 🚓";
        document.querySelector(".world-park-art strong").textContent = "🟤👣👣";
      } else if (item.traceType === "quiet-path" && selected.id === "bell") {
        document.querySelector(".thief-feedback").textContent = "チリン！ きこえたよ";
        tone("bell");
      } else if (item.traceType === "coin-noise" && selected.count > 1) tone("coin-clink");
      return;
    }
    done = true;
    button.classList.add("found-choice");
    answerButtons.forEach((b) => b.disabled = true);
    document.querySelector(".thief-feedback").innerHTML = `<span class="found-stamp">${level === 3 ? "しずかに いけた！" : "みつけた！"}</span><span class="thief-stars">✦ ✨ ✦</span>`;
    document.querySelector(".police-car")?.classList.add("police-go");
    tone(true);
    tone(item.traceType);
    successTimer = window.setTimeout(() => onSuccess({ traceType: item.traceType, selectedPath: selected.id, coinsSelected: selected.count || null }), 850);
  }));
  return () => { window.clearTimeout(timer); window.clearTimeout(successTimer); };
}
