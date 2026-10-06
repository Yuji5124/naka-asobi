import { escapeText } from "./experiment.js";
export const PRIZES = [
  ...[["dino","きょうりゅう","#8fc776","🦕"],["robot","ロボット","#89c9dc","🤖"],["firetruck","しょうぼうしゃ","#f08c72","🚒"],["police","パトカー","#8da8d7","🚓"],["train","でんしゃ","#edc85f","🚃"],["rocket","ロケット","#bc9ee0","🚀"],["camera","カメラ","#83c3b0","📷"],["chest","たからばこ","#d6a25f","🧰"],["crown","おうかん","#f1ca55","👑"],["ice","アイスクリーム","#f2a5c0","🍦"],["cake","ケーキ","#e999a5","🍰"],["balloon","ふうせん","#e78688","🎈"],["acorn","どんぐり","#bd955e","🌰"],["whale","くじら","#71bddd","🐳"],["penguin","ペンギン","#9cb9d0","🐧"],["frog","かえる","#8ecb73","🐸"],["cat","ねこ","#e5b27c","🐱"],["bear","くま","#c89470","🐻"],["ufo","UFO","#b49bda","🛸"],["game","ちいさな ゲームき","#75bdd2","🎮"]]
    .map(([id, name, color, icon]) => ({ id, name, color, icon, kind: "toy" })),
];
export function prizeArt(id) {
  const p = PRIZES.find((p) => p.id === id) || PRIZES[0];
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="40" fill="${p.color}" stroke="#fff7df" stroke-width="5"/><text x="50" y="70" text-anchor="middle" font-size="57" font-family="system-ui, sans-serif">${p.icon || "🎁"}</text></svg>`;
}
export function extraCardArt(kind) {
  return kind === "park"
    ? '<svg class="activity-art" viewBox="0 0 160 130" aria-hidden="true"><path d="M49 106V52" stroke="#aa7952" stroke-width="14"/><path d="M50 12C21 8 8 38 22 54C9 76 43 91 59 74C91 83 105 47 78 33C83 18 62 8 50 12" fill="#6cb369"/><circle cx="112" cy="83" r="29" fill="#ffd35d" stroke="#e5a849" stroke-width="5"/><text x="112" y="96" text-anchor="middle" fill="#c48f34" font-size="34">★</text></svg>'
    : '<svg class="activity-art" viewBox="0 0 160 130" aria-hidden="true"><rect x="30" y="12" width="100" height="104" rx="20" fill="#bceaf4" stroke="#6cabc0" stroke-width="5"/><path d="M38 29h84M80 29v36m-17 0 17 19 17-19" fill="none" stroke="#d5918e" stroke-width="8" stroke-linecap="round"/><circle cx="62" cy="98" r="12" fill="#f7d376"/><circle cx="100" cy="96" r="13" fill="#b5a0e0"/></svg>';
}
const tree = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 76V5" stroke="#ac7850" stroke-width="20"/><path d="M-9-85C-62-96-87-40-60-13C-98 23-55 53-19 32C10 64 65 30 42-3C78-40 33-99-9-85Z" fill="#5da95c"/><circle cx="-34" cy="-37" r="16" fill="#8bc66b"/></g>`;
export function parkArt(variant = 0) {
  const skyTop = variant === 2 ? "#b7b6e9" : "#8bdcf0", skyBottom = variant === 2 ? "#ffe0ca" : "#e7f8df";
  return `<svg viewBox="0 0 900 560" aria-hidden="true"><defs><linearGradient id="park-sky" x2="0" y2="1"><stop stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient></defs><rect width="900" height="560" fill="url(#park-sky)"/><circle cx="786" cy="65" r="34" fill="#ffe078"/><g fill="#fffef6"><ellipse cx="143" cy="67" rx="78" ry="26"/><ellipse cx="468" cy="49" rx="74" ry="22"/></g><path d="M0 170Q200 90 420 177T900 150V560H0Z" fill="#b6da82"/><path d="M360 180Q490 240 380 350T600 560" fill="none" stroke="#ffe6aa" stroke-width="74"/>${tree(128, 205)}${tree(785, 255, 1.1)}<g stroke="#ad7251" stroke-width="12" stroke-linecap="round"><path d="M194 283h143m-143 22h143m-129-46v82m114-82v82"/><path d="M507 145h155m-145 0-20 143m155-143 20 143"/></g><g stroke="#6e8895" stroke-width="5"><path d="M550 148v83m68-83v83"/><path d="M536 234h28m40 0h29" stroke-width="12"/></g><g><path d="M360 293V140h85v83" fill="none" stroke="#738eb4" stroke-width="12"/><path d="M444 207Q458 275 522 307" fill="none" stroke="#f88d77" stroke-width="29" stroke-linecap="round"/><path d="M362 193h75m-75 41h75m-75 40h75" stroke="#738eb4" stroke-width="9"/><path d="M350 148h101l-50-42z" fill="#efb354"/></g><ellipse cx="248" cy="431" rx="119" ry="57" fill="#d5a977"/><ellipse cx="248" cy="427" rx="103" ry="42" fill="#ffdf9f"/><path d="M223 438v-36h45v36m-55 0h65" stroke="#ed9474" stroke-width="7" fill="#f2ae89"/><g transform="translate(618 363)"><path d="M0 63V-18m76 81V-18" stroke="#90a998" stroke-width="10"/><path d="M-20-20h115v70H-20Z" fill="#7dc5d4"/><path d="M9 7h48M9 22h72" stroke="#fff7e5" stroke-width="7"/></g><g fill="#919c86"><ellipse cx="78" cy="414" rx="35" ry="21"/><ellipse cx="531" cy="457" rx="28" ry="18"/></g><g fill="#e794bc">${[70, 358, 726, 849].map((x, i) => `<g transform="translate(${x} ${340 + i * 38})"><path d="M0 24V-4" stroke="#74a352" stroke-width="6"/><circle cx="-8" cy="-7" r="10"/><circle cx="8" cy="-7" r="10"/><circle cy="-17" r="10"/><circle cy="3" r="10"/><circle cy="-7" r="6" fill="#ffe684"/></g>`).join("")}</g><g stroke="#79b64f" stroke-width="6" stroke-linecap="round">${[32, 110, 412, 580, 827].map((x, i) => `<path d="M${x} ${490 - i * 10}l-8-18m8 18 7-23m0 23 7-12"/>`).join("")}</g>${variant ? '<path d="M0 530q150-70 260 0t250 0 390 0v30H0Z" fill="#8ec876"/>' : ""}</svg>`;
}
const positions = [
  { x: 145, y: 232, cover: true },
  { x: 253, y: 326 },
  { x: 508, y: 323 },
  { x: 80, y: 351, cover: true },
  { x: 231, y: 445 },
  { x: 573, y: 241 },
  { x: 648, y: 398 },
  { x: 758, y: 270, cover: true },
  { x: 357, y: 397, cover: true },
  { x: 549, y: 473 },
  { x: 841, y: 467, cover: true },
  { x: 384, y: 157 },
];
export function parkView(feedback, variant, stage = variant + 2) {
  return `<main class="park-screen"><div class="stage-top"><button class="back" data-go="select">‹</button><span class="stage-label">みつける · ステージ ${stage}</span></div><h1 class="screen-title">かくれた コインを みつけよう！</h1><p class="park-progress" id="park-progress">0 / 5 · ぜんぶ みつけよう</p><div class="park-board" id="park-board">${parkArt(variant)}<div id="park-coins"></div></div>${feedback("き や はなの ちかくを さがそう！")}<div class="actions"><button class="secondary" id="park-retry">もういちど</button><button class="primary" id="park-next" hidden>つぎの こうえん ›</button></div></main>`;
}
export function bindPark({
  variant,
  activate,
  tone,
  message,
  onSuccess,
  onRetry,
  onNext,
}) {
  const indices = positions.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Avoid an identical layout on an immediate replay.
  const old = bindPark.lastLayout || [];
  let chosen = indices.slice(0, 5);
  if (chosen.every((i) => old.includes(i))) chosen[0] = indices[5];
  bindPark.lastLayout = chosen;
  document.querySelector("#park-coins").innerHTML = chosen
    .map((i) => {
      const p = positions[i];
      return `<button class="park-coin ${p.cover ? "covered" : ""}" data-park-coin="${i}" aria-label="かくれたコイン" style="left:${p.x / 9}%;top:${p.y / 5.6}%"><span>🪙</span></button>`;
    })
    .join("");
  let found = 0;
  document.querySelectorAll("[data-park-coin]").forEach((b) =>
    activate(b, () => {
      if (b.disabled) return;
      b.disabled = true;
      b.classList.add("found");
      found++;
      tone(true);
      message("みつけた！", "happy");
      document.querySelector("#park-progress").textContent =
        `${found} / 5 · ぜんぶ みつけて 1ポイント`;
      if (found === 5) {
        document.querySelector("#park-next").hidden = false;
        onSuccess();
      }
    }),
  );
  activate(document.querySelector("#park-retry"), onRetry);
  activate(document.querySelector("#park-next"), onNext);
}
export function rewardView(data) {
  const unlocked = data.totalPoints >= 5,
    canPlay = unlocked && data.coinBalance > 0;
  const display = [...PRIZES].sort(() => Math.random() - 0.5).slice(0, 4);
  return `<main class="reward-screen"><div class="stage-top"><button class="back" data-go="select">‹</button><span class="stage-label">ごほうび</span></div><h1 class="screen-title">たからもの クレーン</h1><p class="screen-note" id="reward-message">${canPlay ? "クレーンゲームで あそべるよ！" : unlocked ? "コインを あつめて また あそぼう！" : `あと ${5 - data.totalPoints}ポイントで あそべるよ！`}</p><div class="crane-machine"><div class="crane-rail"></div><div class="claw" id="crane-claw" style="left:50%"><div class="claw-rope"></div><div class="claw-fingers"><svg viewBox="0 0 80 65" aria-hidden="true"><rect x="25" y="3" width="30" height="17" rx="8" fill="#e39bb2"/><path d="M28 17L13 39Q9 54 25 57M52 17L67 39Q71 54 55 57M40 20V42" fill="none" stroke="#8ca5ac" stroke-width="8" stroke-linecap="round"/></svg></div></div><div class="crane-prizes">${display.map((p, i) => `<div class="machine-prize" data-prize="${p.id}" style="left:${[15,38,61,84][i]}%">${prizeArt(p.id)}</div>`).join("")}</div><div class="crane-result" id="crane-result" role="status"></div></div><div class="crane-start"><button class="primary" id="crane-start" ${canPlay ? "" : "disabled"}>🪙 1まいで あそぶ</button><small>5ポイントで コイン1まい。1かい 1まい。</small></div><div class="crane-controls" id="crane-controls" hidden><label>よこに うごかそう<input type="range" min="5" max="95" value="50" id="crane-position" aria-label="クレーンをよこにうごかす" /></label><button class="primary" id="crane-take">とる！</button></div><div class="actions"><button class="secondary" data-go="collection">たからもの ${data.collection.length}こ</button><button class="secondary" data-go="select">あそびに もどる</button></div></main>`;
}
export function collectionView(data) {
  return `<main class="collection-screen"><div class="stage-top"><button class="back" data-go="reward">‹</button><span class="stage-label">たからもの</span></div><h1 class="screen-title">あつめた たからもの</h1><div class="treasure-grid">${
    data.collection
      .map((p) => {
        const prize = PRIZES.find((a) => a.id === p.id);
        return `<div class="treasure">${prizeArt(p.id)}<strong>${escapeText(prize?.name || "ふしぎな たからもの")}</strong></div>`;
      })
      .join("") || "<p>クレーンで たからものを あつめよう！</p>"
  }</div></main>`;
}
export function bindCrane({ data, experiment, activate, tone, refresh, celebratePrize = () => {} }) {
  let playing = false,
    busy = false,
    alive = true,
    timers = [];
  const claw = document.querySelector("#crane-claw"),
    start = document.querySelector("#crane-start"),
    take = document.querySelector("#crane-take"),
    controls = document.querySelector("#crane-controls"),
    result = document.querySelector("#crane-result");
  activate(start, () => {
    if (playing || busy || data.totalPoints < 5 || data.coinBalance < 1) return;
    experiment.start("crane", "crane-01");
    if (!experiment.spend()) {
      experiment.finish("insufficient-coins");
      return;
    }
    playing = true;
    start.hidden = true;
    document.querySelector(".crane-start").hidden = true;
    document.querySelector(".crane-machine").classList.add("reward-ready");
    controls.hidden = false;
    result.classList.remove("prize-won");
    result.textContent = "よこに うごかして とる！";
    tone("crane-start");
  });
  document.querySelector("#crane-position").oninput = (e) => {
    if (busy) return;
    claw.style.left = `${e.target.value}%`;
  };
  activate(take, () => {
    if (!playing || busy) return;
    busy = true;
    take.disabled = true;
    document.querySelector("#crane-position").disabled = true;
    claw.classList.add("descending");
    tone("crane-down");
    const x = Number(document.querySelector("#crane-position").value),
      index = [15, 38, 61, 84].reduce((best, value, i, a) => Math.abs(x - value) < Math.abs(x - a[best]) ? i : best, 0),
      target = document.querySelectorAll(".machine-prize")[index],
      p = PRIZES.find((item) => item.id === target?.dataset.prize),
      success = p && Math.abs(x - [15, 38, 61, 84][index]) <= 10;
    timers.push(
      setTimeout(() => {
        if (!alive) return;
        claw.classList.add("ascending");
        if (success) {
          document
            .querySelector(`[data-prize="${p.id}"]`)
            .classList.add("caught");
          claw.insertAdjacentHTML(
            "beforeend",
            `<div class="carried-prize">${prizeArt(p.id)}</div>`,
          );
          tone(true);
          navigator.vibrate?.(35);
        } else {
          result.textContent = "あっ、すべっちゃった！";
          tone();
        }
      }, 800),
    );
    timers.push(
      setTimeout(() => {
        if (!alive) return;
        playing = false;
        busy = false;
        experiment.complete();
        if (success) {
          experiment.prize(p.id);
          result.innerHTML = `${prizeArt(p.id)}<strong>${p.name}<br>とれた！</strong>`;
          result.classList.add("prize-won");
          celebratePrize();
          tone(true);
          navigator.vibrate?.([30, 45, 30]);
        } else {
          result.innerHTML = "<strong>おしい！<br>また ためそう！</strong>";
          tone();
        }
        experiment.finish(success ? "prize" : "miss");
        controls.hidden = true;
        start.hidden = false;
        document.querySelector(".crane-start").hidden = false;
        document.querySelector(".crane-machine").classList.remove("reward-ready");
        start.disabled = data.coinBalance < 1;
        start.textContent = "🪙 1まいで もういちど";
        document.querySelector("#reward-message").textContent =
          data.coinBalance > 0
            ? "もういちど あそべるよ！"
            : "コインを あつめて また あそぼう！";
        claw.classList.remove("descending", "ascending");
        claw.querySelector(".carried-prize")?.remove();
        document
          .querySelectorAll(".caught")
          .forEach((e) => e.classList.remove("caught"));
        take.disabled = false;
        document.querySelector("#crane-position").disabled = false;
        refresh();
      }, 1800),
    );
  });
  return () => {
    alive = false;
    timers.forEach(clearTimeout);
  };
}
