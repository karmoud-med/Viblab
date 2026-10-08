// Calculatrices & abaques : ISO 10816-3 (8 colonnes), conversions D/V/A, fréquences, roulements, équilibrage.
export const TOOLS = { iso: 'ISO 10816-3', conv: 'Conversions', freq: 'Fréquences', brg: 'Roulements', bal: 'Équilibrage' };
const S = {
  tool: 'iso', big: false,
  iso: { col: '2r', rpm: 1480, pts: [{ l: 'Palier 1 H', v: 3.2 }] },
  conv: { val: 4.5, q: 'v', u: 'mm/s', det: 'rms', f: 25, fu: 'Hz' },
  freq: { rpm: 1500, b: 6, z: 23 },
  brg: { n: 9, bd: 7.94, pd: 39.04, ang: 0, rpm: 1480 },
  bal: { oA: 6.2, oP: 120, tA: 4.8, tP: 45, m: 15, a: 90 },
};
let host = null;
const f2 = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');
const num = (s) => parseFloat(String(s).replace(',', '.'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const inp = (k, l, v, u = '', step = 'any') => `<label class="fl">${l}${u ? ` (${u})` : ''}<input data-k="${k}" type="number" step="${step}" value="${v}"></label>`;
const sel = (k, l, cur, opts) => `<label class="fl">${l}<select data-k="${k}">${opts.map(([v, t]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;

export function openTool(t, pre = {}) {
  S.tool = t;
  if (t === 'iso' && pre.v !== undefined) { S.iso.col = `${pre.g}${pre.s}`; S.iso.pts = [{ l: 'Énoncé', v: pre.v }]; }
  else if (t === 'conv') Object.assign(S.conv, { val: pre.val, q: pre.kind || 'v', u: { d: 'µm', v: 'mm/s', a: 'g' }[pre.kind || 'v'], det: pre.kind === 'd' ? 'pp' : 'rms', f: pre.f, fu: 'Hz' });
  else Object.assign(S[t], pre);
  renderCalc(null, true);
}

export function renderCalc(el, flash) {
  host = el || host; if (!host || !host.isConnected) return;
  const t = S.tool;
  host.classList.toggle('big', S.big);
  host.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px">
      <p class="mt" style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0">Calculatrice &amp; abaques</p>
      <button class="back" data-big>${S.big ? '⤡ Réduire' : '⤢ Agrandir'}</button></div>
    <div class="tabs">${Object.entries(TOOLS).map(([k, l]) => `<button data-t="${k}" class="${k === t ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div>${BODY[t]()}</div><div id="cOut"></div>`;
  if (flash) { host.style.boxShadow = '0 0 0 3px #c4b5fd'; setTimeout(() => (host.style.boxShadow = ''), 900); }
  host.querySelector('[data-big]').onclick = () => { S.big = !S.big; renderCalc(); };
  host.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { S.tool = b.dataset.t; renderCalc(); }));
  host.querySelectorAll('[data-k]').forEach((i) => (i.oninput = i.onchange = (e) => {
    const k = i.dataset.k, v = i.tagName === 'SELECT' ? i.value : num(i.value);
    if (t === 'iso' && (k === 'grp' || k === 'fd')) { const [g, f] = S.iso.col.split(''); S.iso.col = k === 'grp' ? v + f : g + v; return renderCalc(); }
    if (t === 'conv' && k === 'q') { S.conv.q = v; S.conv.u = UNITS[v][0][0]; return renderCalc(); }
    S[t][k] = v; refresh();
  }));
  host.querySelectorAll('[data-pi]').forEach((i) => (i.oninput = () => { const p = S.iso.pts[+i.dataset.pi]; p[i.dataset.pf] = i.dataset.pf === 'v' ? num(i.value) : i.value; refresh(); }));
  host.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { S.iso.pts.splice(+b.dataset.del, 1); renderCalc(); }));
  const add = host.querySelector('[data-add]'); if (add) add.onclick = () => { S.iso.pts.push({ l: `Point ${S.iso.pts.length + 1}`, v: 2 }); renderCalc(); };
  refresh();
}
function refresh() {
  const o = host.querySelector('#cOut'); o.innerHTML = OUT[S.tool]();
  o.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => { S.iso.col = b.dataset.col; renderCalc(); }));
  if (S.tool === 'conv') drawNomo(o.querySelector('canvas'));
}

