const stages = {
  1: {
    instruction: "1を みつけたら、もうひとつの 1へ！",
    numbers: [
      { id: "one-a", value: "1", x: 150, y: 285 },
      { id: "one-b", value: "1", x: 850, y: 315 },
    ],
  },
  2: {
    instruction: "1と1、2と2を それぞれ つなごう！",
    numbers: [
      { id: "one-a", value: "1", x: 150, y: 135 },
      { id: "one-b", value: "1", x: 830, y: 170 },
      { id: "two-a", value: "2", x: 220, y: 445 },
      { id: "two-b", value: "2", x: 855, y: 420 },
    ],
  },
  3: {
    instruction: "1・2・3を おなじ すうじどうしで つなごう！",
    numbers: [
      { id: "one-a", value: "1", x: 135, y: 105 },
      { id: "one-b", value: "1", x: 850, y: 125 },
      { id: "two-a", value: "2", x: 150, y: 300 },
      { id: "two-b", value: "2", x: 860, y: 280 },
      { id: "three-a", value: "3", x: 205, y: 500 },
      { id: "three-b", value: "3", x: 800, y: 480 },
    ],
  },
};

const lineColors = { "1": "#ee759b", "2": "#47b5e7", "3": "#76bd65", "4": "#a58bda", "5": "#e7a03b", "6": "#48aba3" };

function layoutFor(level, stage) {
  if (level === 1) return stages[stage];
  const count = (level === 2 ? [2, 3, 4] : [4, 5, 6])[stage - 1];
  const positions = [[130,115],[355,100],[610,125],[870,100],[150,295],[370,320],[620,280],[865,315],[130,490],[360,500],[605,485],[865,500]];
  const slots = {
    2: [0, 3, 8, 11], 3: [0, 2, 5, 6, 9, 11],
    4: [0, 2, 3, 4, 7, 8, 9, 11], 5: [0, 1, 3, 4, 5, 6, 7, 8, 10, 11],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  }[count];
  const order = { 2:[1,2,2,1], 3:[1,3,2,1,2,3], 4:[1,3,2,4,2,1,4,3], 5:[1,4,2,5,3,1,4,2,5,3], 6:[1,4,2,5,3,6,4,1,6,2,5,3] }[count];
  const seen = new Set();
  return {
    instruction: `1〜${count}を おなじ すうじどうしで つなごう！`,
    numbers: slots.map((slot, i) => {
      const value = String((order[i] + stage - 2 + count) % count + 1);
      const series = seen.has(value) ? "b" : "a";
      seen.add(value);
      const [x, y] = positions[(slot + (stage === 2 ? 4 : 0)) % positions.length];
      return { id: `${value}-${series}`, value, series, x, y };
    }),
  };
}

export function numberLinkLevelView() {
  return `<main class="stage-menu number-link-levels"><div class="stage-top"><button class="back" data-go="connect-menu" aria-label="つなぐあそびをえらぶ">‹</button><span class="stage-label">すうじを つなぐ</span></div><h1 class="screen-title">レベルを えらぼう</h1><div class="stage-choice-grid">${[1,2,3].map((level) => `<button class="stage-card" data-level-game="number-link" data-level="${level}"><div class="number-link-level-art" aria-hidden="true">${level === 1 ? "① ①" : level === 2 ? "② ① ③" : "④ ⑥ ⑤"}</div><span><strong>レベル ${level}</strong><small>${["まずは 1・2・3", "ちらばった すうじ", "1〜6を さがそう"][level-1]} · 3ステージ</small></span></button>`).join("")}</div></main>`;
}

export function numberLinkView(stage, level = 1) {
  const layout = layoutFor(level, stage);
  const title = level === 1 && stage === 1 ? "1 と 1 を つなごう" : "おなじ すうじを つなごう";
  return `<main class="number-link-screen ${level > 1 ? "scattered-numbers" : ""}">
    <div class="stage-top"><button class="back" data-go="number-link-levels" aria-label="レベルをえらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">すうじを つなごう</span></div>
    <div class="number-link-heading"><span aria-hidden="true">🖍️</span><div><p>レベル ${level} · ステージ ${stage}</p><h1>${title}</h1></div><span aria-hidden="true">✨</span></div>
    <p class="number-link-instruction">${layout.instruction} ゆびで せんを ひこう！</p>
    <section class="number-paper" id="number-paper" aria-label="ちらばった すうじ">
      <svg class="number-lines" id="number-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><g id="finished-lines"></g><path id="preview-line" hidden /></svg>
      ${layout.numbers.map((dot) => `<button class="number-sticker ${level === 1 ? `number-${dot.value}` : `number-series-${dot.series}`}" type="button" data-number-id="${dot.id}" data-value="${dot.value}" style="--x:${dot.x / 10}%;--y:${dot.y / 6}%" aria-label="すうじ ${dot.value}">${dot.value}</button>`).join("")}
    </section>
    <div class="number-link-feedback" id="number-link-feedback" role="status" aria-live="polite">${stage === 1 ? "1を タッチしてみよう" : "せんの はじめを タッチしてね"}</div>
    <div class="number-link-actions"><button class="secondary" id="number-link-retry">もういちど</button><button class="primary" id="number-link-next" hidden>${stage === 3 ? "あそびに もどる" : "つぎへ →"}</button></div>
  </main>`;
}

