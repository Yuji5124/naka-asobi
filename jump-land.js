import { PRIZES } from "./extras.js";

const courses = [
  { path: "M92 404 C92 340 150 326 200 350 C248 375 232 420 292 420 C354 420 350 350 410 350 C472 350 466 418 528 418 C594 418 592 316 666 310 C735 304 744 365 816 350", start: [92,404], prize: [816,350], islands: [[105,446,.9],[290,458,1],[485,454,.9],[685,385,1],[815,392,.8]] },
  { path: "M88 384 C152 384 150 306 218 306 C286 306 275 426 350 426 C425 426 406 330 480 330 C550 330 552 420 618 420 C684 420 674 286 748 284 C790 282 800 326 828 326", start: [88,384], prize: [828,326], islands: [[110,430,.85],[225,354,1],[360,463,.95],[490,377,.95],[630,452,1],[760,330,.9],[830,378,.8]] },
  { path: "M82 426 C122 426 124 332 188 332 C252 332 220 430 294 430 C368 430 346 292 430 292 C514 292 486 428 560 428 C634 428 604 330 682 330 C760 330 752 390 830 372", start: [82,426], prize: [830,372], islands: [[92,470,.8],[190,378,.95],[300,470,.9],[430,336,1],[565,468,.9],[686,374,1],[832,420,.8]] },
];
const treasureIds = ["rainbow-seed", "star-pebble", "cloud-lantern"];

function island([x, y, scale], i) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-78 2 0 82 77 1 54 47-50 47Z" fill="#bd6846"/><path d="M-81 2Q-72-27-45-22Q-26-56 2-31Q33-52 47-22Q76-30 83 3Q48 19 0 14Q-42 19-81 2Z" fill="#70b957"/><path d="M-65 3Q-20 20 4 10T66 2" fill="none" stroke="#9bd66c" stroke-width="8" stroke-linecap="round"/><g fill="${i%2 ? "#f3cc58" : "#f48b9f"}"><circle cx="-37" cy="-8" r="7"/><circle cx="-28" cy="-12" r="7"/><circle cx="-33" cy="-20" r="7"/><circle cx="-33" cy="-12" r="4" fill="#fff0a2"/></g><path d="M28 0v-27m-6 10q6-17 13-3" stroke="#438e50" stroke-width="6" stroke-linecap="round" fill="none"/></g>`;
}

export function jumpLandView(stage) {
  const course = courses[(stage - 1) % courses.length];
  const treasure = PRIZES.find((prize) => prize.id === treasureIds[(stage - 1) % treasureIds.length]) || PRIZES[0];
  const islands = course.islands.map(island).join("");
  return `<main class="jump-screen"><div class="stage-top"><button class="back" data-go="trace-menu" aria-label="なぞるを えらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n===stage?"active":n<stage?"done":""}"></span>`).join("")}</div><span class="stage-label">ぴょんぴょん · ${stage}/3</span></div><h1 class="screen-title">ぴょんぴょんランド</h1><p class="jump-instruction" id="jump-instruction">ゆびで ピンクの みちを なぞろう！</p><div class="jump-board" id="jump-board"><svg id="jump-svg" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid meet" aria-label="島から島へピンクの道を指でなぞって、宝物へ進もう"><defs><linearGradient id="jump-sea" x2="0" y2="1"><stop stop-color="#62c5e9"/><stop offset="1" stop-color="#328dbb"/></linearGradient></defs><rect width="900" height="560" fill="url(#jump-sea)"/><path d="M0 115Q80 80 160 115T320 115T480 115T640 115T800 115T960 115M-20 250Q65 215 150 250T320 250T490 250T660 250T830 250T1000 250M-30 520Q50 485 130 520T290 520T450 520T610 520T770 520T930 520" fill="none" stroke="#a9e7ec" stroke-width="10" stroke-linecap="round" opacity=".68"/>${islands}<path id="jump-route-guide" d="${course.path}" fill="none" stroke="#fff2df" stroke-width="82" stroke-linecap="round" stroke-linejoin="round"/><path d="${course.path}" fill="none" stroke="#e95694" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><path d="${course.path}" fill="none" stroke="#ffc2dc" stroke-width="5" stroke-dasharray="3 22" stroke-linecap="round" opacity=".9"/><path id="jump-ink" d="" fill="none" stroke="#fff27a" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><g class="jump-start"><circle cx="${course.start[0]}" cy="${course.start[1]}" r="36" fill="#fff2a8" stroke="#fff" stroke-width="7"/><text x="${course.start[0]}" y="${course.start[1]+14}" text-anchor="middle">⬆</text></g><text class="jump-treasure" x="${course.prize[0]}" y="${course.prize[1]-8}" text-anchor="middle">${treasure.icon}</text><text id="jump-friend" x="${course.start[0]-54}" y="${course.start[1]+12}" text-anchor="middle">🐻</text><g class="jump-cloud" aria-hidden="true"><path d="M38 76q-20-24 8-34 3-36 39-22 19-30 48 0 39-7 34 31 28 23-8 36H57q-31 0-19-11Z" fill="#fff9ef" opacity=".94"/><text x="104" y="65" text-anchor="middle">いっしょに いこう！</text></g></svg><div class="jump-sparkles" id="jump-sparkles" aria-hidden="true">✦　✧　✦</div></div><p class="jump-message" id="jump-message" role="status" aria-live="polite">はじまりの ↑ を さわってね</p><div class="jump-actions"><button class="secondary" id="jump-hint">✨ みちを みる</button><button class="secondary" id="jump-retry">もういちど</button><button class="primary" id="jump-next" hidden>つぎへ ›</button></div></main>`;
}

