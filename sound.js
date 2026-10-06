// A quiet original pentatonic music-box loop. No speech or remote audio.
let context,
  timer,
  index = 0,
  enabled = true;
function note(freq, start, length = 0.18, gain = 0.045) {
  const o = context.createOscillator(),
    g = context.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + length);
  o.connect(g);
  g.connect(context.destination);
  o.start(start);
  o.stop(start + length);
}
const tune = [
  523, 659, 784, 659, 587, 0, 659, 523, 440, 523, 659, 0, 587, 659, 523, 0,
];
function music() {
  if (!enabled || document.hidden || !context) return;
  const n = tune[index++ % tune.length];
  if (n) note(n, context.currentTime, 0.32, 0.018);
}
export function sound(success = false) {
  if (!enabled || document.hidden) return;
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
    if (!timer) {
      music();
      timer = setInterval(music, 420);
    }
    const now = context.currentTime;
    if (success === "crane-start") [523, 659, 784, 988].forEach((f, i) => note(f, now + i * 0.12, 0.2, 0.05));
    else if (success === "crane-down") [440, 392, 349].forEach((f, i) => note(f, now + i * 0.14, 0.16, 0.035));
    else if (success === "bell") [988, 1318].forEach((f, i) => note(f, now + i * 0.08, 0.24, 0.035));
    else if (success === "coin-clink") [784, 988, 1318].forEach((f, i) => note(f, now + i * 0.075, 0.16, 0.03));
    else if (["footprints", "dropped-coin", "moving-grass", "moved-box", "opened-door", "puddle-footprints", "mud-avoidance", "quiet-path", "coin-noise"].includes(success)) {
      const pitch = { footprints: 440, "dropped-coin": 784, "moving-grass": 659, "moved-box": 523, "opened-door": 587, "puddle-footprints": 698, "mud-avoidance": 494, "quiet-path": 659, "coin-noise": 880 }[success];
      note(pitch, now, 0.11, 0.025);
    }
    else (success ? [523, 659, 784] : [440]).forEach((f, i) => note(f, now + i * 0.1));
  } catch {
    /* All games also work silently. */
  }
}
export function setSound(value) {
  enabled = value;
  if (!enabled) {
    clearInterval(timer);
    timer = null;
    context?.suspend().catch(() => {});
  } else if (context) sound();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(timer);
    timer = null;
    context?.suspend().catch(() => {});
  } else if (enabled && context) sound();
});
