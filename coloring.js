const palette = [
  { id: "coral", name: "あか", color: "#f27b82", mark: "●" },
  { id: "blue", name: "あお", color: "#55b8e5", mark: "●" },
  { id: "yellow", name: "きいろ", color: "#f5c84c", mark: "●" },
];

const rounds = {
  1: { title: "まるを ぬろう", shapes: ["circle"], colors: ["coral"] },
  2: { title: "2つの かたちを ぬろう", shapes: ["square", "circle"], colors: ["coral", "blue"] },
  3: { title: "3つの かたちを ぬろう", shapes: ["square", "triangle", "circle"], colors: ["coral", "blue", "yellow"] },
};

const shapeNames = { square: "しかく", triangle: "さんかく", circle: "まる" };

function shapeSvg(shape, fill) {
  const geometry = {
    square: '<rect x="15" y="15" width="70" height="70" rx="12" />',
    triangle: '<path d="M50 12 91 84H9Z" />',
    circle: '<circle cx="50" cy="50" r="38" />',
  }[shape];
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${fill}" stroke="#8c704b" stroke-width="5" stroke-linejoin="round">${geometry}</g></svg>`;
}

export function coloringLevelView() {
  return `<main class="stage-menu coloring-levels"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><span class="stage-label">いろぬり</span></div><h1 class="screen-title">どうやって ぬる？</h1><div class="stage-choice-grid">${[1,2].map((level) => `<button class="stage-card" data-level-game="coloring" data-level="${level}"><div class="coloring-level-art" aria-hidden="true">${level === 1 ? "👆 ●" : "🖍️ ◯"}</div><span><strong>レベル ${level}</strong><small>${level === 1 ? "タッチで ぬる" : "ペンで ぐりぐり"} · 3ステージ</small></span></button>`).join("")}</div></main>`;
}

export function coloringView(stage, level = 1) {
  if (level === 2) return freePaintView(stage);
  const round = rounds[stage] || rounds[1];
  return `<main class="coloring-screen">
    <div class="stage-top"><button class="back" data-go="coloring-levels" aria-label="レベルをえらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">いろぬり · レベル ${level} · ${stage}/3</span></div>
    <h1 class="screen-title">${round.title}</h1>
    <p class="screen-note">いろを えらんで、かたちを タッチ！</p>
    <div class="coloring-palette" role="group" aria-label="ぬる いろ">${round.colors.map((id, i) => { const c = palette.find((color) => color.id === id); return `<button class="color-swatch ${i === 0 ? "selected" : ""}" data-color="${c.id}" style="--paint:${c.color}" aria-label="${c.name}" aria-pressed="${i === 0}"><span>${c.mark}</span><small>${c.name}</small></button>`; }).join("")}</div>
    <div class="coloring-board">${round.shapes.map((shape, i) => `<button class="paint-shape" data-shape="${shape}" aria-label="${shapeNames[shape]}を ぬる">${shapeSvg(shape, "#fffdf5")}<small>${shapeNames[shape]}</small></button>`).join("")}</div>
    <div class="coloring-message" id="coloring-message" role="status" aria-live="polite">いろを えらんで ぬってみよう！</div>
    <div class="coloring-actions"><button class="secondary" id="coloring-retry">もういちど</button><button class="primary" id="coloring-next" hidden>${stage === 3 ? "あそびに もどる" : "つぎの ステージへ →"}</button></div>
  </main>`;
}

export function bindColoring(options) {
  if (options.level === 2) return bindFreePaint(options);
  const { stage, activate, tone, onSuccess, onNext, onRetry } = options;
  const round = rounds[stage] || rounds[1];
  const selected = round.colors[0];
  let activeColor = selected;
  let complete = false;
  const painted = new Map();
  const message = document.querySelector("#coloring-message");

  document.querySelectorAll(".color-swatch").forEach((button) => activate(button, () => {
    if (complete) return;
    activeColor = button.dataset.color;
    document.querySelectorAll(".color-swatch").forEach((swatch) => {
      const isSelected = swatch === button;
      swatch.classList.toggle("selected", isSelected);
      swatch.setAttribute("aria-pressed", String(isSelected));
    });
    message.textContent = `${palette.find((color) => color.id === activeColor).name}を えらんだよ。かたちを ぬろう！`;
    tone();
  }));

  document.querySelectorAll(".paint-shape").forEach((button) => activate(button, () => {
    if (complete) return;
    const shape = button.dataset.shape;
    painted.set(shape, activeColor);
    button.classList.add("painted");
    button.innerHTML = `${shapeSvg(shape, palette.find((color) => color.id === activeColor).color)}<small>${shapeNames[shape]}</small>`;
    tone(true);
    if (painted.size !== round.shapes.length || new Set(painted.values()).size !== round.colors.length) {
      message.textContent = painted.size === round.shapes.length ? "ちがう いろも つかってみよう！" : "いいね！ ほかの かたちも ぬろう！";
      return;
    }
    complete = true;
    message.textContent = "カラフルに ぬれたね！ できた！";
    document.querySelector("#coloring-retry").hidden = true;
    document.querySelector("#coloring-next").hidden = false;
    onSuccess();
  }));

  activate(document.querySelector("#coloring-retry"), onRetry);
  activate(document.querySelector("#coloring-next"), () => onNext(stage));
}

const freeShapes = [
  { name: "まる", path: "M350 200 A150 150 0 1 1 50 200 A150 150 0 1 1 350 200Z", inside: (x,y) => Math.hypot(x-200,y-200) < 140 },
  { name: "しかく", path: "M50 50H350V350H50Z", inside: (x,y) => x>60 && x<340 && y>60 && y<340 },
  { name: "さんかく", path: "M200 40L355 350H45Z", inside: (x,y) => y>60 && y<338 && Math.abs(x-200) < (y-40)/2-10 },
];

