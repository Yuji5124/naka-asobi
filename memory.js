const flowers = [
  { id: "tulip", icon: "🌷", name: "チューリップ" },
  { id: "daisy", icon: "🌼", name: "きいろい はな" },
  { id: "cherry", icon: "🌸", name: "さくら" },
  { id: "hibiscus", icon: "🌺", name: "あかい はな" },
  { id: "sunflower", icon: "🌻", name: "ひまわり" },
  { id: "blossom", icon: "🪻", name: "あおい はな" },
];
let activeSequence = [];
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

function newSequence(stage) {
  const count = stage + 1;
  activeSequence = shuffle(flowers).slice(0, count);
}

export function memoryView(stage) {
  newSequence(stage);
  return `<main class="memory-screen">
    <div class="stage-top"><button class="back" data-go="select" aria-label="あそびをえらぶ">‹</button><div class="steps" aria-label="ステージ ${stage} / 3">${[1,2,3].map((n) => `<span class="step-dot ${n === stage ? "active" : n < stage ? "done" : ""}"></span>`).join("")}</div><span class="stage-label">おぼえる · ${stage}/3</span></div>
    <h1 class="screen-title">おはなの ならびを おぼえよう！</h1>
    <p class="memory-instruction" id="memory-instruction" role="status" aria-live="polite">おはなを よく みてね</p>
    <div class="memory-garden" aria-label="おはなの はなだん">
      <div class="memory-bed"><div class="memory-soil"></div><div class="memory-flowers">${activeSequence.map((flower, i) => `<div class="memory-pot"><span class="memory-flower" data-memory-flower="${i}">${flower.icon}</span><i></i></div>`).join("")}</div></div>
      <div class="memory-hide" id="memory-hide" hidden>🌱　🌱　🌱　🌱</div>
    </div>
    <div class="memory-slots memory-slots-hidden" id="memory-slots" aria-label="おぼえた順番">${activeSequence.map((_, i) => `<span class="memory-slot" data-memory-slot="${i}">${i + 1}</span>`).join("")}</div>
    <div class="memory-choices" id="memory-choices" hidden aria-label="おはなを えらぶ">${shuffle([...activeSequence, ...shuffle(flowers.filter((flower) => !activeSequence.some((item) => item.id === flower.id))).slice(0, 3)]).map((flower) => `<button class="memory-choice" data-memory-choice="${flower.id}" aria-label="${flower.name}">${flower.icon}</button>`).join("")}</div>
    <p class="memory-message" id="memory-message">じゅんばんを おぼえたら おしてね</p>
    <div class="memory-actions"><button class="secondary" id="memory-watch" aria-label="おはなを もういちど みる">👀 もういちど みる</button><button class="primary" id="memory-reveal">おぼえたよ！</button><button class="primary" id="memory-next" hidden>つぎの おはなへ ›</button></div>
  </main>`;
}

export function bindMemory({ stage, activate, tone, onMistake = () => {}, onSuccess, onNext }) {
  const instruction = document.querySelector("#memory-instruction");
  const message = document.querySelector("#memory-message");
  const sequence = activeSequence;
  let showing = true;
  let cursor = 0;
  let complete = false;
  const choices = [...document.querySelectorAll(".memory-choice")];

  function hideFlowers() {
    if (complete) return;
    showing = false;
    document.querySelector(".memory-garden").classList.add("memory-hidden");
    document.querySelector("#memory-slots").classList.remove("memory-slots-hidden");
    document.querySelector("#memory-choices").hidden = false;
    document.querySelector("#memory-reveal").hidden = true;
    instruction.textContent = "おなじ じゅんばんに はなを おそう！";
    message.textContent = "さいしょの おはなは どれかな？";
  }

  function watchAgain() {
    if (complete) return;
    showing = true;
    cursor = 0;
    choices.forEach((button) => { button.disabled = false; button.classList.remove("memory-used", "memory-wrong"); });
    document.querySelectorAll(".memory-slot").forEach((slot, i) => {
      slot.textContent = String(i + 1);
      slot.classList.remove("memory-slot-correct");
    });
    document.querySelector(".memory-garden").classList.remove("memory-hidden");
    document.querySelector("#memory-slots").classList.add("memory-slots-hidden");
    document.querySelector("#memory-choices").hidden = true;
    document.querySelector("#memory-reveal").hidden = false;
    instruction.textContent = "おはなを よく みてね";
    message.textContent = "じゅんばんを おぼえたら おしてね";
    tone();
  }

  activate(document.querySelector("#memory-reveal"), hideFlowers);
  activate(document.querySelector("#memory-watch"), watchAgain);
  choices.forEach((button) => activate(button, () => {
    if (showing || complete) return;
    if (button.dataset.memoryChoice !== sequence[cursor]?.id) {
      button.classList.remove("memory-wrong");
      void button.offsetWidth;
      button.classList.add("memory-wrong");
      message.textContent = "おしい！ もういちど かんがえてみよう";
      onMistake();
      tone(false);
      return;
    }
    button.disabled = true;
    button.classList.add("memory-used");
    const slot = document.querySelector(`[data-memory-slot="${cursor}"]`);
    slot.textContent = sequence[cursor].icon;
    slot.classList.add("memory-slot-correct");
    cursor++;
    tone(true);
    if (cursor < sequence.length) {
      message.textContent = "そうそう！ つぎの はなは どれかな？";
      return;
    }
    complete = true;
    document.querySelector(".memory-garden").classList.remove("memory-hidden");
    instruction.textContent = "おはなの じゅんばん、せいかい！";
    message.textContent = "ぜんぶ おぼえていたね！";
    tone(true);
    const last = onSuccess();
    if (!last) document.querySelector("#memory-next").hidden = false;
  }));
  activate(document.querySelector("#memory-next"), () => onNext(stage));
}
