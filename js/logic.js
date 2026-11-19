/* The class flowchart as data. Each junction asks two things: which value to look at (q1),
   then which corridor that value sends you down (doors). Thresholds use >= so a value exactly on a line has one route.
   Rules follow the summary flowchart from class (swimlane) and the Pulmonary function test lecture:
   FEV1/FVC < 75% = obstruction; corrected %FVC = %pred FVC + (70 - FEV1/FVC), >= 80% = pure obstruction;
   FVC < 80% = restriction; FEF25-75% < 65% = small airway disease; reversible = FEV1 or FVC up >= 12% and >= 200 mL. */
(function (root) {
  'use strict';
  var SUB = { 1: '₁', 2: '₂', 5: '₅', 7: '₇' };
  var FEV1 = 'FEV' + SUB[1], FEF = 'FEF' + SUB[2] + SUB[5] + '₋' + SUB[7] + SUB[5] + '%';
  function r1(x) { return Math.round(x * 10) / 10; }
  function mL(pre, post) { return Math.round((post - pre) * 1000); }
  function pct(pre, post) { return Math.round((post - pre) / pre * 1000) / 10; }
  function bdOf(v) {
    var a = { d: mL(v.fev1[0], v.fev1[1]), p: pct(v.fev1[0], v.fev1[1]) };
    var b = { d: mL(v.fvcL[0], v.fvcL[1]), p: pct(v.fvcL[0], v.fvcL[1]) };
    var ok = function (x) { return x.p >= 12 && x.d >= 200; };
    return { fev1: a, fvc: b, rev: ok(a) || ok(b) };
  }
  function sign(n) { return (n >= 0 ? '+' : '−') + Math.abs(n); }

  var J = {
    ratio: {
      name: FEV1 + '/FVC',
      q1: { q: 'Junction: which value do we check first?', ok: FEV1 + '/FVC ratio (actual value)', bad: ['FVC % predicted', FEF + ' (% predicted)', 'PEF', FEV1 + ' % predicted'],
        why: 'เริ่มที่ <b>' + FEV1 + '/FVC</b> เสมอ เพื่อแยก obstruction ออกก่อน (lower limit ≈ 70–75%) ใช้ค่าจริง ไม่ใช่ %Pred ของ ratio' },
      q2: 'Read ' + FEV1 + '/FVC from the case. Which corridor?',
      doors: [{ t: '< 75%', to: 'corr' }, { t: '≥ 75%', to: 'fvc' }],
      pick: function (v) { return v.ratio < 75 ? 0 : 1; },
      val: function (v) { return FEV1 + '/FVC = ' + v.ratio + '%'; }
    },
    corr: {
      name: 'corrected %FVC',
      q1: { q: 'The ratio is low: obstruction. Which value tells you whether restriction is hiding too?', ok: 'Corrected %FVC', bad: ['FVC % predicted (uncorrected)', FEV1 + ' % predicted', FEF, 'PEF'],
        why: 'Obstruction ทำให้ FVC ต่ำได้จาก air trapping จึงบวกชดเชย <b>(70 − ' + FEV1 + '/FVC)</b> ก่อนเทียบกับ 80%' },
      q2: 'Compute corrected %FVC (formula in Reference). Which corridor?',
      doors: [{ t: '≥ 80%', to: 'bd', via: 'pureobs' }, { t: '< 80%', to: 'comb' }],
      pick: function (v) { return v.fvc + (70 - v.ratio) >= 80 ? 0 : 1; },
      val: function (v) { return 'Corrected %FVC = ' + v.fvc + ' + (70 − ' + v.ratio + ') = ' + r1(v.fvc + 70 - v.ratio) + '%'; }
    },
    fvc: {
      name: '%FVC',
      q1: { q: 'The ratio is normal. Which value do you check next?', ok: 'FVC % predicted', bad: ['Corrected %FVC', FEV1 + ' % predicted', FEF, FEV1 + ' change after bronchodilator'],
        why: 'Ratio ปกติ → ดู <b>FVC</b> ว่าปอดเล็กลง (restrictive pattern) หรือไม่' },
      q2: 'Read FVC % predicted. Which corridor?',
      doors: [{ t: '< 80%', to: 'restr' }, { t: '≥ 80%', to: 'fef' }],
      pick: function (v) { return v.fvc < 80 ? 0 : 1; },
      val: function (v) { return 'FVC = ' + v.fvc + '% of predicted'; }
    },
    bd: {
      name: FEV1 + ' | FVC change',
      q1: { q: 'Pure obstruction. Which value decides reversible or irreversible?', ok: FEV1 + ' or FVC change after bronchodilator', bad: [FEV1 + '/FVC after bronchodilator', FEF + ' after bronchodilator', 'PEF after bronchodilator', 'Corrected %FVC'],
        why: 'Reversible = <b>' + FEV1 + ' หรือ FVC</b> เพิ่มจาก baseline ≥ 12% <b>และ</b> ≥ 200 mL' },
      q2: 'Compare pre and post bronchodilator ' + FEV1 + ' and FVC. Which corridor?',
      doors: [{ t: '≥ 12% and ≥ 200 mL', to: 'rev' }, { t: '< 12% or < 200 mL', to: 'irrev' }],
      pick: function (v) { return bdOf(v).rev ? 0 : 1; },
      val: function (v) { var b = bdOf(v); return FEV1 + ' ' + v.fev1[0].toFixed(2) + ' → ' + v.fev1[1].toFixed(2) + ' L (' + sign(b.fev1.d) + ' mL, ' + sign(b.fev1.p) + '%) · FVC ' + v.fvcL[0].toFixed(2) + ' → ' + v.fvcL[1].toFixed(2) + ' L (' + sign(b.fvc.d) + ' mL, ' + sign(b.fvc.p) + '%)'; }
    },
    fef: {
      name: FEF,
      q1: { q: 'Ratio and FVC are normal. Which value can still be abnormal?', ok: FEF + ' (% predicted)', bad: ['PEF', FEV1 + '/FVC ratio', 'FIF max', 'Expiratory time'],
        why: '<b>' + FEF + '</b> สะท้อน small airways (< 2 mm) และใช้เมื่อ ratio กับ FVC ปกติเท่านั้น' },
      q2: 'Read ' + FEF + ' % predicted. Which corridor?',
      doors: [{ t: '< 65%', to: 'sad' }, { t: '≥ 65%', to: 'norm' }],
      pick: function (v) { return v.fef < 65 ? 0 : 1; },
      val: function (v) { return FEF + ' = ' + v.fef + '% of predicted'; }
    },
    sev: {
      name: 'Severity',
      q1: { q: 'Restrictive pattern. Which value grades its severity?', ok: 'FVC % predicted', bad: [FEV1 + ' % predicted', FEV1 + '/FVC ratio', FEF, 'PEF'],
        why: 'ระดับความรุนแรงของ restrictive pattern ดูจาก <b>FVC %predicted</b> (lecture, ATS/ERS)' },
      q2: 'Grade it. Which gate?',
      doors: [{ t: '≥ 70% · Mild', to: 'end' }, { t: '50–69% · Moderate', to: 'end' }, { t: '35–49% · Severe', to: 'end' }, { t: '< 35% · Very severe', to: 'end' }],
      pick: function (v) { return v.fvc >= 70 ? 0 : v.fvc >= 50 ? 1 : v.fvc >= 35 ? 2 : 3; },
      val: function (v) { return 'FVC = ' + v.fvc + '% of predicted'; }
    }
  };
  var END = {
    rev: 'Reversible obstruction', irrev: 'Irreversible obstruction', comb: 'Combined obstruction & restriction',
    restr: 'Pure restriction', sad: 'Small airway disease', norm: 'Normal', pureobs: 'Pure obstruction'
  };
  /* Walk the flowchart for a stage: the list of nodes visited and the end. */
  function walk(stage) {
    var v = stage.v, node = 'ratio', path = [], guard = 0, sev = null;
    while (guard++ < 10) {
      path.push(node);
      if (J[node]) {
        var i = J[node].pick(v);
        if (node === 'sev') { sev = i; break; }
        node = J[node].doors[i].to;
        continue;
      }
      if (node === 'restr' && stage.severity) { node = 'sev'; continue; }
      break;
    }
    var end = path.indexOf('sev') >= 0 ? 'restr' : path[path.length - 1];
    return { path: path, end: end, sev: sev };
  }
  root.PFT = { J: J, END: END, walk: walk, bdOf: bdOf };
})(typeof window !== 'undefined' ? window : this);
