const cups = [
  { id: "red", name: "あか", color: "#ef6659", ball: "🔴" },
  { id: "yellow", name: "きいろ", color: "#f2c84b", ball: "🟡" },
  { id: "green", name: "みどり", color: "#70b96a", ball: "🟢" },
  { id: "blue", name: "あお", color: "#58b6df", ball: "🔵" },
  { id: "purple", name: "むらさき", color: "#ab8dd4", ball: "🟣" },
];
const routeFor = (stage, lane) => {
  const route = stage === 1 ? [1, -1] : stage === 2 ? [1, 1, -1, -1] : [1, 1, -1, -1, 1, -1];
  return lane >= 3 ? route.map((turn) => -turn) : route;
};
let round;

export function ballDropView(stage) {
  const targetLane = Math.floor(Math.random() * cups.length);
  round = { stage, targetLane, sourceLane: targetLane, route: routeFor(stage, targetLane) };
  const rows = round.route.length;
  const entrances = cups.map((cup, i) => '<button class="ball-entry" data-ball-entry="' + i + '" aria-label="' + cup.name + 'のボール" style="--ball-color:' + cup.color + '">' + cup.ball + '<span></span></button>').join("");
  const gates = Array.from({ length: rows }, (_, row) => cups.map((_, col) => '<button class="ball-gate" data-gate-row="' + row + '" data-gate-col="' + col + '" aria-label="' + (row + 1) + 'だんめの みちをかえる" aria-pressed="false">↘</button>').join("")).join("");
  const goals = cups.map((cup, i) => '<div class="ball-goal ' + (i === targetLane ? "ball-goal-target" : "") + '" data-goal="' + i + '" style="--goal-color:' + cup.color + '"><span>' + (i === targetLane ? "★" : "") + '</span><small>' + cup.name + '</small></div>').join("");
  const steps = [1, 2, 3].map((n) => '<span class="step-dot ' + (n === stage ? "active" : n < stage ? "done" : "") + '"></span>').join("");
  return '<main class="ball-screen"><div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><div class="steps" aria-label="ステージ ' + stage + ' / 3">' + steps + '</div><span class="stage-label">ころころ · ' + stage + '/3</span></div><h1 class="screen-title">ボールを ゴールへ はこぼう！</h1><p class="ball-instruction" id="ball-instruction">' + cups[targetLane].name + 'の ボールを えらぼう</p><div class="ball-entrances" aria-label="ボールを えらぶ">' + entrances + '</div><div class="ball-board" id="ball-board" style="--ball-rows:' + rows + '"><div class="ball-gates">' + gates + '</div><svg class="ball-trail" id="ball-trail" aria-hidden="true" viewBox="0 0 500 500" preserveAspectRatio="none"><polyline id="ball-trail-line" points=""/></svg><div class="rolling-ball" id="rolling-ball" aria-hidden="true">⚪</div></div><div class="ball-goals" aria-label="ゴールのいろ">' + goals + '</div><p class="ball-message" id="ball-message" role="status" aria-live="polite">みちの タイルを タッチすると むきが かわるよ</p><div class="ball-actions"><button class="secondary" id="ball-hint">みちの ヒント</button><button class="secondary" id="ball-reset" hidden>もういちど</button><button class="primary" id="ball-drop" disabled>ボールを おとす！</button><button class="primary" id="ball-next" hidden>つぎへ ›</button></div></main>';
}

