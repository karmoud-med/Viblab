// Groupe motopompe 3D industriel détaillé :
// Moteur asynchrone triphasé + Accouplement élastique à mâchoires + Palier de pompe + Volute centrifuge sur châssis UPN et massif béton
import * as THREE from 'three';
import { MachineTextures } from './machineTextures';

const TAU = Math.PI * 2;
export const H = 0.26; // Hauteur d'axe en mètres

export type SourceId = 'unb' | 'mis' | 'mag' | 'vane' | 'brg';

export interface MachinePartsMap {
  unb: THREE.Mesh[];
  mis: THREE.Mesh[];
  mag: THREE.Mesh[];
  vane: THREE.Mesh[];
  brg: THREE.Mesh[];
}

export interface Machine3DResult {
  root: THREE.Group;
  shaft: THREE.Group;
  fan: THREE.Group;
  brgs: THREE.Group[];
  parts: MachinePartsMap;
  housing: THREE.Mesh[];
  cats: Map<string, THREE.Mesh[]>;
  flash: THREE.Mesh;
  led: THREE.Mesh;
  defPos: THREE.Vector3;
}

export type MachineMaterials = ReturnType<typeof makeMaterials>;

export function makeMaterials(T: typeof THREE = THREE, tx?: MachineTextures) {
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

  const mats = {
    concrete: M('beton', 0xb9b6ae, 0.95, 0),
    frame: M('chassis_peint', 0x3a4a5c, 0.6, 0.3),
    machined: M('acier_usine', 0xb8c0c8, 0.3, 0.9),
    shim: M('cale_inox', 0xd1d5db, 0.25, 0.9),
    motorPaint: M('peinture_moteur_RAL5010', 0x1f4e79, 0.45, 0.25, { side: T.DoubleSide }),
    pumpPaint: M('peinture_pompe_RAL3000', 0x9b1c1c, 0.5, 0.2, { side: T.DoubleSide }),
    guard: M('protecteur_jaune', 0xf2b705, 0.5, 0.2, { side: T.DoubleSide }),
    grill: M('grille', 0x111827, 0.6, 0.4, { transparent: true, opacity: 0.55 }),
    steel: M('acier_arbre', 0xccd2d8, 0.25, 0.95),
    chrome: M('chemise_chromee', 0xe5e7eb, 0.08, 1),
    key: M('clavette', 0x9aa1a9, 0.35, 0.8),
    lamA: M('toles_magnetiques', 0x6b7280, 0.4, 0.8),
    lamB: M('toles_magnetiques_2', 0x4b5563, 0.4, 0.8),
    alu: M('aluminium_coule', 0xbfc5cc, 0.4, 0.9),
    copper: M('cuivre', 0xb87333, 0.3, 1),
    unbal: M('masse_balourd', 0xdc2626, 0.5, 0.3),
    plastic: M('polyamide', 0x1f2937, 0.6, 0),
    coupling: M('fonte_accouplement', 0x5b6470, 0.4, 0.8),
    spider: M('elastomere', 0xdc2626, 0.7, 0),
    bronze: M('bronze_roue', 0xb08d57, 0.3, 0.95),
    bronze2: M('bronze_bague_usure', 0x9c7a45, 0.35, 0.9),
    ring: M('acier_roulement', 0xd7dbe0, 0.15, 1),
    ball: M('element_roulant_chrome', 0x9aa3ad, 0.05, 1),
    brassCage: M('cage_laiton', 0xc19a5b, 0.3, 0.95),
    defect: M('ecaillage', 0x3b2f2a, 0.95, 0.2),
    ceramic: M('ceramique', 0xf1f5f9, 0.2, 0),
    carbon: M('carbone', 0x111827, 0.3, 0.2),
    bolt: M('acier_brunit', 0x2b3038, 0.45, 0.85),
    zinc: M('acier_zingue', 0xc8cdd2, 0.3, 0.8),
    brass: M('laiton', 0xc5a15a, 0.3, 0.9),
    dark: M('noir', 0x111827, 0.8, 0),
    glass: M('verre', 0x93c5fd, 0.05, 0, { transparent: true, opacity: 0.55 }),
    oil: M('huile', 0xd4a017, 0.2, 0, { transparent: true, opacity: 0.6 }),
    rubber: M('caoutchouc_NBR', 0x161616, 0.85, 0),
    pipe: M('tuyauterie', 0x6b7280, 0.45, 0.6),
    dial: M('cadran', 0xffffff, 0.6, 0),
    cable: M('cable', 0x0f172a, 0.7, 0.1),
    ss: M('inox_capteur', 0xd1d5db, 0.22, 0.95),
    led: M('led_capteur', 0x334155, 0.4, 0.3, { emissive: 0x10b981, emissiveIntensity: 0 }),
    flash: Object.assign(
      new T.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85, depthTest: false }),
      { name: 'impact' }
    ),
    castGrey: M('fonte_grise_vanne', 0x4b5563, 0.6, 0.35),
    handwheel: M('volant_peint', 0xb91c1c, 0.45, 0.2),
    weld: M('cordon_soudure', 0x334155, 0.7, 0.5),
    conduit: M('gaine_annelee', 0x111827, 0.6, 0),
    plateMotor: M('plaque_moteur', 0xffffff, 0.45, 0.6),
    platePump: M('plaque_pompe', 0xffffff, 0.45, 0.6),
    arrow: M('fleche_rotation', 0xffffff, 0.5, 0, { transparent: true, alphaTest: 0.3, side: T.DoubleSide }),
  };

  if (!tx) return mats;

  type MatKey = keyof typeof mats;
  const set = (k: MatKey, o: Record<string, any>) => {
    const { color, ...rest } = o;
    Object.assign(mats[k], rest);
    if (color != null) (mats[k] as any).color.set(color);
    (mats[k] as any).needsUpdate = true;
  };

  for (const k of ['motorPaint', 'frame', 'guard', 'handwheel'] as MatKey[]) {
    set(k, { bumpMap: tx.paintBump, bumpScale: 0.6, roughnessMap: tx.paintRough });
  }
  for (const k of ['pumpPaint', 'castGrey', 'coupling'] as MatKey[]) {
    set(k, { bumpMap: tx.castBump, bumpScale: 1.4, roughnessMap: tx.paintRough });
  }
  for (const k of ['steel', 'machined', 'shim', 'key', 'pipe'] as MatKey[]) {
    set(k, { roughnessMap: tx.brushed, bumpMap: tx.brushed, bumpScale: 0.15 });
  }

  set('concrete', { map: tx.concrete, color: 0xffffff });
  set('guard', { alphaMap: tx.perforated, alphaTest: 0.5 });
  mats.plateMotor = M('plaque_moteur', 0xffffff, 0.45, 0.6, { map: tx.plateMotor });
  mats.platePump = M('plaque_pompe', 0xffffff, 0.45, 0.6, { map: tx.platePump });
  mats.arrow = M('fleche_rotation', 0xffffff, 0.5, 0, { map: tx.arrow, transparent: true, alphaTest: 0.3, side: T.DoubleSide });
  set('dial', { map: tx.dial, color: 0xffffff });

  return mats;
}

