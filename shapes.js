// Small orthographic 3D renderer: real cube coordinates, no external libraries.
const NAMES = { rotate: "まわす", build: "つむ", arrange: "ならべる" };
const COLORS = {
  gold: ["#ffe28b", "#f8bd56", "#da963c"],
  blue: ["#98e2f4", "#47b8e0", "#278fc1"],
  green: ["#d2eb90", "#98cc63", "#6da849"],
};
const MODELS = [
  [
    { x: 0, y: 0, z: 0, color: "gold" },
    { x: 1, y: 0, z: 0, color: "blue" },
    { x: 1, y: 1, z: 0, color: "gold" },
    { x: 1, y: 0, z: 1, color: "green" },
  ],
  [
    { x: 0, y: 0, z: 0, color: "green" },
    { x: 0, y: 1, z: 0, color: "gold" },
    { x: 1, y: 0, z: 0, color: "blue" },
    { x: 2, y: 0, z: 0, color: "gold" },
  ],
  [
    { x: 0, y: 0, z: 0, color: "blue" },
    { x: 1, y: 0, z: 0, color: "green" },
    { x: 0, y: 0, z: 1, color: "gold" },
    { x: 0, y: 1, z: 1, color: "gold" },
    { x: 0, y: 2, z: 1, color: "blue" },
  ],
];
MODELS.push([
  { x: 0, y: 0, z: 0, color: "blue" },
  { x: 0, y: 1, z: 0, color: "gold" },
  { x: 1, y: 0, z: 0, color: "blue" },
  { x: 1, y: 1, z: 0, color: "gold" },
  { x: 2, y: 0, z: 0, color: "green" },
  { x: 2, y: 1, z: 0, color: "gold" },
]);
const FLAT = [
  {
    name: "ロケット",
    cells: [
      { slot: 1, type: "triangle", color: "gold", turn: 0 },
      { slot: 4, type: "square", color: "blue", turn: 0 },
      { slot: 6, type: "triangle", color: "gold", turn: 3 },
      { slot: 7, type: "square", color: "blue", turn: 0 },
      { slot: 8, type: "triangle", color: "gold", turn: 1 },
    ],
  },
  {
    name: "おうち",
    cells: [
      { slot: 0, type: "triangle", color: "gold", turn: 0 },
      { slot: 1, type: "triangle", color: "gold", turn: 0 },
      { slot: 2, type: "triangle", color: "gold", turn: 0 },
      { slot: 3, type: "square", color: "blue", turn: 0 },
      { slot: 4, type: "square", color: "blue", turn: 0 },
      { slot: 5, type: "square", color: "blue", turn: 0 },
    ],
  },
  {
    name: "くるま",
    cells: [
      { slot: 1, type: "square", color: "blue", turn: 0 },
      { slot: 2, type: "triangle", color: "gold", turn: 1 },
      { slot: 3, type: "square", color: "blue", turn: 0 },
      { slot: 4, type: "square", color: "blue", turn: 0 },
      { slot: 5, type: "square", color: "blue", turn: 0 },
      { slot: 6, type: "circle", color: "pink", turn: 0 },
      { slot: 8, type: "circle", color: "pink", turn: 0 },
    ],
  },
];
FLAT.push({
  name: "ふね",
  cells: [
    { slot: 1, type: "triangle", color: "gold", turn: 0 },
    { slot: 4, type: "square", color: "blue", turn: 0 },
    { slot: 6, type: "triangle", color: "gold", turn: 2 },
    { slot: 7, type: "square", color: "blue", turn: 0 },
    { slot: 8, type: "triangle", color: "gold", turn: 2 },
  ],
});
const mod = (n) => ((n % 4) + 4) % 4;
function project(x, y, z, angle) {
  const a = (x - 1.5) * Math.cos(angle) - (z - 1.5) * Math.sin(angle);
  const b = (x - 1.5) * Math.sin(angle) + (z - 1.5) * Math.cos(angle);
  return [260 + (a - b) * 61, 300 + (a + b) * 30 - y * 63];
}
const points = (vertices, angle) =>
  vertices
    .map((v) =>
      project(...v, angle)
        .map((n) => n.toFixed(2))
        .join(","),
    )
    .join(" ");
