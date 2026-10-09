// Shared synthesized sound effects; no background music or speech.
let context,
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
function clap(start, strength = 1) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.11), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.08 * strength, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.105);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(start);
}
export function sound(success = false) {
  if (!enabled || document.hidden) return;
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
    const now = context.currentTime;
    if (success === "applause") [0, 0.16, 0.34, 0.53].forEach((delay, i) => clap(now + delay, i === 3 ? 0.8 : 1));
    else if (success === "crane-start") [523, 659, 784, 988].forEach((f, i) => note(f, now + i * 0.12, 0.2, 0.05));
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
  if (!enabled) context?.suspend().catch(() => {});
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) context?.suspend().catch(() => {});
});
