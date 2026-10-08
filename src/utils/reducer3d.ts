import * as THREE from 'three';
import { ReducerParams, ReducerKinematics } from './reducerModel';

const TAU = Math.PI * 2;
export const MODS = [0.005, 0.0065, 0.008];
export const WID = [0.03, 0.04, 0.05];

function gearGeo(T: number, m: number, w: number, phase: number, broken: number): THREE.BufferGeometry {
  const r = (m * T) / 2;
  const ra = r + m;
  const rf = r - 1.25 * m;
  const hp = Math.PI / T;
  const s = new THREE.Shape();

  const P = (rad: number, a: number, first: boolean) => {
    const x = rad * Math.cos(a);
    const y = rad * Math.sin(a);
    if (first) s.moveTo(x, y);
    else s.lineTo(x, y);
  };

  for (let k = 0; k < T; k++) {
    const c = phase + 2 * hp * k;
    const tip = k === broken ? rf + 0.35 * m : ra;
    P(rf, c - hp, !k);
    P(rf, c - 0.5 * hp, false);
    P(tip, c - 0.2 * hp, false);
    P(tip, c + 0.2 * hp, false);
    P(rf, c + 0.5 * hp, false);
  }
  s.closePath();

  const h = new THREE.Path();
  h.absarc(0, 0, 0.012, 0, TAU, true);
  s.holes.push(h);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.001,
    bevelSegments: 1,
    curveSegments: 16,
  });
  geo.translate(0, 0, -w / 2);
  return geo;
}

export const toothAngle = (w: number, n: number, z: number, sgn: number): number =>
  w ? Math.PI - (sgn * TAU * (n - 0.5)) / z : (-sgn * TAU * (n - 1)) / z;

export interface ShaftRef {
  spin: THREE.Group;
  X: number;
  sgn: number;
  mesh: THREE.Mesh;
}

export interface Reducer3DResult {
  root: THREE.Group;
  shafts: ShaftRef[];
  housing: THREE.Object3D[];
  meshPts: THREE.Vector3[];
  flash: THREE.Mesh;
  ring: THREE.Mesh;
  sensor: THREE.Group;
  sBody: THREE.Mesh;
  H: number;
  X: number[];
  Zh: number;
  xmin: number;
  xmax: number;
  yt: number;
  G: { m: number; w: number; r1: number; r2: number; z: number }[];
}

