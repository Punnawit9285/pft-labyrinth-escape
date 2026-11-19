/* PFT Labyrinth Escape: the class spirometry flowchart as a 3D maze.
   Every junction is a room. Question 1: which value do we read here? Question 2: which door does the patient's value open?
   3 hearts, a booster every 3 correct answers in a row, items (Case, Map, Reference) open at any time. */
import * as THREE from '../vendor/three.module.min.js';
import { Sound } from './audio.js';
import { mapSvg, LECTURE_COVERS } from './map.js';

const STAGES = window.STAGES, P = window.PFT, J = P.J;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const LS = {
  get(k, d) { try { const v = localStorage.getItem('pftlab:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pftlab:' + k, JSON.stringify(v)); } catch (e) { } }
};
const REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const LET = 'ABCD';
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

/* ============================== 3D ============================== */
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);
scene.fog = new THREE.FogExp2(0x05080d, 0.034);
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 90);
scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x1a2230, 1.25));
const keyLight = new THREE.PointLight(0x5fd3d6, 24, 30, 1.5); keyLight.position.set(0, 4.4, -1.5); scene.add(keyLight);
const torchL = new THREE.PointLight(0xffb070, 16, 16, 1.6), torchR = torchL.clone();
torchL.position.set(-6.3, 3.1, 1.5); torchR.position.set(6.3, 3.1, 1.5); scene.add(torchL, torchR);

