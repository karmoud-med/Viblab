// Textures procédurales (canvas) : peinture, fonte, acier brossé, béton, sol d'atelier, tôle perforée, plaques et cadran.
export function makeTextures(THREE) {
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  const tex = (c, rx = 1, ry = 1, srgb = false) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const noise = (g, w, h, base, amp, n, rMin, rMax, alpha = 0.08) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { const v = Math.round(128 + (rnd() - 0.5) * 2 * amp); g.fillStyle = `rgba(${v},${v},${v},${alpha})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, rMin + rnd() * (rMax - rMin), 0, 7); g.fill(); }
  };
  const T = {};
  // Peinture époxy : peau d'orange fine
  T.paintBump = tex(cv(256, 256, (g, w, h) => noise(g, w, h, '#808080', 90, 5000, 0.6, 2.2, 0.25)), 6, 6);
  T.paintRough = tex(cv(256, 256, (g, w, h) => noise(g, w, h, '#8c8c8c', 60, 1500, 2, 10, 0.12)), 3, 3);
  // Fonte moulée : grain plus grossier
  T.castBump = tex(cv(256, 256, (g, w, h) => noise(g, w, h, '#808080', 120, 7000, 0.8, 3.5, 0.3)), 5, 5);
  // Acier brossé / rectifié : stries
  T.brushed = tex(cv(512, 64, (g, w, h) => { g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = Math.round(90 + rnd() * 90); g.fillStyle = `rgba(${v},${v},${v},0.35)`; g.fillRect(rnd() * w, 0, 0.6 + rnd() * 1.4, h); } }), 2, 1);
  // Béton du massif
  T.concrete = tex(cv(512, 512, (g, w, h) => { noise(g, w, h, '#b8b4ab', 70, 9000, 0.5, 2.5, 0.25); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(90,86,80,${0.15 + rnd() * 0.25})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.8 + rnd() * 2.2, 0, 7); g.fill(); } }), 2, 1, true);
  // Sol d'atelier : dalle béton, joints, marquage jaune autour de la machine
  T.floor = tex(cv(2048, 2048, (g, w, h) => {
    noise(g, w, h, '#c9c6bf', 50, 60000, 0.6, 3, 0.18);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(120,115,105,${0.03 + rnd() * 0.05})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 40 + rnd() * 160, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(80,78,72,0.55)'; g.lineWidth = 3; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo((k * w) / 4, 0); g.lineTo((k * w) / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, (k * h) / 4); g.lineTo(w, (k * h) / 4); g.stroke(); }
    // zone de sécurité : 1 px = 4 m / 2048
    const s = w / 4, cx = w / 2, cz = h / 2, rx = 1.0 * s / 1.0, rz = 0.55 * s;
    g.strokeStyle = '#e8b400'; g.lineWidth = 0.05 * s; g.strokeRect(cx - rx * 0.95, cz - rz, rx * 1.9, rz * 2);
    g.save(); g.beginPath(); g.rect(cx + rx * 0.95 + 0.04 * s, cz - rz, 0.12 * s, rz * 2); g.clip();
    for (let y = -rz; y < rz * 2; y += 0.1 * s) { g.fillStyle = '#e8b400'; g.beginPath(); g.moveTo(cx + rx, cz - rz + y); g.lineTo(cx + rx + 0.2 * s, cz - rz + y - 0.2 * s); g.lineTo(cx + rx + 0.2 * s, cz - rz + y - 0.15 * s); g.lineTo(cx + rx, cz - rz + y + 0.05 * s); g.fill(); }
    g.restore();
  }), 1, 1, true);
  // Tôle perforée (protecteur) : masque alpha
  T.perforated = tex(cv(128, 128, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 32 + 16 + (y % 2) * 16, y * 32 + 16, 12, 0, 7); g.fill(); } }), 10, 2);
  // Plaques signalétiques
  const plate = (title, lines) => tex(cv(512, 256, (g, w, h) => {
    g.fillStyle = '#d6d9dc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4b5563'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    for (const [x, y] of [[22, 22], [w - 22, 22], [22, h - 22], [w - 22, h - 22]]) { g.fillStyle = '#6b7280'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
    g.fillStyle = '#111827'; g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.fillText(title, w / 2, 58);
    g.fillRect(30, 70, w - 60, 3); g.font = '22px monospace'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, 36, 108 + i * 32));
  }), 1, 1, true);
  T.plateMotor = plate('MOTEUR ASYNCHRONE 3~', ['15 kW   400 V Δ   50 Hz   28,5 A', '1475 tr/min   cos φ 0,86   IE3', 'IP55   Cl. F   4 pôles   B3', 'Roul. 6309-2Z / NU 309 ECP']);
  T.platePump = plate('POMPE CENTRIFUGE', ['EN 733   65-160   roue 7 aubes', 'Q 60 m³/h   H 32 m   1800 tr/min', 'Roul. 2×7309 BE / 6309', 'Garniture mécanique   N° 26-1047']);
  // Cadran manomètre
  T.dial = tex(cv(256, 256, (g, w, h) => {
    const c = w / 2; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 2;
    for (let i = 0; i <= 40; i++) { const a = Math.PI * 0.75 + (i / 40) * Math.PI * 1.5, r1 = i % 5 ? 100 : 90; g.beginPath(); g.moveTo(c + r1 * Math.cos(a), c + r1 * Math.sin(a)); g.lineTo(c + 110 * Math.cos(a), c + 110 * Math.sin(a)); g.stroke(); }
    g.fillStyle = '#111'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; for (let i = 0; i <= 8; i += 2) { const a = Math.PI * 0.75 + (i / 8) * Math.PI * 1.5; g.fillText(String(i), c + 72 * Math.cos(a), c + 72 * Math.sin(a) + 6); }
    g.font = '16px Arial'; g.fillText('bar', c, c + 50);
    g.fillStyle = '#dc2626'; g.beginPath(); g.arc(c, c, 3, 0, 7); g.fill(); const a = Math.PI * 0.75 + 0.42 * Math.PI * 1.5; g.lineWidth = 4; g.strokeStyle = '#dc2626'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + 95 * Math.cos(a), c + 95 * Math.sin(a)); g.stroke();
  }), 1, 1, true);
  // Flèche sens de rotation
  T.arrow = tex(cv(256, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#dc2626'; g.beginPath(); g.moveTo(10, 44); g.lineTo(170, 44); g.lineTo(170, 14); g.lineTo(246, 64); g.lineTo(170, 114); g.lineTo(170, 84); g.lineTo(10, 84); g.fill(); }), 1, 1, true);
  return T;
}