export function buildReducer(
  p: ReducerParams,
  _k: ReducerKinematics | null,
  mat: ReturnType<typeof makeMaterials>
): Reducer3DResult {
  const n = p.st.length;
  const root = new THREE.Group();
  root.name = 'reducteur';

  const add = (
    name: string,
    geo: THREE.BufferGeometry,
    mt: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root
  ): THREE.Mesh => {
    const o = new THREE.Mesh(geo, mt);
    o.name = name;
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const grp = (
    name: string,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root
  ): THREE.Group => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const cylZ = (r: number, l: number, seg = 32) => {
    const geo = new THREE.CylinderGeometry(r, r, l, seg);
    geo.rotateX(Math.PI / 2);
    return geo;
  };

  const box = (a: number, b: number, c: number) => new THREE.BoxGeometry(a, b, c);

  // Implantation
  const G = p.st.map(([z1, z2], i) => ({
    m: MODS[i] || 0.006,
    w: WID[i] || 0.04,
    r1: ((MODS[i] || 0.006) * z1) / 2,
    r2: ((MODS[i] || 0.006) * z2) / 2,
    z: ((n - 1) / 2 - i) * 0.085,
  }));

  const X = [0];
  G.forEach((g, i) => X.push(X[i] + g.r1 + g.r2));
  const off = X[n] / 2;
  for (let i = 0; i <= n; i++) X[i] -= off;

  let xmin = 1e9;
  let xmax = -1e9;
  let Rmax = 0;

  G.forEach((g, i) => {
    xmin = Math.min(xmin, X[i] - g.r1 - g.m, X[i + 1] - g.r2 - g.m);
    xmax = Math.max(xmax, X[i] + g.r1 + g.m, X[i + 1] + g.r2 + g.m);
    Rmax = Math.max(Rmax, g.r2 + g.m);
  });

  xmin -= 0.035;
  xmax += 0.035;
  const H = Rmax + 0.1;
  const yb = H - Rmax - 0.035;
  const yt = H + Rmax + 0.035;
  const Zh = Math.max(...G.map((g) => Math.abs(g.z) + g.w / 2)) + 0.045;

  // Socle + moteur
  const motorL = 0.26;
  const mz0 = Zh + 0.1;
  add(
    'chassis',
    box(xmax - xmin + 0.14, 0.03, 2 * Zh + motorL + 0.3),
    mat.base,
    (xmin + xmax) / 2,
    0.015,
    (motorL + 0.1) / 2
  );

  const motor = grp('moteur', X[0], H, 0);
  add('carcasse', cylZ(0.075, motorL, 48), mat.motor, 0, 0, mz0 + motorL / 2, motor);
  for (let i = 0; i < 8; i++) {
    add('ailette_' + i, cylZ(0.082, 0.008, 48), mat.motor, 0, 0, mz0 + 0.04 + i * 0.026, motor);
  }
  add('capot_ventilateur', cylZ(0.072, 0.05), mat.dark, 0, 0, mz0 + motorL + 0.025, motor);
  add('boite_bornes', box(0.06, 0.04, 0.07), mat.motor, 0, 0.09, mz0 + motorL / 2, motor);
  add(
    'pattes_moteur',
    box(0.13, H - 0.03 - 0.06, 0.18),
    mat.dark,
    0,
    -(H - 0.03) / 2 - 0.02,
    mz0 + motorL / 2,
    motor
  );
  add('accouplement_moteur', cylZ(0.034, 0.025), mat.dark, 0, 0, mz0 - 0.02, motor);

  // Carter
  const housing: THREE.Object3D[] = [];
  const hb = add(
    'carter',
    box(xmax - xmin, yt - yb, 2 * Zh),
    mat.housing,
    (xmin + xmax) / 2,
    (yt + yb) / 2,
    0
  );
  hb.renderOrder = 2;
  housing.push(hb);

  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(hb.geometry), mat.edge);
  edges.name = 'aretes_carter';
  hb.add(edges);

  const fl = add(
    'plan_de_joint',
    box(xmax - xmin + 0.03, 0.012, 2 * Zh + 0.03),
    mat.flange,
    (xmin + xmax) / 2,
    H,
    0
  );
  fl.renderOrder = 2;
  housing.push(fl);

  housing.push(
    add(
      'trappe_visite',
      box((xmax - xmin) * 0.35, 0.012, Zh),
      mat.flange,
      (xmin + xmax) / 2,
      yt + 0.006,
      0
    )
  );
  housing.push(
    add(
      'reniflard',
      cylZ(0.008, 0.03),
      mat.dark,
      (xmin + xmax) / 2 + 0.03,
      yt + 0.025,
      0
    )
  );

  for (const sx of [xmin + 0.03, xmax - 0.03]) {
    for (const sz of [-Zh + 0.03, Zh - 0.03]) {
      add('patte_carter', box(0.06, yb - 0.03, 0.05), mat.dark, sx, 0.03 + (yb - 0.03) / 2, sz);
    }
  }
  add(
    'semelle_carter',
    box(xmax - xmin + 0.04, 0.015, 2 * Zh + 0.04),
    mat.dark,
    (xmin + xmax) / 2,
    yb - 0.0075,
    0
  );

  // Arbres
  const shafts: ShaftRef[] = [];
  for (let s = 0; s <= n; s++) {
    const sgn = s % 2 ? -1 : 1;
    const rs = 0.012 + 0.003 * s;
    const spin = grp('arbre_' + (s + 1), X[s], H, 0);
    const zf = s === 0 ? mz0 - 0.008 : Zh + 0.02;
    const zb = s === n ? -Zh - 0.12 : -Zh - 0.02;
    const shaftMesh = add('arbre', cylZ(rs, zf - zb), mat.steel, 0, 0, (zf + zb) / 2, spin);

    for (const zw of [Zh, -Zh]) {
      const b = add('palier', cylZ(rs * 2.6, 0.03), mat.boss, X[s], H, zw);
      housing.push(b);
      add('roulement', cylZ(rs * 1.7, 0.034), mat.bearing, X[s], H, zw);
    }

    if (s === n) {
      add('accouplement_sortie', cylZ(0.05, 0.03), mat.dark, 0, 0, -Zh - 0.1, spin);
      add('clavette', box(0.012, 0.006, 0.05), mat.dark, 0, rs, -Zh - 0.07, spin);
    }
    if (s === 0) {
      add('accouplement_entree', cylZ(0.034, 0.025), mat.dark, 0, 0, mz0 - 0.05, spin);
      add(
        'bande_reflechissante',
        box(0.01, 0.004, 0.012),
        mat.tape,
        0,
        rs + 0.001,
        Zh + 0.045,
        spin
      );
    }
    shafts.push({ spin, X: X[s], sgn, mesh: shaftMesh });
  }

  // Tachymètre (arbre d'entrée)
  const tach = grp('tachymetre', X[0], H + 0.045, Zh + 0.045);
  add('corps', box(0.026, 0.04, 0.026), mat.tach, 0, 0.01, 0, tach);
  add('support', box(0.008, H + 0.03, 0.008), mat.dark, 0.02, -(H + 0.03) / 2, 0, tach);

  // Engrenages
  const meshPts: THREE.Vector3[] = [];
  G.forEach((g, i) => {
    const [z1, z2] = p.st[i];
    const defHere = p.def !== 'none' && p.dStage === i;
    for (const w of [0, 1]) {
      const s = i + w;
      const z = w ? z2 : z1;
      const r = w ? g.r2 : g.r1;
      const phase = w ? Math.PI + Math.PI / z : 0;
      const sh = shafts[s];
      let broken = -1;
      let al = 0;

      if (defHere && p.dW === w) {
        al = toothAngle(w, p.dTooth, z, sh.sgn);
        broken =
          p.def === 'broken'
            ? (((Math.round((al - phase) / (TAU / z)) % z) + z) % z)
            : -1;
      }

      add(
        `etage${i + 1}_${w ? 'roue' : 'pignon'}`,
        gearGeo(z, g.m, g.w, phase, broken),
        mat.gear[i][w],
        0,
        0,
        g.z,
        sh.spin
      );

      add(
        'moyeu',
        cylZ(Math.max(0.022, r * 0.28), g.w + 0.012),
        mat.gear[i][w],
        0,
        0,
        g.z,
        sh.spin
      );

      if (defHere && p.dW === w) {
        const rr = p.def === 'broken' ? r - 0.75 * g.m : r;
        const mk = add(
          'dent_defaut',
          box(p.def === 'broken' ? 0.8 * g.m : 2.3 * g.m, 1.25 * g.m, g.w + 0.004),
          mat.def,
          rr * Math.cos(al),
          rr * Math.sin(al),
          g.z,
          sh.spin
        );
        mk.rotation.z = al;

        if (p.def === 'crack') {
          const c = add(
            'fissure',
            box(0.5 * g.m, 0.18 * g.m, g.w + 0.006),
            mat.crack,
            (r - 1.05 * g.m) * Math.cos(al + 0.3 / z),
            (r - 1.05 * g.m) * Math.sin(al + 0.3 / z),
            g.z,
            sh.spin
          );
          c.rotation.z = al + 0.5;
        }
      }
    }
    meshPts.push(new THREE.Vector3(X[i] + g.r1, H, g.z));
  });

  // Capteur + éclair d'impact
  const sensor = grp('accelerometre', 0, yt, 0);
  add(
    'embase',
    new THREE.CylinderGeometry(0.012, 0.012, 0.008, 24),
    mat.steel,
    0,
    0.004,
    0,
    sensor
  );
  const sBody = add(
    'corps',
    new THREE.CylinderGeometry(0.01, 0.01, 0.032, 24),
    mat.sensor,
    0,
    0.024,
    0,
    sensor
  );
  add(
    'connecteur',
    new THREE.CylinderGeometry(0.005, 0.005, 0.012, 16),
    mat.steel,
    0,
    0.046,
    0,
    sensor
  );

  const dS = p.def !== 'none' ? p.dStage + p.dW : 0;
  sensor.position.set(X[dS] || 0, yt, Zh - 0.03);

  const flash = add('impact', new THREE.SphereGeometry(1, 24, 16), mat.flash, 0, 0, 0);
  flash.visible = false;
  flash.renderOrder = 5;

  const ring = add('onde_choc', new THREE.TorusGeometry(1, 0.06, 8, 48), mat.flash2, 0, 0, 0);
  ring.visible = false;
  ring.renderOrder = 5;

  return {
    root,
    shafts,
    housing,
    meshPts,
    flash,
    ring,
    sensor,
    sBody,
    H,
    X,
    Zh,
    xmin,
    xmax,
    yt,
    G,
  };
}

