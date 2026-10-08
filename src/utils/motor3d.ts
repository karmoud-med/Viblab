// Moteur asynchrone à induction 3D industriel (forme B3, IE3, carcasse fonte à ailettes).
// Unités en mètres, axe principal selon X, hauteur d'axe H = 0.20 m.
import * as THREE from 'three';
import { MotorTextures } from './motorTextures';

export const H = 0.2;
export const TAU = Math.PI * 2;

export interface MotorParams3D {
  R: number; // Nombre de barres de rotor (12 à 60)
  def: boolean; // Défaut actif (rupture de barres)
  nb: number; // Nombre de barres cassées (1 à 5)
}

export interface Motor3DResult {
  root: THREE.Group;
  frame: THREE.Group;
  rotorG: THREE.Group;
  spin: THREE.Group;
  fan: THREE.Group;
  cages: THREE.Group[];
  housing: THREE.Mesh[];
  cats: Map<string, THREE.Mesh[]>;
  trail: THREE.Line;
  dot: THREE.Mesh;
  glow: THREE.Mesh[];
  NP: number;
  trailX: number;
}

export interface MotorMaterials {
  concrete: THREE.MeshStandardMaterial;
  base: THREE.MeshStandardMaterial;
  shim: THREE.MeshStandardMaterial;
  hPaint: THREE.MeshStandardMaterial;
  paint: THREE.MeshStandardMaterial;
  hGrill: THREE.MeshStandardMaterial;
  sLamA: THREE.MeshStandardMaterial;
  sLamB: THREE.MeshStandardMaterial;
  sCopper: THREE.MeshStandardMaterial;
  insul: THREE.MeshStandardMaterial;
  lamA: THREE.MeshStandardMaterial;
  lamB: THREE.MeshStandardMaterial;
  alu: THREE.MeshStandardMaterial;
  broken: THREE.MeshStandardMaterial;
  crack: THREE.MeshStandardMaterial;
  glow: THREE.MeshBasicMaterial;
  weight: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  key: THREE.MeshStandardMaterial;
  tape: THREE.MeshStandardMaterial;
  coupling: THREE.MeshStandardMaterial;
  ring: THREE.MeshStandardMaterial;
  ball: THREE.MeshStandardMaterial;
  brassCage: THREE.MeshStandardMaterial;
  bolt: THREE.MeshStandardMaterial;
  zinc: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
  ss: THREE.MeshStandardMaterial;
  plate: THREE.MeshStandardMaterial;
  arrow: THREE.MeshStandardMaterial;
}

