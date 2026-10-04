const app = document.querySelector("#app");
const letters = ["あ", "し", "つ", "く", "へ", "ほ"];
const labels = ["みつける", "なぞる", "つなぐ", "かく"];
const words = {
  あ: "あひる",
  し: "しずく",
  つ: "つき",
  く: "くま",
  へ: "へび",
  ほ: "ほし",
};
const KEY = "hiragana-asobi-v1";
const blank = () => ({
  played: [],
  cleared: [],
  recent: [],
  stamps: [],
  sound: true,
});
let data = blank(),
  storageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && typeof saved === "object") {
    data.played = letters.filter(
      (c) => Array.isArray(saved.played) && saved.played.includes(c),
    );
    data.recent = Array.isArray(saved.recent)
      ? saved.recent.filter((c) => letters.includes(c)).slice(0, 6)
      : [];
    data.cleared = [0, 1, 2, 3].filter(
      (n) => Array.isArray(saved.cleared) && saved.cleared.includes(n),
    );
    data.stamps = Array.isArray(saved.stamps)
      ? saved.stamps.filter((s) =>
          ["みつけた", "なぞれた", "つながった", "かけた"].includes(s),
        )
      : [];
    data.sound = saved.sound !== false;
  }
  localStorage.setItem(KEY, JSON.stringify(data));
} catch {
  storageOK = false;
}
let screen = "home",
  stage = 0,
  traceLetter = "し",
  pathRound = 0,
  complete = false;
let sessionLetters = new Set(),
  sessionStages = new Set(),
  generation = 0;
