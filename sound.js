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
    (success ? [523, 659, 784] : [440]).forEach((f, i) =>
      note(f, now + i * 0.1),
    );
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
