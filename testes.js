// Testes da v2: solver de pórtico com molas de Winkler e cálculo da caixa padrão.
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || './index.html', 'utf8');
const js = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
new Function(js)();
const { Calc, Arm, DEFAULTS } = globalThis.__test;

// 1) Quadro quadrado, só pressão lateral uniforme p = 10 nas paredes: canto = p·a²/24
{
  const md = Arm.buildModel({ S: 2, Hc: 2, ep: 0.2, es: 0.2, ei: 0.2, ba: 0, E: 2.68e7, kv: 30000 });
  md.elems.forEach(e => { e.EA = 1e12; });
  const s = Arm.solveFE(md, { el: md.elems.map(e => e.tag === 'wall' ? [-10, 0, -10, 0] : null), pt: [] });
  const t = Arm.memberValues(md, s, md.top);
  console.log('1) canto (lateral):', t.M[t.M.length - 1].toFixed(4), ' esperado', (-10 * 4 / 24).toFixed(4));
}
// 2) Equilíbrio vertical: soma das reações das molas = carga aplicada
{
  const md = Arm.buildModel({ S: 2.3, Hc: 2.3, ep: 0.2, es: 0.2, ei: 0.2, ba: 0.2, E: 2.68e7, kv: 30000 });
  const s = Arm.solveFE(md, { el: md.elems.map(e => e.tag === 'top' ? [0, -13.5, 0, -13.5] : null), pt: [] });
  let R = 0;
  md.bottom.forEach(k => { const e = md.elems[k]; const L = Math.abs(md.nodes[e.j][0] - md.nodes[e.i][0]); R += -30000 * L * (s.u[3 * e.i + 1] + s.u[3 * e.j + 1]) / 2; });
  console.log('2) reação das molas:', R.toFixed(3), ' carga:', (13.5 * 1.15).toFixed(3));
}
// 3) Caixa padrão
const st = Object.assign({}, DEFAULTS);
const m = Calc.compute(st);
console.time('3) cálculo completo');
const A = Arm.compute(m);
console.timeEnd('3) cálculo completo');
A.rows.forEach(r => console.log('  ' + r.key.padEnd(10), 'Md', r.Md.toFixed(2).padStart(6), 'Ms', r.Ms.toFixed(2).padStart(6), 'As', (r.AsCalc || 0).toFixed(2), 'nec', r.AsReq.toFixed(2), '→ ø', r.sug.phi, 'c/', r.sug.s));
A.shear.forEach(v => console.log('  V ' + v.key.padEnd(8), v.Vd.toFixed(2)));
['B', 'L'].forEach(d => { const f = A.frames[d]; console.log(`  dir ${d}: p,máx ${f.pMax.toFixed(1)} kPa, recalque ${f.wMax.toFixed(2)} mm, molas desligadas: ${f.uplift}`); });
