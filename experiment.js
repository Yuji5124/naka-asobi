// Versioned local-only experiment data, independent of old learning records.
export const GAME_NAMES = {
  find: "みつける",
  trace: "なぞる",
  path: "つなぐ",
  write: "かく",
  shape: "かたち",
  maze: "めいろ",
  find2: "みつける2（こうえん）",
  crane: "クレーン",
};
const integer = (n) => (Number.isSafeInteger(n) && n >= 0 ? n : 0);
const seconds = (n) => (Number.isFinite(n) && n >= 0 ? n : 0);
export const escapeText = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function experimentDefaults() {
  return {
    schemaVersion: 2,
    totalPoints: 0,
    stageProgress: {},
    coinBalance: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    collection: [],
    playLogs: {},
    sessions: [],
    coinTransactions: [],
    effects: {
      hanamaru: { shown: 0, retries: 0 },
      fireworks: { shown: 0, retries: 0 },
      stamp: { shown: 0, retries: 0 },
      sparkles: { shown: 0, retries: 0 },
    },
  };
}
export function readExperiment(saved = {}) {
  const d = experimentDefaults();
  d.totalPoints = integer(saved.totalPoints);
  d.stageProgress = Object.fromEntries(
    Object.entries(saved.stageProgress || {}).filter(([id, n]) =>
      (GAME_NAMES[id] || /^(path|maze):[12]$/.test(id)) && Number.isInteger(n) && n >= 1 && n <= 3,
    ),
  );
  d.totalCoinsEarned = Math.floor(d.totalPoints / 5);
  d.totalCoinsSpent = Math.min(
    d.totalCoinsEarned,
    integer(saved.totalCoinsSpent),
  );
  d.coinBalance = d.totalCoinsEarned - d.totalCoinsSpent;
  d.collection = Array.isArray(saved.collection)
    ? saved.collection.filter(
        (p) =>
          p && typeof p.id === "string" && typeof p.acquiredAt === "string",
      )
    : [];
  d.sessions = Array.isArray(saved.sessions)
    ? saved.sessions
        .filter(
          (s) =>
            s &&
            GAME_NAMES[s.gameId] &&
            typeof s.stageId === "string" &&
            typeof s.startedAt === "string",
        )
        .map((s) => ({
          ...s,
          durationSec: seconds(s.durationSec),
          completed: s.completed === true,
        }))
    : [];
  d.coinTransactions = Array.isArray(saved.coinTransactions)
    ? saved.coinTransactions.filter(
        (t) =>
          t &&
          ["earned", "spent"].includes(t.type) &&
          integer(t.amount) > 0 &&
          typeof t.source === "string" &&
          typeof t.timestamp === "string",
      )
    : [];
  for (const [k, v] of Object.entries(saved.playLogs || {}))
    if (v && GAME_NAMES[v.gameId] && typeof v.stageId === "string")
      d.playLogs[k] = {
        gameId: v.gameId,
        stageId: v.stageId,
        playCount: integer(v.playCount),
        totalPlayTime: seconds(v.totalPlayTime),
        lastPlayedAt:
          typeof v.lastPlayedAt === "string" ? v.lastPlayedAt : null,
        completedCount: Math.min(
          integer(v.completedCount),
          integer(v.playCount),
        ),
        mistakeCount: integer(v.mistakeCount),
        level: integer(v.level),
        stage: integer(v.stage),
      };
  for (const id of ["hanamaru", "fireworks", "stamp", "sparkles"])
    d.effects[id] = {
      shown: integer(saved.effects?.[id]?.shown),
      retries: integer(saved.effects?.[id]?.retries),
    };
  return d;
}
export function createExperiment(data, save, onChange = () => {}) {
  let active = null,
    last = performance.now(),
    visible = !document.hidden;
  // A crash or reload only counts the time already checkpointed, never time away.
  for (const s of data.sessions)
    if (!s.endedAt) {
      s.endedAt = s.checkpointAt || s.startedAt;
      s.endReason = "interrupted";
    }
  save();
  function checkpoint() {
    const now = performance.now();
    if (active && visible) {
      const dt = Math.max(0, (now - last) / 1000);
      active.durationSec += dt;
      data.playLogs[`${active.gameId}:${active.stageId}`].totalPlayTime += dt;
      active.checkpointAt = new Date().toISOString();
    }
    last = now;
    if (active) save();
  }
  function finish(reason = "navigation") {
    checkpoint();
    if (active) {
      active.endedAt = new Date().toISOString();
      active.endReason = reason;
      save();
      active = null;
    }
  }
  function start(gameId, stageId, reason = "start", meta = {}) {
    if (reason === "retry" && active?.effect && active.completed) {
      data.effects[active.effect].retries++;
      active.retriedAfterEffect = true;
    }
    finish();
    const now = new Date().toISOString(),
      key = `${gameId}:${stageId}`;
    const log = (data.playLogs[key] ||= {
      gameId,
      stageId,
      playCount: 0,
      totalPlayTime: 0,
      lastPlayedAt: null,
      completedCount: 0,
      mistakeCount: 0,
      level: integer(meta.level),
      stage: integer(meta.stage),
    });
    log.mistakeCount ??= 0;
    log.level ??= integer(meta.level);
    log.stage ??= integer(meta.stage);
    log.playCount++;
    log.lastPlayedAt = now;
    active = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      gameId,
      stageId,
      appVersion: "2026-10-rewards-v2",
      startedAt: now,
      endedAt: null,
      checkpointAt: now,
      durationSec: 0,
      completed: false,
      level: integer(meta.level),
      stage: integer(meta.stage),
      mistakeCount: 0,
      pointsEarned: 0,
      rewardItem: null,
      rewardPlayed: gameId === "crane",
    };
    data.sessions.push(active);
    last = performance.now();
    save();
    return active;
  }
  function transaction(type, source) {
    data.coinTransactions.push({
      type,
      amount: 1,
      source,
      timestamp: new Date().toISOString(),
      sessionId: active?.id || null,
    });
  }
  function complete({ awardPoint = true } = {}) {
    if (!active || active.completed) return null;
    checkpoint();
    active.completed = true;
    const crane = active.gameId === "crane";
    active.pointsEarned = !crane && awardPoint ? 1 : 0;
    data.playLogs[`${active.gameId}:${active.stageId}`].completedCount++;
    const effect = ["hanamaru", "fireworks", "stamp", "sparkles"][Math.floor(Math.random() * 4)];
    if (active.gameId !== "crane") {
      active.effect = effect;
      data.effects[effect].shown++;
    }
    let coin = false;
    if (!crane && awardPoint) {
      data.totalPoints++;
      const earned = Math.floor(data.totalPoints / 5);
      if (earned > data.totalCoinsEarned) {
        data.totalCoinsEarned = earned;
        data.coinBalance++;
        transaction("earned", active.gameId);
        coin = true;
      }
    }
    save();
    onChange();
    return { effect, coin, points: data.totalPoints, pointAwarded: !crane && awardPoint, sessionId: active.id };
  }
  function spend() {
    if (data.totalPoints < 5 || data.coinBalance < 1) return false;
    data.coinBalance--;
    data.totalCoinsSpent++;
    transaction("spent", "crane");
    if (active) active.coinsSpent = (active.coinsSpent || 0) + 1;
    save();
    onChange();
    return true;
  }
  function prize(id) {
    if (active) active.rewardItem = id;
    data.collection.push({
      id,
      acquiredAt: new Date().toISOString(),
      sessionId: active?.id || null,
    });
    save();
  }
  function mistake() {
    if (!active || active.completed) return;
    active.mistakeCount++;
    const log = data.playLogs[`${active.gameId}:${active.stageId}`];
    if (log) log.mistakeCount++;
    save();
  }
  setInterval(checkpoint, 5000);
  document.addEventListener("visibilitychange", () => {
    checkpoint();
    visible = !document.hidden;
    last = performance.now();
  });
  let suspended = null;
  window.addEventListener("pagehide", () => {
    suspended = active
      ? { gameId: active.gameId, stageId: active.stageId }
      : null;
    finish("pagehide");
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && suspended) {
      visible = !document.hidden;
      start(suspended.gameId, suspended.stageId);
      suspended = null;
    }
  });
  return {
    start,
    finish,
    complete,
    spend,
    prize,
    mistake,
    checkpoint,
    get active() {
      return active;
    },
  };
}
export function gameStats(data) {
  return Object.keys(GAME_NAMES).map((gameId) => {
    const rows = Object.values(data.playLogs).filter(
        (l) => l.gameId === gameId,
      ),
      playCount = rows.reduce((a, l) => a + l.playCount, 0),
      totalPlayTime = rows.reduce((a, l) => a + l.totalPlayTime, 0),
      completedCount = rows.reduce((a, l) => a + l.completedCount, 0),
      mistakeCount = rows.reduce((a, l) => a + integer(l.mistakeCount), 0);
    return {
      gameId,
      playCount,
      totalPlayTime,
      completedCount,
      mistakeCount,
      averagePlayTime: playCount ? totalPlayTime / playCount : 0,
      completionRate: playCount ? completedCount / playCount : 0,
    };
  });
}
const duration = (n) => `${Math.floor(n / 60)}分 ${Math.round(n % 60)}秒`;
export function parentLogView(data) {
  const stats = gameStats(data);
  return `<main class="parent-log"><button class="secondary" data-go="home">ホームへ</button><h1>保護者用 プレイログ</h1><button class="secondary" data-go="record">なかよしの きろく（旧版から引き継ぎ）</button><p>この端末だけに保存します。プレイ時間は画面を表示していた時間です。</p><div class="log-summary">${[
    ["遊んだ回数", stats.reduce((a, s) => a + s.playCount, 0) + "回"],
    ["総プレイ時間", duration(stats.reduce((a, s) => a + s.totalPlayTime, 0))],
    ["獲得ポイント", data.totalPoints + "pt"],
    ["獲得コイン", data.totalCoinsEarned + "枚"],
    ["使用コイン", data.totalCoinsSpent + "枚"],
    ["現在のコイン", data.coinBalance + "枚"],
    ["クレーン回数", stats.find((s) => s.gameId === "crane").playCount + "回"],
    ["景品", data.collection.length + "個"],
  ]
    .map(
      ([name, value]) =>
        `<div><small>${name}</small><strong>${value}</strong></div>`,
    )
    .join(
      "",
    )}</div><h2>ゲームごとの比較</h2><div class="log-table-wrap"><table><thead><tr><th>ゲーム</th><th>回数</th><th>時間</th><th>平均時間</th><th>まちがい</th><th>クリア率</th></tr></thead><tbody>${stats.map((s) => `<tr><th>${GAME_NAMES[s.gameId]}</th><td>${s.playCount}</td><td>${duration(s.totalPlayTime)}</td><td>${Math.round(s.averagePlayTime)}秒</td><td>${s.mistakeCount}</td><td>${Math.round(s.completionRate * 100)}%</td></tr>`).join("")}</tbody></table></div><h2>演出と「もう一度」</h2><div class="log-table-wrap"><table><thead><tr><th>演出</th><th>表示</th><th>直後のもう一度</th><th>割合</th></tr></thead><tbody>${Object.entries(
    data.effects,
  )
    .map(
      ([id, e]) =>
        `<tr><th>${({hanamaru:"はなまる",fireworks:"花火",stamp:"スタンプ",sparkles:"キラキラ"})[id]}</th><td>${e.shown}</td><td>${e.retries}</td><td>${e.shown ? Math.round((e.retries / e.shown) * 100) : 0}%</td></tr>`,
    )
    .join("")}</tbody></table></div><h2>最近のプレイ</h2><ol>${
    data.sessions
      .slice(-15)
      .reverse()
      .map(
        (s) =>
          `<li>${GAME_NAMES[s.gameId]} / ${escapeText(s.stageId)} · ${duration(s.durationSec)} · ${s.completed ? "クリア" : "途中"} · ${s.pointsEarned || 0}pt${s.rewardItem ? " · 景品 " + escapeText(s.rewardItem) : ""}<small>${escapeText(s.startedAt)}${s.effect ? " · " + (({hanamaru:"はなまる",fireworks:"花火",stamp:"スタンプ",sparkles:"キラキラ"})[s.effect]) : ""}${s.retriedAfterEffect ? " → もう一度" : ""}</small></li>`,
      )
      .join("") || "<li>これから遊ぼう！</li>"
  }</ol><h2>コイン履歴</h2><ol>${
    data.coinTransactions
      .slice(-20)
      .reverse()
      .map(
        (t) =>
          `<li>${t.type === "earned" ? "+" : "−"}${t.amount}枚 · ${escapeText(GAME_NAMES[t.source] || t.source)}<small>${escapeText(t.timestamp)}</small></li>`,
      )
      .join("") || "<li>5ポイントで最初のコインがもらえます。</li>"
  }</ol><button class="secondary" id="export-log">分析用データを保存（JSON）</button><p>ステージ別集計・各セッション・演出・コイン履歴を含みます。旧版で遊んだ記録は引き継ぎ、過去のプレイ回数は推定しません。</p></main>`;
}
