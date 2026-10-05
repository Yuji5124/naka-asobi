let timers = [];
export function clearCelebration() {
  timers.forEach(clearTimeout);
  timers = [];
  document
    .querySelectorAll(".reward-overlay,.coin-flight")
    .forEach((e) => e.remove());
}
export function celebrate(result, tone, onCoinArrive = () => {}) {
  if (!result) return;
  clearCelebration();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = `reward-overlay ${result.effect}`;
  el.setAttribute("role", "status");
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<circle cx="${100 + 60 * Math.cos(a)}" cy="${100 + 60 * Math.sin(a)}" r="19"/>`;
  }).join("");
  el.innerHTML =
    result.effect === "hanamaru"
      ? `<svg class="hanamaru-stamp" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#ee5b62" stroke-width="7">${petals}<circle cx="100" cy="100" r="38"/><path d="M76 100l17 17 33-38" stroke-linecap="round" stroke-linejoin="round"/></g></svg><strong>よく できました！</strong><span>⭐ ポイント +1</span>`
      : `<div class="firework-sky" aria-hidden="true">${[0, 1, 2].map((n) => `<div class="firework" style="--n:${n}">${Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg"></i>`).join("")}</div>`).join("")}</div><strong>できた！</strong><span>⭐ ポイント +1</span>`;
  if (result.effect === "hanamaru")
    el.insertAdjacentHTML(
      "beforeend",
      `<div class="stamp-sparkles" aria-hidden="true">${Array.from({ length: 6 }, (_, i) => `<i style="--s:${i}">✦</i>`).join("")}</div>`,
    );
  document.body.append(el);
  tone(true);
  if (result.effect === "fireworks" && !reduced)
    [400, 950, 1450].forEach((t) =>
      timers.push(setTimeout(() => tone(true), t)),
    );
  const delay = reduced ? 550 : 2100;
  timers.push(
    setTimeout(() => {
      el.remove();
      if (!result.coin) return;
      const coin = document.createElement("div");
      coin.className = "coin-flight";
      coin.setAttribute("role", "status");
      coin.innerHTML =
        '<div class="big-coin">★</div><strong>5ポイント！<br>コイン ゲット！</strong>';
      document.body.append(coin);
      tone(true);
      const counter = document.querySelector("#coin-count");
      const r = counter?.getBoundingClientRect();
      coin.style.setProperty(
        "--coin-x",
        `${(r ? r.x + r.width / 2 : innerWidth - 60) - innerWidth / 2}px`,
      );
      coin.style.setProperty(
        "--coin-y",
        `${(r ? r.y + r.height / 2 : 40) - innerHeight / 2}px`,
      );
      timers.push(
        setTimeout(
          () => {
            coin.remove();
            onCoinArrive();
            counter?.classList.remove("coin-pop");
            void counter?.offsetWidth;
            counter?.classList.add("coin-pop");
          },
          reduced ? 550 : 1400,
        ),
      );
    }, delay),
  );
}