// ---------- ISO 10816-3 ----------
const LIM = { '1r': [2.3, 4.5, 7.1], '1f': [3.5, 7.1, 11], '2r': [1.4, 2.8, 4.5], '2f': [2.3, 4.5, 7.1], '3r': [2.3, 4.5, 7.1], '3f': [3.5, 7.1, 11], '4r': [1.4, 2.8, 4.5], '4f': [2.3, 4.5, 7.1] };
const COLS = ['4r', '4f', '3r', '3f', '2r', '2f', '1r', '1f'];
const BND = [0, 0.71, 1.4, 2.3, 2.8, 3.5, 4.5, 7.1, 11, 18];
const ZCOL = ['#00b050', '#ffff00', '#ff9933', '#ff0000'];
const ZTXT = [['A', 'Machine neuve', 'New machine condition'], ['B', 'Fonctionnement illimité à long terme', 'Unlimited long-term operation allowable'], ['C', 'Fonctionnement limité à court terme', 'Short-term operation allowable'], ['D', 'Vibration provoquant des dommages', 'Vibration causes damage']];
const zoneOf = (col, v) => { const L = LIM[col]; return v <= L[0] ? 0 : v <= L[1] ? 1 : v <= L[2] ? 2 : 3; };
const yOf = (v) => { v = Math.min(Math.max(v, 0), 18); let i = 0; while (i < 8 && v > BND[i + 1]) i++; return ((i + (v - BND[i]) / (BND[i + 1] - BND[i])) / 9) * 100; };
const GRP = [['1', 'Groupe 1 : grandes machines 300 kW – 50 MW / moteurs H ≥ 315 mm'], ['2', 'Groupe 2 : machines moyennes 15 – 300 kW / moteurs 160 ≤ H < 315 mm'], ['3', 'Groupe 3 : pompes > 15 kW, arbre intermédiaire / courroie'], ['4', 'Groupe 4 : pompes > 15 kW, entraînement direct']];

const BODY = {
  iso: () => { const c = S.iso, [g, f] = c.col.split('');
    return `<div class="f2">${sel('grp', 'Type de machine', g, GRP)}${sel('fd', 'Fondation', f, [['r', 'Rigide'], ['f', 'Flexible']])}</div>
      <div class="f2">${inp('rpm', 'Vitesse de rotation', c.rpm, 'tr/min', '10')}<div class="fl">Mesures (vitesse RMS, mm/s)<span style="font-weight:400;color:#64748b">Chaque point est placé sur l\u2019abaque.</span></div></div>
      <div class="pts">${c.pts.map((p, i) => `<div class="pt"><input data-pi="${i}" data-pf="l" value="${esc(p.l)}"><input data-pi="${i}" data-pf="v" type="number" step="0.1" value="${p.v}"><span class="mono">mm/s</span><button data-del="${i}" title="Supprimer" ${c.pts.length < 2 ? 'disabled' : ''}>×</button></div>`).join('')}
      <button class="addpt" data-add>+ Ajouter un point de mesure</button></div>`; },
  conv: () => { const c = S.conv;
    return `<div class="f2">${sel('q', 'Grandeur connue', c.q, [['d', 'Déplacement'], ['v', 'Vitesse'], ['a', 'Accélération']])}${sel('u', 'Unité', c.u, UNITS[c.q])}</div>
      <div class="f2">${inp('val', 'Valeur', c.val)}${sel('det', 'Détection', c.det, [['rms', 'Efficace (RMS)'], ['pk', 'Crête (0-pk)'], ['pp', 'Crête-crête (pk-pk)']])}</div>
      <div class="f2">${inp('f', 'Fréquence', c.f)}${sel('fu', 'Unité fréquence', c.fu, [['Hz', 'Hz'], ['CPM', 'CPM (tr/min)']])}</div>`; },
  freq: () => { const c = S.freq; return `<div class="f2">${inp('rpm', 'Vitesse', c.rpm, 'tr/min ou CPM')}${inp('b', 'Nombre d\u2019aubes B', c.b, '', '1')}</div>${inp('z', 'Nombre de dents Z', c.z, '', '1')}<div style="height:12px"></div>`; },
  brg: () => { const c = S.brg; return `<div class="f2">${inp('n', 'Nombre d\u2019éléments n', c.n, '', '1')}${inp('rpm', 'Vitesse', c.rpm, 'tr/min')}${inp('bd', 'Diamètre bille Bd', c.bd, 'mm')}${inp('pd', 'Diamètre primitif Pd', c.pd, 'mm')}</div>${inp('ang', 'Angle de contact', c.ang, '°')}<div style="height:12px"></div>`; },
  bal: () => { const c = S.bal; return `<div class="f2">${inp('oA', 'O : amplitude', c.oA, 'mm/s')}${inp('oP', 'O : phase', c.oP, '°')}${inp('tA', 'T : amplitude', c.tA, 'mm/s')}${inp('tP', 'T : phase', c.tP, '°')}${inp('m', 'Masse d\u2019essai Mₜ', c.m, 'g')}${inp('a', 'Angle de pose Mₜ', c.a, '°')}</div>`; },
};

