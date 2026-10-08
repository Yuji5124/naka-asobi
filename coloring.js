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

export function coloringView(stage) {
  const round = rounds[stage] || rounds[1];
  return `<main class="coloring-screen">
    <div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">いろぬり · ステージ ${stage}</span></div>
    <h1 class="screen-title">${round.title}</h1>
    <p class="screen-note">いろを えらんで、かたちを タッチ！</p>
    <div class="coloring-palette" role="group" aria-label="ぬる いろ">${round.colors.map((id, i) => { const c = palette.find((color) => color.id === id); return `<button class="color-swatch ${i === 0 ? "selected" : ""}" data-color="${c.id}" style="--paint:${c.color}" aria-label="${c.name}" aria-pressed="${i === 0}"><span>${c.mark}</span><small>${c.name}</small></button>`; }).join("")}</div>
    <div class="coloring-board">${round.shapes.map((shape, i) => `<button class="paint-shape" data-shape="${shape}" aria-label="${shapeNames[shape]}を ぬる">${shapeSvg(shape, "#fffdf5")}<small>${shapeNames[shape]}</small></button>`).join("")}</div>
    <div class="coloring-message" id="coloring-message" role="status" aria-live="polite">いろを えらんで ぬってみよう！</div>
    <div class="coloring-actions"><button class="secondary" id="coloring-retry">もういちど</button><button class="primary" id="coloring-next" hidden>${stage === 3 ? "あそびに もどる" : "つぎの ステージへ →"}</button></div>
  </main>`;
}

export function bindColoring({ stage, activate, tone, onSuccess, onNext, onRetry }) {
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
