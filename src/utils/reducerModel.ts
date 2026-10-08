// Réducteur multi-étages : cinématique, signal simulé, spectre, outils TSA.

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export const DEF: Record<string, number> = {
  none: 0,
  crack: 0.75,
  broken: 1.5,
};

export const PRESET: Record<number, [number, number][]> = {
  1: [[21, 58]],
  2: [[22, 57], [19, 48]],
  3: [[22, 57], [19, 48], [17, 43]],
};

export const STAGE_COL = ['#7c3aed', '#0d9488', '#db2777'];
const TAU = 2 * Math.PI;
const MESH = [1, 0.45, 0.18];
const MPH = [0, 0.6, 1.1];
const SA = [1, 0.8, 0.65];

export interface ReducerParams {
  rpm: number;
  st: [number, number][];
  ecc: number;
  noise: number;
  def: 'none' | 'crack' | 'broken';
  dStage: number;
  dW: number; // 0: pignon, 1: roue
  dTooth: number;
}

export interface StageKinematics {
  i: number;
  z1: number;
  z2: number;
  gmf: number;
  na: number;
  htf: number;
  gapf: number;
  A: number;
  ratio: number;
}

export interface ReducerKinematics {
  f: number[];
  S: StageKinematics[];
  fint: number;
  ratio: number;
}

export function kin(p: ReducerParams): ReducerKinematics {
  const f: number[] = [p.rpm / 60];
  const S: StageKinematics[] = p.st.map(([z1, z2], i) => {
    const g = z1 * f[i];
    const na = gcd(z1, z2);
    f.push((f[i] * z1) / z2);
    return {
      i,
      z1,
      z2,
      gmf: g,
      na,
      htf: (g * na) / (z1 * z2),
      gapf: g / na,
      A: SA[i] || 0.5,
      ratio: z2 / z1,
    };
  });
  return { f, S, fint: 0.613 * S[0].gmf, ratio: f[0] / f[f.length - 1] };
}

// w = 0 pignon (arbre i), w = 1 roue (arbre i+1)
export const gearOf = (k: ReducerKinematics, stage: number, w: number) => ({
  s: stage + w,
  z: k.S[stage][w ? 'z2' : 'z1'],
  f: k.f[stage + w],
  gmf: k.S[stage].gmf,
});

// Fraction de tour de l'arbre où la dent n passe au point d'engrènement
export const toothU = (w: number, n: number, z: number): number =>
  w ? (n - 0.5) / z : (n - 1) / z;

// Instants des chocs de la dent défectueuse
export const shockPhase = (p: ReducerParams, k: ReducerKinematics) => {
  const g = gearOf(k, p.dStage, p.dW);
  return { g, u0: toothU(p.dW, p.dTooth, g.z) };
};

export function shock(p: ReducerParams, k: ReducerKinematics, t: number): number {
  const d = DEF[p.def] || 0;
  if (!d) return 0;
  const { g, u0 } = shockPhase(p, k);
  let u = t * g.f - u0;
  u -= Math.round(u);
  const dt = u / g.f;
  const q = dt * g.gmf;
  if (q < -0.5 || q > 4) return 0;
  const env = q < 0 ? Math.exp(-((q / 0.12) ** 2)) : Math.exp(-q / 0.8);
  let x = d * 2.2 * env * Math.sin(TAU * 3.1 * q + 0.4);
  if (p.def === 'broken') {
    x -= 0.6 * Math.exp(-(q ** 2)) * Math.cos(TAU * g.gmf * t);
  }
  return x;
}

export function synth(p: ReducerParams, k: ReducerKinematics, t: number): number {
  const e = p.ecc;
  let x = 0;
  for (const s of k.S) {
    const mod = 1 + 0.45 * e * Math.cos(TAU * k.f[s.i] * t + s.i);
    let m = 0;
    for (let h = 0; h < 3; h++) {
      m += MESH[h] * Math.cos(TAU * (h + 1) * s.gmf * t + MPH[h] + s.i * 1.3);
    }
    x += s.A * m * mod;
  }
  k.f.forEach((f, i) => {
    x += (i < k.S.length ? 0.1 + 0.3 * e : 0.08) * Math.cos(TAU * f * t - 0.7 + i);
  });
  return x + shock(p, k, t) + p.noise * 0.9 * Math.sin(TAU * k.fint * t + 0.4);
}

export interface PeakItem {
  f: number;
  a: number;
  label: string;
  kind: 'rpm' | 'int' | 'htf' | 'gmf' | 'sb' | 'sbd';
  st?: number;
  raw?: number;
}