let audioContext;
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    storageOK = false;
  }
}
function collect(c, n) {
  if (!data.played.includes(c)) data.played.push(c);
  if (!data.cleared.includes(n)) data.cleared.push(n);
  data.recent = [c, ...data.recent.filter((x) => x !== c)].slice(0, 6);
  const stamp = ["みつけた", "なぞれた", "つながった", "かけた"][n];
  if (!data.stamps.includes(stamp)) data.stamps.push(stamp);
  sessionLetters.add(c);
  sessionStages.add(n);
  save();
}
function tone(success = false) {
  if (!data.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    (success ? [523, 659, 784] : [440]).forEach((f, i) => {
      const o = audioContext.createOscillator(),
        g = audioContext.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.19);
      o.connect(g);
      g.connect(audioContext.destination);
      o.start(now + i * 0.1);
      o.stop(now + i * 0.1 + 0.2);
    });
  } catch {
    /* A silent browser can still play every activity. */
  }
}
function speak(text) {
  if (!data.sound || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 0.8;
    const voice = speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("ja"));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch {
    /* Japanese voices depend on the device. */
  }
}
const svg = (content, cls = "", viewBox = "0 0 100 100") =>
  `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
const icon = (name) =>
  svg(
    {
      sound:
        '<path d="M18 40h18l24-20v60L36 60H18z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M72 32q22 18 0 36" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
      mute: '<path d="M18 40h18l24-20v60L36 60H18zM75 38l17 24m0-24L75 62" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>',
      arrow:
        '<path d="M18 50h60M52 24l27 26-27 26" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
      back: '<path d="M75 50H22m26-25L22 50l26 25" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
      book: '<path d="M10 22q23-9 40 3 17-12 40-3v61q-25-8-40 2-15-10-40-2z" fill="#d1e6d8" stroke="#679a7e" stroke-width="5" stroke-linejoin="round"/><path d="M50 25v59M22 38h14m-14 14h14m28-14h14m-14 14h14" fill="none" stroke="#679a7e" stroke-width="4" stroke-linecap="round"/>',
      pencil:
        '<path d="M25 73l9-25L69 13q9-9 19 1t0 19L53 68z" fill="#f2c567" stroke="#7c9ca0" stroke-width="4" stroke-linejoin="round"/><path d="M34 48l19 20M62 20l19 20M25 73l-4 10 12-4" stroke="#7c9ca0" stroke-width="4" fill="none"/>',
      path: '<path d="M10 77h32V26h48" fill="none" stroke="#9cba7a" stroke-width="26" stroke-linejoin="round"/><path d="M10 77h32V26h48" fill="none" stroke="#fff9e1" stroke-width="13" stroke-linejoin="round"/>',
    }[name] || "",
  );
function friend(mood = "") {
  return svg(
    '<ellipse cx="49" cy="94" rx="28" ry="4" fill="#cedac2"/><path d="M23 41Q7 14 25 11q13-1 15 22 10-5 21 1Q69 11 80 17q13 10-2 28 15 22 5 40-8 14-32 10-25 4-36-10-13-20 8-44" fill="#fffefa" stroke="#dfdfca" stroke-width="2.5"/><ellipse cx="33" cy="67" rx="8" ry="5" fill="#f5c5b7"/><ellipse cx="69" cy="67" rx="8" ry="5" fill="#f5c5b7"/><ellipse cx="39" cy="57" rx="3" ry="4" fill="#43564b"/><ellipse cx="63" cy="57" rx="3" ry="4" fill="#43564b"/><path d="M46 65q5 8 10 0" fill="none" stroke="#43564b" stroke-width="2.7" stroke-linecap="round"/><path d="M17 71l-9-7m73 9 11-8" stroke="#dfdfca" stroke-width="4" stroke-linecap="round"/><path d="M32 91l-6 4m43-5 6 5" stroke="#dfdfca" stroke-width="5" stroke-linecap="round"/><path d="M49 81q-10-10-13-2t13 11q17-6 13-12t-13 3" fill="#cbe5d7"/>',
    `friend ${mood}`,
  );
}
function picture(c) {
  const content = {
    あ: '<path d="M15 64q15-18 38-9l10-25q13-16 25-1t-2 24l-13 9q-1 25-32 26T15 64" fill="#f9d96f"/><path d="M83 38l15 6-15 6" fill="#ed9c58"/><circle cx="78" cy="35" r="3" fill="#4f6559"/><path d="M31 66q10-6 24 0-7 12-24 0" fill="#eabe52"/><path d="M12 89q12 7 23 0t25 0 25 0" fill="none" stroke="#9dcfd9" stroke-width="5" stroke-linecap="round"/>',
    し: '<path d="M51 8Q42 35 23 58q-14 33 20 37 44 7 37-27Q65 38 51 8" fill="#a9dce6"/><path d="M35 64q-8 15 5 20" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/><circle cx="47" cy="60" r="3" fill="#3e665f"/><circle cx="65" cy="60" r="3" fill="#3e665f"/><path d="M52 71q5 5 10 0" fill="none" stroke="#3e665f" stroke-width="2.5"/>',
    つ: '<path d="M68 8Q32 23 44 57q10 28 39 26-34 28-58-2T28 18q18-15 40-10" fill="#f4d477"/><circle cx="29" cy="48" r="3" fill="#82723e"/><path d="M19 58q6 5 12 0" stroke="#82723e" stroke-width="2" fill="none"/><path d="M82 20l4 8 9 2-7 6 1 9-7-5-8 5 2-10-7-5 10-2z" fill="#f4d477"/>',
    く: '<circle cx="24" cy="27" r="16" fill="#c6a985"/><circle cx="76" cy="27" r="16" fill="#c6a985"/><circle cx="24" cy="27" r="9" fill="#f0d9b9"/><circle cx="76" cy="27" r="9" fill="#f0d9b9"/><ellipse cx="50" cy="55" rx="37" ry="36" fill="#d6b68d"/><ellipse cx="50" cy="68" rx="19" ry="14" fill="#fff0d8"/><circle cx="36" cy="52" r="4" fill="#534c3d"/><circle cx="65" cy="52" r="4" fill="#534c3d"/><path d="M44 63q6-7 12 0l-6 6z" fill="#534c3d"/><path d="M50 68v7m0 0q-8 6-11 0m11 0q8 6 11 0" stroke="#534c3d" stroke-width="2" fill="none"/>',
    へ: '<path d="M24 20q-16 33 13 39t24 26q-29 19-44-6" fill="none" stroke="#9dc69c" stroke-width="22" stroke-linecap="round"/><ellipse cx="30" cy="22" rx="19" ry="15" fill="#acd3a6"/><circle cx="27" cy="17" r="3" fill="#38534e"/><path d="M44 24l14 2m-4-3 4 3-3 4" fill="none" stroke="#cf7d77" stroke-width="3"/>',
    ほ: '<path d="M50 7l13 27 30 5-22 21 5 31-26-15-26 15 5-31L7 39l30-5z" fill="#f6d573" stroke="#e6bd58" stroke-width="3" stroke-linejoin="round"/><circle cx="38" cy="48" r="3" fill="#77694b"/><circle cx="62" cy="48" r="3" fill="#77694b"/><path d="M44 58q6 7 12 0" stroke="#77694b" stroke-width="3" fill="none" stroke-linecap="round"/>',
  };
  return svg(content[c] || content.ほ, "picture");
}
const paths = {
  し: ["M145 75 C143 130 130 218 145 277 C160 340 230 333 285 286"],
  つ: ["M75 130 C154 102 301 91 311 173 C321 235 220 268 155 280"],
  く: ["M265 65 Q207 127 133 191 Q194 242 267 325"],
  へ: ["M62 234 Q110 182 145 145 Q157 132 173 148 Q245 216 332 247"],
  あ: [
    "M94 117 Q196 113 274 98",
    "M181 58 Q171 165 185 308",
    "M273 155 C235 230 137 329 99 287 C49 235 181 166 257 189 C347 216 300 326 242 324",
  ],
  ほ: [
    "M98 69 Q72 169 90 303 L113 276",
    "M168 103 Q244 100 297 93",
    "M166 159 Q239 157 303 149",
    "M243 72 L250 262 C252 314 163 322 159 278 C157 234 259 238 306 292",
  ],
};
function guide(c, preview = false) {
  return svg(
    paths[c]
      .map(
        (d, i) =>
          `<path d="${d}" ${preview ? 'pathLength="1"' : ""} class="${preview ? "" : "trace-guide"}" style="--i:${i}"/>${preview ? "" : `<path d="${d}" class="guide-dots"/>`}`,
      )
      .join("") +
      (preview
        ? ""
        : `<circle class="start-marker" cx="${starts[c][0]}" cy="${starts[c][1]}" r="20"/><text class="start-number" x="${starts[c][0]}" y="${starts[c][1]}">1</text>`),
    preview ? "stroke-preview" : "",
    "0 0 400 400",
  );
}
const starts = {
  し: [145, 75],
  つ: [75, 130],
  く: [265, 65],
  へ: [62, 234],
  あ: [94, 117],
  ほ: [98, 69],
};
function header() {
  return `<header><button class="brand" data-go="home" aria-label="ひらがな あそび ホーム"><span class="brand-mark">あ</span>ひらがな あそび</button><button class="sound" id="sound" aria-pressed="${data.sound}" aria-label="おとを${data.sound ? "けす" : "つける"}">${icon(data.sound ? "sound" : "mute")}<span>おと ${data.sound ? "あり" : "なし"}</span></button></header>`;
}
function stageTop() {
  return `<div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">${icon("back")}</button><div class="steps" aria-label="${stage + 1} / 4">${labels.map((_, i) => `<span class="step-dot ${i === stage ? "active" : ""}"></span>`).join("")}</div><span class="stage-label">${String(stage + 1).padStart(2, "0")} / ${labels[stage]}</span></div>`;
}
function feedback(text) {
  return `<div class="feedback"><div class="friend-mini">${friend()}</div><p class="feedback-text" id="message" role="status" aria-live="polite">${text}</p></div>`;
}
function sayFeedback(text, mood = "think") {
  const el = document.querySelector("#message");
  if (el) el.textContent = text;
  const f = document.querySelector(".feedback .friend");
  if (f) {
    f.classList.remove("happy", "think");
    void f.getBoundingClientRect();
    f.classList.add(mood);
  }
}
function burst() {
  document.querySelector(".celebration")?.remove();
  const el = document.createElement("div");
  el.className = "celebration";
  el.setAttribute("aria-hidden", "true");
  const colors = ["#e8a09b", "#8ec7da", "#edcc6a", "#a8c79f"];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("i");
    p.className = "confetti";
    p.style.cssText = `background:${colors[i % 4]};--dx:${(Math.random() - 0.5) * 750}px;--dy:${120 + Math.random() * 420}px;--spin:${Math.random() * 700}deg;animation-delay:${Math.random() * 0.2}s`;
    el.append(p);
  }
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}
function win(c, text) {
  if (complete) return;
  complete = true;
  collect(c, stage);
  tone(true);
  speak(text);
  sayFeedback(text, "happy");
  burst();
  document.querySelector("#next")?.removeAttribute("hidden");
}
function actions(withNext = true) {
  return `<div class="actions"><button class="secondary" id="retry">もういちど</button>${withNext ? `<button class="primary" id="next" hidden>${stage === 3 ? "できた！" : "つぎへ"} ${icon("arrow")}</button>` : ""}</div>`;
}
function go(to) {
  generation++;
  screen = to;
  complete = false;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  document.querySelector(".drag-ghost")?.remove();
  document.body.classList.toggle("home-scene", screen === "home");
  let body = "";
  if (to === "home")
    body = `<main class="home"><p class="eyebrow">さわって、ためして、できた！</p><h1><span class="rainbow"><i>ひ</i><i>ら</i><i>が</i><i>な</i></span> あそび</h1><div class="hero-art"><div class="hero-sun"></div><span class="tiny-star">✦</span><span class="hero-small shi">し</span><div class="hero-circle"><button class="hero-letter" id="hero-letter" aria-label="あ をよむ">あ</button></div><span class="hero-small tsu">つ</span><span class="tiny-star second">✦</span><div class="hero-friend">${friend()}</div></div><button class="primary start-button" id="start">はじめる ${icon("arrow")}</button><p class="hero-sub">みつけて、なぞって。もじと あそぼう。</p><div class="home-bottom"><button class="book-link" data-go="book">${icon("book")}<span><strong>あいうえお ずかん</strong><small>${data.played.length} もじと なかよし</small></span></button><button class="book-link" data-go="record" aria-label="きろく">${svg('<path d="M50 10l12 24 27 4-20 20 5 28-24-13-24 13 5-28-20-20 27-4z" fill="#f7d97d" stroke="#d1b663" stroke-width="3"/>')}<span><strong>きろく</strong></span></button></div>${storageOK ? "" : storageNotice()}<p class="footer-note">きょうは、どの もじと あそぶ？</p></main><div class="ground" aria-hidden="true"><span class="flower f1">✿</span><span class="flower f2">✿</span><span class="flower f3">✿</span></div>`;
  if (to === "select")
    body = `<main><h1 class="screen-title">なにして あそぶ？</h1><p class="screen-note">すきな あそびを えらんでね</p><div class="stage-grid">${labels.map((l, i) => `<button class="stage-card color-${i}" data-stage="${i}"><span class="stage-icon">${i === 0 ? "あ" : i === 1 ? icon("pencil") : i === 2 ? icon("path") : "ほ"}</span><span><span class="stage-number">ASOBI ${String(i + 1).padStart(2, "0")}</span><strong>${l}</strong><small>${["おなじ もじは どこ？", "ゆびで すーっと", "みちを つくろう", "かいた もじが うごくよ"][i]}</small></span><span class="arrow">›</span></button>`).join("")}</div><div class="select-friend"><div class="friend-mini">${friend()}</div>いっしょに あそぼう！</div></main>`;
  if (to === "play")
    body = `<main>${stageTop()}${[findView, traceView, pathView, writeView][stage]()}</main>`;
  if (to === "result")
    body = `<main>${stageTop()}<h1 class="screen-title">いっぱい あそんだね！</h1><div class="result-art"><span class="big-star">✦</span>${friend("happy")}<span class="big-star">✦</span></div><span class="sticker">なかよし<br>スタンプ</span><p class="screen-note">きょう なかよくなった もじ</p><div class="collected-row">${[...sessionLetters].map((c) => `<span>${c}</span>`).join("")}</div><div class="actions"><button class="secondary" data-go="select">まだ あそぶ</button><button class="primary" data-go="home">ホームへ ${icon("arrow")}</button></div></main>`;
  if (to === "book")
    body = `<main><div class="stage-top"><button class="back" data-go="home" aria-label="ホームへ">${icon("back")}</button><span class="stage-label">もじと なかよし</span></div><h1 class="screen-title">あいうえお ずかん</h1><p class="screen-note">あそんだ もじを さわってみよう</p><div class="book-grid">${letters.map((c) => `<button class="book-card ${data.played.includes(c) ? "" : "locked"}" data-letter="${c}" aria-label="${data.played.includes(c) ? c + " " + words[c] : "まだあそんでいないもじ"}">${data.played.includes(c) ? c : "？"}<small>${data.played.includes(c) ? words[c] : "あそんで みつけよう"}</small></button>`).join("")}</div><div id="book-detail">${feedback("どの もじに する？")}</div></main>`;
  if (to === "record")
    body = `<main><div class="stage-top"><button class="back" data-go="home" aria-label="ホームへ">${icon("back")}</button><span class="stage-label">あそびの おもいで</span></div><h1 class="screen-title">なかよし きろく</h1><div class="result-art">${friend()}</div><p class="screen-note">さいきん あそんだ もじ</p><div class="collected-row">${data.recent.map((c) => `<span>${c}</span>`).join("") || "これから あそぼう！"}</div><div class="actions">${data.stamps.map((s) => `<span class="sticker">✦<br>${s}</span>`).join("")}</div><p class="screen-note">${data.cleared.length ? data.cleared.map((i) => labels[i]).join("・") + " で あそんだよ" : "すきな あそびを えらんでね"}</p>${storageOK ? "" : storageNotice()}<div class="actions"><button class="primary" data-go="select">あそぶ ${icon("arrow")}</button></div></main>`;
  app.innerHTML = header() + body;
  bindCommon();
  if (to === "play") [bindFind, bindTrace, bindPath, bindWrite][stage]();
  if (to === "book") bindBook();
  if (to === "result") {
    tone(true);
    burst();
  }
  window.scrollTo(0, 0);
}
function storageNotice() {
  return '<p class="storage-note" role="status">このブラウザでは きろくを のこせないよ。このまま あそべるよ。</p>';
}
// Drawing can delay the browser's compatibility click. Activate on pointer release
// and ignore its later click; retain native keyboard and assistive-tech clicks.
function activate(button, action) {
  if (!button) return;
  let handled = false;
  button.addEventListener("pointerdown", () => {
    handled = false;
  });
  button.addEventListener("pointerup", (e) => {
    if (e.button !== 0) return;
    handled = true;
    action();
  });
  button.addEventListener("click", (e) => {
    if (!handled || e.detail === 0) action();
    handled = false;
  });
}
function bindCommon() {
  document.querySelectorAll("[data-go]").forEach(
    (b) =>
      (b.onclick = () => {
        tone();
        go(b.dataset.go);
      }),
  );
  document.querySelector("#sound").onclick = () => {
    data.sound = !data.sound;
    save();
    if (!data.sound) window.speechSynthesis?.cancel();
    else {
      tone();
      speak("おとを つけたよ");
    }
    const b = document.querySelector("#sound");
    b.innerHTML =
      icon(data.sound ? "sound" : "mute") +
      `<span>おと ${data.sound ? "あり" : "なし"}</span>`;
    b.setAttribute("aria-pressed", String(data.sound));
    b.setAttribute("aria-label", `おとを${data.sound ? "けす" : "つける"}`);
  };
  document.querySelector("#start")?.addEventListener("click", () => {
    sessionLetters = new Set();
    sessionStages = new Set();
    pathRound = 0;
    traceLetter = "し";
    tone();
    speak("いっしょに あそぼう");
    go("select");
  });
  document.querySelector("#hero-letter")?.addEventListener("click", () => {
    tone();
    speak("あ");
    document.querySelector(".hero-friend .friend").classList.remove("happy");
    void app.offsetWidth;
    document.querySelector(".hero-friend .friend").classList.add("happy");
  });
  document.querySelectorAll("[data-stage]").forEach(
    (b) =>
      (b.onclick = () => {
        stage = Number(b.dataset.stage);
        tone();
        go("play");
        speak(
          [
            "あ を みつけよう",
            "し を なぞろう",
            "あひるまで みちを つくろう",
            "ほ を かいてみよう",
          ][stage],
        );
      }),
  );
  activate(document.querySelector("#retry"), () => {
    tone();
    go("play");
  });
  activate(document.querySelector("#next"), () => {
    if (!complete) return;
    tone();
    if (stage < 3) {
      stage++;
      go("play");
    } else go("result");
  });
}
function findView() {
  return `<div class="instruction"><span class="target">あ</span><h1 class="task-title">を みつけよう！</h1></div><div class="find-grid" id="find-grid"></div><div class="find-progress" aria-label="3つ みつけよう"><span></span><span></span><span></span></div>${feedback("あ は どこかな？")}${actions()}`;
}
function bindFind() {
  const cards = ["あ", "あ", "あ", "お", "め", "ぬ", "の", "ね"];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  document.querySelector("#find-grid").innerHTML = cards
    .map((c) => `<button class="letter-card" aria-label="${c}">${c}</button>`)
    .join("");
  let found = 0;
  document.querySelectorAll(".letter-card").forEach(
    (b) =>
      (b.onclick = () => {
        if (complete || b.classList.contains("found")) {
          tone();
          speak(b.textContent);
          return;
        }
        if (b.textContent === "あ") {
          b.classList.add("found");
          b.setAttribute("aria-label", "あ みつけた");
          found++;
          document
            .querySelectorAll(".find-progress span")
            [found - 1].classList.add("done");
          tone();
          speak("あ");
          sayFeedback("みつけた！", "happy");
          if (found === 3) win("あ", "ぜんぶ みつけた！");
        } else {
          b.classList.remove("wiggle");
          void b.offsetWidth;
          b.classList.add("wiggle");
          tone();
          speak(b.textContent);
          sayFeedback("もういちど！");
        }
      }),
  );
}
function traceView() {
  return `<div class="instruction"><h1 class="task-title">「${traceLetter}」を なぞろう</h1></div><div class="drawing-layout"><div class="draw-board" id="draw-board">${guide(traceLetter)}<canvas id="drawing" aria-label="${traceLetter}をなぞる。1から線にそって指で動かしてね"></canvas></div><div class="letter-tabs" aria-label="なぞるもじ">${["し", "つ", "く", "へ"].map((c) => `<button data-trace="${c}" class="${c === traceLetter ? "selected" : ""}" aria-pressed="${c === traceLetter}">${c}</button>`).join("")}</div></div>${feedback("①から すーっと！")}${actions()}`;
}
function setupDrawing(callbacks) {
  const canvas = document.querySelector("#drawing"),
    ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 800;
  ctx.scale(2, 2);
  ctx.strokeStyle = "#d88882";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  let active = null,
    previous = null,
    stroke = [];
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * 400) / r.width,
      y: ((e.clientY - r.top) * 400) / r.height,
    };
  };
  canvas.onpointerdown = (e) => {
    if (complete || active !== null) return;
    e.preventDefault();
    active = e.pointerId;
    canvas.setPointerCapture(active);
    previous = point(e);
    stroke = [previous];
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    callbacks.start?.(previous);
  };
  canvas.onpointermove = (e) => {
    if (active !== e.pointerId) return;
    e.preventDefault();
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    stroke.push(p);
    callbacks.move?.(p, previous);
    previous = p;
  };
  function finish(e, cancelled = false) {
    if (active !== e.pointerId) return;
    active = null;
    previous = null;
    callbacks.end?.(stroke, cancelled);
  }
  canvas.onpointerup = (e) => finish(e);
  canvas.onpointercancel = (e) => finish(e, true);
  canvas.onlostpointercapture = (e) => finish(e, true);
  return {
    clear() {
      ctx.clearRect(0, 0, 400, 400);
    },
    canvas,
    ctx,
  };
}
function bindTrace() {
  document.querySelectorAll("[data-trace]").forEach((b) =>
    activate(b, () => {
      traceLetter = b.dataset.trace;
      tone();
      go("play");
      speak(traceLetter);
    }),
  );
  const path = document.querySelector(".trace-guide"),
    len = path.getTotalLength();
  const samples = Array.from({ length: 81 }, (_, i) =>
    path.getPointAtLength((len * i) / 80),
  );
  let progress = 0,
    started = false,
    onPath = 0,
    total = 0,
    valid = false;
  const drawing = setupDrawing({
    start(p) {
      valid = Math.hypot(p.x - samples[0].x, p.y - samples[0].y) < 47;
      started = valid;
      progress = 0;
      onPath = 0;
      total = 0;
      drawing.clear();
      sayFeedback(
        valid ? "いいね、そのまま！" : "①から はじめてみよう",
        valid ? "happy" : "think",
      );
      tone();
    },
    move(p) {
      if (!started) return;
      total++;
      let best = Infinity,
        index = 0;
      samples.forEach((s, i) => {
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (d < best) {
          best = d;
          index = i;
        }
      });
      if (best < 43) {
        onPath++;
        if (index <= progress + 12 && index >= progress - 7)
          progress = Math.max(index, progress);
      }
      if (total % 10 === 0 && progress < 72)
        sayFeedback(
          best < 43 ? "すーっと、いいかんじ！" : "うすい せんに もどってみよう",
          best < 43 ? "happy" : "think",
        );
    },
    end(_, cancelled) {
      if (cancelled) {
        sayFeedback("もういちど なぞってみよう");
        return;
      }
      if (valid && progress >= 73 && total >= 12 && onPath / total > 0.78) {
        document.querySelector("#draw-board").classList.add("success");
        win(traceLetter, "じょうず！");
      } else {
        sayFeedback(valid ? "さいごまで なぞってみよう" : "①から もういちど！");
        tone();
      }
    },
  });
}
const roadTypes = {
  H: "M0 50H100",
  V: "M50 0V100",
  LD: "M0 50H50V100",
  T: "M0 50H100M50 50V100",
};
function road(type) {
  return svg(
    `<path d="${roadTypes[type]}" fill="none" stroke="#adc48b" stroke-width="39" stroke-linejoin="round"/><path d="${roadTypes[type]}" fill="none" stroke="#fff6d8" stroke-width="26" stroke-linejoin="round"/><path d="${roadTypes[type]}" fill="none" stroke="#d2bf89" stroke-width="2" stroke-dasharray="5 8"/>`,
  );
}
const goals = ["あ", "く", "ほ", "し", "つ", "へ"];
function pathView() {
  const c = goals[pathRound % goals.length];
  return `<div class="instruction"><h1 class="task-title">${words[c]}まで つなごう</h1></div><div class="path-layout"><div class="puzzle-grid" id="puzzle-grid">${Array.from({ length: 9 }, (_, i) => (i === 0 ? `<div class="path-cell">${road("H")}<span class="token">${c}</span></div>` : i === 8 ? `<div class="path-cell destination">${picture(c)}</div>` : [1, 2, 5].includes(i) ? `<button class="path-cell empty" data-slot="${i}" aria-label="みちをおく ${i === 1 ? "よこ" : i === 2 ? "まがり" : "たて"}"></button>` : `<div class="path-cell decoration">${svg('<path d="M30 70l5-16m10 19 7-18m10 18 5-16" stroke="#c3d3a7" stroke-width="4" stroke-linecap="round"/>')}</div>`)).join("")}</div><div class="path-palette"><small>みちの パーツ</small>${["H", "LD", "V", "T"].map((t, i) => `<button data-piece="${t}" aria-label="${["よこみち", "まがりみち", "たてみち", "わかれみち"][i]}">${road(t)}</button>`).join("")}</div></div>${feedback("みちを はこんでね")}${actions()}<div class="actions"><button class="secondary" id="another-path">ちがう もじ</button></div>`;
}
function bindPath() {
  let selected = null,
    done = new Set(),
    drag = null;
  const expected = { 1: "H", 2: "LD", 5: "V" },
    thisGeneration = generation;
  function select(type) {
    selected = type;
    document
      .querySelectorAll("[data-piece]")
      .forEach((b) => b.classList.toggle("selected", b.dataset.piece === type));
  }
  function place(slot, type) {
    if (complete || done.has(Number(slot.dataset.slot))) return;
    if (type === expected[slot.dataset.slot]) {
      slot.innerHTML = road(type);
      slot.classList.remove("empty");
      slot.setAttribute("aria-label", "みち できた");
      done.add(Number(slot.dataset.slot));
      tone();
      sayFeedback("つながった！", "happy");
      if (done.size === 3) {
        complete = true;
        const c = goals[pathRound % goals.length];
        const token = document.createElement("div");
        token.className = "moving-token";
        token.textContent = c;
        document.querySelector("#puzzle-grid").append(token);
        document.querySelector(".token").style.visibility = "hidden";
        let i = 0;
        const points = [
          [39, 9],
          [70, 9],
          [70, 39],
          [70, 70],
        ];
        const travel = () => {
          if (generation !== thisGeneration) return;
          if (i < points.length) {
            token.style.left = points[i][0] + "%";
            token.style.top = points[i][1] + "%";
            i++;
            setTimeout(travel, 320);
          } else {
            complete = false;
            win(c, `${c}、${words[c]}！`);
          }
        };
        requestAnimationFrame(() => setTimeout(travel, 60));
      }
    } else {
      slot.classList.remove("wiggle");
      void slot.offsetWidth;
      slot.classList.add("wiggle");
      tone();
      sayFeedback("べつの みちも ためそう");
    }
  }
  document.querySelectorAll("[data-slot]").forEach(
    (slot) =>
      (slot.onclick = () => {
        if (selected) place(slot, selected);
        else {
          tone();
          sayFeedback("みちを さわって、ここに おこう");
        }
      }),
  );
  document.querySelectorAll("[data-piece]").forEach((b) => {
    b.onclick = (e) => {
      // Pointer release already handles selecting and dragging this piece.
      if (e.detail !== 0) return;
      select(b.dataset.piece);
      tone();
      sayFeedback("あいている ところに おこう");
    };
    b.onpointerdown = (e) => {
      if (complete) return;
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      select(b.dataset.piece);
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        type: b.dataset.piece,
      };
    };
    b.onpointermove = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6)
        drag.moved = true;
      if (!drag.moved) return;
      let ghost = document.querySelector(".drag-ghost");
      if (!ghost) {
        ghost = document.createElement("div");
        ghost.className = "drag-ghost";
        ghost.innerHTML = road(drag.type);
        document.body.append(ghost);
      }
      ghost.style.left = e.clientX - 37 + "px";
      ghost.style.top = e.clientY - 37 + "px";
      document.querySelectorAll("[data-slot]").forEach((s) => {
        const r = s.getBoundingClientRect();
        s.classList.toggle(
          "over",
          e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom,
        );
      });
    };
    b.onpointerup = (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const type = drag.type,
        moved = drag.moved;
      drag = null;
      document.querySelector(".drag-ghost")?.remove();
      document
        .querySelectorAll(".over")
        .forEach((s) => s.classList.remove("over"));
      if (moved) {
        const slot = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("[data-slot]");
        if (slot) place(slot, type);
        else {
          tone();
          sayFeedback("あいている みちに おこう");
        }
      } else {
        tone();
        sayFeedback("みちを はこんでね");
      }
    };
    b.onpointercancel = () => {
      drag = null;
      document.querySelector(".drag-ghost")?.remove();
      document
        .querySelectorAll(".over")
        .forEach((s) => s.classList.remove("over"));
      sayFeedback("もういちど はこんでね");
    };
  });
  document.querySelector("#another-path").onclick = () => {
    pathRound++;
    tone();
    go("play");
  };
}
function writeView() {
  return `<div class="instruction"><h1 class="task-title">「ほ」を かいてみよう</h1></div><div class="drawing-layout"><div class="write-sample"><small>おてほん</small><button class="sample-char" id="sample" aria-label="ほ をよむ">ほ</button></div><div class="draw-board" id="draw-board"><canvas id="drawing" aria-label="ほを自由にかくキャンバス"></canvas><div class="ink-creature" aria-hidden="true"></div></div></div>${feedback("ゆびで かいてみよう！")}${actions()}<div class="actions"><button class="primary" id="finish-writing">かけた！ ${icon("arrow")}</button></div>`;
}
function bindWrite() {
  let strokes = 0,
    totalLength = 0,
    points = [],
    beginnings = [],
    cancelled = false;
  document.querySelector("#sample").onclick = () => {
    tone();
    speak("ほ");
    sayFeedback("ほ、かいてみよう！", "happy");
  };
  setupDrawing({
    start(p) {
      beginnings.push(p);
      tone();
      cancelled = false;
    },
    move(p, prev) {
      const d = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (d < 100) totalLength += d;
      points.push(p);
    },
    end(stroke, wasCancelled) {
      cancelled = wasCancelled;
      if (!wasCancelled && stroke.length > 2) strokes++;
      if (!wasCancelled)
        sayFeedback(
          strokes < 3 ? "いいね！ つづけて かこう" : "かけたら ボタンを おそう",
          "happy",
        );
      else sayFeedback("つづけて かいてみよう");
    },
  });
  activate(document.querySelector("#finish-writing"), () => {
    if (complete) return;
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y);
    const width = xs.length ? Math.max(...xs) - Math.min(...xs) : 0,
      height = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
    const cells = new Set(
      points
        .filter((p) => p.x > 25 && p.x < 375 && p.y > 25 && p.y < 375)
        .map((p) => `${Math.floor(p.x / 100)},${Math.floor(p.y / 100)}`),
    );
    const leftStart = beginnings.some(
      (p) => p.x < 180 && p.y < 230 && p.y > 15,
    );
    if (
      !cancelled &&
      strokes >= 3 &&
      totalLength >= 450 &&
      width >= 135 &&
      height >= 170 &&
      cells.size >= 5 &&
      leftStart
    ) {
      document.querySelector("#draw-board").classList.add("success", "alive");
      document.querySelector("#finish-writing").hidden = true;
      win("ほ", "わあ！ もじが うごいた！");
    } else {
      tone();
      sayFeedback("もうすこし おおきく かいてみよう");
    }
  });
}
function bindBook() {
  document.querySelectorAll("[data-letter]").forEach(
    (b) =>
      (b.onclick = () => {
        const c = b.dataset.letter;
        if (!data.played.includes(c)) {
          tone();
          sayFeedback("あそぶと もじが ひらくよ");
          b.classList.remove("wiggle");
          void b.offsetWidth;
          b.classList.add("wiggle");
          return;
        }
        tone();
        speak(`${c}、${words[c]}`);
        document.querySelector("#book-detail").innerHTML =
          `<div class="book-detail">${picture(c)}<h2>${c}・${words[c]}</h2><p>せんが じゅんばんに うごくよ</p>${guide(c, true)}<button class="secondary" id="hear">もういちど ${icon("sound")}</button></div>`;
        document.querySelector("#hear").onclick = () => {
          speak(`${c}、${words[c]}`);
          const s = document.querySelector(".stroke-preview");
          const clone = s.cloneNode(true);
          s.replaceWith(clone);
        };
      }),
  );
}
go("home");