function freePaintView(stage) {
  const shape = freeShapes[stage - 1];
  return `<main class="coloring-screen freepaint-screen">
    <div class="stage-top"><button class="back" data-go="coloring-levels" aria-label="レベルをえらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">いろぬり · レベル2 · ${stage}/3</span></div>
    <h1 class="screen-title">${shape.name}を ぐりぐり ぬろう</h1>
    <p class="screen-note">ペンや ゆびを うごかして ぬってね</p>
    <div class="coloring-palette" role="group" aria-label="ぬる いろ">${palette.slice(0,stage).map((color,i) => `<button class="color-swatch ${i === 0 ? "selected" : ""}" data-color="${color.id}" style="--paint:${color.color}" aria-label="${color.name}" aria-pressed="${i === 0}"><span>●</span><small>${color.name}</small></button>`).join("")}</div>
    <div class="coloring-board freepaint-board"><div class="freepaint-area"><canvas id="freepaint-canvas" aria-label="${shape.name}にペンやゆびでいろをぬる"></canvas><svg viewBox="0 0 400 400" aria-hidden="true"><path d="${shape.path}" fill="none" stroke="#8c704b" stroke-width="6" stroke-linejoin="round"/></svg></div></div>
    <div class="freepaint-meter"><span>ぬれたよ</span><progress id="freepaint-progress" max="65" value="0" aria-label="ぬれたところ"></progress></div>
    <div class="coloring-message" id="coloring-message" role="status" aria-live="polite">ぐりぐり ぬってみよう！</div>
    <div class="coloring-actions"><button class="secondary" id="coloring-retry">けして もういちど</button><button class="primary" id="coloring-next" hidden>${stage === 3 ? "あそびに もどる" : "つぎへ →"}</button></div>
  </main>`;
}

function bindFreePaint({ stage, activate, tone, onSuccess, onNext, onRetry }) {
  const canvas = document.querySelector("#freepaint-canvas");
  const ctx = canvas.getContext("2d");
  const shape = freeShapes[stage - 1];
  const path = new Path2D(shape.path);
  canvas.width = canvas.height = 800;
  ctx.scale(2,2);
  ctx.fillStyle = "#fffdf5";
  ctx.fill(path);
  ctx.lineWidth = 44;
  ctx.lineCap = ctx.lineJoin = "round";
  let color = palette[0].color;
  let pointer = null;
  let previous = null;
  let complete = false;
  // Sample the shape interior to tolerate small unpainted gaps at the border.
  const samples = [];
  for (let y=10; y<400; y+=20) for (let x=10; x<400; x+=20)
    if (shape.inside(x,y)) samples.push({x,y});
  const covered = new Set();
  const message = document.querySelector("#coloring-message");
  const meter = document.querySelector("#freepaint-progress");
  const pos = (event) => {
    const r = canvas.getBoundingClientRect();
    return { x:(event.clientX-r.left)*400/r.width, y:(event.clientY-r.top)*400/r.height };
  };
  function paint(from, to) {
    ctx.save();
    ctx.clip(path);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(from.x,from.y); ctx.lineTo(to.x,to.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(to.x,to.y,22,0,Math.PI*2); ctx.fill();
    ctx.restore();
    const dx=to.x-from.x, dy=to.y-from.y, length=dx*dx+dy*dy;
    samples.forEach((point,index) => {
      if (covered.has(index)) return;
      const t = length ? Math.max(0,Math.min(1,((point.x-from.x)*dx+(point.y-from.y)*dy)/length)) : 0;
      if (Math.hypot(point.x-from.x-t*dx,point.y-from.y-t*dy)<=22) covered.add(index);
    });
    meter.value = Math.round(covered.size/samples.length*100);
  }
  function down(event) {
    if (complete || pointer !== null || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    canvas.setPointerCapture(pointer);
    previous = pos(event);
    paint(previous,previous);
    tone();
  }
  function move(event) {
    if (complete || event.pointerId !== pointer) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.();
    for (const pointEvent of events?.length ? events : [event]) {
      const point = pos(pointEvent);
      paint(previous,point); previous = point;
    }
  }
  function up(event) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    if (covered.size/samples.length >= .65 && !complete) {
      complete = true;
      message.textContent = "きれいに ぬれたね！ できた！";
      document.querySelector("#coloring-retry").hidden = true;
      document.querySelector("#coloring-next").hidden = false;
      onSuccess();
    } else message.textContent = meter.value >= 45 ? "あと すこし！ しろい ところを ぬろう" : "いいね！ しろい ところも ぬろう";
  }
  function cancel(event) { if (event.pointerId === pointer) pointer = null; }
  document.querySelectorAll(".color-swatch").forEach((button) => activate(button, () => {
    if (complete) return;
    color = palette.find((item) => item.id === button.dataset.color).color;
    document.querySelectorAll(".color-swatch").forEach((swatch) => {
      swatch.classList.toggle("selected",swatch === button);
      swatch.setAttribute("aria-pressed",String(swatch === button));
    });
    tone();
  }));
  activate(document.querySelector("#coloring-next"), () => onNext(stage));
  activate(document.querySelector("#coloring-retry"),onRetry);
  canvas.addEventListener("pointerdown",down);
  canvas.addEventListener("pointermove",move);
  canvas.addEventListener("pointerup",up);
  canvas.addEventListener("pointercancel",cancel);
  return () => {
    canvas.removeEventListener("pointerdown",down);
    canvas.removeEventListener("pointermove",move);
    canvas.removeEventListener("pointerup",up);
    canvas.removeEventListener("pointercancel",cancel);
  };
}
