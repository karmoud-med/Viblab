// Modèle physique et cinématique de roulement industriel à billes
// Fréquences caractéristiques, impacts mécaniques, zone de charge, FFT & démodulation Hilbert (spectre d'enveloppe)

export const TAU = 2 * Math.PI;

export interface BearingPreset {
  name: string;
  n: number;
  d: number;
  D: number;
  a: number;
}

export const PRESETS: Record<string, BearingPreset> = {
  '6205': { name: 'SKF 6205', n: 9, d: 7.94, D: 39, a: 0 },
  '6308': { name: 'FAG 6308', n: 8, d: 15.08, D: 65, a: 0 },
  '7310': { name: 'SKF 7310 (Contact oblique)', n: 12, d: 19.05, D: 80, a: 40 },
};

export const FS = 16384;
export const NFFT = 16384;
export const FRES = 3000;
export const FRES2 = 5600;
export const TD = 0.0012;
export const PHI_OUT = -Math.PI / 2;
export const PHI_IN = 0;

export type BearingDefectType = 'none' | 'outer' | 'inner' | 'ball' | 'cage';

export const DEFS: Record<BearingDefectType, string> = {
  none: 'Sain',
  outer: 'BPFO (Bague extérieure)',
  inner: 'BPFI (Bague intérieure)',
  ball: 'BSF (Bille / Élément)',
  cage: 'FTF (Cage)',
};

export interface BearingSimParams {
  rpm: number;
  name?: string;
  n: number;
  d: number;
  D: number;
  a: number;
  def: BearingDefectType;
  sev: number; // 0..1
  noise: number; // 0..1
  slip: number; // % (e.g. 1.5)
}

export interface BearingKinematics {
  f: number;
  r: number;
  ftf: number;
  bsf: number;
  bpfo: number;
  bpfi: number;
  slip: number;
  ftfE: number;
  bpfoE: number;
  bpfiE: number;
  bsfE: number;
}

export function freqs(p: BearingSimParams): BearingKinematics {
  const f = p.rpm / 60;
  const r = (p.d / p.D) * Math.cos((p.a * Math.PI) / 180);
  const ftf = (f / 2) * (1 - r);
  const bsf = (p.D / (2 * p.d)) * f * (1 - r * r);
  const s = (p.slip ?? 0) / 100;
  const fe = ftf * (1 - s);

  // Valeurs théoriques + valeurs effectives avec glissement réel des billes (1 à 3%)
  return {
    f,
    r,
    ftf,
    bsf,
    bpfo: ((p.n * f) / 2) * (1 - r),
    bpfi: ((p.n * f) / 2) * (1 + r),
    slip: s,
    ftfE: fe,
    bpfoE: p.n * fe,
    bpfiE: p.n * (f - fe),
    bsfE: bsf * (1 - s),
  };
}

// Fréquence et phase des impacts : impact quand t·fd − u0 est entier
export function impactInfo(p: BearingSimParams, k: BearingKinematics): { fd: number; u0: number } | null {
  if (p.def === 'outer') return { fd: k.bpfoE, u0: (p.n * PHI_OUT) / TAU };
  if (p.def === 'inner') return { fd: k.bpfiE, u0: (-p.n * PHI_IN) / TAU };
  if (p.def === 'ball') return { fd: 2 * k.bsfE, u0: 0 };
  return null;
}

// Zone de charge radiale (vers le bas, y négatif)
export const loadF = (ang: number): number => Math.max(0, -Math.sin(ang)) ** 1.5;