function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
/* stone wall with faint spirometry curves carved into it */
const wallTex = canvasTex(512, 512, (g, w, h) => {
  const r = rng(11);
  g.fillStyle = '#0c121a'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 64) {
    const off = (y / 64) % 2 ? 64 : 0;
    for (let x = -128 + off; x < w; x += 128) {
      const l = 19 + r() * 8; g.fillStyle = `hsl(212, 18%, ${l}%)`; g.fillRect(x + 3, y + 3, 122, 58);
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${r() * .05})`; g.fillRect(x + r() * 124, y + r() * 60, 2, 2); }
    }
  }
  g.strokeStyle = 'rgba(95,211,214,.22)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(60, 430); g.lineTo(84, 300); g.quadraticCurveTo(98, 280, 120, 330); g.lineTo(200, 430); g.quadraticCurveTo(130, 500, 60, 430); g.stroke();
  g.beginPath(); g.moveTo(290, 180); g.quadraticCurveTo(320, 70, 470, 66); g.stroke();
  g.beginPath(); g.moveTo(290, 180); g.lineTo(470, 180); g.stroke();
});
const floorTex = canvasTex(512, 512, (g, w, h) => {
  const r = rng(5);
  g.fillStyle = '#080c12'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 128) for (let x = 0; x < w; x += 128) {
    g.fillStyle = `hsl(210, 14%, ${12 + r() * 6}%)`; g.fillRect(x + 4, y + 4, 120, 120);
  }
  g.strokeStyle = 'rgba(95,211,214,.12)'; g.lineWidth = 2; g.strokeRect(4, 4, w - 8, h - 8);
}, [3, 3]);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: .92, metalness: .04, emissive: 0xffffff, emissiveMap: wallTex, emissiveIntensity: .22 });
const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: .8, metalness: .1, emissive: 0xffffff, emissiveMap: floorTex, emissiveIntensity: .16 });
const ceilMat = new THREE.MeshStandardMaterial({ color: 0x06090e, roughness: 1 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x0d1b22, emissive: 0x2aa6ab, emissiveIntensity: .9, roughness: .4 });
const corrMat = new THREE.MeshBasicMaterial({ color: 0x04070b, side: THREE.BackSide });

function portalMaterial(hex) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { t: { value: 0 }, c: { value: new THREE.Color(hex) }, a: { value: .9 } },
    vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float t; uniform vec3 c; uniform float a; varying vec2 v;' +
      'void main(){ vec2 p = v - vec2(.5, .42); float r = length(p * vec2(1.0, .75));' +
      'float sw = sin(atan(p.y, p.x) * 4.0 + t * 1.7 - r * 16.0) * .5 + .5;' +
      'float g = smoothstep(.82, .0, r); vec3 col = c * (.25 + .75 * sw) * g + c * .18;' +
      'gl_FragColor = vec4(col, a * (g * .85 + .15)); }'
  });
}
function labelTexture(lines, opts) {
  opts = opts || {};
  const w = opts.w || 640, h = opts.h || 200;
  return canvasTex(w, h, (g) => {
    g.fillStyle = opts.bg || 'rgba(5,10,16,.88)';
    const r = 26; g.beginPath(); g.moveTo(r, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r); g.arcTo(w - 4, h - 4, 4, h - 4, r); g.arcTo(4, h - 4, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.closePath(); g.fill();
    g.lineWidth = 6; g.strokeStyle = opts.stroke || '#5fd3d6'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => {
      g.fillStyle = ln.c || '#ffffff';
      g.font = `${ln.w || 600} ${ln.s || 64}px "IBM Plex Sans", "IBM Plex Sans Thai", sans-serif`;
      let size = ln.s || 64;
      while (g.measureText(ln.t).width > w - 50 && size > 22) { size -= 2; g.font = `${ln.w || 600} ${size}px "IBM Plex Sans", sans-serif`; }
      g.fillText(ln.t, w / 2, h * (lines.length === 1 ? .52 : (i + 1) / (lines.length + 1) + (i ? .04 : -.02)));
    });
  });
}

/* ---------- the room ---------- */
const W = 14, D = 14, H = 5.2, NZ = -D / 2, DOOR_H = 3.4;
const room = new THREE.Group(); scene.add(room);
let doors = [], holo = null, holoLabel = null, exitGate = null, dust = null;

function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); room.add(m); return m; }
function disposeRoom() {
  room.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map && o.material.map !== wallTex && o.material.map !== floorTex) o.material.map.dispose(); });
  room.clear(); doors = []; holo = null; holoLabel = null; exitGate = null;
}
function buildRoom(spec) {
  /* spec: { doors: [labels], holo: text, exit: {title, sub} } */
  disposeRoom();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D + 6), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.z = 3; room.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D + 6), ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, 3); room.add(ceil);
  box(.4, H, D + 6, wallMat, -W / 2 - .2, H / 2, 3); box(.4, H, D + 6, wallMat, W / 2 + .2, H / 2, 3);
  /* glowing trim lines along the walls, like a breathing trace */
  box(.06, .06, D + 6, trimMat, -W / 2 + .02, .5, 3); box(.06, .06, D + 6, trimMat, W / 2 - .02, .5, 3);
  /* torches */
  [-1, 1].forEach(s => { const t = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 })); t.position.set(s * (W / 2 - .15), 3.1, 1.5); room.add(t); });
  if (spec.exit) return buildExit(spec.exit);
  const n = spec.doors.length, dw = n > 2 ? 2.5 : 2.9;
  const xs = n === 2 ? [-3.2, 3.2] : n === 3 ? [-4.4, 0, 4.4] : [-5.1, -1.7, 1.7, 5.1];
  /* north wall in pieces around the openings */
  let x0 = -W / 2;
  xs.forEach(x => { const a = x - dw / 2; if (a > x0) box(a - x0, H, .5, wallMat, (x0 + a) / 2, H / 2, NZ); x0 = x + dw / 2; box(dw, H - DOOR_H, .5, wallMat, x, DOOR_H + (H - DOOR_H) / 2, NZ); });
  box(W / 2 - x0, H, .5, wallMat, (x0 + W / 2) / 2, H / 2, NZ);
  spec.doors.forEach((label, i) => {
    const x = xs[i], g = new THREE.Group(); g.position.set(x, 0, NZ); room.add(g);
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(.22, DOOR_H, .7), trimMat); pillarL.position.set(-dw / 2 + .11, DOOR_H / 2, .1);
    const pillarR = pillarL.clone(); pillarR.position.x = dw / 2 - .11;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(dw + .1, .22, .7), trimMat); lintel.position.set(0, DOOR_H, .1);
    g.add(pillarL, pillarR, lintel);
    const mat = portalMaterial(0x2aa6ab);
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(dw - .44, DOOR_H - .12), mat); portal.position.set(0, DOOR_H / 2, .05); g.add(portal);
    const corr = new THREE.Mesh(new THREE.BoxGeometry(dw, DOOR_H, 9), corrMat); corr.position.set(0, DOOR_H / 2, -4.6); g.add(corr);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(n > 2 ? 2.6 : 3.1, n > 2 ? .81 : .97), new THREE.MeshBasicMaterial({ map: labelTexture([{ t: LET[i], s: 46, c: '#5fd3d6' }, { t: label, s: 58 }], { h: 200 }), transparent: true }));
    lab.position.set(0, DOOR_H + .78, .3); g.add(lab);
    const bars = new THREE.Group(); bars.visible = false; g.add(bars);
    const barMat = new THREE.MeshBasicMaterial({ color: 0xff5c5c });
    [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(.16, 3.6, .1), barMat); b.position.set(0, DOOR_H / 2, .25); b.rotation.z = s * .75; bars.add(b); });
    portal.userData.door = i;
    doors.push({ i, x, g, portal, mat, bars, label, state: 'idle' });
  });
  /* the decision diamond: a slowly turning octahedron above a pedestal */
  holo = new THREE.Group(); holo.position.set(0, 0, -2.2); room.add(holo);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.55, .75, 1, 24), new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: .6, metalness: .3 })); ped.position.y = .5; holo.add(ped);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.62, .03, 8, 48), trimMat); ring.rotation.x = Math.PI / 2; ring.position.y = 1.01; holo.add(ring);
  const gem = new THREE.Group(); gem.position.y = 1.85; holo.add(gem);
  gem.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(.62)), new THREE.LineBasicMaterial({ color: 0x5fd3d6 })));
  gem.add(new THREE.Mesh(new THREE.OctahedronGeometry(.4), new THREE.MeshBasicMaterial({ color: 0x5fd3d6, transparent: true, opacity: .3 })));
  holo.userData.gem = gem;
  setHolo(spec.holo || '?');
}
function setHolo(text) {
  if (!holo) return;
  if (holoLabel) { holo.remove(holoLabel); holoLabel.material.map.dispose(); holoLabel.geometry.dispose(); }
  holoLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.0, .62), new THREE.MeshBasicMaterial({ map: labelTexture([{ t: text, s: 60 }], { h: 190, stroke: '#efc04e' }), transparent: true }));
  holoLabel.position.set(0, 2.82, 0); holo.add(holoLabel);
}
function buildExit(ex) {
  box(W, H, .5, wallMat, 0, H / 2, NZ - 6);
  const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), portalMaterial(0xbff6ff)); gate.position.set(0, 2.1, NZ - 5.7); room.add(gate);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.5), new THREE.MeshBasicMaterial({ map: labelTexture([{ t: 'EXIT', s: 40, c: '#efc04e' }, { t: ex.title, s: 66 }], { w: 900, h: 210, stroke: '#efc04e' }), transparent: true }));
  sign.position.set(0, 4.45, NZ - 5.6); room.add(sign);
  exitGate = gate;
}
/* dust drifting in the torchlight */
(function makeDust() {
  const n = 260, pos = new Float32Array(n * 3), r = rng(3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (r() - .5) * W; pos[i * 3 + 1] = r() * H; pos[i * 3 + 2] = (r() - .5) * (D + 4); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9fe8ea, size: .045, transparent: true, opacity: .55, depthWrite: false }));
  scene.add(dust);
})();

/* ---------- camera, view and loop ---------- */
const view = { z: 6.2, y: 1.75, ty: 1.9, fov: 62 };
let portrait = false, panelSide = false;
function layout() {
  const w = innerWidth, h = innerHeight;
  portrait = w <= 820 || w / h < 1;
  panelSide = !portrait;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  /* keep the doors framed: further back and wider on tall screens, and look low so they sit above the bottom sheet */
  view.fov = portrait ? 74 : 60;
  view.z = portrait ? 7.4 + Math.max(0, .9 - w / h) * 3 : 6.2;
  view.ty = portrait ? .55 : 1.9;
  camera.fov = view.fov;
  /* with the side panel, shift the projection so the room centres in the space left of the panel */
  if (panelSide && !$('#panel').hidden) {
    const pw = Math.min(420, w * .38) + 28;
    camera.aspect = (w + pw) / h;
    camera.setViewOffset(w + pw, h, pw, 0, w, h);
  } else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
addEventListener('resize', layout);
const tweens = [];
function tween(ms, fn) {
  return new Promise(res => { if (REDUCE) ms = Math.min(ms, 120); tweens.push({ t0: performance.now(), ms, fn, res }); });
}
let camBase = { x: 0, z: 9 }, look = { x: 0 }, mouse = { x: 0, y: 0 }, idle = true, shake = 0;
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });
const clock = new THREE.Clock();
function frame() {
  const now = performance.now(), dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i], k = Math.min(1, (now - tw.t0) / tw.ms);
    tw.fn(ease(k)); if (k >= 1) { tweens.splice(i, 1); tw.res(); }
  }
  if (holo) { const g = holo.userData.gem; g.rotation.y += dt * .8; g.position.y = 1.85 + Math.sin(t * 1.6) * .07; }
  doors.forEach(d => { d.mat.uniforms.t.value = t; });
  if (exitGate) exitGate.material.uniforms.t.value = t;
  if (dust && !REDUCE) { const p = dust.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * .12; if (y > H) y = 0; p.setY(i, y); } p.needsUpdate = true; }
  const fl = REDUCE ? 1 : .85 + Math.sin(t * 9) * .06 + Math.sin(t * 23) * .04; torchL.intensity = 16 * fl; torchR.intensity = 16 * (1.9 - fl);
  /* idle camera: a slow drift on the title screen, a gentle breath-like bob in game */
  const bob = REDUCE ? 0 : Math.sin(t * 1.3) * .03;
  let cx = camBase.x, cz = camBase.z, cy = view.y + bob;
  if (idle && !REDUCE) { cx += Math.sin(t * .15) * 1.2; }
  if (shake > 0) { cx += (Math.random() - .5) * shake; cy += (Math.random() - .5) * shake; shake = Math.max(0, shake - dt * 1.5); }
  camera.position.set(cx, cy, cz);
  camera.lookAt(look.x + mouse.x * (portrait ? .4 : 1.1), view.ty - mouse.y * .5, NZ);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* tap a door in the scene */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downAt = null;
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 12) return;
  ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(doors.map(d => d.portal))[0];
  if (hit) chooseDoor(hit.object.userData.door);
});
function doorColor(d, hex, a) { d.mat.uniforms.c.value.set(hex); d.mat.uniforms.a.value = a === undefined ? .9 : a; }

/* ============================== GAME ============================== */
let G = null; /* current run */
const panel = $('#panel');
function fresh(stageIdx) {
  return { si: stageIdx, st: STAGES[stageIdx], hearts: 3, shield: 0, inv: { immune: 0, healer: 0 }, streak: 0, node: 'ratio', phase: 'q1', visited: ['start'], open: new Set(), log: [], wrongs: 0, busy: false, peeks: 0 };
}
function hud() {
  const H3 = [0, 1, 2].map(i => `<svg viewBox="0 0 24 22" aria-hidden="true"><path class="h${i < G.hearts ? '' : ' lost'}" d="M12 21 C6 16 1 12 1 7 A5.5 5.5 0 0 1 12 4 A5.5 5.5 0 0 1 23 7 C23 12 18 16 12 21Z"/></svg>`).join('');
  $('#hearts').innerHTML = H3; $('#hearts').setAttribute('aria-label', G.hearts + ' of 3 hearts');
  $('#shield').hidden = !G.shield; $('#shield span').textContent = G.shield > 1 ? '×' + G.shield : '';
  $$('#streak i').forEach((el, i) => el.classList.toggle('on', i < G.streak % 3));
  $('#btnImmune').hidden = !G.inv.immune; $('#btnImmune .n').textContent = G.inv.immune;
  $('#btnHealer').hidden = !G.inv.healer; $('#btnHealer .n').textContent = G.inv.healer;
  $('#stageName').textContent = G.st.title;
  const j = J[G.node];
  $('#stepName').textContent = j ? ('Junction ' + (G.log.filter(l => l.q === 2).length + 1) + ' · ' + (G.phase === 'q1' ? 'which value?' : 'which corridor?')) : '';
}
let toastT = null;
function toast(msg, big) {
  const t = $('#toast'); t.innerHTML = msg; t.classList.toggle('big', !!big); t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), big ? 2600 : 2000);
}
function fade(on) { $('#fade').classList.toggle('on', on); return new Promise(r => setTimeout(r, REDUCE ? 50 : 380)); }
function hurtFlash() { const f = $('#fade'); f.classList.add('hurt'); setTimeout(() => f.classList.remove('hurt'), 180); }

function right() {
  G.streak++;
  Sound.play('right');
  if (G.streak % 3 === 0) setTimeout(offerBoost, 650);
}
function wrong() {
  G.streak = 0; G.wrongs++;
  Sound.play('wrong');
  if (G.shield > 0) { G.shield--; Sound.play('shield'); toast('&#128737;&#65039; Immune absorbed it: no heart lost'); }
  else {
    G.hearts--; Sound.play('hurt'); hurtFlash(); shake = .25;
    const h = $('#hearts'); h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake');
  }
  hud();
  if (G.hearts <= 0) { setTimeout(gameOver, 900); return true; }
  return false;
}
function offerBoost() { if (!G || G.phase === 'end' || G.phase === 'moving') { if (G && G.phase === 'moving') setTimeout(offerBoost, 900); return; } Sound.play('boost'); $('#boost').hidden = false; $('.boostbtn').focus(); }
$$('.boostbtn').forEach(b => b.addEventListener('click', () => {
  G.inv[b.dataset.b]++; $('#boost').hidden = true; hud();
  const btn = b.dataset.b === 'immune' ? $('#btnImmune') : $('#btnHealer'); btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
  toast(b.dataset.b === 'immune' ? 'Immune saved: tap &#128737;&#65039; in the bar to switch it on' : 'Healer saved: tap it in the bar when you need a heart');
}));
$('#btnImmune').addEventListener('click', () => { if (!G || !G.inv.immune) return; G.inv.immune--; G.shield++; Sound.play('shield'); toast('&#128737;&#65039; Immune is on: your next mistake is free'); hud(); });
$('#btnHealer').addEventListener('click', () => {
  if (!G || !G.inv.healer) return;
  if (G.hearts >= 3) { toast('Hearts are already full: keep it for later'); return; }
  G.inv.healer--; G.hearts++; Sound.play('heal'); toast('&#10084;&#65039; +1 heart'); hud();
});

/* ---------- a junction ---------- */
function enterJunction(node) {
  G.node = node; G.phase = 'q1';
  if (G.visited.indexOf(node) < 0) G.visited.push(node);
  const j = J[node];
  buildRoom({ doors: j.doors.map(d => d.t), holo: '?' });
  hud(); askQ1();
}
function askQ1() {
  const j = J[G.node], opts = shuffle([j.q1.ok].concat(shuffle(j.q1.bad).slice(0, 3)));
  G.q1opts = opts;
  panel.innerHTML = `<div class="step">Question 1 of 2 &#183; which value?</div><p class="q">${j.q1.q}</p>` +
    `<ul class="opts">${opts.map((t, i) => `<li><button type="button" class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${t}</span></button></li>`).join('')}</ul>` +
    `<p class="hint">Tip: open <b>Case</b> any time to read the report. <b>Map</b> shows where you are.</p>`;
  showPanel();
  $$('.opt', panel).forEach(b => b.addEventListener('click', () => answerQ1(+b.dataset.i)));
}
function answerQ1(i) {
  if (G.phase !== 'q1' || G.busy) return;
  const j = J[G.node], ok = G.q1opts[i] === j.q1.ok;
  G.phase = 'q1done';
  G.log.push({ node: G.node, q: 1, ok });
  $$('.opt', panel).forEach((b, k) => { b.disabled = true; if (G.q1opts[k] === j.q1.ok) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); else b.classList.add('dim'); });
  G.open.add(G.node); setHolo(j.name);
  const dead = ok ? (right(), false) : wrong();
  hud();
  if (dead) return;
  const fb = document.createElement('div'); fb.className = 'fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<span class="h">${ok ? 'Correct' : 'Not quite. Answer'}: ${j.q1.ok}</span>${j.q1.why}`;
  panel.appendChild(fb);
  const go = document.createElement('button'); go.type = 'button'; go.className = 'btn primary go'; go.textContent = 'Choose a corridor →';
  go.addEventListener('click', askQ2); panel.appendChild(go); go.focus({ preventScroll: true });
  panel.scrollTop = panel.scrollHeight;
}
function askQ2() {
  if (!G || G.phase !== 'q1done') return;
  G.phase = 'q2';
  const j = J[G.node];
  doors.forEach(d => doorColor(d, 0x2fc4c9, 1));
  panel.innerHTML = `<div class="step">Question 2 of 2 &#183; which corridor?</div><p class="q">${j.q2}</p>` +
    `<ul class="opts">${j.doors.map((d, i) => `<li><button type="button" class="opt door" data-i="${i}"><span class="k">${LET[i]}</span><span>${d.t}</span></button></li>`).join('')}</ul>` +
    `<p class="hint">Tap a door in the room or a button here. The value is in <b>Case</b>${G.node === 'corr' || G.node === 'bd' ? '; the formula is in <b>Ref</b>' : ''}.</p>`;
  showPanel(); hud();
  $$('.opt', panel).forEach(b => b.addEventListener('click', () => chooseDoor(+b.dataset.i)));
}
async function chooseDoor(i) {
  if (!G || G.busy) return;
  const j = J[G.node];
  if (G.phase === 'q2fix') { if (i === G.correctDoor) return walkTo(i); toast('Take the glowing corridor ' + LET[G.correctDoor]); return; }
  if (G.phase !== 'q2') return;
  const c = j.pick(G.st.v), ok = i === c;
  G.log.push({ node: G.node, q: 2, ok });
  const btns = $$('.opt', panel);
  btns.forEach((b, k) => { b.disabled = true; if (k === c) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); else b.classList.add('dim'); });
  const fb = document.createElement('div'); fb.className = 'fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = `<span class="h">${ok ? 'Correct corridor' : 'Wrong door. The way is'}: ${j.doors[c].t}</span><span class="val">${j.val(G.st.v)}</span>`;
  if (!ok) {
    doorColor(doors[i], 0xff3b3b, 1); doors[i].bars.visible = true;
    const dead = wrong(); if (dead) return;
    doorColor(doors[c], 0x4fc98b, 1);
    G.phase = 'q2fix'; G.correctDoor = c;
    panel.appendChild(fb);
    const go = document.createElement('button'); go.type = 'button'; go.className = 'btn primary go'; go.textContent = 'Go through ' + LET[c] + ' →';
    go.addEventListener('click', () => walkTo(c)); panel.appendChild(go); go.focus({ preventScroll: true });
    panel.scrollTop = panel.scrollHeight;
    return;
  }
  right(); hud();
  panel.appendChild(fb);
  doors.forEach((d, k) => doorColor(d, k === c ? 0x4fc98b : 0x1a3f44, k === c ? 1 : .35));
  await new Promise(r => setTimeout(r, REDUCE ? 200 : 900));
  walkTo(c);
}
async function walkTo(c) {
  if (G.busy) return; G.busy = true; G.phase = 'moving';
  const j = J[G.node], dest = j.doors[c], d = doors[c];
  Sound.play('door');
  const sx = camBase.x, sz = camBase.z;
  await tween(1100, k => { camBase.x = lerp(sx, d.x, k); camBase.z = lerp(sz, NZ + .8, k); look.x = lerp(0, d.x, k); });
  await Promise.all([fade(true), tween(450, k => { camBase.z = lerp(NZ + .8, NZ - 3, k); })]);
  let to = dest.to;
  if (G.node === 'sev') { G.sevPick = c; return finish('restr'); }
  if (dest.via) { G.visited.push(dest.via); G.open.add(dest.via); toast('Checkpoint: <b>' + P.END[dest.via] + '</b>', true); }
  if (J[to]) { G.busy = false; await arrive(() => enterJunction(to)); return; }
  if (to === 'restr' && G.st.severity) {
    G.visited.push('restr'); G.open.add('restr');
    toast('Checkpoint: <b>Pure restriction</b>. One gate left: how severe?', true);
    G.busy = false; await arrive(() => enterJunction('sev')); return;
  }
  finish(to);
}
async function arrive(build) {
  build();
  camBase.x = 0; look.x = 0; camBase.z = 9.5;
  layout();
  await fade(false);
  await tween(900, k => { camBase.z = lerp(9.5, view.z, k); });
}
async function finish(end) {
  G.phase = 'end'; G.busy = true;
  if (G.visited.indexOf(end) < 0) G.visited.push(end);
  G.open.add(end);
  hidePanel();
  buildRoom({ exit: { title: P.END[end] + (G.sevPick !== undefined ? ' · ' + ['mild', 'moderate', 'severe', 'very severe'][G.sevPick] : '') } });
  camBase.x = 0; look.x = 0; camBase.z = 9.5; layout();
  await fade(false);
  Sound.play('win');
  await tween(1600, k => { camBase.z = lerp(9.5, 2.5, k); });
  const best = LS.get('best:' + G.st.id, -1);
  if (G.hearts > best) LS.set('best:' + G.st.id, G.hearts);
  showEnd(end);
  G.busy = false;
}
function gameOver() {
  G.phase = 'end'; hidePanel(); Sound.play('over');
  const st = G.st;
  $('#endCard').innerHTML = `<div class="endtop"><div class="kick">${st.tag} &#183; ${st.title}</div><div class="ex" style="color:var(--heart)">Out of breath</div>` +
    `<p class="lede">ไม่มีหัวใจเหลือแล้ว ลองใหม่: เปิด <b>Case</b> อ่านค่าก่อนเลือกทาง และใช้ <b>Map</b> ดูว่ากำลังอยู่ช่องไหน</p></div>` +
    `<div class="row"><button type="button" class="btn primary" id="endRetry">Try again</button><button type="button" class="btn" id="endAll">All stages</button></div>`;
  showScreen('scrEnd');
  $('#endRetry').addEventListener('click', () => startStage(G.si)); $('#endAll').addEventListener('click', openStages);
}
function showEnd(end) {
  const st = G.st, next = STAGES[G.si + 1];
  const steps = G.visited.filter(n => J[n]).map(n => `<li><span class="n">${J[n].name}</span><span class="v">${J[n].val(st.v)}</span></li>`).join('');
  const stars = [0, 1, 2].map(i => `<span class="${i < G.hearts ? '' : 'off'}">&#10084;</span>`).join('');
  $('#endCard').innerHTML = `<div class="endtop"><div class="kick">Escaped &#183; ${st.tag} &#183; ${st.title}</div><div class="ex">${st.final}</div><div class="stars" aria-label="${G.hearts} hearts left">${stars}</div></div>` +
    `<ol class="trail">${steps}</ol><ul class="whylist">${st.why.map(w => `<li>${w}</li>`).join('')}</ul>` +
    `<div class="dx">Case diagnosis: <b>${st.dx}</b></div>` +
    (st.id === 'sgd1' ? `<p class="fine">Full Case 1 presentation: <a href="https://punnawit9285.github.io/idiopathic-pulmonary-fibrosis/" style="color:var(--teal)">punnawit9285.github.io/idiopathic-pulmonary-fibrosis</a></p>` : '') +
    `<p class="fine">Source: ${st.source}</p>` +
    `<div class="row">${next ? '<button type="button" class="btn primary" id="endNext">Next: ' + next.title + ' →</button>' : ''}<button type="button" class="btn" id="endRetry">Play again</button><button type="button" class="btn" id="endAll">All stages</button></div>`;
  showScreen('scrEnd');
  if (next) $('#endNext').addEventListener('click', () => startStage(G.si + 1));
  $('#endRetry').addEventListener('click', () => startStage(G.si)); $('#endAll').addEventListener('click', openStages);
}