export function bindNumberLinks({ stage, level = 1, activate, tone, onMistake, onSuccess, onNext, onRetry }) {
  const layout = layoutFor(level, stage);
  const paper = document.querySelector("#number-paper");
  const svg = document.querySelector("#number-lines");
  const preview = document.querySelector("#preview-line");
  const finished = document.querySelector("#finished-lines");
  const feedback = document.querySelector("#number-link-feedback");
  const byId = new Map(layout.numbers.map((dot) => [dot.id, dot]));
  const connected = new Set();
  let selected = null;
  let drag = null;
  let ignoreClickUntil = 0;
  let done = false;

  function coordinates(event) {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1000,
      y: ((event.clientY - rect.top) / rect.height) * 600,
    };
  }
  function dotPoint(dot) {
    return { x: dot.x, y: dot.y };
  }
  function setPreview(points, color) {
    if (!points?.length) return;
    preview.setAttribute("d", points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" "));
    preview.setAttribute("stroke", lineColors[color]);
    // SVGElement does not reflect the HTML `hidden` property, so remove the
    // attribute explicitly to make the in-progress stroke visible.
    preview.removeAttribute("hidden");
  }
  function clearPreview() {
    preview.setAttribute("hidden", "");
    preview.removeAttribute("d");
  }
  function markSelected(dot) {
    selected = dot;
    document.querySelectorAll(".number-sticker").forEach((button) => {
      button.classList.toggle("selected", button.dataset.numberId === dot.id);
    });
  }
  function select(dot) {
    markSelected(dot);
    feedback.textContent = `「${dot.value}」を みつけたね！ おなじ すうじは どこかな？`;
    tone();
  }
  function connect(a, b, points = [dotPoint(a), dotPoint(b)]) {
    if (done || !a || !b || a.id === b.id) return false;
    if (a.value !== b.value) {
      feedback.textContent = "おなじ すうじを さがそう！";
      const button = document.querySelector(`[data-number-id="${b.id}"]`);
      button?.classList.remove("number-bump");
      if (button) { void button.offsetWidth; button.classList.add("number-bump"); }
      onMistake();
      tone(false);
      return false;
    }
    if (connected.has(a.value)) return false;
    const linePoints = [...points, dotPoint(b)];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", linePoints.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" "));
    line.setAttribute("stroke", lineColors[a.value]);
    line.setAttribute("class", "completed-number-line");
    finished.append(line);
    connected.add(a.value);
    document.querySelectorAll(`[data-value="${a.value}"]`).forEach((button) => {
      button.classList.add("matched");
      button.classList.remove("selected");
    });
    selected = null;
    tone(true);
    feedback.textContent = "つながった！";
    if (connected.size === layout.numbers.length / 2) {
      done = true;
      feedback.textContent = "ぜんぶ つながった！ やったね！";
      document.querySelector("#number-link-retry").hidden = true;
      document.querySelector("#number-link-next").hidden = false;
      onSuccess();
    }
    return true;
  }
  function onPointerDown(event) {
    const button = event.target.closest(".number-sticker");
    if (!button || drag || done || button.classList.contains("matched")) return;
    event.preventDefault();
    paper.setPointerCapture(event.pointerId);
    const dot = byId.get(button.dataset.numberId);
    drag = { pointerId: event.pointerId, dot, from: dotPoint(dot), current: coordinates(event), points: [dotPoint(dot)], moved: false };
    setPreview(drag.points, dot.value);
  }
  function onPointerMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.current = coordinates(event);
    const last = drag.points.at(-1);
    if (!last || Math.hypot(drag.current.x - last.x, drag.current.y - last.y) > 3)
      drag.points.push(drag.current);
    if (Math.hypot(drag.current.x - drag.from.x, drag.current.y - drag.from.y) > 14)
      drag.moved = true;
    setPreview(drag.points, drag.dot.value);
  }
  function onPointerUp(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    drag = null;
    const targetButton = document.elementFromPoint(event.clientX, event.clientY)?.closest(".number-sticker");
    const target = targetButton ? byId.get(targetButton.dataset.numberId) : null;
    clearPreview();
    ignoreClickUntil = Date.now() + 500;
    if (!current.moved) {
      select(current.dot);
      feedback.textContent = "ゆびを はなさず、おなじ すうじまで なぞろう！";
      return;
    }
    if (target) {
      if (!connect(current.dot, target, current.points)) {
        if (target.value === current.dot.value) select(current.dot);
        else markSelected(current.dot);
      }
    } else {
      select(current.dot);
      feedback.textContent = "すうじから すうじまで なぞってね";
    }
  }
  function onPointerCancel(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dot = drag.dot;
    drag = null;
    clearPreview();
    select(dot);
  }
  function onClick(event) {
    if (Date.now() < ignoreClickUntil || done) return;
    const button = event.target.closest(".number-sticker");
    if (!button || button.classList.contains("matched")) return;
    const dot = byId.get(button.dataset.numberId);
    select(dot);
    feedback.textContent = "ゆびで なぞって つなごう！";
  }

  activate(document.querySelector("#number-link-next"), () => onNext(stage));
  activate(document.querySelector("#number-link-retry"), onRetry);
  paper.addEventListener("pointerdown", onPointerDown);
  paper.addEventListener("pointermove", onPointerMove);
  paper.addEventListener("pointerup", onPointerUp);
  paper.addEventListener("pointercancel", onPointerCancel);
  paper.addEventListener("click", onClick);
  return () => {
    paper.removeEventListener("pointerdown", onPointerDown);
    paper.removeEventListener("pointermove", onPointerMove);
    paper.removeEventListener("pointerup", onPointerUp);
    paper.removeEventListener("pointercancel", onPointerCancel);
    paper.removeEventListener("click", onClick);
  };
}
