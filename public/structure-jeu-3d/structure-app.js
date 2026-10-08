import { H, buildMachine, makeMaterials } from './machine3d.js';
import { makeTextures } from './textures.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;
const stage = document.querySelector('three-d-stage');
const { THREE } = await stage.ready;
try {
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const pm = new THREE.PMREMGenerator(stage._renderer);
  stage._scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; stage._scene.environmentIntensity = 0.8;
} catch (e) { console.warn('environnement indisponible', e); }
const TX = makeTextures(THREE);
const mat = makeMaterials(THREE, TX);
let RoundedBox = null;
try { ({ RoundedBoxGeometry: RoundedBox } = await import('three/addons/geometries/RoundedBoxGeometry.js')); } catch (e) { console.warn('arrondis indisponibles', e); }
const R = stage._renderer; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;

// ---------- Modèle 3D : groupe motopompe découpé en sous-ensembles mobiles ----------
const m = buildMachine(THREE, mat, { RoundedBox });
const root = m.root, YB = 0.08, CPL = new THREE.Vector3(-0.062, H, 0), PIV = new THREE.Vector3(-0.24, YB, -0.12);
const G = (name, parent, w) => { const g = new THREE.Group(); g.name = name; parent.add(g); parent.updateMatrixWorld(true); g.position.copy(parent.worldToLocal(w.clone())); g.updateMatrixWorld(true); return g; };
const fixed = (o) => /^(Châssis|Tuyauterie · Supports)/.test(o.userData.part || '');
const isMotor = (o) => /^(Moteur|Roulements · Moteur|Instrumentation · Accéléromètre moteur)/.test(o.userData.part || '') || o.name === 'accelerometre_moteur' || (o.name === 'cage_rot' && o.position.x < -0.1);
const kids = [...root.children];
root.updateMatrixWorld(true);
const machG = G('ensemble_suspendu', root, new THREE.Vector3(0, YB, 0));
const misG = G('moteur_desaligne', machG, CPL);
const looseG = G('moteur_pivot_patte', misG, PIV);
const motorG = G('moteur', looseG, new THREE.Vector3());
const motorShaft = G('arbre_moteur_rot', motorG, new THREE.Vector3(0, H, 0));
for (const o of kids) { if (o === machG) continue; if (fixed(o)) continue; (isMotor(o) ? motorG : machG).attach(o); }
for (const o of [...m.shaft.children]) if (o.position.x < -0.05) motorShaft.attach(o);
const motorCages = m.brgs.filter((c) => c.parent === motorG), pumpCages = m.brgs.filter((c) => c.parent !== motorG);
stage.setObject(root);

{
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshStandardMaterial({ map: TX.floor, roughness: 0.85, metalness: 0, bumpMap: TX.castBump, bumpScale: 0.6 }));
  floor.name = 'sol_atelier'; floor.rotation.x = -Math.PI / 2; floor.position.set(0.05, -0.0005, 0.1); floor.receiveShadow = true; stage._scene.add(floor);
  if (stage._ground) stage._ground.visible = false;
  stage._scene.background = new THREE.Color(0xe5e7eb);
  const k = stage._key; k.position.set(1.6, 2.6, 1.4); k.intensity = 2.4; k.shadow.mapSize.set(4096, 4096); k.shadow.bias = -0.0003; k.shadow.normalBias = 0.002;
  Object.assign(k.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: 0.1, far: 8 }); k.shadow.camera.updateProjectionMatrix(); k.shadow.needsUpdate = true;
  stage._scene.add(k.target); k.target.position.set(0, 0.2, 0);
  stage._scene.add(new THREE.HemisphereLight(0xffffff, 0x8a857c, 0.35));
}
const VIEWS = {
  res: { t: [-0.22, 0.36, 0], p: [0.3, 0.72, 1.45] },
  loose: { t: [-0.3, 0.15, 0.05], p: [-0.95, 0.55, 0.9] },
  mis: { t: [-0.08, 0.25, 0], p: [0.25, 0.75, 0.75] },
};
function home() { const v = VIEWS[st.tab]; stage._controls.target.set(...v.t); stage._camera.position.set(...v.p); stage._controls.update(); }