export function makeMaterials(T: typeof THREE, textures: MotorTextures): MotorMaterials {
  const M = (
    name: string,
    color: number,
    r = 0.5,
    m = 0.3,
    extra: Record<string, any> = {}
  ): THREE.MeshStandardMaterial => {
    const mat = new T.MeshStandardMaterial({
      color,
      roughness: r,
      metalness: m,
      ...extra,
    });
    mat.name = name;
    return mat;
  };

  const paint = {
    bumpMap: textures.paintBump,
    bumpScale: 0.6,
    roughnessMap: textures.paintRough,
  };
  const brushed = {
    roughnessMap: textures.brushed,
    bumpMap: textures.brushed,
    bumpScale: 0.15,
  };

  const grill = textures.perforated.clone();
  grill.repeat.set(14, 14);
  grill.needsUpdate = true;

  return {
    concrete: M('beton', 0xffffff, 0.95, 0, { map: textures.concrete }),
    base: M('platine', 0x3a4a5c, 0.6, 0.35, paint),
    shim: M('cale_inox', 0xd1d5db, 0.25, 0.9),
    hPaint: M('peinture_RAL5010', 0x1f4e79, 0.45, 0.25, {
      side: T.DoubleSide,
      bumpMap: textures.castBump,
      bumpScale: 1.1,
      roughnessMap: textures.paintRough,
    }),
    paint: M('peinture_pattes', 0x1f4e79, 0.45, 0.25, {
      bumpMap: textures.castBump,
      bumpScale: 1.1,
      roughnessMap: textures.paintRough,
    }),
    hGrill: M('grille_capot', 0x0f172a, 0.6, 0.4, {
      alphaMap: grill,
      alphaTest: 0.5,
      side: T.DoubleSide,
      transparent: true,
    }),
    sLamA: M('toles_stator', 0x6b7280, 0.4, 0.8, { side: T.DoubleSide }),
    sLamB: M('toles_stator_2', 0x4b5563, 0.4, 0.8, { side: T.DoubleSide }),
    sCopper: M('cuivre_emaille', 0xb45f2a, 0.3, 1),
    insul: M('isolant_classe_F', 0xd8c37a, 0.7, 0),
    lamA: M('toles_rotor', 0x6b7280, 0.4, 0.8),
    lamB: M('toles_rotor_2', 0x4b5563, 0.4, 0.8),
    alu: M('aluminium_coule', 0xc4cad1, 0.35, 0.9),
    broken: M('barre_cassee', 0x7f1d1d, 0.6, 0.3, {
      emissive: new T.Color(0xef4444),
      emissiveIntensity: 0,
    }),
    crack: M('fissure', 0x050505, 0.95, 0),
    glow: Object.assign(
      new T.MeshBasicMaterial({
        color: 0xff3b1f,
        transparent: true,
        opacity: 0.8,
      }),
      { name: 'eclat_barre' }
    ),
    weight: M('masse_equilibrage', 0xb45309, 0.5, 0.6),
    steel: M('acier_arbre', 0xccd2d8, 0.25, 0.95, brushed),
    key: M('clavette', 0x9aa1a9, 0.35, 0.8),
    tape: M('repere_keyphasor', 0xef4444, 0.5, 0),
    coupling: M('fonte_accouplement', 0x5b6470, 0.4, 0.8, {
      bumpMap: textures.castBump,
      bumpScale: 1,
    }),
    ring: M('acier_roulement', 0xd7dbe0, 0.15, 1),
    ball: M('bille_chrome', 0x9aa3ad, 0.05, 1),
    brassCage: M('cage_laiton', 0xc19a5b, 0.3, 0.95),
    bolt: M('acier_brunit', 0x2b3038, 0.45, 0.85),
    zinc: M('acier_zingue', 0xc8cdd2, 0.3, 0.8),
    brass: M('laiton', 0xc5a15a, 0.3, 0.9),
    plastic: M('polyamide', 0x1f2937, 0.6, 0),
    cable: M('cable', 0x0f172a, 0.7, 0.1),
    ss: M('inox_capteur', 0xd1d5db, 0.22, 0.95),
    plate: M('plaque_moteur', 0xffffff, 0.45, 0.6, { map: textures.plateMotor }),
    arrow: M('fleche_rotation', 0xffffff, 0.5, 0, {
      map: textures.arrow,
      transparent: true,
      alphaTest: 0.3,
      side: T.DoubleSide,
    }),
  };
}