export function peaks(p: ReducerParams, k: ReducerKinematics): PeakItem[] {
  const e = p.ecc;
  const d = DEF[p.def] || 0;
  const P: PeakItem[] = [];
  const n = k.S.length;
  const push = (
    f: number,
    a: number,
    label: string,
    kind: 'rpm' | 'int' | 'htf' | 'gmf' | 'sb' | 'sbd',
    st?: number
  ) => {
    if (f > 0 && a > 0.004) P.push({ f, a, label, kind, st });
  };

  k.f.forEach((f, i) => push(f, i < n ? 0.1 + 0.3 * e : 0.08, `1x A${i + 1}`, 'rpm'));
  push(k.fint, p.noise * 0.9, 'Interférence', 'int');

  for (const s of k.S) {
    push(s.htf, 0.03, `HTF${n > 1 ? s.i + 1 : ''}`, 'htf');
    for (let h = 0; h < 3; h++) {
      const g = (h + 1) * s.gmf;
      const A = s.A * MESH[h];
      const L = n > 1 ? `GMF${s.i + 1}` : 'GMF';
      push(g, A, h ? `${h + 1}x ${L}` : L, 'gmf', s.i);
      for (const [fs, c] of [
        [k.f[s.i], 0.225 * e],
        [k.f[s.i + 1], 0.06],
      ]) {
        push(g - fs, c * A, '', 'sb');
        push(g + fs, c * A, '', 'sb');
      }
    }
  }

  if (d) {
    const { g } = shockPhase(p, k);
    const s = k.S[p.dStage];
    for (let h = 0; h < 3; h++) {
      const G = (h + 1) * s.gmf;
      for (let j = 1; j <= 10; j++) {
        const a =
          d *
          0.2 *
          Math.exp(-j / 9) *
          (0.6 + 0.4 * MESH[h]) *
          s.A;
        push(G - j * g.f, a, '', 'sbd');
        push(G + j * g.f, a, '', 'sbd');
      }
    }
    for (let j = 1; j <= 6; j++) {
      push(j * g.f, d * 0.05, j === 1 ? `1x A${g.s + 1} (chocs)` : '', 'sbd');
    }
  }

  return P;
}

export const floorAt = (f: number, p: ReducerParams): number =>
  0.006 +
  0.03 *
    (0.3 + p.noise) *
    (0.5 + 0.5 * Math.abs(Math.sin(f * 0.37) * Math.cos(f * 0.11)));

export function orderCoef(x: Float64Array, o: number): [number, number] {
  let a = 0;
  let b = 0;
  const N = x.length;
  const w = (TAU * o) / N;
  for (let i = 0; i < N; i++) {
    a += x[i] * Math.cos(w * i);
    b += x[i] * Math.sin(w * i);
  }
  return [(2 * a) / N, (2 * b) / N];
}

// Résiduel : TSA moins ordres 1, 2, harmoniques de chaque engrènement de l'arbre et bandes ±1
export function residual(x: Float64Array, Zs: number[]): Float64Array {
  const N = x.length;
  const r = Float64Array.from(x);
  const mean = x.reduce((s, v) => s + v, 0) / N;
  for (let i = 0; i < N; i++) r[i] -= mean;
  const orders = new Set<number>([1, 2]);
  for (const Z of Zs) {
    for (let h = 1; h <= 3; h++) {
      for (const s of [-1, 0, 1]) {
        orders.add(h * Z + s);
      }
    }
  }
  for (const o of orders) {
    if (o <= 0 || o >= N / 2) continue;
    const [a, b] = orderCoef(x, o);
    const w = (TAU * o) / N;
    for (let i = 0; i < N; i++) {
      r[i] -= a * Math.cos(w * i) + b * Math.sin(w * i);
    }
  }
  return r;
}

export interface SignalStats {
  rms: number;
  pk: number;
  crest: number;
  kurt: number;
}

export function stats(x: Float64Array): SignalStats {
  let s2 = 0;
  let s4 = 0;
  let pk = 0;
  const N = x.length;
  for (let i = 0; i < N; i++) {
    const q = x[i] * x[i];
    s2 += q;
    s4 += q * q;
    pk = Math.max(pk, Math.abs(x[i]));
  }
  const rms = Math.sqrt(s2 / N);
  return {
    rms,
    pk,
    crest: pk / (rms || 1e-9),
    kurt: (N * s4) / (s2 * s2 || 1e-12),
  };
}

export function attenuation(r: number, N: number): number {
  const fr = r - Math.floor(r);
  if (fr < 1e-6 || 1 - fr < 1e-6) return 1;
  return Math.abs(Math.sin(Math.PI * fr * N) / (N * Math.sin(Math.PI * fr)));
}