// Pièces à animer / surligner
const byName = (g, n, f = () => true) => { const r = []; g.traverse((o) => { if (o.name === n && f(o)) r.push(o); }); return r; };
const near = (o, x, z) => Math.abs(o.position.x - x) < 0.01 && (z == null || Math.abs(o.position.z - z) < 0.01);
const looseBolt = byName(motorG, 'vis_patte', (o) => near(o, -0.4, 0.1))[0];
const looseWasher = byName(motorG, 'rondelle_patte', (o) => near(o, -0.4, 0.1))[0];
const looseFoot = byName(motorG, 'patte_moteur', (o) => near(o, -0.4))[0];
const boltY0 = looseBolt.position.y, washY0 = looseWasher.position.y;
const guard = [...(m.cats.get('Accouplement · Protecteur') || [])];
const glow = (list, col, k) => { for (const o of list) { o.material.emissive.set(col); o.material.emissiveIntensity = k; } };
const flash = m.flash; flash.material.color.set(0xef4444); flash.material.opacity = 0.7;
const halo = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 16, 64).rotateY(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4, depthWrite: false }));
halo.name = 'halo_contraintes'; halo.position.copy(CPL); halo.renderOrder = 4; machG.attach(halo);
const arrow = (col) => { const a = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 0.1, col, 0.035, 0.022); a.line.material.linewidth = 2; root.add(a); return a; };
const aF = arrow(0xdc2626), aX = arrow(0x2563eb);
aF.position.set(-0.32, H + 0.24, 0); aX.position.set(-0.32, H + 0.32, 0);
const setArrow = (a, v, s) => { a.setDirection(new THREE.Vector3(0, 0, v >= 0 ? 1 : -1)); a.setLength(Math.max(Math.abs(v) * s, 0.04), 0.05, 0.035); };
// Axes d'arbres (désalignement) : bleu = moteur, vert = pompe
const axis = (name, col, parent) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 1.15, 12).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, depthTest: false, transparent: true, opacity: 0.95 })); o.name = name; o.renderOrder = 6; o.position.set(-0.08, H, 0); root.add(o); parent.attach(o); return o; };
const axM = axis('axe_moteur', 0x2563eb, motorG), axP = axis('axe_pompe', 0x10b981, machG);
// Jeu sous la patte (remplissage rouge) + onde de choc
const gap = new THREE.Mesh(new THREE.BoxGeometry(0.072, 1, 0.245), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75, depthWrite: false })); gap.name = 'jeu_patte'; gap.renderOrder = 5; machG.add(gap);
const shock = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, depthWrite: false, side: THREE.DoubleSide })); shock.name = 'onde_choc'; shock.renderOrder = 5; machG.add(shock);
const frameParts = [...(m.cats.get('Châssis · Châssis mécano-soudé (UPN)') || [])];

// ---------- État ----------
const st = { tab: 'res', rpm: 1000, zeta: 0.15, crit: 1800, loose: 50, mis: 80, misType: 'ang', dir: 'rad', trans: false, sweep: false, th: 0, last: performance.now(), lastLift: 0, flashT: 0 };
const RPM2 = 1500, F2 = RPM2 / 60;
const resp = (rpm) => { const r = rpm / st.crit, D = Math.hypot(1 - r * r, 2 * st.zeta * r); return { r, Q: 1 / D, phi: (Math.atan2(2 * st.zeta * r, 1 - r * r) * 180) / Math.PI }; };

// Jeu mécanique : signal de soulèvement tronqué (le pied claque sur le châssis), DFT sur 2 tours → harmoniques et demi-ordres
function looseLift(th, I) {
  const c = 0.85 - 0.75 * I, s = Math.sin(th), rev = Math.floor(th / TAU) % 2;
  const sub = I > 0.55 ? 1 - (I - 0.55) * 1.6 : 1;
  return Math.max(0, s - c) / (1 - c) * (rev ? sub : 1);
}
function looseLines() {
  const I = st.loose / 100, N = 1024, a = [];
  for (let k = 1; k <= 13; k++) { let re = 0, im = 0; for (let i = 0; i < N; i++) { const th = (2 * TAU * i) / N, y = looseLift(th, I); re += y * Math.cos((k * th) / 2); im += y * Math.sin((k * th) / 2); } a[k] = (2 * Math.hypot(re, im)) / N; }
  const scale = I > 0 ? (4.2 * I) / (a[2] * 2) : 0, L = [];
  for (let k = 1; k <= 12; k++) {
    const ord = k / 2; let v = a[k] * k * scale; if (k === 2) v += 1.6;
    if (v > 0.05) L.push({ f: ord * F2, v, lbl: `${ord}x RPM (${(ord * F2).toFixed(1)}Hz)`, col: k % 2 ? '#a855f7' : '#7c3aed' });
  }
  return L;
}
function misAmps() {
  const I = st.mis / 100, par = st.misType !== 'ang' ? I : 0, ang = st.misType !== 'par' ? I : 0, k = st.misType === 'comb' ? 0.75 : 1;
  const rad = [1.2 + (1.4 * par + 1.6 * ang) * k, (5.2 * par + 1.5 * ang) * k, (1.6 * par + 0.5 * ang) * k];
  const ax = [0.4 + (0.9 * par + 5.4 * ang) * k, (1.3 * par + 2.2 * ang) * k, (0.3 * par + 0.9 * ang) * k];
  return { rad, ax, par: par * k * 0.5, ang: ang * k * 0.4 };
}
function curLines() {
  if (st.tab === 'loose') return looseLines();
  if (st.tab === 'mis') { const A = misAmps()[st.dir], d = st.dir === 'rad' ? 'Radial' : 'Axial'; return A.map((v, i) => ({ f: (i + 1) * F2, v, lbl: `${i + 1}x RPM (${d}) (${((i + 1) * F2).toFixed(1)}Hz)`, col: '#dc2626' })); }
  const q = resp(st.rpm); return [{ f: st.rpm / 60, v: 1.0 * q.Q * (st.rpm / 1500) ** 2, lbl: '1x', col: '#2563eb' }];
}
const overall = (L) => Math.sqrt(L.reduce((s, l) => s + l.v * l.v, 0));
const ZONES = [[1.4, 'A · Bon', '#34d399'], [2.8, 'B · Acceptable', '#a3e635'], [4.5, 'C · Surveillance', '#fbbf24'], [1e9, 'D · Dommageable', '#f87171']];
const zoneOf = (v) => ZONES.find((z) => v < z[0]);

