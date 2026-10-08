import { MODULES, PASS } from './formation-data.js';
import { TOOLS, renderCalc as mountCalc, openTool } from './calc.js';
const renderCalc = (flash) => mountCalc(document.getElementById('calc'), flash);

const KEY = 'viblab-formation-n1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
let prog = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(prog));
const passed = (id) => prog[id]?.passed;
const unlocked = (id) => id === 1 || passed(id - 1);
const notify = (msg) => { try { window.parent !== window && window.parent.postMessage({ source: 'viblab-formation', ...msg }, '*'); } catch {} };

const ui = { view: 'list', filter: 'all', mod: null, order: [], ans: {}, cur: 0, result: null };
const app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const I = {
  lock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12l5 5 9-10"/></svg>',
  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  play: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>',
  quiz: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>',
};

// ---------- Parcours ----------
function renderList() {
  const done = MODULES.filter((m) => passed(m.id)).length, pct = Math.round((done / MODULES.length) * 100);
  const list = MODULES.filter((m) => ui.filter === 'all' || (ui.filter === 'done' ? passed(m.id) : !passed(m.id)));
  const next = MODULES.find((m) => !passed(m.id));
  app.innerHTML = `
  <div class="card hero">
    <div><div class="chips"><span class="chip b">ESPACE APPRENANT · VUE ÉLÈVE</span><span class="chip">ISO 18436-2 — VCAT-I</span><span class="chip g">Seuil de validation : ${PASS} %</span></div>
      <h1>Vibrations Niveau 1 — Formation Certifiante</h1>
      <p>Chaque module se déverrouille lorsque le QCM du module précédent est réussi avec au moins ${PASS} % de bonnes réponses. Les calculatrices et abaques restent disponibles pendant les questionnaires.</p></div>
    <div class="prog"><div class="k">Progression globale</div><div class="v">${pct}% <span class="mono" style="font-size:11px;font-weight:400;color:#64748b">(${done}/${MODULES.length} modules)</span></div><div class="bar"><i style="width:${pct}%"></i></div><div style="font-size:10.5px;color:#64748b">${MODULES.length - done} module(s) restant(s)</div></div>
  </div>
  <div class="tool-row">
    <div class="filters">Filtrer par statut :
      ${[['all', `Tous (${MODULES.length})`], ['todo', `À suivre (${MODULES.length - done})`], ['done', `Complétés (${done})`]].map(([k, l]) => `<button data-f="${k}" class="${ui.filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${next ? `<button class="cta" data-quiz="${next.id}">Passer aux Exercices &amp; QCM · Module ${next.id} ›</button>` : '<span class="st ok">' + I.check + ' Parcours Niveau 1 validé</span>'}
  </div>
  <div class="filters" style="justify-content:flex-end"><button id="openCalc">Calculatrices &amp; abaques</button></div>
  <div class="card" id="calcList" hidden></div>
  <div class="grid">${list.map(card).join('') || '<p style="color:#64748b">Aucun module dans ce filtre.</p>'}</div>
  <button class="reset" id="reset">Réinitialiser ma progression</button>`;
  app.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { ui.filter = b.dataset.f; renderList(); }));
  app.querySelectorAll('[data-quiz]').forEach((b) => (b.onclick = () => startQuiz(+b.dataset.quiz)));
  app.querySelectorAll('[data-pres]').forEach((b) => (b.onclick = () => notify({ type: 'open-presentation', module: +b.dataset.pres })));
  document.getElementById('openCalc').onclick = () => { const c = document.getElementById('calcList'); c.hidden = !c.hidden; if (!c.hidden) mountCalc(c); };
  document.getElementById('reset').onclick = () => { if (confirm('Effacer toute la progression et reverrouiller les modules ?')) { prog = {}; save(); renderList(); } };
}
function card(m) {
  const ok = passed(m.id), open = unlocked(m.id), p = prog[m.id];
  const st = ok ? `<span class="st ok">${I.check} Validé · ${p.best} %</span>` : open ? `<span class="st">${p?.attempts ? `Meilleur : ${p.best} %` : 'À valider'}</span>` : `<span class="st lk">${I.lock} Verrouillé</span>`;
  return `<div class="card mod ${open ? '' : 'locked'}">
    <div class="top"><span class="tagm">MODULE ${m.id}</span>${st}</div>
    <p class="mt" style="${open && !ok ? 'color:#2563eb' : ''}">${m.plain ? '' : `Module ${m.id} - `}${esc(m.title)}</p>
    <p class="md">${esc(m.desc)}</p>
    <div class="meta"><span style="display:flex;gap:5px;align-items:center">${I.clock}${m.min} min</span><span>${m.qs.length} questions · ${p?.attempts || 0} tentative(s)</span></div>
    ${open ? `<div class="btns"><button class="b1" data-pres="${m.id}">${I.play} Présentation</button><button class="b2" data-quiz="${m.id}">${I.quiz} ${ok ? 'Refaire le QCM' : 'Passer le QCM'}</button></div>`
      : `<div class="btns"><button class="b1" disabled>${I.lock} Présentation</button><button class="b2" disabled>${I.lock} QCM</button></div><div class="lockmsg">${I.lock} Réussissez le QCM du module ${m.id - 1} avec ${PASS} % minimum.</div>`}
  </div>`;
}

// ---------- QCM ----------
function startQuiz(id) {
  if (!unlocked(id)) return;
  const m = MODULES.find((x) => x.id === id);
  ui.view = 'quiz'; ui.mod = m; ui.ans = {}; ui.cur = 0; ui.result = null;
  ui.order = m.qs.map((_, i) => i).sort(() => Math.random() - 0.5);
  renderQuiz(); scrollTo(0, 0);
}
const answered = (i) => { const a = ui.ans[i]; return a !== undefined && a !== '' && !(Array.isArray(a) && !a.length); };
function correct(q, a) {
  if (q.type === 'num') { const v = parseFloat(String(a).replace(',', '.')); return Number.isFinite(v) && Math.abs(v - q.a) <= q.tol; }
  if (q.type === 'multi') return Array.isArray(a) && a.length === q.a.length && q.a.every((x) => a.includes(x));
  return a === q.a;
}
function renderQuiz() {
  const m = ui.mod, qi = ui.order[ui.cur], q = m.qs[qi], n = m.qs.length, all = m.qs.every((_, i) => answered(i));
  const L = 'ABCDEFG';
  const body = ui.result ? resultHTML() : `
    <div class="dots">${ui.order.map((k, i) => `<button data-go="${i}" class="${answered(k) ? 'ans' : ''} ${i === ui.cur ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
    <p class="mono" style="margin:0 0 6px;font-size:11px;color:#64748b">Question ${ui.cur + 1} / ${n} · ${q.type === 'multi' ? 'Plusieurs réponses' : q.type === 'num' ? 'Réponse numérique' : 'Une seule réponse'}</p>
    <p class="qt">${esc(q.t)}</p>
    ${q.type === 'num' ? `<div class="numin"><input id="num" inputmode="decimal" placeholder="Votre réponse" value="${esc(ui.ans[qi] ?? '')}"><b class="mono">${esc(q.unit)}</b></div>`
      : `<div class="opts">${q.o.map((o, i) => { const sel = q.type === 'multi' ? (ui.ans[qi] || []).includes(i) : ui.ans[qi] === i; return `<button class="opt ${q.type === 'multi' ? 'multi' : ''} ${sel ? 'sel' : ''}" data-o="${i}"><span class="k">${L[i]}</span><span>${esc(o)}</span></button>`; }).join('')}</div>`}
    ${q.tool || q.hint ? `<div class="help"><span><b>Aide :</b> ${esc(q.hint || 'Utilisez la calculatrice ci-contre, pré-remplie avec les données de l\u2019énoncé.')}</span>${q.tool ? `<button id="aid">Ouvrir ${TOOLS[q.tool]} ›</button>` : ''}</div>` : ''}
    <div class="nav">
      <button class="pv" id="prev" ${ui.cur ? '' : 'disabled style="opacity:.4"'}>‹ Précédente</button>
      ${ui.cur < n - 1 ? '<button class="nx" id="next">Suivante ›</button>' : `<button class="sb" id="submit" ${all ? '' : 'disabled'}>Valider le QCM</button>`}
    </div>
    <p class="rule" style="margin-top:12px">${all ? 'Toutes les questions sont répondues.' : `${m.qs.filter((_, i) => answered(i)).length} / ${n} réponses · répondez à toutes les questions pour valider.`} Seuil de réussite : ${PASS} % (${Math.ceil((PASS / 100) * n)} / ${n}).</p>`;
  app.innerHTML = `
  <div class="ws">
    <div class="card">
      <div class="qh"><button class="back" id="back">‹ Parcours</button><span class="tagm">MODULE ${m.id} · QCM</span></div>
      <p class="mt" style="font-size:18px;margin-bottom:4px">${esc(m.title)}</p>
      ${body}
    </div>
    <div class="card sticky" id="calc"></div>
  </div>`;
  document.getElementById('back').onclick = () => { if (ui.result || !Object.keys(ui.ans).length || confirm('Quitter le QCM ? Vos réponses seront perdues.')) { ui.view = 'list'; renderList(); } };
  if (ui.result) bindResult(); else {
    app.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { ui.cur = +b.dataset.go; renderQuiz(); }));
    app.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.o;
      if (q.type === 'multi') { const s = new Set(ui.ans[qi] || []); s.has(i) ? s.delete(i) : s.add(i); ui.ans[qi] = [...s]; } else ui.ans[qi] = i;
      renderQuiz();
    }));
    const num = document.getElementById('num'); if (num) { num.oninput = () => { ui.ans[qi] = num.value; const s = document.getElementById('submit'); if (s) s.disabled = !m.qs.every((_, i) => answered(i)); }; num.onchange = renderQuiz; }
    const go = (d) => { ui.cur = Math.max(0, Math.min(n - 1, ui.cur + d)); renderQuiz(); };
    document.getElementById('prev').onclick = () => go(-1);
    document.getElementById('next') && (document.getElementById('next').onclick = () => go(1));
    document.getElementById('submit') && (document.getElementById('submit').onclick = submit);
    document.getElementById('aid') && (document.getElementById('aid').onclick = () => openTool(q.tool, q.pre));
  }
  renderCalc();
}
function submit() {
  const m = ui.mod, ok = m.qs.map((q, i) => correct(q, ui.ans[i])), good = ok.filter(Boolean).length, pct = Math.round((good / m.qs.length) * 100), pass = pct >= PASS;
  const p = (prog[m.id] ||= { best: 0, attempts: 0, passed: false });
  p.attempts++; p.best = Math.max(p.best, pct); p.last = pct; p.passed = p.passed || pass; save();
  ui.result = { ok, good, pct, pass };
  notify({ type: 'quiz-result', module: m.id, score: pct, passed: pass, unlocked: pass && m.id < MODULES.length ? m.id + 1 : null });
  renderQuiz(); scrollTo(0, 0);
}
function fmtAns(q, a) {
  if (q.type === 'num') return a === undefined || a === '' ? '—' : `${a} ${q.unit}`;
  const L = 'ABCDEFG'; const arr = Array.isArray(a) ? a : a === undefined ? [] : [a];
  return arr.length ? arr.sort().map((i) => `${L[i]}. ${q.o[i]}`).join(' · ') : '—';
}
function resultHTML() {
  const m = ui.mod, r = ui.result, col = r.pass ? '#059669' : '#dc2626', nextM = MODULES.find((x) => x.id === m.id + 1);
  return `
  <div class="score" style="margin-top:12px">
    <div class="ring" style="background:conic-gradient(${col} ${r.pct * 3.6}deg,#e2e8f0 0);"><div style="width:86px;height:86px;border-radius:50%;background:#fff;display:grid;place-items:center;color:${col}">${r.pct}%</div></div>
    <div><p class="mt" style="color:${col};font-size:18px">${r.pass ? 'QCM réussi' : 'Seuil non atteint'}</p>
      <p style="margin:2px 0 0">${r.good} / ${m.qs.length} bonnes réponses · seuil ${PASS} %.</p>
      <p style="margin:2px 0 0;color:#64748b">${r.pass ? (nextM ? `Le module ${nextM.id} « ${esc(nextM.title)} » est déverrouillé.` : 'Le parcours Niveau 1 est entièrement validé.') : `Revoyez les explications ci-dessous puis recommencez. Le module ${m.id + 1 <= MODULES.length ? m.id + 1 : ''} reste verrouillé.`}</p></div>
  </div>
  <div class="nav" style="margin:0 0 16px">
    <button class="pv" id="retry">Recommencer le QCM</button>
    ${r.pass && nextM ? `<button class="nx" id="nextMod">Module ${nextM.id} : passer le QCM ›</button>` : '<button class="nx" id="toList">Retour au parcours</button>'}
  </div>
  <div class="rv">${m.qs.map((q, i) => `<div class="ri ${r.ok[i] ? 'ok' : 'ko'}">
    <p style="font-weight:700;color:#0f172a">${r.ok[i] ? '✓' : '✗'} ${esc(q.t)}</p>
    <p>Votre réponse : <b>${esc(fmtAns(q, ui.ans[i]))}</b></p>
    ${r.ok[i] ? '' : `<p>Bonne réponse : <b>${esc(q.type === 'num' ? `${q.a} ${q.unit} (± ${q.tol})` : fmtAns(q, q.a))}</b></p>`}
    <p style="color:#475569">${esc(q.e)}</p></div>`).join('')}</div>`;
}
function bindResult() {
  document.getElementById('retry').onclick = () => startQuiz(ui.mod.id);
  const nm = document.getElementById('nextMod'); if (nm) nm.onclick = () => startQuiz(ui.mod.id + 1);
  const tl = document.getElementById('toList'); if (tl) tl.onclick = () => { ui.view = 'list'; renderList(); };
}

renderList();