/* ---------- items ---------- */
let ovKind = null, ovTab = 0;
function openItem(kind, tab) {
  if (!G) return;
  ovKind = kind; ovTab = tab || 0;
  $('#overlay').hidden = false;
  $$('.item').forEach(b => b.classList.remove('on'));
  ({ case: $('#btnCase'), map: $('#btnMap'), ref: $('#btnRef') })[kind].classList.add('on');
  drawItem();
  $('#ovClose').focus({ preventScroll: true });
}
function closeItem() { $('#overlay').hidden = true; ovKind = null; $$('.item').forEach(b => b.classList.remove('on')); }
function tabs(names) {
  $('#ovTabs').innerHTML = names.map((n, i) => `<button type="button" class="tab${i === ovTab ? ' on' : ''}" data-t="${i}">${n}</button>`).join('');
  $$('#ovTabs .tab').forEach(b => b.addEventListener('click', () => { ovTab = +b.dataset.t; drawItem(); }));
}
function peekArm(el, reveal) {
  /* first tap arms the cover, second tap opens it and resets the streak */
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (!el.classList.contains('arm')) { $$('.arm').forEach(a => a.classList.remove('arm')); el.classList.add('arm'); el.dataset.was = el.innerHTML; el.innerHTML = 'Peek? resets streak'; return; }
    G.streak = 0; G.peeks++; hud(); reveal(); Sound.play('tap'); toast('Peeked: streak reset');
  });
}
function drawItem() {
  const st = G.st, body = $('#ovBody');
  if (ovKind === 'case') {
    $('#ovTitle').textContent = 'Case';
    const parts = st.images ? st.images.map(im => im.cap) : ['Spirometry report'];
    tabs(parts);
    if (st.images) {
      const im = st.images[ovTab] || st.images[0], done = G.phase === 'end';
      body.innerHTML = `<div class="zoombar"><span>${st.blurb}</span><button type="button" class="btn" id="zoomBtn">Zoom</button></div>` +
        `<div class="imgwrap" id="imgwrap"><img src="${im.src}" alt="${im.cap}">` +
        (im.cloze || []).map(c => `<span class="cl${done ? ' open' : ''}" style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${c.h}%">${c.t}</span>`).join('') + '</div>' +
        `<p class="srcnote">${st.source}. Covers hide the diagnosis until you escape.</p>`;
      $('#zoomBtn').addEventListener('click', () => $('#imgwrap').classList.toggle('zoom'));
      $$('.cl', body).forEach(c => c.addEventListener('click', () => toast('The diagnosis opens when you reach the exit')));
    } else {
      body.innerHTML = `<div class="zoombar"><span>${st.blurb}</span></div><table class="ptable"><thead><tr>${st.table.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>` +
        st.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') + `</tbody></table><p class="srcnote">${st.source}.</p>`;
    }
  } else if (ovKind === 'map') {
    $('#ovTitle').textContent = 'Map';
    tabs(['Summary flowchart', 'Lecture flowchart']);
    if (ovTab === 0) {
      body.innerHTML = mapSvg(G.open, G.visited, G.phase === 'end' ? null : G.node) +
        `<p class="mapnote">Yellow dot = you are here. Covered boxes open as you reach them; tap one to peek (resets your streak). Thresholds use &#8805;: a value exactly on the line goes the &#8805; way.</p>`;
      $$('.mnode.covered', body).forEach(g => peekArmSvg(g));
    } else {
      body.innerHTML = `<div class="imgwrap"><img src="img/lecture-algorithm.jpg" alt="Interpretation of Spirometry flowchart from the lecture">` +
        LECTURE_COVERS.map((c, i) => `<span class="cl${G.open.has(c.k) ? ' open' : ''}" data-i="${i}" style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${c.h}%">?</span>`).join('') + '</div>' +
        `<p class="mapnote">Pulmonary function test lecture, slide 38 (Sanguanwong, 2026). Covers open when you reach that box. Note: at <i>Corrected %FVC</i> this slide&#8217;s Yes/No arrows read the opposite way to the summary flowchart; the game follows the summary flowchart (&#8805; 80% = pure obstruction, &lt; 80% = combined).</p>`;
      $$('.cl', body).forEach(el => { if (!el.classList.contains('open')) peekArm(el, () => { el.classList.add('open'); }); });
    }
  } else if (ovKind === 'ref') {
    $('#ovTitle').textContent = 'Reference';
    tabs(['Formulas']);
    body.innerHTML = `<div class="ref">` +
      `<div class="card"><h3>FEV&#8321;/FVC ratio</h3><p><code>FEV&#8321; &#247; FVC &#215; 100</code>. Use the patient&#8217;s actual (Pre) value, not the %Pred column of the ratio.</p></div>` +
      `<div class="card"><h3>Corrected %FVC</h3><p><code>%predicted FVC + (70 &#8722; FEV&#8321;/FVC)</code>. Used only when the ratio is low, to see whether a low FVC is just air trapping.</p></div>` +
      `<div class="card"><h3>Change after bronchodilator</h3><p><code>mL = Post &#8722; Pre</code> &#183; <code>% = (Post &#8722; Pre) &#247; Pre &#215; 100</code>. Check FEV&#8321; and FVC.</p></div>` +
      `<div class="card"><h3>Severity of a restrictive pattern (FVC %predicted)</h3><table class="rtable"><tr><td>Mild</td><td><span class="cz">&#8805; 70</span></td></tr><tr><td>Moderate</td><td><span class="cz">50&#8211;69</span></td></tr><tr><td>Severe</td><td><span class="cz">35&#8211;49</span></td></tr><tr><td>Very severe</td><td><span class="cz">&lt; 35</span></td></tr></table></div>` +
      `<div class="card"><h3>Remember</h3><p>Spirometry only suggests restriction: confirm it with <span class="cz">TLC (lung volumes)</span>.</p></div>` +
      `<p class="fine">Pulmonary function test lecture (Sanguanwong, 2026), slides 38&#8211;41 and 51; ERS/ATS interpretive standard (Stanojevic et al., 2022). Tap a blank twice to peek (resets your streak).</p></div>`;
    $$('.cz', body).forEach(el => { if (G.phase === 'end') { el.classList.add('open'); return; } el.addEventListener('click', () => { if (el.classList.contains('open')) return; if (!el.classList.contains('arm')) { $$('.arm').forEach(a => a.classList.remove('arm')); el.classList.add('arm'); toast('Tap again to peek: resets your streak'); return; } el.classList.remove('arm'); el.classList.add('open'); G.streak = 0; G.peeks++; hud(); toast('Peeked: streak reset'); }); });
  }
}
function peekArmSvg(g) {
  g.addEventListener('click', () => {
    const k = g.getAttribute('data-k');
    if (!g.classList.contains('arm')) { $$('.mnode.arm').forEach(a => a.classList.remove('arm')); g.classList.add('arm'); toast('Tap the same box again to peek: resets your streak'); return; }
    G.open.add(k); G.streak = 0; G.peeks++; hud(); drawItem(); toast('Peeked: streak reset');
  });
}
$('#btnCase').addEventListener('click', () => openItem('case'));
$('#btnMap').addEventListener('click', () => openItem('map'));
$('#btnRef').addEventListener('click', () => openItem('ref'));
$('#ovClose').addEventListener('click', closeItem);
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeItem(); });

