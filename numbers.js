const DIGITS = [
  "M145 90 L220 55 L220 335",
  "M105 130 C110 45 275 45 290 130 C300 185 245 220 190 260 L105 325 H305",
  "M105 100 C255 35 300 130 195 188 C315 180 315 340 105 300",
  "M250 335 V60 L95 230 H315",
  "M285 65 H135 L125 175 C245 120 310 210 280 285 C250 360 150 350 105 300",
  "M275 85 C160 45 105 165 110 260 C115 355 270 360 292 272 C315 180 170 165 120 238",
  "M95 75 H310 L165 335",
  "M200 195 C75 170 80 70 200 70 C320 70 320 170 200 195 C75 220 80 330 200 330 C320 330 320 220 200 195",
  "M275 220 C240 305 100 280 105 170 C110 70 260 45 290 130 C325 230 230 340 125 320",
];
const REWARDS = ["🚀", "🚃", "🎈", "🐸", "⭐", "🐟", "🍎", "🌼", "🦋"];
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const progress = (stage) => `<div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div>`;

function objects(items, moving = false) {
  return `<div class="number-objects ${moving ? "moving" : ""}" aria-label="${items.length}こ">${items.map((item, i) => `<span style="--i:${i}">${item}</span>`).join("")}</div>`;
}
function task(level, stage) {
  if (level === 1 && stage === 1) return { prompt: "3は どれ？", choices: ["1","3","5"], answer: "3", rewardIcon:"🎈" };
  if (level === 1 && stage === 2) return { prompt: "4は どれ？", choices: ["6","2","4"], answer: "4", rewardIcon:"🎈" };
  if (level === 1) return { prompt: "りんごは いくつ？", art: objects(["🍎","🍎","🍎","🍎"]), choices: ["3","4","5"], answer: "4", rewardIcon:"🍎" };
  if (level === 2 && stage === 1) return { prompt: "りんごは いくつ？", art: objects(["🍎","🍎","🍎"]), choices: ["2","3","4"], answer: "3", rewardIcon:"🍎" };
  if (level === 2 && stage === 2) return { prompt: "くるまは なんだい？", art: objects(["🚗","🚙","🚕","🚗","🚙"]), choices: ["4","5","6"], answer: "5", rewardIcon:"🚙" };
  return { prompt: "およぐ さかなは なんびき？", art: objects(["🐟","🐠","🐟","🐠"], true), choices: ["3","4","5"], answer: "4", rewardIcon:"🐟" };
}
export function numberLevelView() {
  const names = ["みつける", "かぞえる", "かいてみる"];
  const art = ["🔎 123", "🍎 🍎 🍎", "✍️ 4"];
  return `<main class="stage-menu number-level-menu"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><span class="stage-label">すうじ</span></div><h1 class="screen-title">どんな すうじあそび？</h1><div class="stage-choice-grid">${names.map((name, i) => `<button class="stage-card number-level-card" data-level="${i + 1}" data-level-game="number"><span class="number-level-art" aria-hidden="true">${art[i]}</span><span><strong>レベル ${i + 1}</strong><small>${name} · 3ステージ</small></span></button>`).join("")}</div></main>`;
}
export function numberView(level, stage, digitIndex, feedback) {
  const digit = digitIndex % 9 + 1;
  const names = ["", "すうじを みつける", "かぞえる", "すうじを かく"];
  const header = `<div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button>${progress(stage)}<span class="stage-label">レベル ${level} · ステージ ${stage}</span></div>`;
  if (level < 3) {
    const t = task(level, stage);
    return `<main class="number-screen"><div class="number-top">${header}</div><h1 class="screen-title">${names[level]}</h1><h2 class="number-prompt">${t.prompt}</h2>${t.art || ""}<div class="number-choices">${t.choices.map((n, i) => `<button class="number-choice" data-number-choice="${n}" style="--i:${i}">${n}</button>`).join("")}</div><div class="number-reaction" id="number-reaction" aria-live="polite"></div>${feedback("えらんで みよう！")}<button class="primary number-next" id="number-next" hidden>つぎへ ›</button></main>`;
  }
  const path = DIGITS[digit - 1];
  return `<main class="number-screen number-draw-screen"><div class="number-top">${header}</div><h1 class="screen-title">すうじ「${digit}」を かこう</h1><p class="number-instruction">●から なぞってみよう</p><div class="number-draw-layout"><div class="number-example"><small>おてほん</small><strong>${digit}</strong></div><div class="number-drawing" id="number-drawing"><svg id="number-guide" viewBox="0 0 400 400" aria-label="${digit}のうすい おてほん"><path id="number-guide-path" d="${path}" pathLength="1000"/><circle id="number-start" r="20"/></svg><canvas id="number-canvas" aria-label="すうじをゆびでかく"></canvas></div></div><div class="number-reaction" id="number-reaction"></div>${feedback("ゆびで すうじを かこう！")}<div class="number-actions"><button class="secondary" id="number-retry">もういちど</button><button class="primary" id="number-check">できた！</button><button class="primary number-next" id="number-next" hidden>つぎへ ›</button></div></main>`;
}
export function bindNumbers({ level, stage, digitIndex, activate, tone, message, onSuccess, onNext, onMistake = () => {} }) {
  let done = false;
  const succeed = (answer, rewardIcon = REWARDS[(Number(answer)-1)%REWARDS.length]) => {
    if (done) return;
    done = true;
    tone(true);
    message("できた！", "happy");
    const reaction = document.querySelector("#number-reaction");
    const amount = Number(answer) || digitIndex % 9 + 1;
    reaction.innerHTML = `<div class="number-result">${Array.from({length:amount},(_,i)=>`<span style="--i:${i}">${escape(rewardIcon)}</span>`).join("")}</div><strong class="number-pop">${answer}</strong>`;
    reaction.classList.add("show");
    const last = onSuccess();
    if (!last) document.querySelector("#number-next").hidden = false;
    else document.querySelector("#number-next")?.remove();
  };
  if (level < 3) {
    const t = task(level, stage);
    document.querySelectorAll("[data-number-choice]").forEach((b) => activate(b, () => {
      if (done) return;
      if (b.dataset.numberChoice === t.answer) {
        b.classList.add("correct");
        succeed(t.answer, t.rewardIcon);
      } else {
        b.classList.add("number-wiggle");
        setTimeout(() => b.classList.remove("number-wiggle"), 380);
        tone(); message("おしい！ もういちど えらぼう"); onMistake();
      }
    }));
  } else {
    const digit = digitIndex % 9 + 1,
      svg = document.querySelector("#number-guide"),
      path = document.querySelector("#number-guide-path"),
      canvas = document.querySelector("#number-canvas"),
      ctx = canvas.getContext("2d"),
      rect = () => canvas.getBoundingClientRect();
    canvas.width = 800; canvas.height = 800; ctx.scale(2,2);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 24; ctx.strokeStyle = "#f27891";
    const start = path.getPointAtLength(0); document.querySelector("#number-start").setAttribute("cx",start.x); document.querySelector("#number-start").setAttribute("cy",start.y);
    let active = null, points = [], length = 0, previous = null, validStart = false;
    const pos = (e) => { const r = rect(); return {x:(e.clientX-r.left)*400/r.width,y:(e.clientY-r.top)*400/r.height}; };
    canvas.onpointerdown = (e) => {
      if (done || active !== null) return;
      e.preventDefault(); active=e.pointerId; canvas.setPointerCapture(active);
      previous=pos(e); points=[previous]; length=0;
      validStart=Math.hypot(previous.x-start.x,previous.y-start.y)<72;
      ctx.beginPath(); ctx.moveTo(previous.x,previous.y); tone();
    };
    canvas.onpointermove = (e) => {
      if (active !== e.pointerId) return;
      e.preventDefault(); const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke();
      length += Math.hypot(p.x-previous.x,p.y-previous.y); points.push(p); previous=p;
    };
    const end = (e) => { if(active===e.pointerId) { active=null; previous=null; } };
    canvas.onpointerup=end; canvas.onpointercancel=end; canvas.onlostpointercapture=end;
    activate(document.querySelector("#number-check"), () => {
      if (done) return;
      const checkpoints=[.2,.4,.6,.8,1].map((n)=>path.getPointAtLength(path.getTotalLength()*n));
      const covered=checkpoints.filter((p)=>points.some((q)=>Math.hypot(q.x-p.x,q.y-p.y)<76)).length;
      if(validStart && length>100 && covered>=3) {
        succeed(digit);
      } else {
        message(validStart ? "もうすこし なぞってみよう" : "ひかる まるから はじめよう"); tone(); onMistake();
      }
    });
    activate(document.querySelector("#number-retry"), () => {
      points=[]; length=0; validStart=false; ctx.clearRect(0,0,400,400); message("●から なぞってね"); tone();
    });
  }
  activate(document.querySelector("#number-next"), () => { if (!done) return; tone(); onNext(); });
}
