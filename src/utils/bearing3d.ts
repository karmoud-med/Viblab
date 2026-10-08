// Visualisation 3D industrielle d'un palier à semelle (plummer block) et roulement à billes
// Avec géométrie paramétrique, écaillage de défauts, accéléromètre et onde de choc
import * as THREE from 'three';
import { PHI_OUT, PHI_IN, BearingSimParams } from './bearingModel';

const TAU = Math.PI * 2;
const S = 0.004;

export interface Bearing3DResult {
  root: THREE.Group;
  grease: THREE.Object3D[];
  ring: THREE.Group;
  innerG: THREE.Group;
  ri: number;
  ro: number;
  dS: number;
  shaft: THREE.Group;
  cage: THREE.Group;
  balls: THREE.Group[];
  housing: THREE.Group;
  cap: THREE.Group;
  flash: THREE.Mesh;
  wave: THREE.Mesh;
  Hc: number;
  Rp: number;
  rb: number;
  Rh: number;
  B: number;
  OD: number;
  Lh: number;
}

export type BearingMaterials = ReturnType<typeof makeMaterials>;

export function makeMaterials(T: typeof THREE = THREE) {
  const M = (
    name: string,
    color: number,
    r = 0.5,
    m = 0.3,
    extra: THREE.MeshStandardMaterialParameters = {}
  ) => {
    const x = new T.MeshStandardMaterial({ color, roughness: r, metalness: m, ...extra });
    x.name = name;
    return x;
  };

  const Bm = (name: string, color: number, op: number) => {
    const x = new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthTest: false });
    x.name = name;
    return x;
  };

  const mats = {
    ring: M('acier_bague_ext', 0xb4bcc6, 0.24, 0.95, { side: T.DoubleSide, emissive: 0x2563eb, emissiveIntensity: 0 }),
    ringIn: M('acier_bague_int', 0xe3e7eb, 0.14, 0.95, { side: T.DoubleSide, emissive: 0x2563eb, emissiveIntensity: 0 }),
    ball: M('acier_bille_chrome', 0x9aa3ad, 0.05, 1, { emissive: 0x2563eb, emissiveIntensity: 0 }),
    etch: M('marquage', 0x6b7280, 0.6, 0.4),
    cage: M('cage_laiton', 0xc19a5b, 0.3, 0.95, { emissive: 0x2563eb, emissiveIntensity: 0 }),
    cageDef: M('cage_defaut', 0xf59e0b, 0.35, 0.4, { emissive: 0xf59e0b, emissiveIntensity: 0.3 }),
    rivet: M('rivet', 0x8a6a3c, 0.4, 0.7),
    steel: M('acier_arbre_rectifie', 0xc9ced4, 0.3, 0.92),
    key: M('clavette', 0x9aa1a9, 0.35, 0.7),
    dark: M('fond_noir', 0x1f2937, 0.7, 0.2),
    nut: M('ecrou_KM', 0x3b4048, 0.35, 0.7),
    coupling: M('accouplement', 0x1e3a8a, 0.45, 0.35),
    tape: M('repere', 0xef4444, 0.4, 0.1),
    frame: M('chassis_peint', 0x9ca3af, 0.6, 0.25),
    shim: M('cale_inox', 0xc3c8ce, 0.3, 0.8),
    paint: M('fonte_peinte', 0x4b5d67, 0.62, 0.18, { side: T.DoubleSide }),
    machined: M('fonte_usinee', 0xa3adb5, 0.35, 0.6, { side: T.DoubleSide }),
    bolt: M('acier_brunit', 0x2b3038, 0.45, 0.85),
    zinc: M('acier_zingue', 0xc8cdd2, 0.3, 0.8),
    brass: M('laiton', 0xc5a15a, 0.3, 0.8),
    grease: M('graisse_lithium', 0xc8a24a, 0.35, 0, { transparent: true, opacity: 0.55 }),
    greaseCh: M('graisse_chambre', 0xc8a24a, 0.4, 0, { transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide }),
    rubber: M('caoutchouc_NBR', 0x161616, 0.85, 0, { side: T.DoubleSide }),
    ss: M('inox_capteur', 0xd1d5db, 0.22, 0.95),
    cable: M('cable', 0x0f172a, 0.7, 0.1),
    zone: Object.assign(new T.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.14, side: T.DoubleSide, depthWrite: false }), { name: 'zone_de_charge' }),
    def: M('ecaillage', 0xf97316, 0.8, 0, { emissive: 0xf97316, emissiveIntensity: 0.35 }),
    crack: M('fissure', 0x111827, 0.9, 0),
    sensor: M('capteur_led', 0x334155, 0.4, 0.3, { emissive: 0xef4444, emissiveIntensity: 0 }),
    flash: Bm('impact', 0xff3b1f, 0.85),
    flash2: Bm('onde_choc', 0xf59e0b, 0.8),
    housingSet: [] as THREE.Material[],
  };

  mats.housingSet = [mats.paint, mats.machined, mats.rubber, mats.bolt, mats.zinc, mats.brass];
  return mats;
}