/* ---------- screens ---------- */
function showScreen(id) { $$('.screen').forEach(s => { s.hidden = s.id !== id; }); }
function hideScreens() { $$('.screen').forEach(s => { s.hidden = true; }); }
function showPanel() { panel.hidden = false; layout(); }
function hidePanel() { panel.hidden = true; layout(); }
function openStages() {
  G = null; idle = true; hidePanel(); $('#hud').hidden = true; closeItem();
  buildRoom({ doors: ['< 75%', '≥ 75%'], holo: 'FEV₁/FVC' });
  camBase.x = 0; camBase.z = 8; look.x = 0;
  $('#stageGrid').innerHTML = STAGES.map((s, i) => {
    const best = LS.get('best:' + s.id, -1);
    return `<button type="button" class="scard${s.star ? ' star' : ''}" data-i="${i}"><span class="tg">${i + 1} &#183; ${s.tag}${s.star ? ' &#183; start here' : ''}</span><b>${s.title}</b><small>${s.blurb}</small>` +
      `<span class="best${best < 0 ? ' none' : ''}">${best < 0 ? 'not played yet' : '&#10084;'.repeat(best) + '&#9825;'.repeat(3 - best)}</span></button>`;
  }).join('');
  $$('.scard').forEach(b => b.addEventListener('click', () => startStage(+b.dataset.i)));
  showScreen('scrStages');
  const first = $('.scard'); if (first) first.focus({ preventScroll: true });
}
async function startStage(i) {
  Sound.init(); if (!Sound.isMuted()) Sound.startMusic();
  G = fresh(i); idle = false; hideScreens(); closeItem(); $('#boost').hidden = true;
  $('#hud').hidden = false;
  await fade(true);
  enterJunction('ratio');
  camBase.x = 0; look.x = 0; camBase.z = 9.5; layout();
  await fade(false);
  await tween(1000, k => { camBase.z = lerp(9.5, view.z, k); });
  toast('Open <b>Case</b> to read the patient&#8217;s report', true);
}
function musicLabel() { const m = Sound.isMuted(); $('#btnMusic2 span').textContent = m ? 'off' : 'on'; $('#btnMusic').style.opacity = m ? .45 : 1; }
function toggleMusic() { Sound.init(); Sound.setMuted(!Sound.isMuted()); if (Sound.isMuted()) Sound.stopMusic(); musicLabel(); }
$('#btnMusic').addEventListener('click', toggleMusic);
$('#btnMusic2').addEventListener('click', toggleMusic);
$('#btnPlay').addEventListener('click', () => { Sound.init(); if (!Sound.isMuted()) Sound.startMusic(); openStages(); });
$('#btnHow').addEventListener('click', () => showScreen('scrHow'));
$('#btnHowOk').addEventListener('click', () => showScreen(G ? 'scrStages' : 'scrTitle'));
$('#btnStagesBack').addEventListener('click', () => showScreen('scrTitle'));
$('#btnMenu').addEventListener('click', () => { if (G && G.phase !== 'end' && !confirm('Leave this labyrinth? Progress in this stage is lost.')) return; openStages(); });

