// Testes da v3.0: motor de elementos finitos de casca e dimensionamento.
// Uso: node testes.js [arquivo.html]   (padrão: ./index.html)
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || './index.html', 'utf8');
new Function(html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>')))();
const { Calc, Arm, FEengine, DEFAULTS } = globalThis.__test;
const FE = FEengine();
const ok = (c, msg) => console.log((c ? '  OK   ' : '  FALHA ') + msg);

// 1) Placa quadrada engastada, carga uniforme (Timoshenko: w = 0,00126 q a⁴/D; M centro = 0,0231 q a², ν = 0,3)
{
  const a = 1, nd = 20, t = 0.01, E = 1e7, nu = 0.3, D = E * t ** 3 / 12 / (1 - nu * nu);
  const nodes = [], elems = [], id = (i, j) => i * (nd + 1) + j;
  for (let i = 0; i <= nd; i++) for (let j = 0; j <= nd; j++) nodes.push([i * a / nd, j * a / nd, 0]);
  for (let i = 0; i < nd; i++) for (let j = 0; j < nd; j++) elems.push({ s: 'top', n: [id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1)], a: a / nd, b: a / nd, t, c: [0, 0, 0] });
  const mesh = { nodes, elems }, edge = p => p[0] < 1e-9 || p[1] < 1e-9 || p[0] > a - 1e-9 || p[1] > a - 1e-9;
  const sys = FE.prepare(mesh, { E, nu }, (n, d) => edge(nodes[n]) || d < 2 || d === 5);
  const F = FE.areaLoad(mesh, sys.eq, sys.n, () => [0, 0, -1]);
  const A = Float64Array.from(sys.a0); FE.factor(A, sys.maxa, sys.n); const U = FE.backsub(A, sys.maxa, sys.n, F);
  const c = id(nd / 2, nd / 2), w = -U[sys.eq[6 * c + 2]] * D;
  const rec = FE.recovery(mesh), M = FE.nodal(rec, FE.gaussValues(mesh, sys.eq, U, { E, nu })).top[8 * rec.surfIdx.top.get(c)];
  console.log('1) Placa engastada');
  ok(Math.abs(w / 0.00126 - 1) < 0.02, `flecha ${w.toFixed(5)} q·a⁴/D (ref. 0,00126)`);
  ok(Math.abs(-M / 0.0231 - 1) < 0.02, `momento no centro ${(-M).toFixed(4)} q·a² (ref. 0,0231)`);
}
// 2) Caixa longa (L = 20 m) só com pressão lateral uniforme p = 10: deve reproduzir o pórtico plano (canto p·a²/24)
{
  const L0 = { K: 0, gd: 0, gp: 0, gw: 0, dw: 99, cT: 0, dA: 1, dB: 3, qtSelf: 0, qtSoil: 0, qChim: 0, qbSelf: 0, uBase: 0, qAba: 0, wallW: 0, q: 0, Kq: 10 };
  const r = FE.analyze({ geo: { Bc: 2, Lc: 20, Hc: 2, ep: 0.2, es: 0.2, ei: 0.2, ba: 0, bo: 0, lo: 0, chimH: 0, h: 0.15 }, mat: { E: 2.5e7, nu: 0.2 }, kv: 3e4, loads: L0, combos: [{ f: [0, 0, 0, 1], lin: true }] });
  const res = r.results[0].res;
  // nó mais próximo de (x, y, z) na superfície s
  const val = (s, x, y, z, k) => { let best = null, dmin = Infinity; r.surfNodes[s].forEach((i, j) => { const p = r.nodes[i], d = Math.hypot(p[0] - x, p[1] - y, p[2] - z); if (d < dmin) { dmin = d; best = res[s][8 * j + k]; } }); return best; };
  const topM = val('top', 0, 0, 2, 0), wallMid = val('wx', 1, 0, 1, 1), wallFace = val('wx', 1, 0, 1.9, 1);
  console.log('2) Caixa longa × pórtico plano');
  ok(Math.abs(topM / 1.6667 - 1) < 0.02, `laje de topo ${topM.toFixed(3)} (ref. 1,667)`);
  ok(Math.abs(-wallMid / 3.3333 - 1) < 0.02, `meio da parede ${(-wallMid).toFixed(3)} (ref. 3,333)`);
  ok(Math.abs(wallFace / 0.7167 - 1) < 0.03, `parede na face da laje ${wallFace.toFixed(3)} (ref. 0,717)`);
}
// 3) Flutuação: conferência manual (coluna inteira sob a área interna, só e_i na aba; solo sobre a laje com γsat, sobre a aba e no prisma com γ′)
{
  const m = Calc.compute(Object.assign({}, DEFAULTS));
  const Binf = 2.9, Linf = 3.3, Aaba = Binf * Linf - 2.5 * 2.9, U = 10 * 1.0 * 2.5 * 2.9 + 10 * 0.2 * Aaba;
  const tg = Math.tan(Math.PI / 6), h = 2.8, ring = t => 2 * t * tg * (Binf + Linf) + 4 * (t * tg) ** 2;
  let Wp = 0; const n = 20000; for (let i = 0; i < n; i++) { const t = (i + 0.5) * h / n; Wp += ring(t) * h / n * (t < 0.8 ? 9 : 17); }
  const Rc = (105 + 47.85) / 1.1, Ro = (105 + 47.85 + 36.25 + 2.5 * 2.9 * 0.5 * 17 + Aaba * (2.0 * 17 + 0.8 * 9)) / 1.1 + Wp / 1.3;
  console.log('3) Flutuação');
  ok(Math.abs(m.sub.U - U) < 1e-6, `subpressão (interna + aba líquida): U = ${m.sub.U.toFixed(2)} kN (manual ${U.toFixed(2)})`);
  ok(Math.abs(m.constr.FS - Rc / U) < 1e-3, `FS construtiva ${m.constr.FS.toFixed(3)} (manual ${(Rc / U).toFixed(3)})`);
  ok(Math.abs(m.oper.FS - Ro / U) < 2e-3, `FS operação ${m.oper.FS.toFixed(3)} (manual ${(Ro / U).toFixed(3)})`);
}
// 4) Caixa padrão: equilíbrio (operação e etapa construtiva), convergência e dimensionamento
{
  const m = Calc.compute(Object.assign({}, DEFAULTS));
  const { inp, aux } = Arm.feInput(m);
  const run = q => { const ro = FE.analyze(q[0]), rc = FE.analyze(q[1]), n0 = ro.results.length, nc = rc.results.length;
    return { ro, rc, r: Object.assign({}, ro, { results: ro.results.concat(rc.results), eluIdx: [...Array(16).keys()].concat([...Array(nc - 1).keys()].map(k => n0 + k)), elsIdx: [16, 17, 18, 19, n0 + nc - 1] }) }; };
  const R1 = run(inp), A = Arm.post(m, R1.r, aux);
  console.log(`4) Caixa padrão: ${R1.ro.stats.nElem} elementos, ${R1.ro.stats.nEq} equações, ${R1.ro.stats.ms + R1.rc.stats.ms} ms (duas etapas)`);
  ok(Math.abs(A.R - A.Fz) / A.Fz < 1e-6, `equilíbrio, operação: reações ${A.R.toFixed(2)} kN = cargas ${A.Fz.toFixed(2)} kN`);
  const cc = R1.rc.results[R1.rc.results.length - 1];
  ok(Math.abs(cc.R - cc.Fz) / Math.abs(cc.Fz) < 1e-6, `equilíbrio, etapa construtiva: reações ${cc.R.toFixed(2)} kN = cargas ${cc.Fz.toFixed(2)} kN`);
  const wall = 2 * (2.3 + 2.7) * 0.2 * 25 * 2.1, top = 13.5 * 2.3 * 2.7 + 13.5 * 0.1 * 2 * (2.3 + 2.7);
  const qC = wall + 5 * 9.57 - 10 * 9.57 + 8 * (9.57 - 2.5 * 2.9);
  ok(Math.abs(cc.Fz - qC) < 0.5, `cargas da etapa construtiva = paredes (altura H) + laje de fundo − subpressão + água sobre a aba = ${qC.toFixed(2)} kN`);
  const S = A.soil, Abot = 2.9 * 3.3;
  ok(Math.abs(S.pMed - A.R / Abot) < 1e-6 && S.pMax >= S.pMed && S.sMax === Math.max(S.pMax, S.pMaxC), `tensão no solo: máx. ${S.pMax.toFixed(1)} kPa (${(S.pMax / 98.0665).toFixed(2)} kgf/cm²), construtiva ${S.pMaxC.toFixed(1)}, média ${S.pMed.toFixed(1)} kPa ≤ σadm ${S.sadm} → ${S.ok}`);
  const q2 = JSON.parse(JSON.stringify(inp)); q2.forEach(x => { x.geo.h = 0.075; });
  const A2 = Arm.post(m, run(q2).r, aux);
  const dif = Math.max(...A.rows.map((x, i) => Math.abs(x.Mmax - A2.rows[i].Mmax) / Math.max(1, A2.rows[i].Mmax)));
  ok(dif < 0.05, `convergência 10 × 7,5 cm: maior diferença nos momentos de dimensionamento ${(dif * 100).toFixed(1)} %`);
  A.rows.forEach(x => console.log('     ' + x.key.padEnd(10), 'Md', x.Md.toFixed(2).padStart(6), 'Nd', x.Nd.toFixed(1).padStart(6), 'Ms', x.Ms.toFixed(2).padStart(6), 'As,nec', x.AsReq.toFixed(2), '→ ø', x.sug.phi, 'c/', x.sug.s));
}