export function bindJumpLand({ stage, activate, tone, onMistake = () => {}, onSuccess, onNext }) {
  const svg = document.querySelector("#jump-svg");
  const guide = document.querySelector("#jump-route-guide");
  const ink = document.querySelector("#jump-ink");
  const friend = document.querySelector("#jump-friend");
  const message = document.querySelector("#jump-message");
  const instruction = document.querySelector("#jump-instruction");
  const treasure = PRIZES.find((prize) => prize.id === treasureIds[(stage - 1) % treasureIds.length]) || PRIZES[0];
  const samples = Array.from({ length: 241 }, (_, i) => guide.getPointAtLength(guide.getTotalLength() * i / 240));
  let progress = 0;
  let pointer = null;
  let complete = false;
  let hasStarted = false;
  let points = [];

  function pointFromEvent(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }
  function setFriend(index) {
    const point = samples[index];
    friend.setAttribute("x", point.x - (index === 0 ? 54 : 0));
    friend.setAttribute("y", point.y + 14);
  }
  function onMove(event) {
    if (event.pointerId !== pointer || complete) return;
    event.preventDefault();
    const current = pointFromEvent(event);
    let nearest = progress;
    let distance = Infinity;
    for (let i = progress; i <= Math.min(samples.length - 1, progress + 18); i++) {
      const d = Math.hypot(current.x - samples[i].x, current.y - samples[i].y);
      if (d < distance) { nearest = i; distance = d; }
    }
    if (distance > 62) {
      message.textContent = "ピンクの みちを たどってね！";
      return;
    }
    progress = nearest;
    points.push(current);
    ink.setAttribute("d", points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "));
    setFriend(progress);
    const percent = Math.floor(progress / 240 * 100);
    message.textContent = percent >= 98 ? "たからもの まで あと すこし！" : `いいね！ ${percent}% すすんだよ`;
    if (progress >= 238) finish();
  }
  function onDown(event) {
    if (complete || pointer !== null) return;
    const current = pointFromEvent(event);
    if (!hasStarted) {
      if (Math.hypot(current.x - samples[0].x, current.y - samples[0].y) > 72) {
        message.textContent = "はじまりの ↑ から すすもう！";
        return;
      }
      hasStarted = true;
      instruction.textContent = "そのまま みちを たどってね！";
      message.textContent = "くまさん、しゅっぱつ！";
      tone();
    } else if (Math.hypot(current.x - samples[progress].x, current.y - samples[progress].y) > 72) return;
    pointer = event.pointerId;
    svg.setPointerCapture(pointer);
    onMove(event);
  }
  function onUp(event) {
    if (event.pointerId === pointer) {
      pointer = null;
      message.textContent = complete ? message.textContent : "ゆびを はなしても だいじょうぶ。つづきから なぞれるよ";
    }
  }
  function finish() {
    complete = true;
    pointer = null;
    progress = 240;
    setFriend(progress);
    instruction.textContent = "たからものを みつけた！";
    message.textContent = `${treasure.name}を みつけた！`;
    document.querySelector(".jump-screen").classList.add("jump-complete");
    tone(true);
    const last = onSuccess(treasure.id);
    if (!last) document.querySelector("#jump-next").hidden = false;
  }
  function reset() {
    if (complete) return;
    pointer = null;
    progress = 0;
    hasStarted = false;
    points = [];
    ink.setAttribute("d", "");
    document.querySelector(".jump-screen").classList.remove("jump-hint");
    setFriend(0);
    instruction.textContent = "ゆびで ピンクの みちを なぞろう！";
    message.textContent = "はじまりの ↑ を さわってね";
    tone();
  }
  const hint = document.querySelector("#jump-hint");
  activate(hint, () => {
    if (complete) return;
    document.querySelector(".jump-screen").classList.add("jump-hint");
    message.textContent = "ピンクの みちを たどれば だいじょうぶ！";
    tone("bell");
    setTimeout(() => document.querySelector(".jump-screen")?.classList.remove("jump-hint"), 1200);
  });
  activate(document.querySelector("#jump-retry"), reset);
  activate(document.querySelector("#jump-next"), () => onNext(stage));
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
  return () => {
    svg.removeEventListener("pointerdown", onDown);
    svg.removeEventListener("pointermove", onMove);
    svg.removeEventListener("pointerup", onUp);
    svg.removeEventListener("pointercancel", onUp);
  };
}