export function buildMotor(
  T: typeof THREE,
  mat: MotorMaterials,
  p: MotorParams3D
): Motor3DResult {
  const root = new T.Group();
  root.name = 'moteur_asynchrone';

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
    hous = false
  ): THREE.Mesh => {
    const o = new T.Mesh(geo, mt);
    o.name = name;
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    o.userData.part = CAT;
    if (!cats.has(CAT)) cats.set(CAT, []);
    cats.get(CAT)!.push(o);
    if (hous) housing.push(o);
    return o;
  };

  const grp = (
    name: string,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root
  ): THREE.Group => {
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
  const hexY = (r: number, l: number) => new T.CylinderGeometry(r, r, l, 6);
  const hexX = (r: number, l: number) =>
    new T.CylinderGeometry(r, r, l, 6).rotateZ(Math.PI / 2);
  const box = (a: number, b: number, c: number) => new T.BoxGeometry(a, b, c);
  const latheX = (pts: [number, number][], seg = 64) =>
    new T.LatheGeometry(
      pts.map(([r, x]) => new T.Vector2(r, x)),
      seg
    ).rotateZ(-Math.PI / 2);
  const ringX = (r1: number, r2: number, w: number, seg = 64) =>
    latheX(
      [
        [r1, -w / 2],
        [r2, -w / 2],
        [r2, w / 2],
        [r1, w / 2],
        [r1, -w / 2],
      ],
      seg
    );
  const torX = (R: number, r: number, seg = 48) =>
    new T.TorusGeometry(R, r, 12, seg).rotateY(Math.PI / 2);
  const radial = (o: THREE.Mesh, a: number) => {
    o.rotation.x = Math.PI / 2 - a;
    return o;
  };
  const nipple = (x: number, y: number, z: number, parent: THREE.Object3D) => {
    add('graisseur_hex', hexY(0.006, 0.008), mat.brass, x, y + 0.004, z, parent);
    add('graisseur_tete', new T.SphereGeometry(0.004, 12, 8), mat.brass, x, y + 0.011, z, parent);
  };

  // ---------- Massif ----------
  CAT = 'Massif · Massif béton et platine';
  add('massif_beton', box(0.95, 0.05, 0.52), mat.concrete, 0.02, 0.025, 0);
  add('platine_acier', box(0.62, 0.012, 0.38), mat.base, 0, 0.056, 0);
  for (const sx of [-0.28, 0.28]) {
    for (const sz of [-0.16, 0.16]) {
      add('tige_scellement', cylY(0.006, 0.03), mat.bolt, sx, 0.066, sz);
      add('ecrou_scellement', hexY(0.011, 0.009), mat.bolt, sx, 0.067, sz);
    }
  }
  const yb = 0.062;

  const frame = grp('moteur_vibrant', 0, 0, 0);
  const R0 = 0.122,
    x0 = -0.17,
    x1 = 0.17;

  // ---------- Carcasse ----------
  CAT = 'Carcasse · Carcasse à ailettes (fonte)';
  add('carcasse', cylX(R0, 0.34, 72), mat.hPaint, 0, H, 0, frame, true);
  for (let i = 0; i < 36; i++) {
    const a = (i * TAU) / 36,
      s = Math.sin(a);
    if (
      s < -0.5 ||
      Math.abs(a - Math.PI / 2) < 0.32 ||
      a < 0.28 ||
      a > TAU - 0.28
    )
      continue;
    radial(
      add(
        'ailette',
        new T.BoxGeometry(0.32, 0.022, 0.005),
        mat.hPaint,
        0,
        H + (R0 + 0.009) * s,
        (R0 + 0.009) * Math.cos(a),
        frame,
        true
      ),
      a
    );
  }

  CAT = 'Carcasse · Flasques paliers';
  for (const [x, s] of [
    [x1 + 0.012, 1],
    [x0 - 0.012, -1],
  ]) {
    add('flasque', cylX(R0 - 0.004, 0.024, 72), mat.hPaint, x, H, 0, frame, true);
    add('bossage_palier', cylX(0.058, 0.026, 48), mat.hPaint, x + s * 0.022, H, 0, frame, true);
    add('chapeau_roulement', ringX(0.029, 0.05, 0.008), mat.hPaint, x + s * 0.038, H, 0, frame, true);
    for (let i = 0; i < 4; i++) {
      const a = (i * TAU) / 4 + Math.PI / 4;
      add('vis_chapeau', hexX(0.004, 0.006), mat.bolt, x + s * 0.045, H + 0.04 * Math.sin(a), 0.04 * Math.cos(a), frame);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6 + 0.26;
      radial(
        add('nervure_flasque', new T.BoxGeometry(0.008, 0.05, 0.008), mat.hPaint, x + s * 0.014, H + 0.085 * Math.sin(a), 0.085 * Math.cos(a), frame, true),
        a
      );
    }
    nipple(x, H + R0 - 0.004, 0, frame);
  }

  CAT = 'Carcasse · Capot et grille de ventilation';
  add('capot_ventilateur', cylX(0.126, 0.1, 72, true), mat.hPaint, -0.245, H, 0, frame, true);
  add('bord_capot', torX(0.126, 0.004, 72), mat.hPaint, -0.295, H, 0, frame, true);
  add('grille', cylX(0.123, 0.003, 72), mat.hGrill, -0.294, H, 0, frame, true);
  for (let i = 1; i <= 4; i++) {
    add('anneau_grille', torX(0.025 * i, 0.0025, 48), mat.hPaint, -0.297, H, 0, frame, true);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i * TAU) / 3 + 0.5;
    add('vis_capot', hexX(0.004, 0.006), mat.bolt, -0.215, H + 0.127 * Math.sin(a), 0.127 * Math.cos(a), frame);
  }
  add('fleche_sens_rotation', new T.PlaneGeometry(0.05, 0.025), mat.arrow, -0.245, H, 0.1275, frame, true);

  CAT = 'Carcasse · Boîte à bornes';
  const yT = H + R0;
  add('embase_boite', box(0.1, 0.02, 0.1), mat.hPaint, 0.03, yT + 0.002, 0, frame, true);
  add('boite_bornes', box(0.12, 0.07, 0.12), mat.hPaint, 0.03, yT + 0.047, 0, frame, true);
  add('couvercle_boite', box(0.128, 0.012, 0.128), mat.hPaint, 0.03, yT + 0.088, 0, frame, true);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add('vis_couvercle', cylY(0.004, 0.006, 8), mat.bolt, 0.03 + sx * 0.052, yT + 0.096, sz * 0.052, frame);
    }
  }
  add('presse_etoupe', cylZ(0.012, 0.03), mat.plastic, 0.03, yT + 0.04, 0.073, frame);
  add(
    'ecrou_presse_etoupe',
    new T.CylinderGeometry(0.015, 0.015, 0.008, 6).rotateX(Math.PI / 2),
    mat.plastic,
    0.03,
    yT + 0.04,
    0.078,
    frame
  );
  add(
    'cable_alimentation',
    new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(0.03, yT + 0.04, 0.085),
        new T.Vector3(0.03, yT + 0.03, 0.17),
        new T.Vector3(0.05, 0.12, 0.3),
        new T.Vector3(0.02, 0.07, 0.42),
      ]),
      40,
      0.009,
      10
    ),
    mat.cable,
    0,
    0,
    0,
    frame
  );
  add('bornier', box(0.07, 0.015, 0.04), mat.plastic, 0.03, yT + 0.02, 0, frame);
  for (let i = 0; i < 6; i++) {
    add(
      'borne_U1V1W1',
      cylY(0.004, 0.02, 8),
      mat.brass,
      0.005 + (i % 3) * 0.025,
      yT + 0.035,
      i < 3 ? -0.01 : 0.01,
      frame
    );
  }

  CAT = 'Carcasse · Anneaux de levage';
  for (const x of [-0.1, 0.12]) {
    add('base_anneau', hexY(0.012, 0.01), mat.bolt, x, yT + 0.004, 0, frame);
    add('anneau_levage', new T.TorusGeometry(0.018, 0.005, 10, 28), mat.bolt, x, yT + 0.03, 0, frame);
  }

  CAT = 'Carcasse · Plaque signalétique';
  add('bossage_plaque', box(0.1, 0.055, 0.012), mat.hPaint, -0.06, H, 0.117, frame, true);
  add('plaque_signaletique', new T.PlaneGeometry(0.092, 0.046), mat.plate, -0.06, H, 0.1236, frame);

  CAT = 'Carcasse · Pattes de fixation B3';
  for (const x of [-0.11, 0.11]) {
    add('cale_reglage', new T.BoxGeometry(0.075, 0.003, 0.28), mat.shim, x, yb + 0.0015, 0, frame);
    add('semelle_patte', box(0.07, 0.02, 0.27), mat.paint, x, yb + 0.013, 0, frame);
    add('voile_patte', box(0.07, H - 0.08 - yb - 0.02, 0.17), mat.paint, x, yb + 0.023 + (H - 0.08 - yb - 0.02) / 2, 0, frame);
    for (const sz of [-1, 1]) {
      add('rondelle_patte', cylY(0.014, 0.002), mat.zinc, x, yb + 0.024, sz * 0.11, frame);
      add('vis_patte', hexY(0.011, 0.01), mat.bolt, x, yb + 0.03, sz * 0.11, frame);
    }
  }
  add('borne_terre', hexY(0.006, 0.01), mat.brass, 0.11, yb + 0.03, 0.13, frame);

  // ---------- Stator ----------
  CAT = 'Stator · Paquet de tôles magnétiques';
  for (let i = 0; i < 9; i++) {
    add('toles_stator', ringX(0.078, 0.112, 0.0299, 72), i % 2 ? mat.sLamA : mat.sLamB, -0.12 + i * 0.03, H, 0, frame);
  }

  CAT = 'Stator · Bobinage cuivre';
  for (const x of [-0.152, 0.152]) {
    add('tete_bobine', torX(0.094, 0.014, 64), mat.sCopper, x, H, 0, frame);
    add('frette_isolant', torX(0.094, 0.0155, 64).scale(0.4, 1, 1), mat.insul, x, H, 0, frame);
  }
  for (let i = 0; i < 36; i++) {
    const a = (i * TAU) / 36;
    radial(
      add('conducteur_encoche', new T.BoxGeometry(0.27, 0.008, 0.004), mat.sCopper, 0, H + 0.083 * Math.sin(a), 0.083 * Math.cos(a), frame),
      a
    );
  }

  // ---------- Rotor ----------
  const rotorG = grp('rotor_orbite', 0, H, 0, frame);
  const spin = grp('rotor_rot', 0, 0, 0, rotorG);

  CAT = 'Rotor · Arbre, clavette et repère';
  add('arbre', cylX(0.024, 0.62, 40), mat.steel, 0, 0, 0, spin);
  for (const s of [-1, 1]) {
    add('epaulement', cylX(0.03, 0.02, 40), mat.steel, s * 0.17, 0, 0, spin);
  }
  add('clavette', box(0.04, 0.008, 0.01), mat.key, 0.29, 0.024, 0, spin);
  add('repere_keyphasor', new T.BoxGeometry(0.012, 0.002, 0.008), mat.tape, 0.24, 0.0245, 0, spin);

  CAT = 'Rotor · Paquet de tôles rotoriques';
  for (let i = 0; i < 12; i++) {
    add('toles_rotor', cylX(0.0735, 0.0225, 64), i % 2 ? mat.lamA : mat.lamB, -0.1265 + i * 0.023, 0, 0, spin);
  }

  CAT = 'Rotor · Barres aluminium (cage d’écureuil)';
  const broken: [number, number, number][] = [];
  for (let i = 0; i < p.R; i++) {
    const a = (i * TAU) / p.R,
      y = 0.0728 * Math.sin(a),
      z = 0.0728 * Math.cos(a);
    if (p.def && i < p.nb) {
      radial(add('barre_cassee', new T.BoxGeometry(0.248, 0.006, 0.005), mat.broken, -0.014, y, z, spin), a);
      radial(add('fissure_barre', new T.BoxGeometry(0.004, 0.0065, 0.0055), mat.crack, 0.112, y, z, spin), a);
      broken.push([0.116, y, z]);
    } else {
      radial(add('barre_rotor', new T.BoxGeometry(0.276, 0.006, 0.005), mat.alu, 0, y, z, spin), a);
    }
  }

  CAT = 'Rotor · Anneaux de court-circuit';
  for (const s of [-1, 1]) {
    add('anneau_court_circuit', ringX(0.05, 0.075, 0.014), mat.alu, s * 0.145, 0, 0, spin);
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8;
      add('picot_equilibrage', cylX(0.003, 0.012, 8), mat.alu, s * 0.157, 0.064 * Math.sin(a), 0.064 * Math.cos(a), spin);
    }
  }
  add('masse_equilibrage', box(0.012, 0.009, 0.014), mat.weight, 0.157, 0.0, 0.064, spin);

  CAT = 'Rotor · Ventilateur de refroidissement';
  const fan = grp('ventilateur', -0.245, 0, 0, spin);
  add('moyeu_ventilateur', cylX(0.035, 0.025), mat.plastic, 0, 0, 0, fan);
  for (let i = 0; i < 10; i++) {
    const a = (i * TAU) / 10,
      b = radial(add('pale', new T.BoxGeometry(0.03, 0.075, 0.004), mat.plastic, 0, 0.07 * Math.sin(a), 0.07 * Math.cos(a), fan), a);
    b.rotation.y = 0.35;
  }

  CAT = 'Accouplement · Demi-accouplement côté moteur';
  add('moyeu_accouplement', cylX(0.05, 0.04, 48), mat.coupling, 0.275, 0, 0, spin);
  for (let i = 0; i < 3; i++) {
    const a = (i * TAU) / 3;
    radial(add('machoire', box(0.022, 0.026, 0.024), mat.coupling, 0.305, 0.03 * Math.sin(a), 0.03 * Math.cos(a), spin), a);
  }
  add('vis_pression', cylY(0.004, 0.01, 8), mat.bolt, 0.275, 0.05, 0, spin);

  // ---------- Roulements ----------
  const cages: THREE.Group[] = [];
  const bearing = (x: number, n: number) => {
    const ri = 0.024,
      ro = 0.05,
      w = 0.025,
      Rp = (ri + ro) / 2,
      rb = (ro - ri) * 0.21;
    add(
      'bague_exterieure',
      latheX([
        [Rp + rb * 0.7, -w / 2],
        [ro, -w / 2],
        [ro, w / 2],
        [Rp + rb * 0.7, w / 2],
        [Rp + rb * 0.7, -w / 2],
      ]),
      mat.ring,
      x,
      H,
      0,
      frame
    );
    add(
      'bague_interieure',
      latheX([
        [ri, -w / 2],
        [Rp - rb * 0.7, -w / 2],
        [Rp - rb * 0.7, w / 2],
        [ri, w / 2],
        [ri, -w / 2],
      ]),
      mat.ring,
      x,
      0,
      0,
      spin
    );
    for (const s of [-1, 1]) {
      add('flasque_2Z', ringX(Rp - rb * 0.7, Rp + rb * 0.7, 0.0012), mat.zinc, x + s * (w / 2 - 0.001), H, 0, frame);
    }
    const cage = grp('cage_rot', x, H, 0, frame);
    cages.push(cage);
    for (let i = 0; i < n; i++) {
      const a = (i * TAU) / n;
      add('bille', new T.SphereGeometry(rb, 20, 14), mat.ball, 0, Rp * Math.sin(a), Rp * Math.cos(a), cage);
    }
    for (const dx of [-w * 0.3, w * 0.3]) {
      add('cage', torX(Rp, rb * 0.18, 64), mat.brassCage, dx, 0, 0, cage);
    }
  };

  CAT = 'Roulements · Côté accouplement (DE) – 6309-2Z';
  bearing(0.195, 8);
  CAT = 'Roulements · Côté ventilateur (NDE) – 6308-2Z';
  bearing(-0.195, 8);

  // ---------- Instrumentation ----------
  CAT = 'Instrumentation · Accéléromètres palier DE (V + H)';
  const sv = grp('accelerometre_V', 0.204, H + 0.058, 0, frame);
  add('embase', hexY(0.011, 0.008), mat.ss, 0, 0.004, 0, sv);
  add('corps', cylY(0.0095, 0.028), mat.ss, 0, 0.022, 0, sv);
  add(
    'cable',
    new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(0, 0.036, 0),
        new T.Vector3(0, 0.07, -0.02),
        new T.Vector3(-0.05, 0.08, -0.12),
        new T.Vector3(-0.1, -0.1, -0.2),
      ]),
      40,
      0.003,
      8
    ),
    mat.cable,
    0,
    0,
    0,
    sv
  );
  const sh = grp('accelerometre_H', 0.204, H, 0.058, frame);
  sh.rotation.x = Math.PI / 2;
  add('embase', hexY(0.011, 0.008), mat.ss, 0, 0.004, 0, sh);
  add('corps', cylY(0.0095, 0.028), mat.ss, 0, 0.022, 0, sh);

  CAT = 'Instrumentation · Capteur keyphasor';
  add('support_keyphasor', box(0.05, 0.008, 0.014), mat.zinc, 0.235, H + 0.062, 0, frame);
  add('sonde_keyphasor', cylY(0.006, 0.03, 16), mat.ss, 0.24, H + 0.044, 0, frame);
  add('ecrou_sonde', hexY(0.009, 0.005), mat.bolt, 0.24, H + 0.056, 0, frame);

  // ---------- Trace d'orbite ----------
  const NP = 260;
  const tg = new T.BufferGeometry();
  tg.setAttribute('position', new T.BufferAttribute(new Float32Array(NP * 3), 3));
  tg.setDrawRange(0, 0);
  const trail = new T.Line(
    tg,
    new T.LineBasicMaterial({ color: 0x2563eb, depthTest: false, transparent: true })
  );
  trail.name = 'trace_orbite';
  trail.renderOrder = 6;
  frame.add(trail);

  const ref = new T.Mesh(
    torX(0.03, 0.0006, 64),
    new T.MeshBasicMaterial({ color: 0x94a3b8, depthTest: false, transparent: true, opacity: 0.6 })
  );
  ref.position.set(0.335, H, 0);
  ref.renderOrder = 6;
  frame.add(ref);

  const dot = new T.Mesh(
    new T.SphereGeometry(0.0035, 12, 8),
    new T.MeshBasicMaterial({ color: 0xdc2626, depthTest: false })
  );
  dot.renderOrder = 7;
  frame.add(dot);

  const glow = broken.map(([x, y, z]) => {
    const g = new T.Mesh(new T.SphereGeometry(0.008, 16, 10), mat.glow);
    g.position.set(x, y, z);
    g.renderOrder = 5;
    spin.add(g);
    return g;
  });

  return {
    root,
    frame,
    rotorG,
    spin,
    fan,
    cages,
    housing,
    cats,
    trail,
    dot,
    glow,
    NP,
    trailX: 0.335,
  };
}