// ---------- Interface ----------
const TXT = {
  res: { expT: 'Résonance structurelle', exp: () => `<p>La <b>résonance</b> apparaît quand la fréquence de rotation coïncide avec une <b>fréquence propre</b> de la structure (ici ${st.crit} RPM). La force de balourd est alors amplifiée par la faible raideur dynamique du massif.</p><p>• <b>Influence 3D :</b> faites glisser la vitesse vers ${st.crit} RPM : l\u2019ensemble moteur-pompe oscille violemment sur son châssis (mouvement amplifié et ralenti). Augmenter l\u2019amortissement écrête le pic.</p><p>• <b>Signature de phase (180°) :</b> la flèche bleue (déplacement) suit la flèche rouge (force) en sous-critique (≈ 0°), est en quadrature au pic (90°), puis s\u2019oppose à la force en sur-critique (≈ 180°).</p>`,
    chT: 'Courbe de réponse fréquentielle (Bode : amplification et phase vs vitesse)', note: 'Cliquez sur la courbe pour choisir la vitesse',
    legend: '<span><i style="background:#dc2626"></i>Force de balourd</span><span><i style="background:#2563eb"></i>Déplacement du massif</span><span>Mouvement amplifié · ralenti</span>' },
  loose: { expT: 'Jeu mécanique de type B (fixation)', exp: () => `<p>Le <b>jeu mécanique</b> (ex. vis de fixation desserrée) produit des impacts métalliques répétitifs à chaque tour de l\u2019arbre.</p><p>• <b>Influence 3D :</b> la patte avant-gauche du moteur est en surbrillance rouge. La vis est dévissée : la patte se soulève puis claque sur la semelle (éclair rouge). Le signal tronqué produit un chapelet d\u2019harmoniques 1x, 2x, 3x… sur le spectre.</p><p>• <b>Au-delà de 55 %</b>, le moteur ne retombe plus de la même façon d\u2019un tour sur l\u2019autre : des <b>sous-harmoniques</b> 0.5x, 1.5x, 2.5x apparaissent, signe d\u2019un jeu avancé.</p>`,
    chT: 'Spectre fréquentiel de diagnostic (FFT · palier moteur, vertical)', note: `Vitesse fixe ${RPM2} RPM (${F2.toFixed(1)} Hz) · mm/s RMS`,
    legend: '<span><i style="background:#dc2626"></i>Patte desserrée</span><span>Soulèvement amplifié ×40 · ralenti</span>' },
  mis: { expT: 'Désalignement d\u2019accouplement', exp: () => `<p>Le <b>désalignement</b> survient quand les axes du moteur et de la pompe ne sont plus colinéaires.</p><p>• <b>Influence 3D :</b> le moteur est décalé et/ou pivoté par rapport à l\u2019axe de la pompe (protecteur masqué). Le halo orange au niveau de l\u2019accouplement pulse deux fois par tour : il illustre les contraintes de cisaillement dans l\u2019étoile élastomère.</p><p>• <b>Parallèle :</b> forte composante <b>2x radiale</b>. <b>Angulaire :</b> forte composante <b>1x axiale</b>, en opposition de phase de part et d\u2019autre de l\u2019accouplement. Basculez la direction de mesure pour comparer.</p>`,
    chT: 'Spectre fréquentiel de diagnostic (FFT · palier moteur côté accouplement)', note: `Vitesse fixe ${RPM2} RPM (${F2.toFixed(1)} Hz) · mm/s RMS`,
    legend: '<span><i style="background:#f97316"></i>Contraintes accouplement</span><span>Décalage amplifié · ralenti</span>' },
};
const seg = (id, fn) => $(id).querySelectorAll('button').forEach((b) => (b.onclick = () => { $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset.v); }));
seg('tabs', (v) => { st.tab = v; st.sweep = false; document.querySelectorAll('[data-tab]').forEach((c) => (c.hidden = c.dataset.tab !== v)); home(); upd(); });
seg('misType', (v) => { st.misType = v; upd(); });
seg('dir', (v) => { st.dir = v; upd(); });
for (const k of ['rpm', 'zeta', 'crit', 'loose', 'mis']) $(k).oninput = (e) => { st[k] = +e.target.value; if (k === 'rpm') st.sweep = false; upd(); };
$('bSweep').onclick = () => { st.sweep = !st.sweep; if (st.sweep && st.rpm >= 2990) st.rpm = 200; upd(); };
$('bHome').onclick = home;
$('bTrans').onclick = () => {
  st.trans = !st.trans; $('bTrans').classList.toggle('on', st.trans);
  for (const o of m.housing) { const mt = o.material; mt.transparent = st.trans || mt.name === 'grille'; mt.opacity = st.trans ? 0.13 : mt.name === 'grille' ? 0.55 : 1; mt.depthWrite = !st.trans; mt.needsUpdate = true; }
};
$('chart').onclick = (e) => {
  if (st.tab !== 'res') return; const r = e.target.getBoundingClientRect(), x = (e.clientX - r.left - 46) / (r.width - 62);
  st.rpm = Math.round(Math.min(3000, Math.max(200, x * 3000)) / 10) * 10; st.sweep = false; upd();
};
const row = (k, v, c = '#f8fafc') => `<div class="r"><span>${k}</span><b style="color:${c}">${v}</b></div>`;
function upd() {
  const T = TXT[st.tab];
  $('expT').textContent = T.expT; $('exp').innerHTML = T.exp(); $('chT').textContent = T.chT; $('chNote').textContent = T.note; $('legend').innerHTML = T.legend;
  $('rpm').value = st.rpm;
  $('vRpm').textContent = `${st.rpm} RPM (${(st.rpm / 60).toFixed(1)} Hz)`; $('vZeta').textContent = st.zeta.toFixed(2); $('vCrit').textContent = `${st.crit} RPM`;
  $('bSweep').textContent = st.sweep ? '■ Arrêter le balayage' : '▶ Simuler un démarrage (200 → 3000 RPM)'; $('bSweep').classList.toggle('on', st.sweep);
  const q = resp(st.rpm), zone = q.r < 0.8 ? ['Sous-critique', '#059669'] : q.r < 1.2 ? ['Zone de résonance', '#dc2626'] : ['Sur-critique', '#d97706'];
  $('kR').textContent = q.r.toFixed(2); $('kQ').textContent = q.Q.toFixed(2) + ' x'; $('kPhi').textContent = Math.round(q.phi) + '°';
  $('kZone').textContent = zone[0]; $('kZone').style.color = zone[1];
  const I = st.loose / 100, LL = looseLines();
  $('vLoose').textContent = st.loose + ' %';
  $('kTorque').textContent = Math.round(210 * (1 - I)) + ' N·m / 210';
  $('kLift').textContent = (0.5 * I).toFixed(2) + ' mm';
  $('kHarm').textContent = LL.filter((l) => Number.isInteger(l.f / F2) && l.v > 0.3).length + ' raies';
  const subs = LL.filter((l) => !Number.isInteger(l.f / F2) && l.v > 0.3); $('kSub').textContent = subs.length ? 'Présentes (' + subs.length + ')' : 'Absentes'; $('kSub').style.color = subs.length ? '#dc2626' : '#059669';
  const M = misAmps(), A = M[st.dir];
  $('vMis').textContent = st.mis + ' %'; $('kPar').textContent = M.par.toFixed(2) + ' mm'; $('kAng').textContent = M.ang.toFixed(2) + ' mm/100 mm';
  $('kRatio').textContent = (A[1] / A[0]).toFixed(2);
  let h = '';
  if (st.tab === 'res') h = row('Vitesse balayée', st.rpm + ' RPM') + row('Facteur d\u2019amplification', q.Q.toFixed(2) + 'x', '#60a5fa') + row('Déphasage', Math.round(q.phi) + '°', '#f87171') + row('État', zone[0], q.r < 0.8 ? '#34d399' : q.r < 1.2 ? '#f87171' : '#fbbf24');
  else if (st.tab === 'loose') h = row('État vis pied avant-gauche', I < 0.05 ? 'Serrée' : I < 0.4 ? 'Couple insuffisant' : 'Desserrée / jeu', I < 0.05 ? '#34d399' : '#f87171') + row('Soulèvement vertical', (0.5 * I).toFixed(2) + ' mm', '#f87171') + row('Raie dominante', LL.length ? LL.reduce((a, b) => (b.v > a.v ? b : a)).lbl.split(' (')[0] : '–', '#c084fc');
  else h = row('Contrainte accouplement', st.misType === 'par' ? 'Cisaillement radial' : st.misType === 'ang' ? 'Wobble angulaire' : 'Combinée', '#fb923c') + row('Désalignement radial', M.par.toFixed(2) + ' mm', '#f87171') + row('Écart angulaire', M.ang.toFixed(2) + ' mm/100', '#f87171') + row('Indicateur', A[1] > A[0] ? '2x > 1x' : '1x dominant', '#fbbf24');
  $('hud').innerHTML = h;
  const LN = curLines(), vg = overall(LN), z = zoneOf(vg), pos = Math.min(vg, 9) / 9 * 100;
  $('sevV').textContent = vg.toFixed(2) + ' mm/s'; $('sevV').style.color = z[2]; $('sevZ').textContent = 'Zone ' + z[1]; $('sevZ').style.color = z[2];
  $('sevM').style.left = pos + '%';
  st.lines = LN; st.vg = vg;
  $('wvT').textContent = st.tab === 'res' ? 'Signal temporel (palier moteur, horizontal)' : st.tab === 'loose' ? 'Signal temporel (palier moteur, vertical)' : `Signal temporel (palier moteur, ${st.dir === 'rad' ? 'radial' : 'axial'})`;
  $('wvN').textContent = st.tab === 'res' ? 'échelle fixe ± 10 mm/s' : st.tab === 'loose' ? 'impacts répétitifs, forme tronquée' : st.misType === 'ang' && st.dir === 'ax' ? 'sinusoïde 1x axiale dominante' : 'motif 1x + 2x par tour';
  for (const o of guard) o.visible = st.tab !== 'mis';
  axM.visible = axP.visible = st.tab === 'mis'; gap.visible = shock.visible = st.tab === 'loose';
  for (const o of frameParts) { o.material.emissive.set(0xdc2626); o.material.emissiveIntensity = 0; }
  aF.visible = aX.visible = st.tab === 'res'; halo.visible = st.tab === 'mis';
  glow([looseFoot, looseBolt, looseWasher], 0xdc2626, st.tab === 'loose' && I > 0 ? 0.55 : 0);
  if (st.tab !== 'loose') { looseBolt.position.y = boltY0; looseWasher.position.y = washY0; looseG.rotation.set(0, 0, 0); }
  if (st.tab !== 'mis') { misG.rotation.set(0, 0, 0); misG.position.z = misBase.z; misG.position.y = misBase.y; }
  if (st.tab !== 'res') machG.rotation.set(0, 0, 0);
  draw();
}
const misBase = misG.position.clone();

