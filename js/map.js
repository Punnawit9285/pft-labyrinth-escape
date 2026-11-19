/* The Map item: the class summary flowchart (swimlane) drawn as SVG, plus the lecture's full flowchart as an image.
   Anything that would answer a question straight away is covered: the value each diamond checks, and every exit.
   A cover opens when you reach that point, or when you peek (which resets your streak). */
const LANES = [
  { k: 'obs', name: 'Obstruction', y: 0, h: 235, fill: '#13223a' },
  { k: 'res', name: 'Restriction', y: 235, h: 190, fill: '#2b1a22' },
  { k: 'sad', name: 'Small airway', y: 425, h: 110, fill: '#2a2414' },
  { k: 'wnl', name: 'WNL', y: 535, h: 105, fill: '#14271d' }
];
const NODES = {
  start: { k: 'c', x: 80, y: 345, r: 17 },
  ratio: { k: 'd', x: 215, y: 345, w: 170, h: 84, l: ['FEV₁/FVC', 'ratio'] },
  corr: { k: 'd', x: 215, y: 235, w: 170, h: 84, l: ['corrected', '%FVC'] },
  pureobs: { k: 'b', x: 420, y: 105, w: 150, h: 46, l: ['Pure obstruction'], c: '#22385c' },
  bd: { k: 'd', x: 630, y: 105, w: 180, h: 90, l: ['FEV₁ | FVC', 'change'] },
  rev: { k: 'b', x: 880, y: 40, w: 160, h: 44, l: ['Reversible'], c: '#22385c' },
  irrev: { k: 'b', x: 880, y: 175, w: 160, h: 44, l: ['Irreversible'], c: '#22385c' },
  comb: { k: 'b', x: 470, y: 235, w: 190, h: 52, l: ['Combined obstruction', '& restriction'], c: '#35294d' },
  fvc: { k: 'd', x: 470, y: 345, w: 150, h: 80, l: ['%FVC'] },
  restr: { k: 'b', x: 720, y: 345, w: 170, h: 48, l: ['Pure restriction'], c: '#4a2530' },
  fef: { k: 'd', x: 470, y: 480, w: 160, h: 76, l: ['FEF₂₅₋₇₅%'] },
  sad: { k: 'b', x: 720, y: 480, w: 190, h: 46, l: ['Small airway disease'], c: '#4a3d17' },
  norm: { k: 'b', x: 470, y: 590, w: 150, h: 44, l: ['Normal'], c: '#1f4630' }
};
const EDGES = {
  e0: { a: 'start', b: 'ratio', p: [[97, 345], [130, 345]] },
  e1: { a: 'ratio', b: 'corr', p: [[215, 303], [215, 277]], t: '< 75%', at: [226, 296], an: 'start' },
  e2: { a: 'corr', b: 'pureobs', p: [[215, 193], [215, 105], [345, 105]], t: '≥ 80%', at: [226, 150], an: 'start' },
  e3: { a: 'corr', b: 'comb', p: [[300, 235], [375, 235]], t: '< 80%', at: [337, 225] },
  e4: { a: 'pureobs', b: 'bd', p: [[495, 105], [540, 105]] },
  e5: { a: 'bd', b: 'rev', p: [[630, 60], [630, 40], [800, 40]], t: '≥ 12% & ≥ 200 mL', at: [716, 30] },
  e6: { a: 'bd', b: 'irrev', p: [[630, 150], [630, 175], [800, 175]], t: '< 12% or < 200 mL', at: [716, 166] },
  e7: { a: 'ratio', b: 'fvc', p: [[300, 345], [395, 345]], t: '≥ 75%', at: [347, 335] },
  e8: { a: 'fvc', b: 'restr', p: [[545, 345], [635, 345]], t: '< 80%', at: [590, 335] },
  e9: { a: 'fvc', b: 'fef', p: [[470, 385], [470, 442]], t: '≥ 80%', at: [481, 418], an: 'start' },
  e10: { a: 'fef', b: 'sad', p: [[550, 480], [625, 480]], t: '< 65%', at: [587, 470] },
  e11: { a: 'fef', b: 'norm', p: [[470, 518], [470, 568]], t: '≥ 65%', at: [481, 548], an: 'start' }
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* open: Set of node keys whose label is visible; visited: node keys on the player's path; here: current node */
export function mapSvg(open, visited, here) {
  let h = '<svg class="mapsvg" viewBox="0 0 1000 640" role="img" aria-label="Class spirometry flowchart with covered answers">' +
    '<defs><marker id="ma" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L8,3.5 L0,7 Z" fill="#8f9bb0"/></marker>' +
    '<marker id="mal" markerWidth="12" markerHeight="12" refX="9" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L10,4.5 L0,9 Z" fill="#5fd3d6"/></marker></defs>';
  LANES.forEach(l => {
    h += `<rect x="0" y="${l.y}" width="1000" height="${l.h}" fill="${l.fill}" stroke="#ffffff1a"/><rect x="0" y="${l.y}" width="34" height="${l.h}" fill="#ffffff0d"/>` +
      `<text transform="translate(18 ${l.y + l.h / 2}) rotate(-90)" text-anchor="middle" dominant-baseline="central" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="600" fill="#a6b0c2">${l.name}</text>`;
  });
  Object.keys(EDGES).forEach(k => {
    const e = EDGES[k], on = visited.indexOf(e.a) >= 0 && visited.indexOf(e.b) >= 0;
    h += `<polyline points="${e.p.map(p => p.join(',')).join(' ')}" fill="none" stroke="${on ? '#5fd3d6' : '#8f9bb0'}" stroke-width="${on ? 3.5 : 1.6}" marker-end="url(#${on ? 'mal' : 'ma'})"/>`;
    if (e.t) h += `<text x="${e.at[0]}" y="${e.at[1]}" text-anchor="${e.an || 'middle'}" dominant-baseline="central" font-family="IBM Plex Mono, monospace" font-size="13.5" font-weight="${on ? 700 : 500}" fill="${on ? '#5fd3d6' : '#a6b0c2'}">${esc(e.t)}</text>`;
  });
  Object.keys(NODES).forEach(k => {
    const n = NODES[k], isOpen = open.has(k) || k === 'start', on = visited.indexOf(k) >= 0, cur = k === here;
    const stroke = cur ? '#efc04e' : on ? '#5fd3d6' : '#8f9bb0', sw = cur || on ? 3.2 : 1.6;
    let shape;
    if (n.k === 'c') shape = `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="#0b121b" stroke="${stroke}" stroke-width="${sw}"/>`;
    else if (n.k === 'd') shape = `<polygon points="${n.x},${n.y - n.h / 2} ${n.x + n.w / 2},${n.y} ${n.x},${n.y + n.h / 2} ${n.x - n.w / 2},${n.y}" fill="${isOpen ? '#0b121b' : '#1d2a38'}" stroke="${stroke}" stroke-width="${sw}" ${isOpen ? '' : 'stroke-dasharray="6 4"'}/>`;
    else shape = `<rect x="${n.x - n.w / 2}" y="${n.y - n.h / 2}" width="${n.w}" height="${n.h}" rx="9" fill="${isOpen ? n.c : '#1d2a38'}" stroke="${stroke}" stroke-width="${sw}" ${isOpen ? '' : 'stroke-dasharray="6 4"'}/>`;
    const lines = isOpen ? (n.l || []) : (n.k === 'c' ? [] : ['? tap to peek']);
    const y0 = n.y - (lines.length - 1) * 9;
    h += `<g class="mnode${isOpen ? '' : ' covered'}" data-k="${k}" style="cursor:${isOpen ? 'default' : 'pointer'}">${shape}` +
      lines.map((t, i) => `<text x="${n.x}" y="${y0 + i * 18}" text-anchor="middle" dominant-baseline="central" font-family="${isOpen ? 'IBM Plex Sans, sans-serif' : 'IBM Plex Mono, monospace'}" font-size="${isOpen ? 16 : 12}" font-weight="${isOpen ? 500 : 600}" fill="${isOpen ? '#e8edf5' : '#5fd3d6'}">${esc(t)}</text>`).join('') +
      (cur ? `<circle cx="${n.x}" cy="${n.y - (n.h || 34) / 2 - 12}" r="7" fill="#efc04e"><animate attributeName="r" values="5;9;5" dur="1.4s" repeatCount="indefinite"/></circle>` : '') + '</g>';
  });
  return h + '</svg>';
}

/* Cover boxes over the lecture slide (percent of lecture-algorithm.jpg). key = what the box hides. */
export const LECTURE_COVERS = [
  { k: 'ratio', x: 45.3, y: 27.9, w: 9.9, h: 9.4 },
  { k: 'fvc', x: 24.4, y: 28.6, w: 9.4, h: 7.6 },
  { k: 'corr', x: 65.0, y: 27.4, w: 8.9, h: 10.2 },
  { k: 'fef', x: 6.4, y: 61.0, w: 9.2, h: 10.2 },
  { k: 'bd', x: 65.0, y: 59.6, w: 9.6, h: 15.4 },
  { k: 'norm', x: 4.8, y: 29.0, w: 12.0, h: 7.4 },
  { k: 'norm', x: 22.9, y: 62.8, w: 10.0, h: 7.2 },
  { k: 'restr', x: 21.5, y: 44.2, w: 12.0, h: 12.4 },
  { k: 'sev', x: 33.7, y: 43.2, w: 20.2, h: 23.0 },
  { k: 'comb', x: 81.4, y: 26.0, w: 15.0, h: 11.6 },
  { k: 'pureobs', x: 61.5, y: 45.6, w: 15.2, h: 7.0 },
  { k: 'irrev', x: 83.1, y: 62.7, w: 15.4, h: 13.0 },
  { k: 'sad', x: 1.8, y: 78.8, w: 17.2, h: 9.6 },
  { k: 'rev', x: 58.0, y: 79.8, w: 23.4, h: 8.8 }
];