export function buildBearing(
  T: typeof THREE = THREE,
  p: BearingSimParams,
  mat: BearingMaterials
): Bearing3DResult {
  const root = new T.Group();
  root.name = 'palier_roulement';

  const add = (
    name: string,
    geo: THREE.BufferGeometry,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root
  ): THREE.Mesh => {
    const o = new T.Mesh(geo, mt);
    o.name = name;
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const grp = (name: string, x: number, y: number, z: number, parent: THREE.Object3D = root): THREE.Group => {
    const g = new T.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const lathe = (pts: [number, number][], seg = 96) =>
    new T.LatheGeometry(pts.map(([r, z]) => new T.Vector2(r, z)), seg).rotateX(Math.PI / 2);
  const cylZ = (r: number, l: number, seg = 48) =>
    new T.CylinderGeometry(r, r, l, seg).rotateX(Math.PI / 2);
  const cylY = (r: number, l: number, seg = 32) =>
    new T.CylinderGeometry(r, r, l, seg);
  const hexY = (r: number, l: number) =>
    new T.CylinderGeometry(r, r, l, 6);
  const box = (a: number, b: number, c: number) =>
    new T.BoxGeometry(a, b, c);
  const extrude = (shape: THREE.Shape, depth: number, bev = 0.003) =>
    new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: 2,
      curveSegments: 48,
    }).translate(0, 0, -depth / 2);

  // Dimensions du roulement
  const dS = p.d * S;
  const Rp = (p.D / 2) * S;
  const rb = dS / 2;
  const bore = Math.max((p.D - 1.75 * p.d) / 2, 4) * S;
  const OD = ((p.D + 1.65 * p.d) / 2) * S;
  const B = 1.9 * dS;
  const ch = 0.12 * dS;

  // Dimensions du palier
  const y0 = 0.045;
  const Hc = y0 + OD * 1.55;
  const Rb = OD * 1.45;
  const Wf = OD * 5.2;
  const tf = OD * 0.4;
  const lugX = OD * 2.1;
  const lugUp = OD * 0.3;
  const lugDn = OD * 0.32;
  const Lh = Math.max(B * 2.2, OD * 1.05);

  // Châssis + cales
  add('chassis_profile', box(Wf * 1.35, 0.03, Math.max(0.62, Lh * 2.2)), mat.frame, 0, 0.015, -0.1);
  add('chassis_aile', box(Wf * 1.35, 0.012, 0.03), mat.frame, 0, 0.036, Lh * 0.9);
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      add('cale_reglage', box(OD * 1.25, 0.0035, Lh * 0.95), mat.shim, sx * (Wf / 2 - OD * 0.6), 0.03 + 0.00175 + i * 0.0039, 0);
    }
  }
  const yb = 0.03 + 0.0078; // dessous de la semelle

  // ---------- Palier ----------
  const housing = grp('palier', 0, 0, 0);
  const base = grp('corps_palier', 0, 0, 0, housing);
  const cap = grp('chapeau_palier', 0, 0, 0, housing);

  // Corps (semelle + pied + demi-alésage)
  const sb = new T.Shape();
  const fy = yb + tf;
  sb.moveTo(-Wf / 2, yb);
  sb.lineTo(Wf / 2, yb);
  sb.lineTo(Wf / 2, fy - 0.004);
  sb.lineTo(Wf / 2 - 0.004, fy);
  sb.lineTo(Rb * 1.38, fy);
  sb.quadraticCurveTo(Rb * 0.92, fy, Rb * 0.92, fy + OD * 0.35);
  sb.lineTo(Rb * 0.98, Hc - lugDn - OD * 0.12);
  sb.lineTo(lugX, Hc - lugDn);
  sb.lineTo(lugX, Hc);
  sb.lineTo(OD, Hc);
  sb.absarc(0, Hc, OD, 0, Math.PI, true);
  sb.lineTo(-lugX, Hc);
  sb.lineTo(-lugX, Hc - lugDn);
  sb.lineTo(-Rb * 0.98, Hc - lugDn - OD * 0.12);
  sb.lineTo(-Rb * 0.92, fy + OD * 0.35);
  sb.quadraticCurveTo(-Rb * 0.92, fy, -Rb * 1.38, fy);
  sb.lineTo(-Wf / 2 + 0.004, fy);
  sb.lineTo(-Wf / 2, fy - 0.004);
  sb.lineTo(-Wf / 2, yb);
  add('corps', extrude(sb, Lh - 0.006), mat.paint, 0, 0, 0, base);

  // Chapeau
  const sc = new T.Shape();
  const a1 = Math.asin(Math.min(0.95, (OD * 0.48) / Rb));
  sc.moveTo(lugX, Hc);
  sc.lineTo(lugX, Hc + lugUp);
  sc.lineTo(Rb * Math.cos(a1) + OD * 0.05, Hc + lugUp);
  sc.absarc(0, Hc, Rb, a1, Math.PI - a1, false);
  sc.lineTo(-lugX, Hc + lugUp);
  sc.lineTo(-lugX, Hc);
  sc.lineTo(-OD, Hc);
  sc.absarc(0, Hc, OD, Math.PI, 0, true);
  sc.lineTo(lugX, Hc);
  add('chapeau', extrude(sc, Lh - 0.006), mat.paint, 0, 0.0008, 0, cap);

  // Plan de joint usiné
  add('plan_joint', box(lugX * 2 + 0.004, 0.0016, Lh + 0.002), mat.machined, 0, Hc, 0, base);

  // Nervures du pied
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const g = add('nervure', box(0.008, OD * 0.5, OD * 0.5), mat.paint, sx * Rb * 1.02, fy + OD * 0.2, sz * (Lh / 2 - 0.004), base);
      g.rotation.z = -sx * 0.55;
    }
  }

  // Lumières de fixation + boulons de pied
  for (const sx of [-1, 1]) {
    const X = sx * (Wf / 2 - OD * 0.48);
    add('lumiere_fixation', box(OD * 0.42, 0.0015, OD * 0.2), mat.dark, X, fy + 0.0012, 0, base);
    add('rondelle_pied', cylY(OD * 0.2, 0.004), mat.zinc, X, fy + 0.0035, 0, base);
    add('tete_vis_pied', hexY(OD * 0.15, OD * 0.11), mat.bolt, X, fy + 0.0055 + OD * 0.055, 0, base);
    add('tige_vis_pied', cylY(OD * 0.07, 0.03), mat.bolt, X, 0.015, 0, base);
  }

  // Boulons de chapeau
  for (const sx of [-1, 1]) {
    const X = sx * OD * 1.78;
    const yt = Hc + lugUp + 0.0008;
    add('rondelle_chapeau', cylY(OD * 0.17, 0.003), mat.zinc, X, yt + 0.0015, 0, cap);
    add('tete_vis_chapeau', hexY(OD * 0.13, OD * 0.1), mat.bolt, X, yt + 0.003 + OD * 0.05, 0, cap);
    add('tige_vis_chapeau', cylY(OD * 0.06, lugUp + lugDn + OD * 0.12), mat.bolt, X, Hc - lugDn - OD * 0.06 + (lugUp + lugDn + OD * 0.12) / 2, 0, cap);
    add('ecrou_chapeau', hexY(OD * 0.13, OD * 0.1), mat.bolt, X, Hc - lugDn - OD * 0.05, 0, base);
    add('goupille', cylY(OD * 0.03, 0.004), mat.machined, sx * OD * 1.35, Hc + 0.002, Lh / 2 - OD * 0.12, base);
  }

  // Graisseur
  const ga = Math.PI / 2 - 0.55;
  const gx = Rb * Math.cos(ga);
  const gy = Hc + Rb * Math.sin(ga);
  const ng = grp('graisseur', gx, gy, -Lh * 0.18, cap);
  ng.rotation.z = ga - Math.PI / 2;
  add('bossage', cylY(OD * 0.12, OD * 0.08), mat.paint, 0, 0, 0, ng);
  add('hexagone', hexY(OD * 0.07, OD * 0.07), mat.brass, 0, OD * 0.075, 0, ng);
  add('tete_bille', new T.SphereGeometry(OD * 0.045, 16, 12), mat.brass, 0, OD * 0.14, 0, ng);

  // Plaque signalétique
  add('plaque', box(OD * 0.9, OD * 0.28, 0.0015), mat.zinc, 0, Hc + OD * 0.68, Lh / 2 - 0.0005, cap);
  add('plaque_texte', box(OD * 0.7, OD * 0.04, 0.0017), mat.dark, 0, Hc + OD * 0.72, Lh / 2 - 0.0004, cap);
  add('plaque_texte', box(OD * 0.5, OD * 0.04, 0.0017), mat.dark, 0, Hc + OD * 0.63, Lh / 2 - 0.0004, cap);

  // Joints à double lèvre
  for (const sz of [-1, 1]) {
    const z = sz * (Lh / 2 - 0.006);
    add('joint_bague', lathe([[bore * 1.12, z - 0.006], [OD, z - 0.006], [OD, z + 0.006], [bore * 1.12, z + 0.006], [bore * 1.12, z - 0.006]], 64), mat.rubber, 0, Hc, 0, housing);
    add('joint_levre', new T.TorusGeometry(bore * 1.12, 0.0028, 10, 64), mat.rubber, 0, Hc, z + sz * 0.006, housing);
    const pU = add('portee_usinee', new T.RingGeometry(OD * 1.0, OD * 1.12, 64), mat.machined, 0, Hc, sz * (Lh / 2 + 0.0002), housing);
    pU.rotation.y = sz < 0 ? Math.PI : 0;
  }

  // ---------- Roulement ----------
  const b0 = Math.acos(0.28 / 0.52);
  const z0 = 0.52 * dS * Math.sin(b0);
  const arc = (sgn: number, from: number, to: number): [number, number][] => {
    const a: [number, number][] = [];
    for (let i = 0; i <= 18; i++) {
      const b = from + ((to - from) * i) / 18;
      a.push([Rp + sgn * 0.52 * dS * Math.cos(b), 0.52 * dS * Math.sin(b)]);
    }
    return a;
  };
  const ring = grp('roulement', 0, Hc, 0);
  const ro = Rp + 0.28 * dS;
  const ri = Rp - 0.28 * dS;

  add(
    'bague_exterieure',
    lathe([
      [OD - ch, -B / 2],
      [OD, -B / 2 + ch],
      [OD, B / 2 - ch],
      [OD - ch, B / 2],
      [ro + ch * 0.6, B / 2],
      [ro, B / 2 - ch * 0.6],
      [ro, z0],
      ...arc(1, b0, -b0),
      [ro, -z0],
      [ro, -B / 2 + ch * 0.6],
      [ro + ch * 0.6, -B / 2],
      [OD - ch, -B / 2],
    ]),
    mat.ring,
    0,
    0,
    0,
    ring
  );

  // Marquage laser sur la bague extérieure
  if (typeof document !== 'undefined') {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1024;
    const g = cv.getContext('2d');
    if (g) {
      const c = 512;
      const sc = c / OD;
      const rt = ((ro + OD) / 2) * sc;
      const txt = `${(p.name || 'ROULEMENT').replace(/ \(.*\)/, '').toUpperCase()}  ·  C3  ·  ${p.n} × Ø${p.d}  ·  ISO 15`;
      g.fillStyle = '#2b2f36';
      g.font = `bold ${Math.max(18, (OD - ro) * sc * 0.42)}px monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let ang = Math.PI * 0.62;
      for (const chItem of txt) {
        const w = g.measureText(chItem).width / rt;
        ang -= w / 2;
        g.save();
        g.translate(c + rt * Math.cos(ang), c - rt * Math.sin(ang));
        g.rotate(Math.PI / 2 - ang);
        g.fillText(chItem, 0, 0);
        g.restore();
        ang -= w / 2;
      }
      const tex = new T.CanvasTexture(cv);
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 4;
      const mk = new T.MeshStandardMaterial({
        map: tex,
        transparent: true,
        metalness: 0.6,
        roughness: 0.6,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      mk.name = 'marquage_laser';
      add('marquage_BE', new T.RingGeometry(ro + ch, OD - ch, 128, 1), mk, 0, 0, B / 2 + 0.0003, ring);
    }
  }

  // Zone de charge radiale (bleue transparente en bas)
  const zone = add(
    'zone_de_charge',
    new T.RingGeometry(Rp - rb * 1.6, Rp + rb * 1.6, 48, 1, PHI_OUT - Math.PI / 3, (2 * Math.PI) / 3),
    mat.zone,
    0,
    0,
    B / 2 + 0.0015,
    ring
  );
  zone.renderOrder = 3;

  // Arbre + bague intérieure + écrou (tournants)
  const shaft = grp('arbre_rot', 0, Hc, 0);
  const zF = Lh / 2 + 0.06;
  add('arbre', cylZ(bore, zF + 0.3, 48), mat.steel, 0, 0, (zF - 0.3) / 2, shaft);
  add('chanfrein_arbre', new T.CylinderGeometry(bore * 0.92, bore, 0.004, 48).rotateX(Math.PI / 2), mat.steel, 0, 0, zF + 0.002, shaft);
  add('epaulement', cylZ(bore * 1.18, 0.1), mat.steel, 0, 0, -Lh / 2 - 0.06, shaft);
  add('rainure_clavette', box(bore * 0.52, bore * 0.3, 0.045), mat.dark, 0, bore * 0.86, zF - 0.03, shaft);
  add('clavette', box(bore * 0.48, bore * 0.38, 0.04), mat.key, 0, bore * 1.0, zF - 0.03, shaft);
  add('repere_arbre', box(bore * 0.22, bore * 1.5, 0.001), mat.tape, 0, -bore * 0.25, zF + 0.0045, shaft);
  add('accouplement', cylZ(bore * 2.7, 0.04), mat.coupling, 0, 0, -0.3, shaft);
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    add('vis_accouplement', cylZ(bore * 0.22, 0.044, 12), mat.bolt, Math.cos(a) * bore * 2.1, Math.sin(a) * bore * 2.1, -0.3, shaft);
  }

  const innerG = grp('bague_interieure_rot', 0, Hc, 0);
  add(
    'bague_interieure',
    lathe([
      [bore + ch * 0.6, -B / 2],
      [ri - ch * 0.6, -B / 2],
      [ri, -B / 2 + ch * 0.6],
      [ri, -z0],
      ...arc(-1, -b0, b0),
      [ri, z0],
      [ri, B / 2 - ch * 0.6],
      [ri - ch * 0.6, B / 2],
      [bore + ch * 0.6, B / 2],
      [bore, B / 2 - ch * 0.6],
      [bore, -B / 2 + ch * 0.6],
      [bore + ch * 0.6, -B / 2],
    ]),
    mat.ringIn,
    0,
    0,
    0,
    innerG
  );

  // Rondelle frein + écrou à encoches
  const nz = B / 2 + 0.0035;
  add(
    'rondelle_frein',
    lathe([
      [bore, nz - 0.0015],
      [bore + (ri - bore) * 0.6, nz - 0.0015],
      [bore + (ri - bore) * 0.6, nz + 0.0015],
      [bore, nz + 0.0015],
      [bore, nz - 0.0015],
    ], 48),
    mat.shim,
    0,
    0,
    0,
    shaft
  );

  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const t = add('languette', box(bore * 0.18, bore * 0.2, 0.0015), mat.shim, Math.cos(a) * (bore + (ri - bore) * 0.62), Math.sin(a) * (bore + (ri - bore) * 0.62), nz, shaft);
    t.rotation.z = a;
  }

  const kz = nz + 0.0015 + 0.005;
  const rk = bore + (ri - bore) * 0.5;
  add('ecrou_encoches', lathe([[bore, kz - 0.005], [rk, kz - 0.005], [rk, kz + 0.005], [bore, kz + 0.005], [bore, kz - 0.005]], 48), mat.nut, 0, 0, 0, shaft);
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 + 0.4;
    const e = add('encoche', box(bore * 0.2, bore * 0.16, 0.0102), mat.dark, Math.cos(a) * rk * 0.97, Math.sin(a) * rk * 0.97, kz, shaft);
    e.rotation.z = a;
  }

  // Cage rivetée + billes
  const cage = grp('cage_rot', 0, Hc, 0);
  const balls: THREE.Group[] = [];
  const cmat = p.def === 'cage' ? mat.cageDef : mat.cage;
  const gap = (TAU * Rp) / p.n - dS;

  const pk = Math.asin(Math.min(0.99, (rb * 1.08) / Rp));
  const step = TAU / p.n;
  for (const sz of [-1, 1]) {
    for (let k = 0; k < p.n; k++) {
      const a0 = k * step + pk;
      const len = step - 2 * pk;
      if (len <= 0.01) continue;
      const sh = new T.Shape();
      sh.absarc(0, 0, Rp + 0.2 * dS, a0, a0 + len, false);
      sh.absarc(0, 0, Rp - 0.2 * dS, a0 + len, a0, true);
      add('flasque_cage', new T.ExtrudeGeometry(sh, { depth: 0.05 * dS, bevelEnabled: false, curveSegments: 24 }), cmat, 0, 0, sz * 0.58 * dS - 0.025 * dS, cage);
    }
  }

  for (let k = 0; k < p.n; k++) {
    const a = ((k + 0.5) * TAU) / p.n;
    const cx = Rp * Math.cos(a);
    const cy = Rp * Math.sin(a);
    const br = add('pont_cage', box(0.42 * dS, Math.max(gap * 0.5, 0.0015), 1.16 * dS), cmat, cx, cy, 0, cage);
    br.rotation.z = a;
    for (const sz of [-1, 1]) {
      add('rivet', new T.SphereGeometry(0.07 * dS, 10, 8), mat.rivet, cx, cy, sz * 0.62 * dS, cage);
    }
    const holder = grp('alveole_' + k, 0, 0, 0, cage);
    holder.rotation.z = (k * TAU) / p.n;
    const spin = grp('bille_' + (k + 1), Rp, 0, 0, holder);
    add('bille', new T.SphereGeometry(rb, 32, 20), mat.ball, 0, 0, 0, spin);
    balls.push(spin);
  }

  // Graisse lithium
  const grease: THREE.Object3D[] = [];
  for (let k = 0; k < p.n; k++) {
    for (const sz of [-1, 1]) {
      const a = ((k + 0.5) * TAU) / p.n + sz * 0.12;
      const gb = add(
        'graisse_cage',
        new T.SphereGeometry(rb * 0.42, 12, 8),
        mat.grease,
        (Rp + sz * 0.05 * dS) * Math.cos(a),
        (Rp + sz * 0.05 * dS) * Math.sin(a),
        sz * 0.7 * dS,
        cage
      );
      gb.scale.set(1.2, 0.8, 0.5);
      grease.push(gb);
    }
  }

  for (const sz of [-1, 1]) {
    const z1 = sz * (B / 2 + 0.002);
    const z2 = sz * (Lh / 2 - 0.013);
    const zm = Math.min(z1, z2);
    const zM = Math.max(z1, z2);
    if (zM - zm > 0.003) {
      const gc = add(
        'graisse_chambre',
        lathe([[ri * 1.02, zm], [OD * 0.98, zm], [OD * 0.98, zM], [ri * 1.02, zM], [ri * 1.02, zm]], 64),
        mat.greaseCh,
        0,
        Hc,
        0,
        housing
      );
      gc.rotation.z = Math.PI;
      grease.push(gc);
    }
  }

  if (p.def === 'cage') {
    const fis = add('fissure_cage', box(0.5 * dS, 0.12 * dS, 0.1 * dS), mat.crack, Rp, 0, 0.64 * dS, cage);
    fis.rotation.z = 0.3;
  }

  // Écaillage : cratère irrégulier (fragments arrachés)
  const spall = (name: string, parent: THREE.Object3D, r: number, ang: number, out: number) => {
    const g = grp(name, r * Math.cos(ang), r * Math.sin(ang), 0, parent);
    g.rotation.z = ang;
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    add('fond_cratere', box(0.06 * dS, 0.42 * dS, 0.5 * dS), mat.def, out * 0.01 * dS, 0, 0, g);
    for (let i = 0; i < 9; i++) {
      const f = add('fragment', new T.DodecahedronGeometry(0.06 * dS * (0.6 + rnd()), 0), mat.def, out * 0.02 * dS, (rnd() - 0.5) * 0.5 * dS, (rnd() - 0.5) * 0.6 * dS, g);
      f.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      f.scale.x = 0.4;
    }
  };

  if (p.def === 'outer') spall('ecaillage_BE', ring, Rp + rb, PHI_OUT, 1);
  if (p.def === 'inner') spall('ecaillage_BI', innerG, Rp - rb, PHI_IN, -1);
  if (p.def === 'ball' && balls[0]) {
    const eb = add('ecaillage_bille', new T.SphereGeometry(rb * 0.3, 16, 12), mat.def, rb * 0.84, 0, 0, balls[0]);
    eb.scale.set(0.35, 1, 1);
    for (let i = 0; i < 4; i++) {
      add('fragment', new T.DodecahedronGeometry(rb * 0.08, 0), mat.def, rb * 0.95, (i - 1.5) * rb * 0.12, ((i % 2) - 0.5) * rb * 0.15, balls[0]);
    }
  }

  // Accéléromètre monté au sommet du chapeau
  const sensor = grp('accelerometre', 0, Hc + Rb + 0.0008, 0, cap);
  add('lamage', cylY(0.016, 0.002), mat.machined, 0, 0.001, 0, sensor);
  add('base_hex', hexY(0.012, 0.008), mat.ss, 0, 0.006, 0, sensor);
  add('corps', cylY(0.0105, 0.03, 32), mat.ss, 0, 0.025, 0, sensor);
  add('bague_moletee', cylY(0.0112, 0.004, 24), mat.sensor, 0, 0.032, 0, sensor);
  add('connecteur', cylZ(0.0045, 0.012, 16).rotateY(Math.PI / 2), mat.ss, 0.014, 0.022, 0, sensor);
  const cableCurve = new T.CatmullRomCurve3([
    new T.Vector3(0.02, 0.022, 0),
    new T.Vector3(0.05, 0.03, 0.01),
    new T.Vector3(0.09, 0.02, 0.05),
    new T.Vector3(0.12, -0.02, 0.09),
  ]);
  add('cable', new T.TubeGeometry(cableCurve, 40, 0.003, 8, false), mat.cable, 0, 0, 0, sensor);

  // Effets d'impact (sphère flash + onde de choc annulaire)
  const flash = add('impact', new T.SphereGeometry(1, 24, 16), mat.flash, 0, 0, B / 2);
  flash.visible = false;
  flash.renderOrder = 5;

  const wave = add('onde_choc', new T.TorusGeometry(1, 0.05, 8, 64), mat.flash2, 0, Hc, B / 2 + 0.003);
  wave.visible = false;
  wave.renderOrder = 5;

  return {
    root,
    grease,
    ring,
    innerG,
    ri,
    ro,
    dS,
    shaft,
    cage,
    balls,
    housing,
    cap,
    flash,
    wave,
    Hc,
    Rp,
    rb,
    Rh: Rb,
    B,
    OD,
    Lh,
  };
}
