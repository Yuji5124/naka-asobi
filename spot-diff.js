const stages = {
  1: { title: "あひるさんを みつけよう", left: ["🌳", "☀️", "🦆", "🦆", "🌷"], right: ["🌳", "☀️", "🐤", "🦆", "🌷"], target: 2, hint: "あひるさんの ちがうところは どこかな？" },
  2: { title: "おはなの ちがいは どこ？", left: ["🌲", "🌼", "🌸", "🛝", "🦋"], right: ["🌲", "🌼", "🍃", "🛝", "🦋"], target: 2, hint: "おはなが ちがうよ。さがしてみよう！" },
  3: { title: "おそらを くらべてみよう", left: ["☀️", "☁️", "🌈", "🐦", "🌻"], right: ["🌙", "☁️", "🌈", "🐦", "🌻"], target: 0, hint: "おそらの ちがうところを タッチ！" },
};

let activeRound;
export function spotDiffView(stage) {
  const base = stages[stage];
  const left = [...base.left], right = [...base.right];
  const origin = base.target;
  let previous = null;
  try {
    const stored = sessionStorage.getItem(`spot-diff-target-${stage}`);
    if (stored !== null) previous = Number(stored);
  } catch { /* Random placement still works when session storage is unavailable. */ }
  let target = Math.floor(Math.random() * (left.length - 1));
  if (Number.isInteger(previous) && previous >= 0 && previous < left.length && target >= previous) target++;
  try { sessionStorage.setItem(`spot-diff-target-${stage}`, String(target)); } catch { /* Session storage is optional. */ }
  [left[target], left[origin]] = [left[origin], left[target]];
  [right[target], right[origin]] = [right[origin], right[target]];
  activeRound = { ...base, left, right, target };
  const picture = (items, side) => `<div class="spot-scene" aria-label="${side}の え">${items.map((item, i) => side === "right" ? `<button class="spot-object" data-diff="${i}" aria-label="${item}">${item}</button>` : `<span class="spot-object">${item}</span>`).join("")}</div>`;
  const data = activeRound;
  return `<main class="spot-screen"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">まちがいさがし</span></div><h1 class="screen-title">${data.title}</h1><p class="spot-hint" id="spot-hint">${data.hint}</p><div class="spot-pairs"><section class="spot-card"><span>くらべる え</span>${picture(data.left, "left")}</section><section class="spot-card"><span>ちがうところを タッチ！</span>${picture(data.right, "right")}</section></div><div class="spot-feedback" id="spot-feedback" role="status" aria-live="polite">ちがうところを さがそう！</div><button class="primary" id="spot-next" hidden>つぎへ ›</button></main>`;
}

export function bindSpotDiff({ stage, activate, tone, message, onMistake, onSuccess, onNext }) {
  const data = activeRound;
  let done = false;
  document.querySelectorAll("[data-diff]").forEach((target) => {
    activate(target, () => {
      if (done) return;
      const feedback = document.querySelector("#spot-feedback");
      if (Number(target.dataset.diff) !== data.target) {
        target.classList.remove("spot-wiggle");
        void target.offsetWidth;
        target.classList.add("spot-wiggle");
        feedback.textContent = "おしい！ もういちど くらべよう";
        tone(false);
        onMistake();
        return;
      }
      done = true;
      target.classList.add("spot-found");
      feedback.textContent = "みつけた！ ちがいが わかったね！";
      message("みつけた！", "happy");
      tone(true);
      const last = onSuccess();
      if (!last) document.querySelector("#spot-next").hidden = false;
    });
  });
  activate(document.querySelector("#spot-next"), () => {
    if (!done) return;
    tone();
    onNext();
  });
}