// ---------- Graphiques ----------
const noise = Array.from({ length: 400 }, (_, i) => 0.04 + 0.05 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1));
function ctx() {
  const c = $('chart');
  const dpr = window.devicePixelRatio || 1;
  const W = Math.max(300, c.clientWidth || 600);
  const Hh = Math.max(200, +(c.getAttribute('height') || 340));
  const targetW = Math.round(W * dpr);
  const targetH = Math.round(Hh * dpr);
  if (c.width !== targetW || c.height !== targetH) {
    c.width = targetW;
    c.height = targetH;
    c.style.height = Hh + 'px';
  }
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, c.width, c.height);
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { x, W, H: Hh };
}
const L = 46, Rm = 16;
function grid(x, W, y0, y1, nx) { x.strokeStyle = '#f1f5f9'; x.lineWidth = 1; for (let i = 0; i <= nx; i++) { const px = L + ((W - L - Rm) * i) / nx; x.beginPath(); x.moveTo(px, y0); x.lineTo(px, y1); x.stroke(); } for (let i = 0; i <= 4; i++) { const py = y0 + ((y1 - y0) * i) / 4; x.beginPath(); x.moveTo(L, py); x.lineTo(W - Rm, py); x.stroke(); } }
function draw() {
  const { x, W, H: Hh } = ctx(); x.font = '10px ui-monospace,Menlo,monospace';
  if (st.tab === 'res') return drawBode(x, W, Hh);
  const lines = st.tab === 'loose' ? looseLines() : (() => { const A = misAmps()[st.dir], d = st.dir === 'rad' ? 'Radial' : 'Axial'; return A.map((v, i) => ({ f: (i + 1) * F2, v, lbl: `${i + 1}x RPM (${d}) (${((i + 1) * F2).toFixed(1)}Hz)`, col: '#dc2626' })); })();
  const fmax = 160, y0 = 14, y1 = Hh - 28, vmax = 7, X = (f) => L + ((W - L - Rm) * f) / fmax, Y = (v) => y1 - ((y1 - y0) * Math.min(v, vmax)) / vmax;
  grid(x, W, y0, y1, 8);
  x.fillStyle = '#64748b'; x.textAlign = 'center'; for (let f = 0; f <= fmax; f += 20) x.fillText(f + ' Hz', X(f), y1 + 16);
  x.textAlign = 'right'; for (let v = 0; v <= vmax; v += 1.75) x.fillText(v.toFixed(1), L - 6, Y(v) + 3);
  x.strokeStyle = '#cbd5e1'; x.beginPath(); for (let i = 0; i < noise.length; i++) { const px = L + ((W - L - Rm) * i) / (noise.length - 1); i ? x.lineTo(px, Y(noise[i])) : x.moveTo(px, Y(noise[i])); } x.stroke();
  x.strokeStyle = '#0f172a'; x.beginPath(); x.moveTo(L, y1); x.lineTo(W - Rm, y1); x.stroke();
  let lastLblX = -1e9; x.textAlign = 'center';
  for (const l of lines) {
    const px = X(l.f), py = Y(l.v); x.strokeStyle = l.col; x.lineWidth = 2; x.beginPath(); x.moveTo(px, y1); x.lineTo(px, py); x.stroke();
    x.fillStyle = l.col; x.beginPath(); x.arc(px, py, 3.5, 0, TAU); x.fill();
    if (l.v > 0.25 && px - lastLblX > 70) { x.fillStyle = '#0f172a'; x.fillText(l.lbl, px, py - 9); lastLblX = px; }
  }
  x.lineWidth = 1;
}
function drawBode(x, W, Hh) {
  const yA0 = 16, yA1 = Math.round(Hh * 0.52), yP0 = yA1 + 28, yP1 = Hh - 28, rmax = 3000, X = (r) => L + ((W - L - Rm) * r) / rmax;
  const qmax = Math.max(4, Math.ceil(1 / (2 * st.zeta) + 0.5)), YA = (q) => yA1 - ((yA1 - yA0) * Math.min(q, qmax)) / qmax;
  const YP = (p) => yP0 + ((yP1 - yP0) * Math.min(180, Math.max(0, p))) / 180;
  
  // Grille Amplification
  grid(x, W, yA0, yA1, 6);
  
  // Grille Phase (colonnes verticales)
  x.strokeStyle = '#f1f5f9'; x.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const px = L + ((W - L - Rm) * i) / 6;
    x.beginPath(); x.moveTo(px, yP0); x.lineTo(px, yP1); x.stroke();
  }
  // Lignes horizontales de référence de phase : 0°, 45°, 90° (résonance), 135°, 180°
  for (const p of [0, 45, 90, 135, 180]) {
    const py = YP(p);
    x.strokeStyle = (p === 90) ? '#e2e8f0' : (p === 0 || p === 180) ? '#cbd5e1' : '#f8fafc';
    x.lineWidth = (p === 90 || p === 0 || p === 180) ? 1.2 : 0.8;
    x.beginPath(); x.moveTo(L, py); x.lineTo(W - Rm, py); x.stroke();
  }

  // Zone vitesse critique (résonance)
  const fc = X(st.crit);
  x.fillStyle = 'rgba(245,158,11,.12)'; x.fillRect(fc - 12, yA0, 24, yP1 - yA0);
  x.strokeStyle = '#d97706'; x.lineWidth = 1.5; x.setLineDash([4, 4]);
  x.beginPath(); x.moveTo(fc, yA0); x.lineTo(fc, yP1); x.stroke(); x.setLineDash([]);
  x.fillStyle = '#b45309'; x.textAlign = 'left'; x.font = 'bold 10.5px ui-monospace,Menlo,monospace';
  x.fillText(`VITESSE CRITIQUE (${st.crit} RPM)`, Math.min(fc + 8, W - 195), yA0 + 10);
  
  // 1. Courbe d'amplification dynamique
  x.strokeStyle = '#2563eb'; x.lineWidth = 2.2; x.beginPath();
  for (let r = 0; r <= rmax; r += 5) {
    const px = X(r), py = YA(resp(r).Q);
    r === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
  }
  x.stroke();

  // 2. Courbe de déphasage (Bleu roi foncé net, transition continue 0° -> 90° -> 180°)
  x.strokeStyle = '#1d4ed8'; x.lineWidth = 2.2; x.beginPath();
  for (let r = 0; r <= rmax; r += 5) {
    const px = X(r), py = YP(resp(r).phi);
    r === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
  }
  x.stroke();

  // Graduations Y Amplification
  x.lineWidth = 1; x.fillStyle = '#64748b'; x.font = '10px ui-monospace,Menlo,monospace'; x.textAlign = 'right';
  for (let i = 0; i <= 4; i++) x.fillText(((qmax * (4 - i)) / 4).toFixed(1) + 'x', L - 6, yA0 + ((yA1 - yA0) * i) / 4 + 3);
  
  // Graduations Y Phase
  for (const p of [0, 45, 90, 135, 180]) {
    x.fillStyle = (p === 90) ? '#dc2626' : '#64748b';
    x.font = (p === 90) ? 'bold 10px ui-monospace,Menlo,monospace' : '10px ui-monospace,Menlo,monospace';
    x.fillText(p + '°', L - 6, YP(p) + 3);
  }

  // Graduations X RPM
  x.fillStyle = '#64748b'; x.textAlign = 'center'; x.font = '10px ui-monospace,Menlo,monospace';
  for (let r = 0; r <= rmax; r += 500) x.fillText(r + ' RPM', X(r), yP1 + 17);

  // Titres des sous-graphes
  x.textAlign = 'left'; x.fillStyle = '#0f172a'; x.font = 'bold 11px ui-monospace,Menlo,monospace';
  x.fillText('Amplification dynamique (Q)', L + 6, yA0 + 10);
  x.fillText('Déphasage force / déplacement (0° → 180°)', L + 6, yP0 - 7);

  // Curseur de fonctionnement en direct
  const q = resp(st.rpm), px = X(st.rpm);
  x.strokeStyle = '#dc2626'; x.lineWidth = 1.5; x.setLineDash([3, 3]);
  x.beginPath(); x.moveTo(px, yA0); x.lineTo(px, yP1); x.stroke(); x.setLineDash([]);

  // Points rouges sur les courbes avec liseré blanc
  for (const py of [YA(q.Q), YP(q.phi)]) {
    x.fillStyle = '#dc2626'; x.beginPath(); x.arc(px, py, 4.5, 0, TAU); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.5; x.stroke();
  }

  // Étiquettes directes sur le curseur
  x.font = 'bold 10px ui-monospace,Menlo,monospace'; x.fillStyle = '#dc2626';
  const isRight = px > W - 85;
  x.textAlign = isRight ? 'right' : 'left';
  const tx = isRight ? px - 8 : px + 8;
  x.fillText(`${q.Q.toFixed(2)}x`, tx, YA(q.Q) - 4);
  x.fillText(`${Math.round(q.phi)}°`, tx, YP(q.phi) + 3);
}
new ResizeObserver(draw).observe($('chart'));

