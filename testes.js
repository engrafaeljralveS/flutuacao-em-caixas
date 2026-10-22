const fs=require('fs');
const html=fs.readFileSync('./index.html','utf8');
const js=html.slice(html.lastIndexOf('<script>')+8, html.lastIndexOf('</script>'));
new Function(js)();
const {Calc,Arm,DEFAULTS}=globalThis.__test;
// 1) quadro quadrado, carga lateral uniforme p nas paredes: canto = p a²/24
let a=2,p=10,I=1;
let s=Arm.solveFrame(a,a,I,I,I,0,0,()=>p);
console.log('canto lateral', s.top.M[0].toFixed(4), 'esperado', (-p*a*a/24).toFixed(4), 'parede meio', s.wall.M[80].toFixed(4),'esperado',(p*a*a/8-p*a*a/24).toFixed(4));
// 2) só carga no topo, paredes muito rígidas: canto -qL²/12
s=Arm.solveFrame(a,a,I,1e6,I,p,0,()=>0);
console.log('topo engastado', s.top.M[0].toFixed(4), (-p*a*a/12).toFixed(4), 'meio', s.top.M[80].toFixed(4), (p*a*a/24).toFixed(4));
// 3) carga topo e fundo iguais, quadro quadrado igual EI -> simétrico: canto = q a²/24
s=Arm.solveFrame(a,a,I,I,I,p,p,()=>0);
console.log('topo+fundo', s.top.M[0].toFixed(4), (-p*a*a/24).toFixed(4), s.bot.M[0].toFixed(4));
// equilíbrio: soma no canto A (topo vs parede)
s=Arm.solveFrame(2.3,2.3,0.2**3/12,0.2**3/12,0.2**3/12,17,30,y=>10+5*y);
console.log('canto A topo', s.top.M[0].toFixed(4),'parede topo', s.wall.M[0].toFixed(4), ' canto B fundo', s.bot.M[0].toFixed(4),'parede base',s.wall.M[160].toFixed(4));
const st=Object.assign({},DEFAULTS,{fck:30,fyk:500,gmc:1.4,gms:1.15,dl:4,wlim:0.3,q:4,gg:1.4,gq:1.4,psi1:0.4,k0:true,split:false});
const m=Calc.compute(st); const A=Arm.compute(m);
console.log('qtg',A.qtg.toFixed(2),'qbg',A.qbg.toFixed(2),'K',A.K.toFixed(3),'Hc',A.Hc, 'dA',A.dA,'pg base', A.pg(A.dB).toFixed(2));
A.rows.forEach(r=>console.log(r.key.padEnd(10), 'Md',r.Md.toFixed(2),'Ms',r.Ms.toFixed(2),'As',(r.AsCalc||0).toFixed(2),'min',r.AsMin.toFixed(2),'sug',r.sug.phi,r.sug.s,r.sug.As.toFixed(2), r.sug.wk.toFixed(3)));
A.shear.forEach(v=>console.log(v.key,'Vd',v.Vd.toFixed(2)));