/* ---------- keys ---------- */
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === 'Escape') { if (!$('#overlay').hidden) { closeItem(); e.preventDefault(); } return; }
  if (!$('#boost').hidden) { if (k === '1') $$('.boostbtn')[0].click(); if (k === '2') $$('.boostbtn')[1].click(); return; }
  if (!G || G.phase === 'end' || !$('#overlay').hidden) return;
  if (k === 'c' || k === 'C') return openItem('case');
  if (k === 'm' || k === 'M') return openItem('map');
  if (k === 'r' || k === 'R') return openItem('ref');
  const n = parseInt(k, 10);
  if (n >= 1 && n <= 4) {
    if (G.phase === 'q1') answerQ1(n - 1);
    else if (G.phase === 'q2' || G.phase === 'q2fix') chooseDoor(n - 1);
    return;
  }
  if ((k === 'ArrowLeft' || k === 'ArrowRight') && (G.phase === 'q2' || G.phase === 'q2fix')) {
    if (J[G.node].doors.length === 2) chooseDoor(k === 'ArrowLeft' ? 0 : 1);
    return;
  }
  if (k === 'Enter' && document.activeElement === document.body) { const go = $('.go', panel); if (go) go.click(); }
});

/* ---------- start ---------- */
layout();
buildRoom({ doors: ['< 75%', '≥ 75%'], holo: 'FEV₁/FVC' });
camBase.z = 8;
musicLabel();
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!G) buildRoom({ doors: ['< 75%', '≥ 75%'], holo: 'FEV₁/FVC' }); });
/* test hook: lets an automated check play the game without guessing coordinates */
window.__pft = { get G() { return G; }, startStage, answerQ1, askQ2, chooseDoor, openItem, closeItem, openStages };