// ---------- Boucle d'animation ----------
function tick(t) {
  const dt = Math.min((t - st.last) / 1000, 0.05); st.last = t;
  if (st.sweep && st.tab === 'res') { st.rpm = Math.min(3000, st.rpm + dt * 260); if (st.rpm >= 3000) st.sweep = false; st.rpm = Math.round(st.rpm); upd(); }
  const rpm = st.tab === 'res' ? st.rpm : RPM2, vis = st.tab === 'res' ? (rpm / 60) * 0.045 : 0.8; // tours/s affichés (ralenti)
  st.th += dt * vis * TAU; const th = st.th;
  motorShaft.rotation.x = th; m.shaft.rotation.x = th;
  for (const c of [...motorCages, ...pumpCages]) c.rotation.x = th * 0.4;
  if (st.tab === 'res') {
    const q = resp(rpm), ph = (q.phi * Math.PI) / 180, ampF = (rpm / 3000) ** 2, ampX = Math.min(q.Q * ampF, 6);
    machG.rotation.x = 0.011 * ampX * Math.sin(th - ph);
    setArrow(aF, Math.sin(th), 0.2); setArrow(aX, Math.sin(th - ph) * Math.min(1.6, 0.25 + ampX / 2.5), 0.2);
    const heat = Math.max(0, Math.min(1, (st.vg - 1.4) / 4)); for (const o of frameParts) o.material.emissiveIntensity = heat * (0.35 + 0.35 * Math.abs(Math.sin(th - ph)));
  } else if (st.tab === 'loose') {
    const I = st.loose / 100, lift = 0.05 * I * looseLift(th % (2 * TAU), I);
    looseG.rotation.z = -(lift / 0.16) * 0.85; looseG.rotation.x = -(lift / 0.22) * 0.35;
    looseBolt.position.y = boltY0 + 0.03 * I; looseBolt.rotation.y = th * 0.02; looseWasher.position.y = washY0 + 0.02 * I;
    gap.position.set(-0.4, lift / 2, 0); gap.scale.y = Math.max(lift, 1e-4); gap.visible = lift > 2e-4;
    if (st.lastLift > 1e-4 && lift <= 1e-4 && I > 0.02) st.flashT = 1;
    st.lastLift = lift;
    st.flashT = Math.max(0, st.flashT - dt * 4);
    flash.visible = st.flashT > 0; if (flash.visible) { flash.position.set(-0.4, 0.005, 0.1); flash.scale.setScalar(0.015 + 0.05 * (1 - st.flashT) * (0.4 + I)); flash.material.opacity = 0.8 * st.flashT; }
    shock.visible = st.flashT > 0; shock.position.set(-0.4, 0.004, 0.05); shock.scale.setScalar(0.03 + 0.3 * (1 - st.flashT) * (0.3 + I)); shock.material.opacity = 0.9 * st.flashT;
    looseFoot.material.emissiveIntensity = I > 0 ? 0.45 + 0.5 * st.flashT : 0;
  } else {
    const M = misAmps(), wob = Math.sin(2 * th);
    misG.position.z = misBase.z + M.par * 0.1; misG.rotation.y = M.ang * 0.3 + 0.01 * M.ang * wob;
    halo.material.opacity = (0.25 + 0.6 * Math.abs(wob)) * Math.min(1, st.mis / 30 + 0.1);
    halo.scale.setScalar(1 + 0.25 * Math.abs(wob) * st.mis / 100);
    halo.material.color.setHSL(0.07 - 0.07 * Math.abs(wob) * st.mis / 100, 0.95, 0.55);
  }
  if (st.tab !== 'loose') flash.visible = false;
  drawWave(t / 1000);
  requestAnimationFrame(tick);
}
function drawWave(T) {
  const c = $('wave'), dpr = window.devicePixelRatio || 1, W = c.clientWidth, Hh = +(c.getAttribute('height') || 150);
  if (!W) return;
  const targetW = Math.round(W * dpr);
  const targetH = Math.round(Hh * dpr);
  if (c.width !== targetW || c.height !== targetH) {
    c.width = targetW;
    c.height = targetH;
    c.style.height = Hh + 'px';
  }
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, c.width, c.height);
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const L0 = 46, win = 0.2, ym = Hh / 2, sc = (Hh / 2 - 12) / 10, lines = st.lines || [], t0 = (T * 0.05) % 1;
  x.strokeStyle = '#f1f5f9'; for (let i = 0; i <= 8; i++) { const px = L0 + ((W - L0 - 16) * i) / 8; x.beginPath(); x.moveTo(px, 8); x.lineTo(px, Hh - 8); x.stroke(); }
  x.strokeStyle = '#cbd5e1'; x.beginPath(); x.moveTo(L0, ym); x.lineTo(W - 16, ym); x.stroke();
  x.fillStyle = '#64748b'; x.font = '10px ui-monospace,Menlo,monospace'; x.textAlign = 'right';
  for (const v of [10, 0, -10]) x.fillText((v > 0 ? '+' : '') + v, L0 - 6, ym - v * sc + 3);
  const col = st.tab === 'res' ? '#2563eb' : st.tab === 'loose' ? '#7c3aed' : '#dc2626', z = zoneOf(st.vg || 0);
  x.strokeStyle = col; x.lineWidth = 1.6; x.beginPath();
  const N = Math.max(200, Math.round(W - L0));
  for (let i = 0; i <= N; i++) {
    const t = t0 + (win * i) / N; let v = 0;
    lines.forEach((l, k) => { const ph = st.tab === 'loose' ? -k * 0.35 : st.tab === 'mis' ? k * 1.1 : 0; v += Math.SQRT2 * l.v * (st.tab === 'loose' ? Math.cos(TAU * l.f * t + ph) : Math.sin(TAU * l.f * t + ph)); });
    v += 0.12 * Math.sin(i * 7.31) * Math.sin(i * 2.17);
    const px = L0 + ((W - L0 - 16) * i) / N, py = ym - Math.max(-11, Math.min(11, v)) * sc; i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.stroke(); x.lineWidth = 1;
  x.textAlign = 'left'; x.fillStyle = z[2] === '#f87171' ? '#dc2626' : '#0f172a'; x.fillText(`crête ≈ ${(Math.SQRT2 * (st.vg || 0)).toFixed(1)} mm/s · fenêtre ${win * 1000} ms`, L0 + 6, 18);
}
home(); upd(); requestAnimationFrame(tick);
