/* All sound is synthesised with the Web Audio API: no audio files, nothing to license.
   Music: a slow minor-key loop (Am - F - C - G) with a soft pad, a sparse arpeggio, a low pulse and a quiet
   "breath" of filtered noise every two bars. It starts only after a tap or click, as browsers require. */
const KEY = 'pftlab:mute';
let ctx = null, master, music, sfx, delay, verbIn, playing = false, timer = null, nextT = 0, step = 0;
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { }

const N = n => 440 * Math.pow(2, (n - 69) / 12);
/* chords as MIDI notes: Am, Fmaj7, C, G (low register pad), with arpeggio tones above */
const CH = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]];
const BPM = 72, BEAT = 60 / BPM, STEPS_PER_CHORD = 16; /* 16 eighth notes = 2 bars per chord */

function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(master);
  music = ctx.createGain(); music.gain.value = 0.32; music.connect(comp);
  sfx = ctx.createGain(); sfx.gain.value = 0.55; sfx.connect(comp);
  /* a feedback delay gives the arpeggio its cave-like space */
  delay = ctx.createDelay(1.5); delay.delayTime.value = BEAT * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.38; const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2200;
  delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(music);
  verbIn = ctx.createGain(); verbIn.gain.value = 1; verbIn.connect(delay);
}
function env(g, t, a, peak, d, sus, r, len) {
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(peak * sus, 0.0001), t + a + d);
  g.gain.setValueAtTime(Math.max(peak * sus, 0.0001), t + len);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len + r);
}
function osc(type, f, t, len, peak, dest, opts) {
  opts = opts || {};
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (opts.detune) o.detune.value = opts.detune;
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + len);
  env(g, t, opts.a || 0.01, peak, opts.d || 0.08, opts.s === undefined ? 0.6 : opts.s, opts.r || 0.25, len);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + len + (opts.r || 0.25) + 0.05);
  return g;
}
let noiseBuf = null;
function noise(t, len, peak, dest, f0, f1, q) {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || 1.2; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + len);
  const g = ctx.createGain(); env(g, t, len * 0.45, peak, len * 0.2, 0.7, len * 0.4, len * 0.6);
  s.connect(bp); bp.connect(g); g.connect(dest); s.start(t); s.stop(t + len + 0.5);
}

/* ---------- music scheduler ---------- */
function schedule() {
  while (nextT < ctx.currentTime + 0.25) {
    const chord = CH[Math.floor(step / STEPS_PER_CHORD) % CH.length], s = step % STEPS_PER_CHORD, t = nextT;
    if (s === 0) {
      /* pad: detuned saws through a slowly opening low-pass */
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
      lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(1100, t + BEAT * 4); lp.frequency.linearRampToValueAtTime(420, t + BEAT * 8);
      lp.connect(music);
      chord.slice(0, 4).forEach((n, i) => {
        osc('sawtooth', N(n), t, BEAT * 7.6, 0.05, lp, { a: 1.6, d: 1, s: 0.8, r: 1.8, detune: i % 2 ? 7 : -7 });
      });
      osc('sine', N(chord[0] - 12), t, BEAT * 7.5, 0.22, music, { a: 0.4, d: 1, s: 0.7, r: 1.2 });
      /* the "breath": noise that rises and falls like an inhalation every chord */
      noise(t + BEAT * 0.5, BEAT * 5, 0.05, music, 300, 1400, 0.9);
    }
    if (s % 4 === 0) osc('sine', N(chord[0] - 12), t, 0.18, 0.18, music, { a: 0.005, d: 0.1, s: 0.2, r: 0.2, slide: N(chord[0] - 24) });
    /* sparse arpeggio, deterministic pattern so it feels composed rather than random */
    const pat = [0, -1, 2, -1, 4, -1, 3, 1, 0, -1, 4, -1, 2, 3, -1, 1];
    if (pat[s] >= 0) {
      const n = chord[pat[s]] + 12;
      const g = osc('triangle', N(n), t, BEAT * 0.4, 0.07, music, { a: 0.005, d: 0.15, s: 0.3, r: 0.5 });
      g.connect(verbIn);
    }
    nextT += BEAT / 2; step++;
  }
}
function startMusic() {
  init(); if (!ctx || playing) return;
  playing = true; nextT = ctx.currentTime + 0.1; step = 0;
  timer = setInterval(schedule, 60);
}
function stopMusic() { playing = false; if (timer) clearInterval(timer); timer = null; }

/* ---------- sound effects ---------- */
const FX = {
  tap: t => osc('sine', 880, t, 0.04, 0.12, sfx, { r: 0.08 }),
  right: t => { osc('sine', N(76), t, 0.12, 0.3, sfx, { r: 0.3 }); osc('sine', N(83), t + 0.1, 0.25, 0.3, sfx, { r: 0.5 }); osc('triangle', N(88), t + 0.2, 0.3, 0.12, sfx, { r: 0.6 }); },
  wrong: t => { osc('square', 110, t, 0.22, 0.14, sfx, { slide: 70, r: 0.2 }); noise(t, 0.3, 0.2, sfx, 800, 200, 0.8); },
  hurt: t => { osc('sawtooth', 220, t, 0.35, 0.18, sfx, { slide: 90, r: 0.25 }); },
  shield: t => { osc('sine', N(84), t, 0.3, 0.2, sfx, { r: 0.6 }); osc('sine', N(91), t + 0.05, 0.3, 0.12, sfx, { r: 0.6 }); },
  door: t => { noise(t, 0.9, 0.25, sfx, 200, 2400, 1.5); osc('sine', 140, t, 0.6, 0.12, sfx, { slide: 60, r: 0.3 }); },
  boost: t => [72, 76, 79, 84, 88].forEach((n, i) => osc('triangle', N(n), t + i * 0.07, 0.18, 0.18, sfx, { r: 0.4 })),
  heal: t => [67, 71, 74, 79].forEach((n, i) => osc('sine', N(n), t + i * 0.09, 0.2, 0.22, sfx, { r: 0.5 })),
  win: t => [69, 73, 76, 81, 85, 88].forEach((n, i) => osc('triangle', N(n), t + i * 0.12, 0.35, 0.2, sfx, { r: 0.9 })),
  over: t => [64, 60, 57, 52].forEach((n, i) => osc('sawtooth', N(n), t + i * 0.22, 0.3, 0.08, sfx, { r: 0.5 }))
};
function play(name) { init(); if (!ctx || muted) return; const f = FX[name]; if (f) f(ctx.currentTime + 0.01); }
function setMuted(m) {
  muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) { }
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
  if (!m) startMusic();
}
export const Sound = { init, startMusic, stopMusic, play, setMuted, isMuted: () => muted };