function isoChart(c) {
  const pts = c.pts.filter((p) => Number.isFinite(p.v));
  const col = (k) => `<div class="icol ${k === c.col ? 'on' : ''}" data-col="${k}" title="Groupe ${k[0]} ${k[1] === 'r' ? 'rigide' : 'flexible'}">
      ${[8, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => { const z = zoneOf(k, (BND[i] + BND[i + 1]) / 2), first = zoneOf(k, (BND[i + 1] + (BND[i + 2] ?? 99)) / 2) !== z || i === 8;
        return `<div class="icell" style="background:${ZCOL[z]}">${k === c.col && first ? `<b style="color:${z === 3 ? '#fff' : '#0f172a'}">${'ABCD'[z]}</b>` : ''}</div>`; }).join('')}
      ${k === c.col ? pts.map((p, i) => `<div class="imk ${COLS.indexOf(k) >= 4 ? 'l' : ''}" style="bottom:${yOf(p.v)}%"><span>${esc(p.l)} · ${f2(p.v, 1)}</span></div>`).join('') : ''}</div>`;
  const ax = (fn) => `<div class="iax">${BND.slice(1, 9).map((b) => `<span style="bottom:${yOf(b)}%">${fn(b)}</span>`).join('')}</div>`;
  const ft = (txt, span, on) => `<div class="ift ${on ? 'on' : ''}" style="grid-column:span ${span}">${txt}</div>`;
  const g = c.col[0];
  return `<div class="iwrap"><div class="igrid">
    <div class="ichart">${COLS.map(col).join('')}${ax((b) => f2(b, b < 1 ? 2 : 1).replace(',0', '').replace(',10', ',1'))}${ax((b) => f2(b / 25.4, 2))}</div>
    <div class="ifoot">
      ${COLS.map((k) => ft(k[1] === 'r' ? 'rigide' : 'flexible', 1, k === c.col)).join('')}${ft('<b>Fondation</b>', 2)}
      ${ft('Pompes > 15 kW<br>radiales, axiales, diagonales', 4, g === '3' || g === '4')}${ft('Machines moyennes<br>15 kW &lt; P &lt; 300 kW', 2, g === '2')}${ft('Grandes machines<br>300 kW &lt; P &lt; 50 MW', 2, g === '1')}${ft('<b>Type de machine</b>', 2)}
      ${ft('Entraînement direct', 2, g === '4')}${ft('Arbre intermédiaire /<br>entraînement courroie', 2, g === '3')}${ft('Moteurs<br>160 mm &lt; H &lt; 315 mm', 2, g === '2')}${ft('Moteurs<br>315 mm ≤ H', 2, g === '1')}${ft('', 2)}
      ${['4', '3', '2', '1'].map((x) => ft(`<b>Groupe ${x}</b>`, 2, g === x)).join('')}${ft('<b>Groupe</b>', 2)}
    </div></div>
    <div class="iunits"><span>mm/s RMS</span><span>in/s RMS</span></div></div>`;
}