export function makeMaterials() {
  const M = (
    name: string,
    color: number,
    r = 0.5,
    m = 0.3,
    extra: Record<string, any> = {}
  ) => {
    const x = new THREE.MeshStandardMaterial({
      color,
      roughness: r,
      metalness: m,
      ...extra,
    });
    x.name = name;
    return x;
  };

  const GC = [
    [0x4c1d95, 0x7c3aed],
    [0x0f766e, 0x14b8a6],
    [0x9d174d, 0xdb2777],
  ];

  return {
    gear: GC.map(([a, b], i) => [
      M(`pignon_etage${i + 1}`, a, 0.4, 0.45),
      M(`roue_etage${i + 1}`, b, 0.42, 0.4),
    ]),
    web: M('voile_roue', 0x334155, 0.5, 0.3),
    steel: M('acier_arbre', 0xcbd5e1, 0.28, 0.6),
    refShaft: M('arbre_reference', 0x2563eb, 0.3, 0.4),
    base: M('chassis', 0xcbd5e1, 0.65, 0.2),
    dark: M('fonte', 0x475569, 0.45, 0.3),
    motor: M('moteur', 0x1e3a8a, 0.45, 0.35),
    housing: M('carter_fonte', 0x64748b, 0.55, 0.25, {
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    flange: M('plan_joint', 0x64748b, 0.5, 0.25, {
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
    boss: M('palier_fonte', 0x64748b, 0.5, 0.25, {
      transparent: true,
      opacity: 0.45,
    }),
    bearing: M('roulement', 0x94a3b8, 0.3, 0.6),
    edge: Object.assign(
      new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.7 }),
      { name: 'aretes' }
    ),
    def: M('dent_defaut', 0xf59e0b, 0.4, 0.1, {
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 0.3,
    }),
    crack: M('fissure', 0x111827, 0.9, 0),
    tape: M('bande_reflechissante', 0xef4444, 0.3, 0.1),
    tach: M('tachymetre', 0x0f172a, 0.4, 0.3),
    sensor: M('capteur', 0x334155, 0.4, 0.3, {
      emissive: new THREE.Color(0xef4444),
      emissiveIntensity: 0,
    }),
    flash: Object.assign(
      new THREE.MeshBasicMaterial({
        color: 0xff3b1f,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
      }),
      { name: 'impact' }
    ),
    flash2: Object.assign(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
      }),
      { name: 'onde_choc' }
    ),
  };
}