export function bindBallDrop({ stage, activate, tone, onMistake, onSuccess, onNext }) {
  const { targetLane, sourceLane, route } = round;
  const rows = route.length;
  const directions = Array.from({ length: rows }, () => Array(cups.length).fill(1));
  let routeLane = sourceLane;
  route.forEach((turn, row) => {
    directions[row][routeLane] = turn;
    routeLane = Math.max(0, Math.min(cups.length - 1, routeLane + turn));
  });
  directions[0][sourceLane] *= -1;
  const entryButtons = [...document.querySelectorAll("[data-ball-entry]")];
  const gateButtons = [...document.querySelectorAll(".ball-gate")];
  const dropButton = document.querySelector("#ball-drop");
  const hintButton = document.querySelector("#ball-hint");
  const resetButton = document.querySelector("#ball-reset");
  const instruction = document.querySelector("#ball-instruction");
  const message = document.querySelector("#ball-message");
  const ball = document.querySelector("#rolling-ball");
  const board = document.querySelector("#ball-board");
  let selectedLane = null;
  let rolling = false;
  let complete = false;
  let hintOn = false;
  const timers = [];

  function currentPath(matrix = directions) {
    const cols = [sourceLane];
    for (let row = 0; row < rows; row++) cols.push(Math.max(0, Math.min(cups.length - 1, cols[row] + matrix[row][cols[row]])));
    return cols;
  }
  function paintGates() {
    const activeCols = currentPath();
    gateButtons.forEach((button) => {
      const row = Number(button.dataset.gateRow), col = Number(button.dataset.gateCol);
      const correct = hintOn && route[row] === directions[row][col] && solutionCols[row] === col;
      button.textContent = directions[row][col] < 0 ? "↙" : "↘";
      button.classList.toggle("gate-current", !rolling && !complete && activeCols[row] === col);
      button.classList.toggle("gate-hint", correct);
      button.setAttribute("aria-pressed", String(directions[row][col] < 0));
    });
    const path = currentPath();
    const points = ["50,0", ...path.slice(1).map((col, row) => (50 + col * 100) + "," + ((row + 0.5) * 500 / rows).toFixed(1)), (50 + path[path.length - 1] * 100) + ",500"].join(" ");
    document.querySelector("#ball-trail-line").setAttribute("points", points);
    document.querySelector("#ball-trail").classList.toggle("trail-hint", hintOn);
  }
  const solutionCols = [];
  let solutionLane = sourceLane;
  route.forEach((turn) => { solutionCols.push(solutionLane); solutionLane = Math.max(0, Math.min(cups.length - 1, solutionLane + turn)); });
  const firstTry = currentPath();
  if (firstTry[firstTry.length - 1] === targetLane) directions[rows - 1][firstTry[rows - 1]] *= -1;
  function setBall(lane, row) {
    ball.style.left = ((lane + 0.5) * 100 / cups.length) + "%";
    ball.style.top = (row * 100) + "%";
    ball.style.setProperty("--ball-color", cups[selectedLane ?? sourceLane].color);
  }
  function selectBall(lane) {
    if (rolling || complete) return;
    if (lane !== targetLane) {
      instruction.textContent = cups[targetLane].name + "の ボールを さがそう！";
      entryButtons[lane].classList.remove("ball-entry-wrong");
      void entryButtons[lane].offsetWidth;
      entryButtons[lane].classList.add("ball-entry-wrong");
      tone(false);
      onMistake();
      return;
    }
    selectedLane = lane;
    entryButtons.forEach((button, i) => button.classList.toggle("ball-entry-selected", i === lane));
    dropButton.disabled = false;
    instruction.textContent = cups[lane].name + "の ボールだね！";
    message.textContent = "ひかる タイルを タッチして みちを かえよう";
    ball.textContent = cups[lane].ball;
    ball.classList.add("ball-ready");
    setBall(sourceLane, 0.06);
    tone(true);
  }
  entryButtons.forEach((button) => activate(button, () => selectBall(Number(button.dataset.ballEntry))));

  gateButtons.forEach((button) => activate(button, () => {
    if (rolling || complete) return;
    const row = Number(button.dataset.gateRow), col = Number(button.dataset.gateCol);
    directions[row][col] *= -1;
    button.classList.remove("gate-tap");
    void button.offsetWidth;
    button.classList.add("gate-tap");
    tone();
    paintGates();
  }));

  activate(hintButton, () => {
    if (rolling || complete) return;
    hintOn = !hintOn;
    if (hintOn) {
      let col = sourceLane;
      route.forEach((turn, row) => { directions[row][col] = turn; col += turn; });
      hintButton.textContent = "ヒントを けす";
      message.textContent = "ひかる タイルの むきを みてね";
    } else {
      hintButton.textContent = "みちの ヒント";
      message.textContent = "ひかる タイルを タッチして みちを かえよう";
    }
    paintGates();
  });

  activate(dropButton, () => {
    if (selectedLane === null || rolling || complete) return;
    rolling = true;
    hintOn = false;
    ball.classList.remove("ball-ready");
    paintGates();
    dropButton.disabled = true;
    hintButton.disabled = true;
    resetButton.hidden = true;
    gateButtons.forEach((button) => { button.disabled = true; button.classList.remove("gate-current", "gate-hint"); });
    entryButtons.forEach((button) => { button.disabled = true; });
    message.textContent = "ころころ おちていくよ！";
    const path = currentPath();
    setBall(path[0], 0.02);
    path.slice(1).forEach((lane, index) => timers.push(setTimeout(() => {
      if (!board.isConnected) return;
      setBall(lane, (index + 0.5) / rows);
      tone();
      gateButtons.find((button) => Number(button.dataset.gateRow) === index && Number(button.dataset.gateCol) === path[index])?.classList.add("gate-used");
    }, 440 * (index + 1))));
    timers.push(setTimeout(() => {
      if (!board.isConnected) return;
      rolling = false;
      const landed = path[path.length - 1];
      setBall(landed, 1);
      document.querySelector("[data-goal='" + landed + "']")?.classList.add("goal-landed");
      if (landed === targetLane) {
        complete = true;
        message.textContent = cups[landed].name + "の ゴールに はいった！";
        instruction.textContent = "ぴったり ゴール！";
        tone(true);
        if (!onSuccess()) document.querySelector("#ball-next").hidden = false;
      } else {
        message.textContent = cups[landed].name + "の ゴールだったよ。みちを かえてみよう！";
        tone(false);
        onMistake();
        resetButton.hidden = false;
      }
      hintButton.disabled = false;
    }, 440 * rows + 220));
  });

  activate(resetButton, () => {
    if (rolling || complete) return;
    document.querySelectorAll(".goal-landed").forEach((goal) => goal.classList.remove("goal-landed"));
    gateButtons.forEach((button) => { button.disabled = false; button.classList.remove("gate-used"); });
    entryButtons.forEach((button) => { button.disabled = false; });
    dropButton.disabled = selectedLane === null;
    resetButton.hidden = true;
    setBall(sourceLane, 0.02);
    paintGates();
    message.textContent = "ひかる タイルの むきを かえてみよう";
  });
  activate(document.querySelector("#ball-next"), () => onNext(stage));
  paintGates();
  ball.textContent = "⚪";
  setBall(sourceLane, 0.02);
  return () => timers.forEach(clearTimeout);
}