const OUT = {
  iso: () => {
    const c = S.iso, L = LIM[c.col], pts = c.pts.filter((p) => Number.isFinite(p.v)), band = c.rpm > 600 ? '10 – 1000 Hz' : '2 – 1000 Hz';
    const worst = pts.reduce((a, p) => (!a || p.v > a.v ? p : a), null), wz = worst ? zoneOf(c.col, worst.v) : 0, next = L[wz];
    return `${isoChart(c)}
      <div class="ilegend">${ZTXT.map(([z, fr, en], i) => `<div><i style="background:${ZCOL[i]};color:${i === 3 ? '#fff' : '#0f172a'}">${z}</i><span>${fr}<small>${en}</small></span></div>`).join('')}</div>
      ${worst ? `<div class="zone" style="background:${ZCOL[wz]};color:${wz === 3 ? '#fff' : '#0f172a'}">Zone ${ZTXT[wz][0]} · ${ZTXT[wz][1]} (point le plus élevé : ${esc(worst.l)}, ${f2(worst.v, 2)} mm/s)</div>` : ''}
      <table class="itab"><tr><th>Point</th><th>mm/s RMS</th><th>in/s RMS</th><th>Zone</th></tr>
        ${pts.map((p) => { const z = zoneOf(c.col, p.v); return `<tr><td>${esc(p.l)}</td><td>${f2(p.v, 2)}</td><td>${f2(p.v / 25.4, 3)}</td><td><i class="zb" style="background:${ZCOL[z]};color:${z === 3 ? '#fff' : '#0f172a'}">${'ABCD'[z]}</i></td></tr>`; }).join('')}</table>
      <div class="out" style="margin-top:10px">
        <div><span>Limites A/B · B/C · C/D</span><b>${L.map((x) => f2(x, 1)).join(' · ')} mm/s</b></div>
        <div><span>Équivalent impérial</span><b>${L.map((x) => f2(x / 25.4, 2)).join(' · ')} in/s</b></div>
        ${worst && wz < 3 ? `<div><span>Marge avant la zone ${'ABCD'[wz + 1]}</span><b>${f2(next - worst.v, 2)} mm/s (${Math.round(((next - worst.v) / next) * 100)} %)</b></div>` : ''}
        <div><span>Alarme recommandée (≤ 1,25 × B/C)</span><b>${f2(Math.min(1.25 * L[1], L[2]), 2)} mm/s</b></div>
        <div><span>Déclenchement (≤ 1,25 × C/D)</span><b>${f2(1.25 * L[2], 2)} mm/s</b></div>
        <div><span>Bande de mesure (${Math.round(c.rpm)} tr/min)</span><b>${band}</b></div>
      </div>
      <p class="note">Vitesse vibratoire efficace mesurée sur les paliers, directions radiales et axiale. Cliquez une colonne de l\u2019abaque pour changer de groupe ou de fondation.</p>`;
  },
  conv: () => {
    const R = convAll(S.conv), c = S.conv, det = ['rms', 'pk', 'pp'], dl = { rms: 'RMS', pk: 'Crête', pp: 'Crête-crête' };
    const row = (q, name, mU, iU, mf, iF, d1, d2) => `<tr><th>${name}</th>${det.map((d) => `<td class="${c.q === q && c.det === d ? 'hit' : ''}"><b>${f2(R[q][d] * mf, d1)}</b> ${mU}<small>${f2(R[q][d] * iF, d2)} ${iU}</small></td>`).join('')}</tr>`;
    return `<table class="ctab"><tr><th></th>${det.map((d) => `<th>${dl[d]}</th>`).join('')}</tr>
        ${row('d', 'Déplacement', 'µm', 'mils', 1, 1 / 25.4, 2, 3)}
        ${row('v', 'Vitesse', 'mm/s', 'in/s', 1, 1 / 25.4, 3, 4)}
        ${row('a', 'Accélération', 'm/s²', 'g', 1, 1 / 9.80665, 3, 4)}</table>
      <div class="out" style="margin:10px 0"><div><span>Fréquence</span><b>${f2(R.f, 3)} Hz · ${f2(R.f * 60, 0)} CPM · ω = ${f2(R.w, 2)} rad/s</b></div>
        <div><span>Période</span><b>${f2(1000 / R.f, 3)} ms</b></div></div>
      <p class="mt" style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin:6px 0">Nomogramme D-V-A (valeurs RMS)</p>
      <canvas height="300" style="border:1px solid #e2e8f0;border-radius:8px"></canvas>
      <p class="note">Sinusoïde pure : crête = √2 × RMS, crête-crête = 2 × crête, V = ω·D, A = ω·V (ω = 2πf), 1 g = 9,80665 m/s², 1 mil = 25,4 µm, 1 in/s = 25,4 mm/s. Pour un signal complexe, ces facteurs ne s\u2019appliquent qu\u2019à chaque raie prise séparément.</p>`;
  },
  freq: () => { const c = S.freq, f = c.rpm / 60;
    return `<div class="out"><div><span>1x rotation</span><b>${f2(f)} Hz · ${Math.round(c.rpm)} CPM</b></div><div><span>2x · 3x</span><b>${f2(2 * f)} · ${f2(3 * f)} Hz</b></div><div><span>BPF = B × f</span><b>${f2(c.b * f, 1)} Hz · ${Math.round(c.b * c.rpm)} CPM</b></div><div><span>GMF = Z × f</span><b>${f2(c.z * f, 1)} Hz</b></div><div><span>Période 1x</span><b>${f2(1000 / f, 1)} ms</b></div></div>`; },
  brg: () => { const c = S.brg, f = c.rpm / 60, r = (c.bd / c.pd) * Math.cos((c.ang * Math.PI) / 180);
    const o = (c.n / 2) * f * (1 - r), i = (c.n / 2) * f * (1 + r), b = (c.pd / (2 * c.bd)) * f * (1 - r * r), t = (f / 2) * (1 - r);
    return `<div class="out"><div><span>BPFO (bague ext.)</span><b>${f2(o)} Hz · ${f2(o / f)}x</b></div><div><span>BPFI (bague int.)</span><b>${f2(i)} Hz · ${f2(i / f)}x</b></div><div><span>BSF (élément)</span><b>${f2(b)} Hz · ${f2(b / f)}x</b></div><div><span>FTF (cage)</span><b>${f2(t)} Hz · ${f2(t / f)}x</b></div></div>
      <p class="note">BPFO = n/2·f·(1 − Bd/Pd·cos α) · BPFI = n/2·f·(1 + Bd/Pd·cos α) · BSF = Pd/(2Bd)·f·(1 − (Bd/Pd·cos α)²) · FTF = f/2·(1 − Bd/Pd·cos α)</p>`; },
  bal: () => { const c = S.bal, V = (A, p) => [A * Math.cos((p * Math.PI) / 180), A * Math.sin((p * Math.PI) / 180)];
    const O = V(c.oA, c.oP), T = V(c.tA, c.tP), M = V(c.m, c.a), E = [T[0] - O[0], T[1] - O[1]];
    const dv = (a, b) => { const d = b[0] ** 2 + b[1] ** 2 || 1e-9; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
    const al = dv(E, M), W = dv([-O[0], -O[1]], al), amp = (v) => Math.hypot(...v), ang = (v) => (((Math.atan2(v[1], v[0]) * 180) / Math.PI) + 360) % 360;
    return `<div class="out"><div><span>E = T − O</span><b>${f2(amp(E))} mm/s @ ${Math.round(ang(E))}°</b></div><div><span>Sensibilité α</span><b>${Math.round(amp(al) * 1000)} µm/s/g @ ${Math.round(ang(al))}°</b></div><div><span>Correction W</span><b style="color:#c4b5fd">${f2(amp(W))} g @ ${Math.round(ang(W))}°</b></div><div><span>Variation (règle des 30 %)</span><b>${Math.round((amp(E) / c.oA) * 100)} %</b></div></div>
      <p class="note">Coefficient d\u2019influence : E = T − O ; α = E / Mₜ ; W = −O / α (masse d\u2019essai retirée).</p>`; },
};

// ---------- Conversions ----------
const UNITS = { d: [['µm', 'µm'], ['mm', 'mm'], ['mils', 'mils']], v: [['mm/s', 'mm/s'], ['in/s', 'in/s'], ['m/s', 'm/s']], a: [['g', 'g'], ['m/s²', 'm/s²'], ['mm/s²', 'mm/s²']] };
const TO_BASE = { 'µm': 1, mm: 1000, mils: 25.4, 'mm/s': 1, 'in/s': 25.4, 'm/s': 1000, g: 9.80665, 'm/s²': 1, 'mm/s²': 0.001 }; // base : µm, mm/s, m/s²
const DET = { rms: 1, pk: Math.SQRT2, pp: 2 * Math.SQRT2 };
function convAll(c) {
  const f = c.fu === 'CPM' ? c.f / 60 : c.f, w = 2 * Math.PI * f;
  const rms = (c.val * TO_BASE[c.u]) / DET[c.det];
  let v; // mm/s RMS
  if (c.q === 'v') v = rms; else if (c.q === 'd') v = (rms / 1000) * w; else v = (rms / w) * 1000;
  const d = (v / w) * 1000, a = (v / 1000) * w; // µm RMS, m/s² RMS
  const all = (x) => ({ rms: x, pk: x * DET.pk, pp: x * DET.pp });
  return { f, w, d: all(d), v: all(v), a: all(a) };
}
function drawNomo(cv) {
  if (!cv) return;
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = +cv.getAttribute('height');
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const L = 40, R = W - 10, T = 10, B = H - 26, F0 = 0, F1 = 4, V0 = -2, V1 = 3;
  const X = (f) => L + ((Math.log10(f) - F0) / (F1 - F0)) * (R - L), Y = (v) => B - ((Math.log10(v) - V0) / (V1 - V0)) * (B - T);
  x.save(); x.beginPath(); x.rect(L, T, R - L, B - T); x.clip();
  x.strokeStyle = '#eef2f6'; x.lineWidth = 1;
  for (let e = F0; e <= F1; e++) for (let k = 1; k < 10; k++) { const px = X(k * 10 ** e); x.beginPath(); x.moveTo(px, T); x.lineTo(px, B); x.stroke(); }
  for (let e = V0; e <= V1; e++) for (let k = 1; k < 10; k++) { const py = Y(k * 10 ** e); x.beginPath(); x.moveTo(L, py); x.lineTo(R, py); x.stroke(); }
  x.font = '9px ui-monospace,Menlo,monospace';
  for (const d of [0.1, 1, 10, 100, 1000, 10000]) { // D µm RMS : v = ω·D/1000
    const v = (f) => (2 * Math.PI * f * d) / 1000; x.strokeStyle = '#93c5fd'; x.beginPath(); x.moveTo(X(1), Y(v(1))); x.lineTo(X(1e4), Y(v(1e4))); x.stroke();
    const vR = v(1e4); x.fillStyle = '#2563eb'; x.textAlign = 'right'; if (vR < 10 ** V1) { if (vR > 10 ** V0) x.fillText(`${d} µm`, R - 3, Y(vR) + 11); } else { const fT = (10 ** V1 * 1000) / (2 * Math.PI * d); x.textAlign = 'left'; x.fillText(`${d} µm`, X(fT) + 3, T + 10); }
  }
  for (const a of [0.01, 0.1, 1, 10, 100, 1000]) { // A m/s² RMS : v = A/ω·1000
    const v = (f) => (a / (2 * Math.PI * f)) * 1000; x.strokeStyle = '#fca5a5'; x.beginPath(); x.moveTo(X(1), Y(v(1))); x.lineTo(X(1e4), Y(v(1e4))); x.stroke();
    const vL = v(1); x.fillStyle = '#dc2626'; x.textAlign = 'left'; if (vL < 10 ** V1) { if (vL > 10 ** V0) x.fillText(`${a} m/s²`, L + 3, Y(vL) + 11); } else { const fT = (a * 1000) / (2 * Math.PI * 10 ** V1); x.textAlign = 'right'; x.fillText(`${a} m/s²`, X(fT) - 3, T + 24); }
  }
  const R0 = convAll(S.conv);
  if (R0.f > 0 && R0.v.rms > 0) {
    const px = X(R0.f), py = Y(R0.v.rms);
    x.strokeStyle = '#0f172a'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(px, B); x.lineTo(px, py); x.lineTo(L, py); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#9333ea'; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill();
  }
  x.restore();
  x.fillStyle = '#475569'; x.textAlign = 'center';
  for (let e = F0; e <= F1; e++) { x.textAlign = e === F1 ? 'right' : 'center'; x.fillText(`${10 ** e}`, X(10 ** e), B + 12); } x.textAlign = 'center';
  x.fillText('Fréquence (Hz)', (L + R) / 2, H - 2);
  x.textAlign = 'right'; for (let e = V0; e <= V1; e++) x.fillText(`${10 ** e}`, L - 4, Y(10 ** e) + 3);
  x.save(); x.translate(10, (T + B) / 2); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.fillText('Vitesse mm/s RMS', 0, 0); x.restore();
  x.strokeStyle = '#cbd5e1'; x.strokeRect(L, T, R - L, B - T);
}
