// Checks that every stage's numbers lead to the expected exit through the flowchart rules.
// Run from the repo root: node tools/validate.js
const fs = require('fs'), vm = require('vm');
const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/stages.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/logic.js', 'utf8'), ctx);
const { STAGES, PFT } = ctx.window;
let bad = 0;
for (const s of STAGES) {
  const w = PFT.walk(s);
  const okPath = JSON.stringify(w.path) === JSON.stringify(s.expect.path);
  const okEnd = w.end === s.expect.end;
  const okSev = s.expect.sev === undefined || w.sev === s.expect.sev;
  const vals = w.path.filter(n => PFT.J[n]).map(n => PFT.J[n].val(s.v)).join(' | ');
  console.log(`${okPath && okEnd && okSev ? 'ok ' : 'BAD'} ${s.id.padEnd(5)} ${w.path.join(' > ')}${w.sev !== null ? ' [sev ' + w.sev + ']' : ''}  ::  ${vals}`);
  if (!(okPath && okEnd && okSev)) bad++;
}
if (bad) { console.log(bad + ' stage(s) disagree'); process.exit(1); }
