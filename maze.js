// Original silhouette mazes. A seeded spanning tree gives branches and one route.
export const MAZE_NAMES = {
  acorn: "どんぐり",
  butterfly: "ちょうちょ",
  rocket: "ロケット",
  cloud: "くも",
  shell: "かいがら",
  flower: "おはな",
};
export function mazeModel(kind) {
  const rows =
    kind === "cloud"
      ? [
          [2,3,4,5],
          [1,2,3,4,5,6],
          [0,1,2,3,4,5,6,7],
          [0,1,2,3,4,5,6,7],
          [1,2,3,4,5,6,7],
          [2,3,4,5,6],
        ]
      : kind === "shell"
        ? [[1,2,3,4,5,6],[0,1,2,3,4,5,6,7],[0,1,2,3,4,5,6,7],[1,2,3,4,5,6],[2,3,4,5,6]]
        : kind === "flower"
          ? [[3,4],[2,3,4,5],[1,2,3,4,5,6],[0,1,2,3,4,5,6,7],[1,2,3,4,5,6],[2,3,4,5]]
      : kind === "rocket"
      ? [
          [3, 4],
          [2, 3, 4, 5],
          [2, 3, 4, 5],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 5, 6],
        ]
      : kind === "acorn"
        ? [
            [2, 3, 4, 5],
            [1, 2, 3, 4, 5, 6],
            [1, 2, 3, 4, 5, 6],
            [2, 3, 4, 5],
            [3, 4],
          ]
        : [
            [0, 1, 6, 7],
            [0, 1, 2, 3, 4, 5, 6, 7],
            [1, 2, 3, 4, 5, 6],
            [0, 1, 2, 3, 4, 5, 6, 7],
            [0, 1, 6, 7],
          ];
  const nodes = rows.flatMap((row, y) =>
    row.map((x) => ({
      id: `${x},${y}`,
      x: 96 + x * 64,
      y: 92 + y * 64,
      col: x,
      row: y,
    })),
  );
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const start = nodes[0],
    goal = nodes.at(-1),
    edges = [],
    seen = new Set([start.id]);
  let seed = ({ rocket:319, acorn:91, cloud:503, shell:619, flower:727 })[kind] || 207;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function visit(a) {
    const candidates = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
      .map(([x, y]) => byId.get(`${a.col + x},${a.row + y}`))
      .filter(Boolean);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const b of candidates)
      if (!seen.has(b.id)) {
        seen.add(b.id);
        edges.push([a, b]);
        visit(b);
      }
  }
  visit(start);
  const parents = new Map([[start.id, null]]),
    queue = [start];
  for (const a of queue)
    for (const [p, q] of edges) {
      const b = p === a ? q : q === a ? p : null;
      if (b && !parents.has(b.id)) {
        parents.set(b.id, a);
        queue.push(b);
      }
    }
  const route = [];
  for (let n = goal; n; n = parents.get(n.id)) route.unshift(n);
  return { nodes, edges, start, goal, route };
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function segmentDistance(p, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    t = Math.max(
      0,
      Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
    );
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}
export function onMazePath(model, p) {
  return model.edges.some(([a, b]) => segmentDistance(p, a, b) <= 19);
}
function silhouette(kind) {
  if (kind === "rocket")
    return '<path d="M320 18Q218 81 199 242L116 358L199 341L260 411H380L441 341L524 358L441 242Q422 81 320 18Z" fill="#c4e6f0" stroke="#81b9c8" stroke-width="5"/><path d="M286 414l34 56 34-56" fill="#ffd170"/><circle cx="320" cy="75" r="22" fill="#ffe7a3"/>';

  return kind === "acorn"
    ? '<path d="M165 136Q164 370 320 426Q476 370 475 136Z" fill="#f4cc89" stroke="#d5a368" stroke-width="5"/><path d="M142 147Q155 23 320 28Q485 23 498 147Z" fill="#b8956b" stroke="#947351" stroke-width="5"/><path d="M315 30q-10-25 15-26" fill="none" stroke="#947351" stroke-width="14" stroke-linecap="round"/>'
    : '<path d="M317 215C228 12 40 6 48 184Q50 256 142 264C13 296 62 451 179 406Q263 371 320 262Q375 371 461 406C578 451 627 296 498 264Q590 256 592 184C600 6 412 12 323 215Z" fill="#fbd7e5" stroke="#e8a9c3" stroke-width="5"/><path d="M308 113q-23-43-43-38m67 38q23-43 43-38" fill="none" stroke="#aa85af" stroke-width="5" stroke-linecap="round"/>';
}
export function mazeCardArt() {
  return '<svg class="activity-art maze-card-art" viewBox="0 0 160 130" aria-hidden="true"><rect x="15" y="12" width="130" height="104" rx="25" fill="#e7f2c3"/><path d="M36 38h34v32h34V38h25M36 70v25h93M70 95V70" stroke="#759153" stroke-width="19" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 38h34v32h34V38h25" stroke="#fff9e8" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="38" r="9" fill="#27b7d7"/><path d="m129 27 4 7 8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1z" fill="#ffbf36"/></svg>';
}
export function mazeView(feedback, level = 1, stage = 1) {
  return `<main class="maze-screen"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><span class="stage-label">めいろ</span></div><h1 class="screen-title">ゴールまで たどろう！</h1><p class="screen-note">レベル ${level} · ステージ ${stage}</p><div class="maze-board" id="maze-board"></div>${feedback("あおい まるから ゆびで たどろう！")}<div class="maze-actions"><button class="secondary" id="maze-retry">↶ もういちど</button><button class="primary" id="maze-next" hidden>つぎの めいろ ›</button></div></main>`;
}
export function bindMaze({
  activate,
  message,
  tone,
  onSuccess,
  onMistake = () => {},
  initialKind = "acorn",
  level = 1,
  onStage = () => {},
}) {
  const board = document.querySelector("#maze-board"),
    next = document.querySelector("#maze-next");
  let kind = initialKind,
    model,
    position,
    trail,
    completed = false,
    pointer = null,
    blocked = false;
  function paint() {
    const paths = model.edges
      .map(([a, b]) => `M${a.x} ${a.y}L${b.x} ${b.y}`)
      .join("");
    const marker = (p, label, color) =>
      `<g transform="translate(${p.x} ${p.y})"><circle r="21" fill="${color}" stroke="white" stroke-width="4"/><text y="-30" text-anchor="middle" fill="#67472f" font-size="19" font-weight="bold">${label}</text></g>`;
    board.innerHTML = `<svg id="maze-svg" viewBox="0 0 640 480" tabindex="0" role="application" aria-label="${MAZE_NAMES[kind]}のめいろ。あおいまるからゆびでたどる。矢印キーでもうごける。">${silhouette(kind)}<path d="${paths}" fill="none" stroke="#8b7158" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/><path d="${paths}" fill="none" stroke="#fffbed" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>${marker(model.start, "スタート", "#34bdd5")}${marker(model.goal, "ゴール", "#ffc64d")}<polyline id="maze-trail" fill="none" stroke="#36b7d5" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle id="maze-token" r="14" fill="#29afd0" stroke="white" stroke-width="4"/></svg>`;
    const svg = board.querySelector("svg");
    svg.addEventListener("pointerdown", down);
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
    svg.addEventListener("lostpointercapture", () => {
      pointer = null;
    });
    svg.addEventListener("keydown", key);
    update();
  }
  function update() {
    board.querySelector("#maze-token").setAttribute("cx", position.x);
    board.querySelector("#maze-token").setAttribute("cy", position.y);
    board
      .querySelector("#maze-trail")
      .setAttribute("points", trail.map((p) => `${p.x},${p.y}`).join(" "));
  }
  function reset(id = kind, reason = "start") {
    onStage(id, reason);
    kind = id;
    model = mazeModel(kind);
    position = { ...model.start };
    trail = [{ ...position }];
    completed = false;
    pointer = null;
    next.hidden = true;
    board.classList.remove("completed");
    paint();
    message("あおい まるから ゆびで たどろう！");
  }
  function point(e) {
    const svg = board.querySelector("svg");
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svg.getScreenCTM().inverse(),
    );
  }
  function down(e) {
    if (completed || pointer !== null || e.button !== 0) return;
    e.preventDefault();
    const p = point(e);
    if (distance(p, position) > 28) {
      message("あおい まるから つづけよう！");
      return;
    }
    pointer = e.pointerId;
    blocked = false;
    e.currentTarget.setPointerCapture(pointer);
    tone();
  }
  function advance(target) {
    const origin = { ...position },
      count = Math.ceil(distance(origin, target) / 3);
    for (let i = 1; i <= count; i++) {
      const p = {
        x: origin.x + ((target.x - origin.x) * i) / count,
        y: origin.y + ((target.y - origin.y) * i) / count,
      };
      if (!onMazePath(model, p)) {
        if (!blocked) { message("かべだね。べつの みちを ためそう！"); onMistake(); }
        blocked = true;
        update();
        return;
      }
      position = p;
      trail.push(p);
      if (distance(position, model.goal) < 16) {
        completed = true;
        next.hidden = false;
        board.classList.add("completed");
        message("できた！ ゴールに ついたね！", "happy");
        onSuccess(kind);
        break;
      }
    }
    blocked = false;
    update();
  }
  function move(e) {
    if (e.pointerId !== pointer || completed) return;
    e.preventDefault();
    advance(point(e));
  }
  function up(e) {
    if (e.pointerId === pointer) {
      pointer = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }
  function key(e) {
    const dirs = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!dirs[e.key] || completed) return;
    e.preventDefault();
    const [dx, dy] = dirs[e.key];
    advance({ x: position.x + dx * 8, y: position.y + dy * 8 });
  }
  activate(document.querySelector("#maze-retry"), () => {
    tone();
    reset(kind, "retry");
  });
  activate(next, () => {
    tone();
    const all = Object.keys(MAZE_NAMES), ids = all.slice((level - 1) * 3, level * 3);
    reset(ids[(ids.indexOf(kind) + 1) % ids.length]);
  });
  reset();
  return () => {
    pointer = null;
  };
}