export function buildMachine(
  T: typeof THREE = THREE,
  mat: MachineMaterials
): Machine3DResult {
  const root = new T.Group();
  root.name = 'groupe_motopompe';

  const parts: MachinePartsMap = { unb: [], mis: [], mag: [], vane: [], brg: [] };
  const housing: THREE.Mesh[] = [];
  const cats = new Map<string, THREE.Mesh[]>();
  let CAT = '';

  const add = (
    name: string,
    geo: THREE.BufferGeometry,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root,
    src: SourceId | null = null,
    hous = false
  ): THREE.Mesh => {
    const o = new T.Mesh(geo, mt.clone());
    o.name = name;
    o.position.set(x, y, z);
    parent.add(o);

    o.userData.part = CAT;
    if (!cats.has(CAT)) cats.set(CAT, []);
    cats.get(CAT)!.push(o);

    if (src) {
      o.userData.src = src;
      parts[src].push(o);
    }
    if (hous) housing.push(o);
    return o;
  };

  const grp = (name: string, x: number, y: number, z: number, parent: THREE.Object3D = root): THREE.Group => {
    const g = new T.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const cylX = (r: number, l: number, seg = 48, open = false) =>
    new T.CylinderGeometry(r, r, l, seg, 1, open).rotateZ(Math.PI / 2);
  const cylY = (r: number, l: number, seg = 32) =>
    new T.CylinderGeometry(r, r, l, seg);
  const cylZ = (r: number, l: number, seg = 24) =>
    new T.CylinderGeometry(r, r, l, seg).rotateX(Math.PI / 2);
  const hexY = (r: number, l: number) =>
    new T.CylinderGeometry(r, r, l, 6);
  const hexX = (r: number, l: number) =>
    new T.CylinderGeometry(r, r, l, 6).rotateZ(Math.PI / 2);
  const box = (a: number, b: number, c: number) =>
    new T.BoxGeometry(a, b, c);
  const latheX = (pts: [number, number][], seg = 64) =>
    new T.LatheGeometry(pts.map(([r, x]) => new T.Vector2(r, x)), seg).rotateZ(-Math.PI / 2);
  const ringX = (r1: number, r2: number, w: number, seg = 64) =>
    latheX([[r1, -w / 2], [r2, -w / 2], [r2, w / 2], [r1, w / 2], [r1, -w / 2]], seg);
  const torX = (R: number, r: number, seg = 48) =>
    new T.TorusGeometry(R, r, 12, seg).rotateY(Math.PI / 2);
  const radial = (o: THREE.Mesh, a: number) => {
    o.rotation.x = Math.PI / 2 - a;
    return o;
  };
  const nipple = (x: number, y: number, z: number, parent: THREE.Object3D = root) => {
    add('graisseur_hex', hexY(0.006, 0.008), mat.brass, x, y + 0.004, z, parent);
    add('graisseur_tete', new T.SphereGeometry(0.004, 12, 8), mat.brass, x, y + 0.011, z, parent);
  };

  // Ligne d'arbres tournante & roulements
  const shaft = grp('ligne_arbres_rot', 0, H, 0);
  const brgs: THREE.Group[] = [];

  const bearing = (
    x: number,
    ri: number,
    ro: number,
    w: number,
    n: number,
    type: 'ball' | 'roller' | 'ac',
    src: SourceId | null = null
  ) => {
    const Rp = (ri + ro) / 2;
    const e = (ro - ri) * 0.5;
    const rb = e * 0.42;

    add(
      'bague_exterieure',
      latheX([[Rp + rb * 0.7, -w / 2], [ro, -w / 2], [ro, w / 2], [Rp + rb * 0.7, w / 2], [Rp + rb * 0.7, -w / 2]]),
      mat.ring,
      x,
      H,
      0,
      root,
      src
    );
    add(
      'bague_interieure',
      latheX([[ri, -w / 2], [Rp - rb * 0.7, -w / 2], [Rp - rb * 0.7, w / 2], [ri, w / 2], [ri, -w / 2]]),
      mat.ring,
      x,
      0,
      0,
      shaft,
      src
    );

    if (type === 'roller') {
      for (const sx of [-1, 1]) {
        add('epaulement_NU', ringX(Rp + rb * 0.7, Rp + rb * 1.05, w * 0.12), mat.ring, x + sx * w * 0.44, H, 0, root, src);
      }
    }

    const cage = grp('cage_rot', x, H, 0);
    brgs.push(cage);

    const rows = type === 'ac' ? [-w / 4, w / 4] : [0];
    const r = type === 'ac' ? rb * 0.72 : rb;

    for (const dx of rows) {
      for (let i = 0; i < n; i++) {
        const a = (i * TAU) / n + (dx > 0 ? Math.PI / n : 0);
        const y = Rp * Math.sin(a);
        const z = Rp * Math.cos(a);
        if (type === 'roller') {
          add('rouleau_cylindrique', cylX(rb, w * 0.7, 16), mat.ball, 0, y, z, cage, src);
        } else {
          add('bille', new T.SphereGeometry(r, 20, 14), mat.ball, dx, y, z, cage, src);
        }
      }
    }

    for (const dx of type === 'ac' ? [-w / 2 + 0.002, 0, w / 2 - 0.002] : [-w * 0.42, w * 0.42]) {
      add('cage', torX(Rp, rb * 0.16, 64), mat.brassCage, dx, 0, 0, cage, src);
    }

    return { Rp, rb, ro };
  };

  // ---------- Massif + Châssis mécano-soudé ----------
  CAT = 'Châssis · Massif béton';
  add('massif_beton', box(1.42, 0.04, 0.56), mat.concrete, -0.03, 0.02, 0);

  CAT = 'Châssis · Châssis mécano-soudé (UPN)';
  for (const sz of [-1, 1]) {
    add('longeron_UPN', box(1.2, 0.03, 0.04), mat.frame, -0.03, 0.055, sz * 0.18);
  }
  for (const x of [-0.58, -0.25, 0.08, 0.5]) {
    add('traverse', box(0.04, 0.03, 0.36), mat.frame, x, 0.055, 0);
  }
  add('platine_chassis', box(1.2, 0.006, 0.42), mat.frame, -0.03, 0.073, 0);
  for (const x of [-0.58, -0.25, 0.08, 0.5]) {
    for (const sz of [-1, 1]) {
      add('cordon_soudure', cylY(0.004, 0.03, 8), mat.weld, x + 0.02, 0.055, sz * 0.16);
    }
  }
  add('rebord_egouttoir', box(1.2, 0.012, 0.006), mat.frame, -0.03, 0.082, 0.21);
  add('rebord_egouttoir', box(1.2, 0.012, 0.006), mat.frame, -0.03, 0.082, -0.21);

  CAT = 'Châssis · Tiges de scellement';
  for (const sx of [-0.6, 0.53]) {
    for (const sz of [-0.24, 0.24]) {
      add('tige_scellement', cylY(0.007, 0.05), mat.bolt, sx, 0.065, sz);
      add('ecrou_scellement', hexY(0.012, 0.01), mat.bolt, sx, 0.08, sz);
      add('patte_scellement', box(0.05, 0.01, 0.06), mat.frame, sx, 0.07, sz * 0.92);
    }
  }

  const yb = 0.08;
  CAT = 'Châssis · Semelles usinées et cales';
  for (const x of [-0.4, -0.24]) {
    add('semelle_usinee_moteur', box(0.08, 0.004, 0.26), mat.machined, x, yb - 0.002, 0);
    add('cale_inox', box(0.07, 0.002, 0.25), mat.shim, x, yb + 0.001, 0);
  }
  add('semelle_usinee_palier', box(0.08, 0.004, 0.16), mat.machined, 0.1, yb - 0.002, 0);
  add('semelle_usinee_volute', box(0.1, 0.004, 0.22), mat.machined, 0.3, yb - 0.002, 0);
  for (const sz of [-1, 1]) {
    add('vis_poussee_alignement', cylZ(0.005, 0.04, 8), mat.bolt, -0.44, yb + 0.012, sz * 0.15);
  }

  // ---------- Ligne d'arbres (tournante) ----------
  CAT = 'Moteur · Arbre moteur';
  add('arbre_moteur', cylX(0.022, 0.48), mat.steel, -0.3, 0, 0, shaft, 'unb');
  add('clavette_arbre_moteur', box(0.032, 0.008, 0.01), mat.key, -0.088, 0.022, 0, shaft, 'unb');

  CAT = 'Moteur · Rotor à cage d’écureuil';
  for (let i = 0; i < 11; i++) {
    add('rotor_tole', cylX(0.066, 0.018, 48), i % 2 ? mat.lamA : mat.lamB, -0.41 + i * 0.019, 0, 0, shaft, 'unb');
  }
  for (let i = 0; i < 28; i++) {
    const a = (i * TAU) / 28;
    radial(add('barre_rotor', box(0.215, 0.006, 0.005), mat.alu, -0.315, 0.064 * Math.sin(a), 0.064 * Math.cos(a), shaft, 'unb'), a);
  }
  for (const x of [-0.423, -0.207]) {
    add('anneau_court_circuit', ringX(0.045, 0.067, 0.012), mat.alu, x, 0, 0, shaft, 'unb');
  }
  add('masse_balourd', box(0.025, 0.012, 0.03), mat.unbal, -0.31, 0.072, 0, shaft, 'unb');

  CAT = 'Moteur · Ventilateur de refroidissement';
  const fan = grp('ventilateur', -0.505, 0, 0, shaft);
  add('moyeu_ventilateur', cylX(0.03, 0.02), mat.plastic, 0, 0, 0, fan);
  for (let i = 0; i < 9; i++) {
    const a = (i * TAU) / 9;
    const b = radial(add('pale', box(0.024, 0.07, 0.004), mat.plastic, 0, 0.055 * Math.sin(a), 0.055 * Math.cos(a), fan), a);
    b.rotation.y = 0.35;
  }

  CAT = 'Accouplement · Moyeux et étoile élastomère';
  for (const x of [-0.088, -0.036]) {
    add('moyeu_accouplement', cylX(0.046, 0.034), mat.coupling, x, 0, 0, shaft, 'mis');
    add('vis_pression', cylY(0.004, 0.01, 8), mat.bolt, x, 0.046, 0, shaft);
  }
  add('etoile_elastomere', cylX(0.04, 0.016), mat.spider, -0.062, 0, 0, shaft, 'mis');
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    radial(add('machoire', box(0.026, 0.02, 0.022), mat.coupling, -0.062 + (i % 2 ? 0.008 : -0.008), 0.032 * Math.sin(a), 0.032 * Math.cos(a), shaft, 'mis'), a);
  }

  CAT = 'Pompe · Arbre de pompe et chemise';
  add('arbre_pompe', cylX(0.019, 0.4), mat.steel, 0.14, 0, 0, shaft, 'unb');
  add('clavette_arbre_pompe', box(0.03, 0.007, 0.009), mat.key, -0.034, 0.019, 0, shaft, 'unb');
  add('chemise_arbre', cylX(0.023, 0.06), mat.chrome, 0.245, 0, 0, shaft);
  add('ecrou_blocage_roulements', hexX(0.027, 0.01), mat.bolt, 0.012, 0, 0, shaft);
  add('deflecteur', ringX(0.019, 0.04, 0.004), mat.rubber, 0.21, 0, 0, shaft);

  CAT = 'Pompe · Roue fermée 7 aubes';
  const imp = grp('roue_pompe', 0.31, 0, 0, shaft);
  add('flasque_arriere', cylX(0.092, 0.007, 64), mat.bronze, -0.022, 0, 0, imp, 'vane');
  add(
    'flasque_avant',
    latheX([[0.035, 0.018], [0.092, 0.012], [0.092, 0.018], [0.035, 0.024], [0.035, 0.018]]),
    mat.bronze,
    0,
    0,
    0,
    imp,
    'vane'
  );
  add('moyeu_roue', cylX(0.03, 0.04), mat.bronze, -0.005, 0, 0, imp, 'vane');
  for (let i = 0; i < 6; i++) {
    const a = (i * TAU) / 6;
    add('trou_equilibrage', cylX(0.004, 0.009, 10), mat.dark, -0.022, 0.045 * Math.sin(a), 0.045 * Math.cos(a), imp);
  }
  add('ecrou_roue', hexX(0.018, 0.016), mat.bolt, 0.026, 0, 0, imp);
  for (let i = 0; i < 7; i++) {
    for (let s = 0; s < 3; s++) {
      const r = 0.042 + s * 0.018;
      const a = (i * TAU) / 7 - s * 0.28;
      const v = add('aube', box(0.024, 0.02, 0.004), mat.bronze, 0, r * Math.sin(a), r * Math.cos(a), imp, 'vane');
      radial(v, a);
      v.rotation.x += 0.5;
    }
  }

  // ---------- Moteur asynchrone ----------
  const mX = -0.32;
  CAT = 'Moteur · Carcasse à ailettes';
  add('carcasse_moteur', cylX(0.1, 0.3, 64), mat.motorPaint, mX, H, 0, root, 'mag', true);
  for (let i = 0; i < 32; i++) {
    const a = (i * TAU) / 32;
    const deg = (a * 180) / Math.PI;
    if ((deg > 200 && deg < 340) || (deg > 75 && deg < 105)) continue;
    radial(add('ailette', box(0.27, 0.026, 0.005), mat.motorPaint, mX, H + 0.11 * Math.sin(a), 0.11 * Math.cos(a), root, 'mag', true), a);
  }
  for (const a of [Math.PI / 4, (3 * Math.PI) / 4]) {
    for (const s of [1, -1]) {
      add('tirant', cylX(0.004, 0.34, 8), mat.bolt, mX, H + 0.102 * Math.sin(a), s * 0.102 * Math.cos(a));
    }
  }

  CAT = 'Moteur · Flasques paliers';
  for (const x of [mX - 0.16, mX + 0.16]) {
    add('flasque_moteur', cylX(0.097, 0.03, 64), mat.motorPaint, x, H, 0, root, 'mag', true);
    nipple(x, H + 0.097, 0);
  }
  add('bossage_palier_CA', cylX(0.058, 0.03), mat.motorPaint, mX + 0.185, H, 0, root, 'mag', true);
  add('chapeau_roulement_CA', ringX(0.024, 0.045, 0.01), mat.motorPaint, mX + 0.205, H, 0, root, 'mag', true);
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 + Math.PI / 4;
    add('vis_chapeau', hexX(0.004, 0.006), mat.bolt, mX + 0.212, H + 0.036 * Math.sin(a), 0.036 * Math.cos(a));
  }
  add('joint_V_ring', torX(0.024, 0.004), mat.rubber, mX + 0.216, 0, 0, shaft);

  CAT = 'Moteur · Capot ventilateur';
  add('capot_ventilateur', cylX(0.1, 0.075, 64, true), mat.motorPaint, -0.515, H, 0, root, 'mag', true);
  add('grille_capot', cylX(0.098, 0.004, 64), mat.grill, -0.553, H, 0, root, null, true);
  for (let i = 1; i <= 4; i++) {
    add('anneau_grille', torX(0.022 * i, 0.003, 48), mat.motorPaint, -0.556, H, 0, root, null, true);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i * TAU) / 3;
    add('vis_capot', cylY(0.003, 0.008, 8), mat.bolt, -0.5, H + 0.1 * Math.sin(a), 0.1 * Math.cos(a));
  }

  CAT = 'Moteur · Stator et bobinage';
  add('stator', ringX(0.072, 0.092, 0.26), mat.lamA, mX, H, 0, root, 'mag');
  for (let i = 0; i < 36; i++) {
    const a = (i * TAU) / 36;
    radial(add('encoche_stator', box(0.262, 0.008, 0.003), mat.copper, mX, H + 0.076 * Math.sin(a), 0.076 * Math.cos(a), root, 'mag'), a);
  }
  for (const x of [mX - 0.145, mX + 0.145]) {
    add('tete_bobine', torX(0.08, 0.016), mat.copper, x, H, 0, root, 'mag');
  }

  CAT = 'Moteur · Boîte à bornes';
  add('boite_bornes', box(0.1, 0.06, 0.1), mat.motorPaint, mX + 0.02, H + 0.12, 0, root, 'mag', true);
  add('couvercle_boite', box(0.108, 0.01, 0.108), mat.motorPaint, mX + 0.02, H + 0.155, 0, root, 'mag', true);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add('vis_couvercle', cylY(0.004, 0.006, 8), mat.bolt, mX + 0.02 + sx * 0.045, H + 0.162, sz * 0.045);
    }
  }
  add('presse_etoupe', cylZ(0.012, 0.03), mat.plastic, mX + 0.02, H + 0.115, 0.065);
  add(
    'cable_alimentation',
    new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(mX + 0.02, H + 0.115, 0.08),
        new T.Vector3(mX + 0.02, H + 0.1, 0.16),
        new T.Vector3(mX, 0.1, 0.24),
        new T.Vector3(mX - 0.05, 0.09, 0.3),
      ]),
      30,
      0.008,
      8
    ),
    mat.cable,
    0,
    0,
    0
  );

  CAT = 'Moteur · Plaque, levage et pattes';
  add('anneau_levage', new T.TorusGeometry(0.02, 0.005, 10, 24), mat.bolt, mX - 0.09, H + 0.125, 0);
  add('plaque_signaletique', new T.PlaneGeometry(0.09, 0.045), mat.plateMotor, mX - 0.06, H + 0.025, 0.1012, root, null, true);
  const flRot = add('fleche_sens_rotation', new T.PlaneGeometry(0.05, 0.025), mat.arrow, -0.5532, H + 0.075, 0, root, null, true);
  flRot.rotation.y = -Math.PI / 2;
  add('borne_terre', hexY(0.006, 0.01), mat.brass, -0.24, yb + 0.03, 0.125);
  for (const x of [-0.4, -0.24]) {
    add('patte_moteur', box(0.07, H - 0.07 - yb, 0.24), mat.motorPaint, x, yb + (H - 0.07 - yb) / 2, 0, root, 'mag', true);
    for (const sz of [-1, 1]) {
      add('vis_patte', hexY(0.011, 0.01), mat.bolt, x, yb + 0.012, sz * 0.1);
      add('rondelle_patte', cylY(0.014, 0.002), mat.zinc, x, yb + 0.006, sz * 0.1);
    }
  }

  CAT = 'Roulements · Moteur côté ventilateur – 6309 (billes)';
  bearing(mX - 0.155, 0.022, 0.05, 0.025, 8, 'ball');

  CAT = 'Roulements · Moteur côté accouplement – NU 309 (rouleaux)';
  bearing(mX + 0.165, 0.022, 0.05, 0.025, 12, 'roller');

  // ---------- Protecteur d'accouplement ----------
  CAT = 'Accouplement · Protecteur';
  const gd = add('protecteur_accouplement', cylX(0.075, 0.13, 48, true), mat.guard, -0.062, H, 0, root, 'mis', true);
  (gd.material as THREE.Material).side = T.DoubleSide;
  for (const x of [-0.11, -0.015]) {
    add('support_protecteur', box(0.01, H - yb - 0.07, 0.03), mat.guard, x, yb + (H - yb - 0.07) / 2, 0.06, root, null, true);
  }

  // ---------- Palier de pompe (lanterne) ----------
  const pX = 0.1;
  CAT = 'Palier pompe · Corps de palier';
  add('corps_palier_pompe', cylX(0.056, 0.2, 64), mat.pumpPaint, pX, H, 0, root, 'brg', true);
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 + Math.PI / 4;
    radial(add('nervure_palier', box(0.17, 0.012, 0.006), mat.pumpPaint, pX, H + 0.058 * Math.sin(a), 0.058 * Math.cos(a), root, 'brg', true), a);
  }
  add('pied_palier', box(0.07, H - 0.05 - yb, 0.14), mat.pumpPaint, pX, yb + (H - 0.05 - yb) / 2, 0, root, 'brg', true);
  add('bouchon_remplissage', hexY(0.01, 0.014), mat.brass, pX - 0.05, H + 0.064, 0);
  const plqP = add('plaque_pompe', new T.PlaneGeometry(0.075, 0.0375), mat.platePump, pX + 0.01, H + 0.002, -0.0572);
  plqP.rotation.y = Math.PI;
  const flP = add('fleche_sens_rotation', new T.PlaneGeometry(0.05, 0.025), mat.arrow, pX - 0.02, H + 0.035, 0.05, root);
  flP.rotation.x = -0.6;
  add('bouchon_vidange', hexY(0.008, 0.01), mat.brass, pX - 0.05, H - 0.062, 0);

  CAT = 'Palier pompe · Couvercles et joints labyrinthe';
  for (const x of [pX - 0.105, pX + 0.105]) {
    add('couvercle_palier', ringX(0.02, 0.062, 0.02), mat.pumpPaint, x, H, 0, root, 'brg', true);
    add('joint_labyrinthe', ringX(0.019, 0.03, 0.014), mat.bronze, x + Math.sign(x - pX) * 0.012, 0, 0, shaft);
  }

  CAT = 'Palier pompe · Graissage huile (niveau constant)';
  add('voyant_huile', cylZ(0.012, 0.006), mat.glass, pX - 0.02, H - 0.025, 0.058);
  add('bras_huileur', cylZ(0.004, 0.04, 8), mat.zinc, pX + 0.02, H - 0.035, 0.075);
  add('huileur_bulbe', new T.SphereGeometry(0.018, 20, 14), mat.glass, pX + 0.02, H - 0.012, 0.098);
  add('huile', box(0.17, 0.004, 0.08), mat.oil, pX, H - 0.03, 0);

  CAT = 'Roulements · Pompe arrière – 2 × 7309 BE (contact oblique)';
  bearing(pX - 0.07, 0.019, 0.048, 0.04, 10, 'ac');

  CAT = 'Roulements · Pompe côté roue – 6309 (billes) · défaut BPFO';
  const dB = bearing(pX + 0.07, 0.019, 0.048, 0.022, 8, 'ball', 'brg');
  const defPos = new T.Vector3(pX + 0.07, H - (dB.Rp + dB.rb * 0.72), 0);
  add('ecaillage_BE', box(0.012, 0.002, 0.01), mat.defect, defPos.x, defPos.y, 0, root, 'brg');

  CAT = 'Pompe · Garniture mécanique';
  add('grain_fixe', ringX(0.024, 0.034, 0.008), mat.ceramic, pX + 0.165, H, 0);
  add('grain_tournant', ringX(0.023, 0.032, 0.008), mat.carbon, pX + 0.157, 0, 0, shaft);
  add('ressort_garniture', torX(0.027, 0.003), mat.steel, pX + 0.145, 0, 0, shaft);
  add('chapeau_garniture', box(0.012, 0.09, 0.09), mat.pumpPaint, pX + 0.175, H, 0, root, null, true);
  for (const s of [-1, 1]) {
    add('goujon_chapeau', cylX(0.004, 0.025, 8), mat.bolt, pX + 0.18, H + s * 0.035, s * 0.035);
  }
  add('lanterne_ouverture', box(0.05, 0.03, 0.002), mat.dark, pX + 0.145, H, 0.057);

  // ---------- Volute centrifuge ----------
  const vX = 0.31;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 60; i++) {
    const th = -TAU + 0.35 + ((TAU - 0.35) * i) / 60;
    const r = 0.098 + 0.04 * (i / 60);
    pts.push(new T.Vector3(vX, H + r * Math.sin(th), r * Math.cos(th)));
  }
  const rEnd = 0.138;

  CAT = 'Pompe · Corps de volute';
  add('volute_spirale', new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.042, 20, false), mat.pumpPaint, 0, 0, 0, root, 'vane', true);
  add('corps_volute', cylX(0.1, 0.07, 64), mat.pumpPaint, vX, H, 0, root, 'vane', true);
  add('purge_volute', hexY(0.008, 0.012), mat.brass, vX, H - 0.18, 0);
  add('event_volute', hexY(0.007, 0.012), mat.brass, vX + 0.02, H + 0.182, -0.03);
  for (const sz of [-1, 1]) {
    add('pied_volute', box(0.09, H - 0.13 - yb, 0.05), mat.pumpPaint, vX, yb + (H - 0.13 - yb) / 2, sz * 0.08, root, 'vane', true);
  }

  CAT = 'Pompe · Couvercle, joint et bagues d’usure';
  add('couvercle_volute', cylX(0.148, 0.022, 64), mat.pumpPaint, vX - 0.05, H, 0, root, 'vane', true);
  add('joint_corps', ringX(0.12, 0.15, 0.003), mat.rubber, vX - 0.038, H, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i * TAU) / 12;
    add('vis_couvercle_volute', cylX(0.006, 0.03, 8), mat.bolt, vX - 0.05, H + 0.136 * Math.sin(a), 0.136 * Math.cos(a));
  }
  add('bague_usure_avant', ringX(0.035, 0.042, 0.012), mat.bronze2, vX + 0.022, H, 0);
  add('bague_usure_arriere', ringX(0.03, 0.037, 0.008), mat.bronze2, vX - 0.03, H, 0);

  CAT = 'Pompe · Aspiration (bride + tuyauterie)';
  add('nez_aspiration', cylX(0.052, 0.12, 48), mat.pumpPaint, vX + 0.09, H, 0, root, 'vane', true);
  add('bride_aspiration', cylX(0.082, 0.02), mat.pumpPaint, vX + 0.155, H, 0, root, 'vane', true);
  add('joint_bride_asp', ringX(0.05, 0.075, 0.003), mat.rubber, vX + 0.166, H, 0);
  add('contre_bride_asp', cylX(0.082, 0.018), mat.pipe, vX + 0.176, H, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    add('boulon_bride', cylX(0.006, 0.05, 8), mat.bolt, vX + 0.166, H + 0.068 * Math.sin(a), 0.068 * Math.cos(a));
    add('ecrou_bride', hexX(0.009, 0.007), mat.bolt, vX + 0.192, H + 0.068 * Math.sin(a), 0.068 * Math.cos(a));
  }
  add('tuyau_aspiration', cylX(0.05, 0.1, 48), mat.pipe, vX + 0.235, H, 0);

  CAT = 'Pompe · Refoulement (bride + manomètre)';
  add('nez_refoulement', cylY(0.04, 0.16, 40), mat.pumpPaint, vX, H + 0.08, rEnd, root, 'vane', true);
  add('bride_refoulement', cylY(0.068, 0.02, 40), mat.pumpPaint, vX, H + 0.17, rEnd, root, 'vane', true);
  add('joint_bride_ref', cylY(0.06, 0.003, 40), mat.rubber, vX, H + 0.181, rEnd);
  add('contre_bride_ref', cylY(0.068, 0.018, 40), mat.pipe, vX, H + 0.191, rEnd);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    add('boulon_bride', cylY(0.006, 0.05, 8), mat.bolt, vX + 0.056 * Math.cos(a), H + 0.181, rEnd + 0.056 * Math.sin(a));
    add('ecrou_bride', hexY(0.009, 0.007), mat.bolt, vX + 0.056 * Math.cos(a), H + 0.207, rEnd + 0.056 * Math.sin(a));
  }
  add('tuyau_refoulement', cylY(0.038, 0.1, 40), mat.pipe, vX, H + 0.25, rEnd);
  add('manometre_piquage', cylZ(0.007, 0.03), mat.brass, vX, H + 0.12, rEnd + 0.05);
  add('manometre', cylZ(0.025, 0.012), mat.zinc, vX, H + 0.12, rEnd + 0.07);
  add('cadran', cylZ(0.021, 0.001), mat.dial, vX, H + 0.12, rEnd + 0.0765);

  // ---------- Tuyauteries, vannes et supports ----------
  const valve = (
    name: string,
    x: number,
    y: number,
    z: number,
    axis: 'x' | 'y',
    rBody = 0.058,
    rFl = 0.082,
    parent = root
  ) => {
    const g = grp(name, x, y, z, parent);
    if (axis === 'y') g.rotation.z = Math.PI / 2;
    add('corps_vanne', cylX(rBody, 0.07, 40), mat.castGrey, 0, 0, 0, g);
    for (const s of [-1, 1]) {
      add('bride_vanne', cylX(rFl, 0.016), mat.castGrey, s * 0.043, 0, 0, g);
    }
    add('chapeau_vanne', box(0.05, 0.07, 0.06), mat.castGrey, 0, 0.085, 0, g);
    add('tige_vanne', cylY(0.006, 0.08, 12), mat.steel, 0, 0.16, 0, g);

    const hw = grp('volant', 0, 0.2, 0, g);
    add('jante_volant', new T.TorusGeometry(0.055, 0.006, 10, 40).rotateX(Math.PI / 2), mat.handwheel, 0, 0, 0, hw);
    for (let i = 0; i < 3; i++) {
      const r = add('rayon_volant', box(0.11, 0.006, 0.006), mat.handwheel, 0, 0, 0, hw);
      r.rotation.y = (i * Math.PI) / 3;
    }
    add('moyeu_volant', cylY(0.012, 0.014), mat.handwheel, 0, 0, 0, hw);
    return g;
  };

  CAT = 'Tuyauterie · Vanne d’isolement aspiration';
  valve('vanne_aspiration', vX + 0.33, H, 0, 'x');
  add('tuyau_aspiration_amont', cylX(0.05, 0.3, 40), mat.pipe, vX + 0.52, H, 0);

  CAT = 'Tuyauterie · Clapet et vanne de refoulement';
  add('clapet_anti_retour', cylY(0.055, 0.07, 40), mat.castGrey, vX, H + 0.335, rEnd);
  for (const s of [-1, 1]) {
    add('bride_clapet', cylY(0.068, 0.016, 40), mat.castGrey, vX, H + 0.335 + s * 0.043, rEnd);
  }
  const flClap = add('fleche_clapet', new T.PlaneGeometry(0.03, 0.06), mat.arrow, vX, H + 0.335, rEnd + 0.0555);
  flClap.rotation.z = Math.PI / 2;

  valve('vanne_refoulement', vX, H + 0.437, rEnd, 'y', 0.048, 0.068);
  add('tuyau_refoulement_aval', cylY(0.038, 0.192, 40), mat.pipe, vX, H + 0.584, rEnd);
  add('coude_90', new T.TorusGeometry(0.08, 0.038, 16, 24, Math.PI / 2).rotateY(-Math.PI / 2), mat.pipe, vX, H + 0.68, rEnd - 0.08);
  add('tuyau_collecteur', cylZ(0.038, 0.4, 40), mat.pipe, vX, H + 0.76, rEnd - 0.28);

  CAT = 'Tuyauterie · Supports de tuyauterie';
  add('poteau_support_asp', box(0.04, H - 0.06, 0.04), mat.frame, vX + 0.55, (H - 0.06) / 2, 0);
  const berc = add('berceau_support_asp', cylX(0.054, 0.04, 32, true), mat.frame, vX + 0.55, H, 0);
  (berc.material as THREE.Material).side = T.DoubleSide;
  add('platine_support', box(0.1, 0.01, 0.1), mat.frame, vX + 0.55, 0.005, 0);
  add('collier_support', torX(0.051, 0.005), mat.zinc, vX + 0.55, H, 0);
  add('poteau_support_ref', box(0.04, H + 0.692, 0.04), mat.frame, vX + 0.14, (H + 0.692) / 2, rEnd - 0.4);
  add('console_support_ref', box(0.18, 0.03, 0.04), mat.frame, vX + 0.06, H + 0.707, rEnd - 0.4);
  add('platine_support', box(0.1, 0.01, 0.1), mat.frame, vX + 0.14, 0.005, rEnd - 0.4);

  CAT = 'Moteur · Câblage (gaine + conduit)';
  add('gaine_cable', cylY(0.016, 0.1, 16), mat.conduit, mX - 0.05, 0.05, 0.3);

  // ---------- Instrumentation ----------
  CAT = 'Instrumentation · Accéléromètre palier pompe (vertical)';
  const sensor = grp('accelerometre_pompe', pX + 0.07, H + 0.062, 0);
  add('embase', hexY(0.012, 0.008), mat.ss, 0, 0.004, 0, sensor);
  add('corps', cylY(0.0105, 0.03), mat.ss, 0, 0.023, 0, sensor);
  const led = new T.Mesh(cylY(0.0112, 0.004), mat.led);
  led.name = 'led';
  led.position.set(0, 0.03, 0);
  sensor.add(led);
  add('connecteur', cylX(0.0045, 0.014), mat.ss, -0.014, 0.02, 0, sensor);
  add(
    'cable_capteur',
    new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(-0.02, 0.02, 0),
        new T.Vector3(-0.07, 0.03, -0.02),
        new T.Vector3(-0.12, 0.0, -0.1),
        new T.Vector3(-0.14, -0.15, -0.18),
      ]),
      40,
      0.003,
      8
    ),
    mat.cable,
    0,
    0,
    0,
    sensor
  );

  CAT = 'Instrumentation · Accéléromètre moteur (horizontal)';
  const s2 = grp('accelerometre_moteur', mX + 0.16, H, 0.097);
  s2.rotation.x = Math.PI / 2;
  add('embase', hexY(0.011, 0.008), mat.ss, 0, 0.004, 0, s2);
  add('corps', cylY(0.0095, 0.026), mat.ss, 0, 0.021, 0, s2);
  add(
    'cable_capteur',
    new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(0, 0.035, 0),
        new T.Vector3(0, 0.07, 0.02),
        new T.Vector3(0.05, 0.12, 0.15),
      ]),
      30,
      0.003,
      8
    ),
    mat.cable,
    0,
    0,
    0,
    s2
  );

  const flash = new T.Mesh(new T.SphereGeometry(1, 20, 14), mat.flash);
  flash.name = 'impact';
  flash.position.copy(defPos);
  flash.visible = false;
  flash.renderOrder = 5;
  root.add(flash);

  return { root, shaft, fan, brgs, parts, housing, cats, flash, led, defPos };
}