function depth(c, angle) {
  return (
    (c.x + c.z - 2) * Math.cos(angle) +
    (c.x - c.z) * Math.sin(angle) +
    c.y * 0.01
  );
}
export function cubePicture(cubes, angle = 0, interactive = false) {
  const polygon = (v, fill, attrs = "") =>
    `<polygon points="${points(v, angle)}" fill="${fill}" stroke="#fff6df" stroke-width="1.8" stroke-linejoin="round" ${attrs}/>`;
  let body =
    '<ellipse cx="260" cy="348" rx="212" ry="59" fill="#c6ae7b" opacity=".15"/>';
  body += polygon(
    [
      [0, -0.14, 0],
      [3, -0.14, 0],
      [3, -0.14, 3],
      [0, -0.14, 3],
    ],
    "#d8bd87",
  );
  for (let x = 0; x < 3; x++)
    for (let z = 0; z < 3; z++)
      body += polygon(
        [
          [x, 0, z],
          [x + 1, 0, z],
          [x + 1, 0, z + 1],
          [x, 0, z + 1],
        ],
        (x + z) % 2 ? "#f7e9c8" : "#fff3d8",
        interactive
          ? `data-cell="${x},${z}" tabindex="0" role="button" aria-label="ます ${x + 1} ${z + 1}"`
          : "",
      );
  for (const c of [...cubes].sort(
    (a, b) => depth(a, angle) - depth(b, angle),
  )) {
    const { x, y, z, color } = c,
      colors = COLORS[color] || COLORS.gold;
    const attr = interactive
      ? `data-cell="${x},${z}" data-cube="${x},${y},${z}"`
      : "";
    const faces = [
      {
        normal: [1, 0],
        v: [
          [x + 1, y, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          [x + 1, y, z + 1],
        ],
      },
      {
        normal: [-1, 0],
        v: [
          [x, y, z + 1],
          [x, y + 1, z + 1],
          [x, y + 1, z],
          [x, y, z],
        ],
      },
      {
        normal: [0, 1],
        v: [
          [x + 1, y, z + 1],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
          [x, y, z + 1],
        ],
      },
      {
        normal: [0, -1],
        v: [
          [x, y, z],
          [x, y + 1, z],
          [x + 1, y + 1, z],
          [x + 1, y, z],
        ],
      },
    ];
    body += `<g ${attr}>`;
    for (const f of faces) {
      const [nx, nz] = f.normal,
        rx = nx * Math.cos(angle) - nz * Math.sin(angle),
        rz = nx * Math.sin(angle) + nz * Math.cos(angle);
      if (rx + rz > 0.001)
        body += polygon(f.v, rx - rz > 0 ? colors[2] : colors[1], attr);
    }
    body += polygon(
      [
        [x, y + 1, z],
        [x + 1, y + 1, z],
        [x + 1, y + 1, z + 1],
        [x, y + 1, z + 1],
      ],
      colors[0],
      attr,
    );
    body += "</g>";
  }
  if (interactive) {
    body += '<g fill="#fff" fill-opacity=".005" stroke="none" aria-label="ひろい おくばしょ">';
    for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) {
      const [cx, cy] = project(x + 0.5, 0, z + 0.5, angle);
      body += `<circle cx="${cx}" cy="${cy}" r="27" data-cell="${x},${z}" role="button" tabindex="0" aria-label="${x + 1}ばん ${z + 1}ばんに つみきを おく"/>`;
    }
    body += "</g>";
  }
  return `<svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" ${interactive ? 'aria-label="つみきをおく台。ますをタップして置けます"' : 'aria-hidden="true"'}>${body}</svg>`;
}
// Accept the same construction anywhere on the board, rather than grading its location.
export function sameConstruction(a, b) {
  const canonical = (cs) => {
    if (!cs.length) return "";
    const minX = Math.min(...cs.map((c) => c.x)),
      minZ = Math.min(...cs.map((c) => c.z));
    return cs
      .map((c) => `${c.x - minX},${c.y},${c.z - minZ},${c.color}`)
      .sort()
      .join("|");
  };
  return a.length === b.length && canonical(a) === canonical(b);
}
function flatPiece(type, color, turn = 0, muted = false) {
  const fill = muted
    ? "#eadfc7"
    : { gold: "#ffcd5b", blue: "#56badd", pink: "#f38caa" }[color];
  const shape =
    type === "square"
      ? '<rect x="12" y="12" width="76" height="76" rx="5"/>'
      : type === "circle"
        ? '<circle cx="50" cy="50" r="36"/>'
        : '<polygon points="8,87 92,87 50,13"/>';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${turn * 90} 50 50)" fill="${fill}" stroke="${muted ? "#d3bf98" : "#fff5d8"}" stroke-width="3" stroke-linejoin="round">${shape}</g></svg>`;
}
function cubeSwatch(color) {
  return cubePicture([{ x: 1, y: 0, z: 1, color }], 0).replace(
    'viewBox="0 0 520 420"',
    'viewBox="175 190 170 155"',
  );
}
export function shapeCardArt() {
  return `<div class="activity-art cube-card">${cubePicture(MODELS[0])}</div>`;
}
export function shapeSelection(friend) {
  return `<main class="shape-menu"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><span class="stage-label">かたち あそび</span></div><h1 class="screen-title">かたちで あそぼう！</h1><p class="screen-note">くるっと、ぽんっ。なにが できるかな？</p><div class="shape-mode-grid">${["rotate", "build", "arrange"].map((m, i) => `<button class="stage-card shape-mode" data-shape-mode="${m}">${i === 2 ? `<div class="flat-card">${flatPiece("square", "blue")}${flatPiece("triangle", "gold")}${flatPiece("circle", "pink")}</div>` : shapeCardArt()}<span><strong>${NAMES[m]}</strong><small>${["うしろは どう なってる？", "おてほんと おなじに つもう", "かたちを あわせよう"][i]}</small></span></button>`).join("")}</div><div class="select-friend"><div class="friend-mini">${friend()}</div>ためして、もういちど！</div></main>`;
}
export function shapeGameView(mode, feedback, stage = 1) {
  const title = {
    rotate: "おなじ むきに まわそう",
    build: "おてほんと おなじに つもう",
    arrange: "かたちを あわせよう",
  }[mode];
  return `<main class="shape-screen shape-game ${mode}"><div class="stage-top"><button class="back" data-go="shapes" aria-label="かたちをえらぶ">‹</button><span class="stage-label">かたち / ${NAMES[mode]} · ステージ ${stage}</span></div><h1 class="task-title">${title}</h1><div class="shape-reference"><span class="sample-label">おてほん</span><div id="shape-model"></div><span class="shape-round" id="shape-round"></span></div><div class="shape-work"><div id="shape-world" class="shape-world"></div><div class="rotation-controls" ${mode === "arrange" ? "hidden" : ""}><button class="rotate-button" id="turn-left" aria-label="ひだりにまわす"><b>↶</b><small>ひだりに まわす</small></button><span class="rotation-hint" id="rotation-direction">くるっと まわそう</span><button class="rotate-button" id="turn-right" aria-label="みぎにまわす"><b>↷</b><small>みぎに まわす</small></button></div><div class="shape-tray" id="shape-tray" ${mode === "rotate" ? "hidden" : ""}></div></div>${feedback(mode === "rotate" ? "うしろは どうかな？" : mode === "build" ? "つみきを はこんでね" : "かたちを はこんでね")}<div class="shape-actions"><button class="secondary" id="shape-retry">もういちど</button>${mode === "build" ? '<button class="secondary shape-undo" id="shape-undo">ひとつ もどす</button>' : ""}<button class="primary" id="shape-next" hidden>つぎへ →</button></div></main>`;
}
export function bindShapeGame({
  mode,
  activate,
  tone,
  message,
  onSuccess,
  onStage = () => {},
  startRound = 0,
}) {
  let round = startRound,
    cubes = [],
    placed = new Map(),
    selected = "gold",
    selectedFlat = "square",
    turn = 0,
    orientation = 0,
    angle = 0,
    solved = false,
    frame = 0,
    drag = null,
    alive = true;
  const world = document.querySelector("#shape-world"),
    model = document.querySelector("#shape-model"),
    tray = document.querySelector("#shape-tray");
  const baseAngle = 0;
  const modelCubes = () => MODELS[round % MODELS.length];
  const flatGoal = () => FLAT[round % FLAT.length];
  const targetOrientation = () => [1, 3, 2, 1][round % 4];
  function render() {
    if (!alive) return;
    if (mode === "arrange") {
      model.innerHTML = `<div class="flat-preview">${flatGoal()
        .cells.map(
          (c) =>
            `<div style="grid-area:${Math.floor(c.slot / 3) + 1}/${(c.slot % 3) + 1}">${flatPiece(c.type, c.color, c.turn)}</div>`,
        )
        .join("")}</div>`;
      world.innerHTML = `<div class="flat-board">${Array.from(
        { length: 9 },
        (_, slot) => {
          const goal = flatGoal().cells.find((c) => c.slot === slot),
            p = placed.get(slot);
          return goal
            ? `<button class="flat-slot ${p ? "filled" : ""}" data-flat-slot="${slot}" aria-label="かたちをおく ${slot + 1}" ${p ? "disabled" : ""}>${flatPiece(goal.type, goal.color, goal.turn, !p)}</button>`
            : '<div class="flat-blank"></div>';
        },
      ).join("")}</div>`;
      world
        .querySelectorAll("[data-flat-slot]")
        .forEach((b) =>
          activate(b, () => placeFlat(Number(b.dataset.flatSlot))),
        );
      document.querySelector("#shape-round").textContent = flatGoal().name;
    } else {
      model.innerHTML = cubePicture(
        modelCubes(),
        mode === "rotate"
          ? baseAngle + (targetOrientation() * Math.PI) / 2
          : angle,
      ).replace('viewBox="0 0 520 420"', 'viewBox="60 0 400 400"');
      world.innerHTML = cubePicture(
        mode === "rotate" ? modelCubes() : cubes,
        angle,
        mode === "build",
      ).replace('viewBox="0 0 520 420"', 'viewBox="60 0 400 400"');
      world.querySelectorAll("[data-cell]").forEach(
        (p) =>
          (p.onkeydown = (e) => {
            if ((e.key === "Enter" || e.key === " ") && mode === "build") {
              e.preventDefault();
              placeCube(p.dataset.cell);
            }
          }),
      );
      document.querySelector("#shape-round").textContent =
        mode === "rotate" ? "どこから みたのかな？" : "したから つもう";
    }
  }
  function celebrate() {
    if (solved) return;
    solved = true;
    document.querySelector(".shape-game").classList.add("completed");
    document.querySelector("#shape-next").hidden = false;
    message("できた！ おなじ かたち！", "happy");
    onSuccess(mode);
  }
  function check() {
    if (mode === "rotate" && mod(orientation) === targetOrientation())
      celebrate();
    if (mode === "build" && sameConstruction(cubes, modelCubes())) celebrate();
    if (mode === "arrange" && placed.size === flatGoal().cells.length)
      celebrate();
  }
  function rotate(direction) {
    if (mode === "arrange") return;
    tone();
    orientation += direction;
    const indicator = document.querySelector("#rotation-direction");
    if (indicator)
      indicator.textContent = direction < 0 ? "↶ ひだりへ！" : "みぎへ！ ↷";
    const button = document.querySelector(
      direction < 0 ? "#turn-left" : "#turn-right",
    );
    button?.classList.remove("turn-press");
    void button?.offsetWidth;
    button?.classList.add("turn-press");
    const destination = baseAngle + (orientation * Math.PI) / 2,
      initial = angle,
      start = performance.now();
    cancelAnimationFrame(frame);
    message("くるっと！ みえかたが かわるよ", "happy");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (now) => {
      if (!alive) return;
      const t = reduced ? 1 : Math.min(1, (now - start) / 320);
      angle = initial + (destination - initial) * (1 - Math.pow(1 - t, 3));
      render();
      if (t < 1) frame = requestAnimationFrame(animate);
      else check();
    };
    frame = requestAnimationFrame(animate);
  }
  function placeCube(cell) {
    if (solved) {
      tone();
      message("つぎも あそぼう！", "happy");
      return;
    }
    const [x, z] = cell.split(",").map(Number),
      column = cubes.filter((c) => c.x === x && c.z === z),
      y = column.length;
    if (y >= 3 || cubes.length >= 12) {
      tone();
      message("ひとつ もどして ためそう");
      return;
    }
    cubes.push({ x, y, z, color: selected });
    tone();
    render();
    message("ぽんっ！ つぎは どこかな？", "happy");
    check();
  }
  function placeFlat(slot) {
    if (solved || placed.has(slot)) return;
    const goal = flatGoal().cells.find((c) => c.slot === slot);
    if (!goal) return;
    tone();
    const color = { square: "blue", triangle: "gold", circle: "pink" }[
      selectedFlat
    ];
    if (
      goal.type === selectedFlat &&
      goal.color === color &&
      (goal.type !== "triangle" || goal.turn === mod(turn))
    ) {
      placed.set(slot, { type: selectedFlat });
      render();
      message("ぴったり！", "happy");
      check();
    } else {
      const b = world.querySelector(`[data-flat-slot="${slot}"]`);
      b?.classList.add("wiggle");
      setTimeout(() => b?.classList.remove("wiggle"), 450);
      message(
        goal.type === selectedFlat
          ? "くるっと まわしてみよう"
          : "べつの かたちも ためそう",
      );
    }
  }
  function palette() {
    if (mode === "rotate") return;
    const types =
      mode === "build"
        ? ["gold", "blue", "green"]
        : ["square", "triangle", "circle"];
    tray.innerHTML =
      types
        .map(
          (t) =>
            `<button class="shape-piece" data-shape-piece="${t}" aria-label="${{ gold: "きいろのつみき", blue: "あおのつみき", green: "みどりのつみき", square: "しかく", triangle: "さんかく", circle: "まる" }[t]}">${mode === "build" ? cubeSwatch(t) : flatPiece(t, { square: "blue", triangle: "gold", circle: "pink" }[t], t === "triangle" ? mod(turn) : 0)}</button>`,
        )
        .join("") +
      (mode === "arrange"
        ? '<div class="flat-rotation"><button class="piece-turn" id="piece-turn-left" aria-label="さんかくをひだりにまわす">↶<small>ひだりに まわす</small></button><button class="piece-turn" id="piece-turn" aria-label="さんかくをみぎにまわす">↷<small>みぎに まわす</small></button></div>'
        : "");
    tray.querySelectorAll("[data-shape-piece]").forEach((b) => {
      const choose = () => {
        if (mode === "build") selected = b.dataset.shapePiece;
        else selectedFlat = b.dataset.shapePiece;
        highlight();
      };
      b.onpointerdown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        choose();
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      };
      b.onpointermove = (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8)
          drag.moved = true;
        if (!drag.moved) return;
        let ghost = document.querySelector(".shape-drag");
        if (!ghost) {
          ghost = document.createElement("div");
          ghost.className = "shape-drag";
          ghost.innerHTML = b.innerHTML;
          document.body.append(ghost);
        }
        ghost.style.left = `${e.clientX - 45}px`;
        ghost.style.top = `${e.clientY - 45}px`;
      };
      b.onpointerup = (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        const moved = drag.moved;
        drag = null;
        document.querySelector(".shape-drag")?.remove();
        if (moved) {
          const target = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest(mode === "build" ? "[data-cell]" : "[data-flat-slot]");
          if (target) {
            if (mode === "build") placeCube(target.dataset.cell);
            else placeFlat(Number(target.dataset.flatSlot));
          } else {
            tone();
            message("だいの うえに はこんでね");
          }
        } else {
          tone();
          message(
            mode === "build"
              ? "だいを さわって おこう"
              : "うすい かたちを さわろう",
          );
        }
      };
      b.onpointercancel = () => {
        drag = null;
        document.querySelector(".shape-drag")?.remove();
        message("もういちど はこんでね");
      };
      b.onclick = (e) => {
        if (e.detail === 0) {
          choose();
          tone();
          message("おく ところを さわってね");
        }
      };
    });
    activate(document.querySelector("#piece-turn-left"), () => {
      turn--;
      tone();
      selectedFlat = "triangle";
      palette();
      message("↶ ひだりに まわしたよ", "happy");
    });
    activate(document.querySelector("#piece-turn"), () => {
      turn++;
      tone();
      selectedFlat = "triangle";
      palette();
      message("くるっと！ もういちど ためそう", "happy");
    });
    highlight();
  }
  function highlight() {
    tray.querySelectorAll("[data-shape-piece]").forEach((b) => {
      const active =
        b.dataset.shapePiece === (mode === "build" ? selected : selectedFlat);
      b.classList.toggle("selected", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  let worldDrag = null;
  if (mode !== "arrange") {
    world.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      cancelAnimationFrame(frame);
      world.setPointerCapture(e.pointerId);
      worldDrag = {
        id: e.pointerId,
        x: e.clientX,
        angle,
        cell: e.target.closest("[data-cell]")?.dataset.cell,
        moved: false,
      };
    };
    world.onpointermove = (e) => {
      if (!worldDrag || e.pointerId !== worldDrag.id) return;
      const dx = e.clientX - worldDrag.x;
      if (Math.abs(dx) > 12) worldDrag.moved = true;
      if (worldDrag.moved) {
        angle = worldDrag.angle + dx * 0.012;
        render();
      }
    };
    world.onpointerup = (e) => {
      if (!worldDrag || e.pointerId !== worldDrag.id) return;
      const d = worldDrag;
      worldDrag = null;
      if (d.moved) {
        orientation = Math.round((angle - baseAngle) / (Math.PI / 2));
        angle = baseAngle + (orientation * Math.PI) / 2;
        tone();
        render();
        message("うしろも みえたね！", "happy");
        check();
      } else if (mode === "build" && d.cell) placeCube(d.cell);
      else {
        tone();
        message("よこに すーっと まわしてみよう");
      }
    };
    world.onpointercancel = () => {
      worldDrag = null;
      angle = baseAngle + (orientation * Math.PI) / 2;
      render();
      message("もういちど まわしてみよう");
    };
  }
  function reset(reason = "start") {
    onStage(round, reason);
    cancelAnimationFrame(frame);
    cubes = [];
    placed = new Map();
    orientation = 0;
    angle = baseAngle;
    solved = false;
    turn = 0;
    selected = "gold";
    selectedFlat = "square";
    document.querySelector(".shape-game").classList.remove("completed");
    document.querySelector("#shape-next").hidden = true;
    render();
    palette();
    message(
      mode === "rotate"
        ? "うしろは どうかな？"
        : mode === "build"
          ? "つみきを はこんでね"
          : "かたちを はこんでね",
    );
  }
  activate(document.querySelector("#turn-left"), () => rotate(-1));
  activate(document.querySelector("#turn-right"), () => rotate(1));
  activate(document.querySelector("#shape-retry"), () => {
    tone();
    reset("retry");
  });
  activate(document.querySelector("#shape-next"), () => {
    if (!solved) return;
    round++;
    tone();
    reset();
  });
  activate(document.querySelector("#shape-undo"), () => {
    if (!cubes.length) {
      tone();
      message("つみきを おいてみよう");
      return;
    }
    cubes.pop();
    solved = false;
    document.querySelector("#shape-next").hidden = true;
    document.querySelector(".shape-game").classList.remove("completed");
    tone();
    render();
    message("もどった！ もういちど");
  });
  reset();
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    document.querySelector(".shape-drag")?.remove();
  };
}