const hash = (j: number): number => {
  const x = Math.sin(j * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Amplitude d'un impact (j = numéro d'impact) : zone de charge + dispersion naturelle ±20%
export function impactAmp(p: BearingSimParams, k: BearingKinematics, ti: number, j: number): number {
  const v = 0.8 + 0.4 * hash(j);
  const par = ((j % 2) + 2) % 2;
  if (p.def === 'outer') return v;
  if (p.def === 'inner') return v * (0.15 + 0.85 * loadF(TAU * k.f * ti + PHI_IN));
  if (p.def === 'ball') return v * (par ? 0.6 : 1) * (0.2 + 0.8 * loadF(TAU * k.ftfE * ti));
  return 0;
}

// Parcourt les impacts récents à l'instant t
export function eachImpact(
  p: BearingSimParams,
  k: BearingKinematics,
  t: number,
  cb: (tau: number, A: number, ti: number, j: number) => void
): void {
  const ii = impactInfo(p, k);
  if (!ii || !p.sev) return;
  const j0 = Math.floor(t * ii.fd - ii.u0);
  for (let j = j0; j > j0 - 4; j--) {
    const ti = (j + ii.u0) / ii.fd;
    const tau = t - ti;
    if (tau > 6 * TD) break;
    cb(tau, 3 * p.sev * impactAmp(p, k, ti, j), ti, j);
  }
}

// Signal d'accélération propre sans bruit
export function clean(p: BearingSimParams, k: BearingKinematics, t: number): number {
  let x = 0.12 * Math.sin(TAU * k.f * t) + 0.04 * Math.sin(2 * TAU * k.f * t + 1);
  eachImpact(p, k, t, (tau, A) => {
    x += A * (Math.exp(-tau / TD) * Math.sin(TAU * FRES * tau) + 0.35 * Math.exp(-tau / (TD * 0.6)) * Math.sin(TAU * FRES2 * tau + 1));
  });
  if (p.def === 'cage') {
    x += p.sev * (0.3 * Math.sin(TAU * k.ftf * t) + 0.12 * Math.sin(2 * TAU * k.ftf * t + 0.5)) * (1 + 0.3 * Math.sin(TAU * k.f * t));
  }
  return x;
}

export function envAt(p: BearingSimParams, k: BearingKinematics, t: number): number {
  let e = 0;
  eachImpact(p, k, t, (tau, A) => {
    e += A * Math.exp(-tau / TD);
  });
  return e;
}

export const noiseSigma = (p: BearingSimParams): number => 0.06 + 0.35 * p.noise;

function rng(seed: number) {
  let s = seed;
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(TAU * r());
}

// Synthétise le bloc temporel complet avec bruit coloré sur la résonance
export function record(p: BearingSimParams, k: BearingKinematics): Float64Array {
  const g = rng(4242);
  const sg = noiseSigma(p);
  const x = new Float64Array(NFFT);
  // Bruit mécanique coloré : excite aussi la résonance du palier
  let y1 = 0;
  let y2 = 0;
  const w = (TAU * FRES) / FS;
  const rr = 0.985;
  const a1 = 2 * rr * Math.cos(w);
  const a2 = -rr * rr;

  for (let i = 0; i < NFFT; i++) {
    const e = g();
    const y = a1 * y1 + a2 * y2 + e * 0.05;
    y2 = y1;
    y1 = y;
    x[i] = clean(p, k, i / FS) + sg * (0.6 * g() + y * 0.35);
  }
  return x;
}

// FFT Cooley-Tukey in-place
export function fft(re: Float64Array, im: Float64Array, inv = false): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let b = n >> 1;
    for (; j & b; b >>= 1) j ^= b;
    j ^= b;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = ((inv ? 1 : -1) * TAU) / len;
    const wr = Math.cos(a);
    const wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const k = i + j;
        const l = k + len / 2;
        const tr = re[l] * cr - im[l] * ci;
        const ti = re[l] * ci + im[l] * cr;
        re[l] = re[k] - tr;
        im[l] = im[k] - ti;
        re[k] += tr;
        im[k] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
  if (inv) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

// Spectre d'amplitude avec fenêtre Hanning
export function ampSpec(x: Float64Array): Float64Array {
  const n = x.length;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  let ws = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((TAU * i) / (n - 1));
    re[i] = x[i] * w;
    ws += w;
  }
  fft(re, im);
  const A = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    A[i] = (2 * Math.hypot(re[i], im[i])) / ws;
  }
  return A;
}

// Démodulation d'enveloppe : filtre passe-bande + transformée de Hilbert -> signal analytique -> |z| -> FFT
export function envelope(x: Float64Array, fc: number, bw: number): { env: Float64Array; spec: Float64Array } {
  const n = x.length;
  const re = Float64Array.from(x);
  const im = new Float64Array(n);
  const df = FS / n;

  fft(re, im);
  const lo = Math.max(1, Math.round((fc - bw / 2) / df));
  const hi = Math.min(n / 2 - 1, Math.round((fc + bw / 2) / df));

  for (let i = 0; i < n; i++) {
    const keep = i >= lo && i <= hi;
    re[i] = keep ? 2 * re[i] : 0;
    im[i] = keep ? 2 * im[i] : 0;
  }

  fft(re, im, true);
  const e = new Float64Array(n);
  let m = 0;
  for (let i = 0; i < n; i++) {
    e[i] = Math.hypot(re[i], im[i]);
    m += e[i];
  }
  m /= n;
  for (let i = 0; i < n; i++) {
    e[i] -= m;
  }
  return { env: e, spec: ampSpec(e) };
}

export function rms(x: Float64Array): number {
  let s = 0;
  for (const v of x) s += v * v;
  return Math.sqrt(s / x.length);
}

export function kurt(x: Float64Array): number {
  let m = 0;
  for (const v of x) m += v;
  m /= x.length;
  let s2 = 0;
  let s4 = 0;
  for (const v of x) {
    const q = (v - m) ** 2;
    s2 += q;
    s4 += q * q;
  }
  return (x.length * s4) / (s2 * s2 || 1e-12);
}
