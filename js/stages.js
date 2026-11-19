/* Stage data for PFT Labyrinth Escape.
   Every number is transcribed from the printout shown in the Case item; the route through the maze is computed from
   these numbers by the rules in game.js (and checked by tools/validate.js against `expect`).
   v.ratio  = FEV1/FVC actual (pre-bronchodilator), %
   v.fvc    = FVC % predicted (pre)
   v.fef    = FEF25-75% % predicted (pre)
   v.fev1   = [pre, post] FEV1 in litres;  v.fvcL = [pre, post] FVC in litres */
window.STAGES = [
  {
    id: 'sgd1', star: true,
    title: 'Case 1 · Idiopathic pulmonary fibrosis',
    tag: 'SGD case', source: 'RS I student presentation 2569, Case 1',
    blurb: '68-year-old man, exertional dyspnea for a year, dry cough, Velcro crackles.',
    images: [
      { src: 'img/case1-history.jpg', cap: 'History and examination', cloze: [{ x: 1.8, y: 17.9, w: 13.4, h: 3.6, t: 'Case 1: ???' }, { x: 1.8, y: 94.0, w: 44, h: 4.6, t: 'Diagnosed: ??? (revealed at the exit)' }] },
      { src: 'img/case1-pft.png', cap: 'Pulmonary function test' }
    ],
    v: { ratio: 89, fvc: 52, fef: 60, fev1: [1.19, 1.23], fvcL: [1.33, 1.36] },
    severity: true,
    expect: { path: ['ratio', 'fvc', 'restr', 'sev'], end: 'restr', sev: 1 },
    final: 'Moderate restrictive pattern, no significant bronchodilator response',
    why: ['FEV&#8321;/FVC 89% &#8594; ไม่ obstruct; FVC 52% &lt; 80% &#8594; restriction; 50&#8211;69% = moderate',
      'หลังยา FEV&#8321; +40 mL (+3%), FVC +30 mL (+2%) &#8594; ไม่ตอบสนอง',
      'FEF&#8322;&#8325;&#8331;&#8327;&#8325;% 60% ไม่ได้ใช้: ถึงช่องนั้นเมื่อ FVC &#8805; 80% เท่านั้น',
      'Spirometry บอกได้แค่ restrictive pattern &#8594; confirm ด้วย TLC; เข้ากับ IPF (ปอดแข็ง compliance ลด ปริมาตรปอดลด)'],
    dx: 'Idiopathic pulmonary fibrosis'
  },
  {
    id: 'sgd3',
    title: 'Case 3 · Wheeze and chest tightness',
    tag: 'SGD case', source: 'RS I student presentation 2569, Case 3',
    blurb: '16-year-old girl, wheeze after cleaning a dusty attic.',
    images: [
      { src: 'img/case3-history.jpg', cap: 'History and examination', cloze: [{ x: 1.8, y: 2.6, w: 17.5, h: 4.2, t: 'Case 3: ???' }, { x: 1.8, y: 90.8, w: 33, h: 4.8, t: 'Diagnosis: ???' }] },
      { src: 'img/case3-pft.png', cap: 'Pulmonary function test' }
    ],
    v: { ratio: 55, fvc: 92, fef: 34, fev1: [1.08, 1.33], fvcL: [1.95, 2.08] },
    expect: { path: ['ratio', 'corr', 'bd', 'rev'], end: 'rev' },
    final: 'Obstructive pattern with significant bronchodilator response (reversible)',
    why: ['FEV&#8321;/FVC 55% &lt; 75% &#8594; obstruction',
      'Corrected %FVC = 92 + (70 &#8722; 55) = 107% &#8805; 80% &#8594; pure obstruction (ไม่มี restriction ร่วม)',
      'FEV&#8321; 1.08 &#8594; 1.33 L = +250 mL (+23%) &#8594; &#8805; 12% และ &#8805; 200 mL = reversible'],
    dx: 'Asthmatic attack'
  },
  {
    id: 'sgd5',
    title: 'Case 5 · 40 pack-years',
    tag: 'SGD case', source: 'RS I student presentation 2569, Case 5',
    blurb: '68-year-old ex-smoker, chronic productive cough, barrel chest.',
    images: [
      { src: 'img/case5-history.jpg', cap: 'History, examination and chest film', cloze: [{ x: 1.8, y: 2.2, w: 15.5, h: 3.2, t: 'Case 5: ???' }, { x: 1.8, y: 56.9, w: 58, h: 3.2, t: 'Diagnosis: ???' }] },
      { src: 'img/case5-pft.png', cap: 'Pulmonary function test' }
    ],
    v: { ratio: 43, fvc: 66, fef: 15, fev1: [0.86, 0.92], fvcL: [2.02, 2.08] },
    expect: { path: ['ratio', 'corr', 'bd', 'irrev'], end: 'irrev' },
    final: 'Obstructive pattern without significant bronchodilator response (irreversible)',
    why: ['FEV&#8321;/FVC 43% &lt; 75% &#8594; obstruction',
      'Corrected %FVC = 66 + (70 &#8722; 43) = 93% &#8805; 80% &#8594; FVC ที่ต่ำอธิบายได้ด้วย air trapping = pure obstruction',
      'FEV&#8321; +60 mL (+7%), FVC +60 mL (+3%) &#8594; irreversible'],
    dx: 'Chronic obstructive pulmonary disease (COPD)'
  },
  {
    id: 'lec2',
    title: 'Lecture example 2',
    tag: 'Lecture', source: 'Pulmonary function test lecture (Sanguanwong, 2026), slide 53',
    blurb: 'Thai male 29 years, Ht 162 cm, Wt 80 kg.',
    images: [{ src: 'img/lec-ex2.jpg', cap: 'Spirometry report' }],
    v: { ratio: 80.53, fvc: 93, fef: 70, fev1: [2.90, 3.01], fvcL: [3.61, 3.49] },
    expect: { path: ['ratio', 'fvc', 'fef', 'norm'], end: 'norm' },
    final: 'Normal spirometry',
    why: ['ใช้ FEV&#8321;/FVC จริง 80.53% (ไม่ใช่ %Pred 93)', 'FVC 93% &#8805; 80%', 'FEF&#8322;&#8325;&#8331;&#8327;&#8325;% 70% &#8805; 65% &#8594; normal'],
    dx: 'Normal'
  },
  {
    id: 'lec3',
    title: 'Lecture example 3',
    tag: 'Lecture', source: 'Pulmonary function test lecture (Sanguanwong, 2026), slide 54',
    blurb: 'Thai male 71 years, Ht 162 cm, Wt 41.4 kg.',
    images: [{ src: 'img/lec-ex3.jpg', cap: 'Spirometry report' }],
    v: { ratio: 41.96, fvc: 81, fef: 15, fev1: [1.01, 1.09], fvcL: [2.40, 2.43] },
    expect: { path: ['ratio', 'corr', 'bd', 'irrev'], end: 'irrev' },
    final: 'Obstructive pattern without significant bronchodilator response',
    why: ['FEV&#8321;/FVC 41.96% &lt; 75%', 'Corrected %FVC = 81 + (70 &#8722; 41.96) = 109% &#8805; 80% &#8594; pure obstruction', 'FEV&#8321; +80 mL (+8%) &#8594; irreversible'],
    dx: 'Irreversible obstruction'
  },
  {
    id: 'lec4',
    title: 'Lecture example 4',
    tag: 'Lecture', source: 'Pulmonary function test lecture (Sanguanwong, 2026), slide 55',
    blurb: 'Thai male 76 years, Ht 169 cm, Wt 62 kg.',
    images: [{ src: 'img/lec-ex4.jpg', cap: 'Spirometry report' }],
    v: { ratio: 53.29, fvc: 100, fef: 33, fev1: [1.69, 1.90], fvcL: [3.17, 3.32] },
    expect: { path: ['ratio', 'corr', 'bd', 'rev'], end: 'rev' },
    final: 'Obstructive pattern with significant bronchodilator response',
    why: ['FEV&#8321;/FVC 53.29% &lt; 75%', 'Corrected %FVC = 100 + (70 &#8722; 53.29) = 117% &#8594; pure obstruction', 'FEV&#8321; 1.69 &#8594; 1.90 L = +210 mL (+12.4%) &#8594; ผ่านทั้ง 12% และ 200 mL = reversible'],
    dx: 'Reversible obstruction'
  },
  {
    id: 'lec5',
    title: 'Lecture example 5',
    tag: 'Lecture', source: 'Pulmonary function test lecture (Sanguanwong, 2026), slide 56',
    blurb: 'Thai male 70 years, Ht 172 cm, Wt 65 kg.',
    images: [{ src: 'img/lec-ex5.jpg', cap: 'Spirometry report' }],
    v: { ratio: 82.81, fvc: 62, fef: 82, fev1: [1.79, 1.93], fvcL: [2.16, 2.15] },
    severity: true,
    expect: { path: ['ratio', 'fvc', 'restr', 'sev'], end: 'restr', sev: 1 },
    final: 'Moderate restrictive pattern',
    why: ['FEV&#8321;/FVC 82.81% &#8805; 75%', 'FVC 62% &lt; 80% &#8594; restriction', '50&#8211;69% = moderate &#8594; confirm ด้วย TLC'],
    dx: 'Restrictive pattern'
  },
  {
    id: 'lec6',
    title: 'Lecture example 6',
    tag: 'Lecture', source: 'Pulmonary function test lecture (Sanguanwong, 2026), slide 57',
    blurb: 'Thai female 70 years, Ht 156 cm, Wt 55.8 kg.',
    images: [{ src: 'img/lec-ex6.jpg', cap: 'Spirometry report' }],
    v: { ratio: 83.11, fvc: 60, fef: 51, fev1: [1.09, 1.08], fvcL: [1.32, 1.31] },
    severity: true,
    expect: { path: ['ratio', 'fvc', 'restr', 'sev'], end: 'restr', sev: 1 },
    final: 'Moderate restrictive pattern',
    why: ['FEV&#8321;/FVC 83.11% &#8805; 75%', 'FVC 60% &lt; 80% &#8594; restriction (moderate)', 'FEF&#8322;&#8325;&#8331;&#8327;&#8325;% 51% ไม่ได้ใช้ เพราะ FVC ต่ำ'],
    dx: 'Restrictive pattern'
  },
  {
    id: 'lab2',
    title: 'PFT lab · Discussion case 2',
    tag: 'Lab', source: 'Pulmonary function test lab handout, discussion case 2 (numbers transcribed)',
    blurb: 'Spirometry printout from the PFT lab.',
    table: {
      head: ['', 'Pred', 'Pre', '%Pred', 'Post', '%Pred'],
      rows: [['FVC (L)', '3.10', '2.30', '74', '2.36', '76'], ['FEV1 (L)', '2.50', '2.02', '81', '2.07', '83'], ['FEV1/FVC (%)', '81', '88', '109', '88', '109'],
        ['FEV1/FEV6 (%)', '', '88', '', '88', ''], ['FEF 25-75% (L/sec)', '2.65', '2.09', '79', '2.12', '80'], ['Expiratory Time (sec)', '', '4.70', '', '4.55', ''], ['PEF (L/min)', '', '230', '', '312', '']]
    },
    v: { ratio: 88, fvc: 74, fef: 79, fev1: [2.02, 2.07], fvcL: [2.30, 2.36] },
    severity: true,
    expect: { path: ['ratio', 'fvc', 'restr', 'sev'], end: 'restr', sev: 0 },
    final: 'Mild restrictive pattern, no significant bronchodilator response',
    why: ['FEV&#8321;/FVC 88% &#8805; 75%', 'FVC 74% &lt; 80% &#8594; restriction', '&#8805; 70% = mild'],
    dx: 'Restrictive pattern'
  },
  {
    id: 'lab5',
    title: 'PFT lab · Discussion case 5',
    tag: 'Lab', source: 'Pulmonary function test lab handout, discussion case 5 (numbers transcribed)',
    blurb: 'Spirometry printout from the PFT lab.',
    table: {
      head: ['', 'Pred', 'Pre', '%Pred', 'Post', '%Pred'],
      rows: [['FVC (L)', '3.10', '1.86', '60', '1.94', '63'], ['FEV1 (L)', '2.48', '1.02', '41', '1.08', '44'], ['FEV1/FVC (%)', '80', '55', '69', '56', '70'],
        ['FEV1/FEV6 (%)', '', '57', '', '58', ''], ['FEF 25-75% (L/sec)', '2.65', '0.48', '18', '0.53', '20'], ['Expiratory Time (sec)', '', '8.20', '', '7.95', ''], ['PEF (L/min)', '', '177', '', '185', '']]
    },
    v: { ratio: 55, fvc: 60, fef: 18, fev1: [1.02, 1.08], fvcL: [1.86, 1.94] },
    expect: { path: ['ratio', 'corr', 'comb'], end: 'comb' },
    final: 'Combined obstructive and restrictive defect',
    why: ['FEV&#8321;/FVC 55% &lt; 75% &#8594; obstruction', 'Corrected %FVC = 60 + (70 &#8722; 55) = 75% &lt; 80% &#8594; FVC ต่ำเกินกว่าที่ obstruction อธิบายได้ = combined', 'ควร confirm restriction ด้วย TLC'],
    dx: 'Combined defect'
  },
  {
    id: 'ac79',
    title: 'Past exam · AC79',
    tag: 'Past exam', source: 'ACidosis MCQs (AC79 RS I), Chapter XI question 3 [unpublished recall file]',
    blurb: 'A 40-year-old male with progressive dyspnea upon exertion for 4 months.',
    table: {
      head: ['Parameter', 'Pre-bronchodilator', '% Predicted'],
      rows: [['FVC', '2.5 L', '80%'], ['FEV1', '2.2 L', '75%'], ['FEF 25-75%', '1.6 L', '50%']]
    },
    v: { ratio: 88, fvc: 80, fef: 50, fev1: [2.2, 2.2], fvcL: [2.5, 2.5] },
    expect: { path: ['ratio', 'fvc', 'fef', 'sad'], end: 'sad' },
    final: 'Small airway disease (key: small airway obstruction)',
    why: ['FEV&#8321;/FVC = 2.2 &#247; 2.5 = 88% (ต้องคำนวณเอง) &#8805; 75%', 'FVC 80% ไม่ต่ำกว่า 80%', 'FEF&#8322;&#8325;&#8331;&#8327;&#8325;% 50% &lt; 65% &#8594; small airway disease'],
    dx: 'Small airway disease'
  }
];
