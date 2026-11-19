# PFT Labyrinth Escape

A 3D maze for learning to read spirometry with the class flowchart. Every junction asks two questions:

1. **Which value do we look at here?** (for example FEV₁/FVC)
2. **Which corridor?** Pick the door whose rule fits the patient, for example `< 75%` or `≥ 75%`.

- **Play:** https://punnawit9285.github.io/pft-labyrinth-escape/
- Made for the RS I Case 1 presentation (idiopathic pulmonary fibrosis): https://punnawit9285.github.io/idiopathic-pulmonary-fibrosis/

## Rules

- Start with **3 hearts**. Each wrong answer costs one. At zero the stage restarts.
- **Three correct answers in a row** earn a booster: **Immune** (the next mistake costs nothing) or **Healer** (+1 heart, up to 3). Boosters wait in the top bar until you tap them.
- **Items**, open any time:
  - **Case**: the patient's report (history and PFT printout). The diagnosis is covered until you escape.
  - **Map**: the class summary flowchart and the lecture flowchart, with the value each diamond checks and every exit covered. A cover opens when you reach that point. Peeking under a cover early resets your streak.
  - **Ref**: formulas (FEV₁/FVC, corrected %FVC, change after bronchodilator) and the severity table, with the table covered.
- Restrictive stages end with one more gate: grade the severity by FVC % predicted.
- Music and sound effects are synthesised in the browser (Web Audio). They start after your first tap and can be switched off.
- Two looks: the default dark teal labyrinth and a **pink** one (rose stone, pink torchlight and portals). Switch with ♥ in the top bar, the Theme button on the title screen, or `T`.

Works on phones (tap a door or a button; the questions sit in a bottom sheet) and computers (`1`–`4` answer, `←` `→` doors, `Enter` continue, `C` `M` `R` items, `T` dark or pink, `Esc` close).

## Stages

| # | Stage | Exit |
| --- | --- | --- |
| 1 | Case 1 · IPF (RS I student presentation 2569) | Pure restriction, moderate |
| 2 | Case 3 · asthma | Reversible obstruction |
| 3 | Case 5 · COPD | Irreversible obstruction |
| 4–8 | Pulmonary function test lecture, examples 2–6 | Normal; irreversible; reversible; restriction (moderate) × 2 |
| 9 | PFT lab, discussion case 2 | Restriction, mild |
| 10 | PFT lab, discussion case 5 | Combined obstruction and restriction |
| 11 | AC79 past exam (PFT question 3) | Small airway disease |

`node tools/validate.js` walks every stage's numbers through the rules and checks it reaches the expected exit.

## The rules used

From the class summary flowchart and the Pulmonary function test lecture (Sanguanwong, 2026), slides 36–41 and 51:

- FEV₁/FVC (actual value) `< 75%` → obstruction branch; `≥ 75%` → check FVC.
- Corrected %FVC = %predicted FVC + (70 − FEV₁/FVC). `≥ 80%` → pure obstruction; `< 80%` → combined obstruction and restriction.
- Pure obstruction: FEV₁ or FVC up `≥ 12%` and `≥ 200 mL` after bronchodilator → reversible; otherwise irreversible.
- FVC `< 80%` predicted → pure restriction (confirm with TLC), graded by FVC: mild ≥ 70, moderate 50–69, severe 35–49, very severe < 35.
- FVC `≥ 80%` → FEF₂₅₋₇₅% `< 65%` → small airway disease; `≥ 65%` → normal.

Thresholds use ≥ so a value exactly on a line has one route.

**Note.** On the lecture's flowchart slide, the corrected %FVC diamond reads "> 80%? Yes → combined". The summary flowchart, and the purpose of the correction, give the opposite (≥ 80% → pure obstruction). The game follows the summary flowchart and says so on the Map.

## Files

- `index.html`, `style.css`: the page and its layout (side panel on wide screens, bottom sheet on phones).
- `js/game.js`: the 3D scene (three.js) and the game flow.
- `js/logic.js`: the flowchart as data, the questions and the rules.
- `js/stages.js`: every stage's numbers, images and explanations.
- `js/map.js`: the Map item (SVG replica of the summary flowchart, covers for the lecture slide).
- `js/audio.js`: music and sound effects.
- `vendor/three.module.min.js`: three.js r170 (MIT, see `vendor/three-LICENSE.txt`), vendored so the game has no runtime CDN dependency.

Static site: serve the folder with any web server (ES modules do not load from `file://`), for example `npx serve .` or `python -m http.server`.

## Credits

Case pages: RS I student presentation handout 2569 (cases 1, 3, 5). Spirometry reports and flowchart: Pulmonary function test lecture, Natthawan Sanguanwong, Department of Physiology, Faculty of Medicine, Chulalongkorn University (2026). Lab cases: PFT lab handout, discussion cases 2 and 5 (numbers transcribed). AC79 RS I recall file (unpublished). Built with three.js.
