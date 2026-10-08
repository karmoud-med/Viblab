import { BearingFrequencies, BearingParams, Vector2D, BalancingParams, BalancingResult } from '../types';

// Bit-reversal helper for FFT
function bitReverse(n: number, bits: number): number {
  let reversed = 0;
  for (let i = 0; i < bits; i++) {
    if ((n & (1 << i)) !== 0) {
      reversed |= (1 << (bits - 1 - i));
    }
  }
  return reversed;
}

// In-place Radix-2 FFT
export function fft(real: Float32Array, imag: Float32Array) {
  const n = real.length;
  const bits = Math.round(Math.log2(n));
  
  for (let i = 0; i < n; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      let temp = real[i];
      real[i] = real[j];
      real[j] = temp;
      temp = imag[i];
      imag[i] = imag[j];
      imag[j] = temp;
    }
  }
  
  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    for (let i = 0; i < n; i += size) {
      for (let j = i; j < i + halfSize; j++) {
        const k = j + halfSize;
        const angle = -2 * Math.PI * (j - i) / size;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        
        const tr = real[k] * wr - imag[k] * wi;
        const ti = real[k] * wi + imag[k] * wr;
        
        real[k] = real[j] - tr;
        imag[k] = imag[j] - ti;
        
        real[j] += tr;
        imag[j] += ti;
      }
    }
  }
}

// Windowing functions
export function applyWindow(data: Float32Array, type: string): { windowed: Float32Array; gainCompensation: number } {
  const N = data.length;
  const windowed = new Float32Array(N);
  let windowSum = 0;

  switch (type) {
    case 'hanning':
      for (let n = 0; n < N; n++) {
        const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
        windowed[n] = data[n] * w;
        windowSum += w;
      }
      break;
    case 'hamming':
      for (let n = 0; n < N; n++) {
        const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
        windowed[n] = data[n] * w;
        windowSum += w;
      }
      break;
    case 'flattop':
      for (let n = 0; n < N; n++) {
        const w = 0.21557895 
          - 0.41663158 * Math.cos((2 * Math.PI * n) / (N - 1))
          + 0.277263158 * Math.cos((4 * Math.PI * n) / (N - 1))
          - 0.083578947 * Math.cos((6 * Math.PI * n) / (N - 1))
          + 0.006947368 * Math.cos((8 * Math.PI * n) / (N - 1));
        windowed[n] = data[n] * w;
        windowSum += w;
      }
      break;
    case 'rectangular':
    default:
      for (let n = 0; n < N; n++) {
        windowed[n] = data[n];
        windowSum += 1.0;
      }
      break;
  }

  // Coherent gain compensation factor (average value of the window)
  const gainCompensation = windowSum / N;
  return { windowed, gainCompensation };
}

// Convert degrees to radians and back
export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => {
  let deg = (rad * 180) / Math.PI;
  while (deg < 0) deg += 360;
  return deg % 360;
};

// Vector operations
export function addVectors(v1: Vector2D, v2: Vector2D): Vector2D {
  const r1 = degToRad(v1.phase);
  const r2 = degToRad(v2.phase);
  const x = v1.amplitude * Math.cos(r1) + v2.amplitude * Math.cos(r2);
  const y = v1.amplitude * Math.sin(r1) + v2.amplitude * Math.sin(r2);
  const amp = Math.sqrt(x * x + y * y);
  const phase = radToDeg(Math.atan2(y, x));
  return { amplitude: amp, phase };
}

export function subtractVectors(v1: Vector2D, v2: Vector2D): Vector2D {
  const r1 = degToRad(v1.phase);
  const r2 = degToRad(v2.phase);
  const x = v1.amplitude * Math.cos(r1) - v2.amplitude * Math.cos(r2);
  const y = v1.amplitude * Math.sin(r1) - v2.amplitude * Math.sin(r2);
  const amp = Math.sqrt(x * x + y * y);
  const phase = radToDeg(Math.atan2(y, x));
  return { amplitude: amp, phase };
}

export function multiplyVectors(v1: Vector2D, v2: Vector2D): Vector2D {
  return {
    amplitude: v1.amplitude * v2.amplitude,
    phase: (v1.phase + v2.phase) % 360
  };
}

export function divideVectors(v1: Vector2D, v2: Vector2D): Vector2D {
  return {
    amplitude: v2.amplitude === 0 ? 0 : v1.amplitude / v2.amplitude,
    phase: (v1.phase - v2.phase + 360) % 360
  };
}

// Bearing frequency calculator
export function calculateBearingFreqs(params: BearingParams): BearingFrequencies {
  const fr = params.rpm / 60; // running frequency in Hz
  const dOverD = params.ballDiameter / params.pitchDiameter;
  const cosAlpha = Math.cos(degToRad(params.contactAngle));
  
  const bpfi = (params.numBalls / 2) * fr * (1 + dOverD * cosAlpha);
  const bpfo = (params.numBalls / 2) * fr * (1 - dOverD * cosAlpha);
  const bsf = (params.pitchDiameter / (2 * params.ballDiameter)) * fr * (1 - Math.pow(dOverD * cosAlpha, 2));
  const ftf = 0.5 * fr * (1 - dOverD * cosAlpha);
  
  return { bpfi, bpfo, bsf, ftf };
}

// Greatest Common Divisor helper
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Least Common Multiple helper
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

// Single-plane Vector Balancing
export function solveBalancing(params: BalancingParams): BalancingResult {
  const { original, trial, trialWeight, trialAngle } = params;
  
  // Vector O = original run
  // Vector T = trial run
  // Effect of trial weight E = T - O
  const effect = subtractVectors(trial, original);
  
  // Trial weight vector: W_t = trialWeight at trialAngle
  const trialWeightVector: Vector2D = { amplitude: trialWeight, phase: trialAngle };
  
  // Influence Coefficient alpha = E / W_t
  const influenceCoeff = divideVectors(effect, trialWeightVector);
  
  // Correction weight vector W_c = -O / alpha
  // Since -O is O with +180 degrees phase shift
  const minusO: Vector2D = { amplitude: original.amplitude, phase: (original.phase + 180) % 360 };
  const correctionVector = divideVectors(minusO, influenceCoeff);
  
  return {
    effect,
    influenceCoeff,
    correctionWeight: correctionVector.amplitude,
    correctionAngle: correctionVector.phase
  };
}

// Unit Conversion calculations
// Standard gravity acceleration g = 9.80665 m/s^2 = 386.0885 in/s^2
const G_METRIC = 9.80665 * 1000; // mm/s^2
const G_IMPERIAL = 386.0885; // in/s^2

export interface ConversionInput {
  value: number;
  type: 'accel' | 'vel' | 'disp';
  unit: string; // 'g_rms' | 'g_pk' | 'mms_rms' | 'mms_pk' | 'ips_rms' | 'ips_pk' | 'um_pp' | 'mils_pp'
  freq: number; // Hz
}

export function convertVibrationUnits(input: ConversionInput): {
  accel_g_rms: number;
  accel_g_pk: number;
  vel_mms_rms: number;
  vel_mms_pk: number;
  vel_ips_rms: number;
  vel_ips_pk: number;
  disp_um_pp: number;
  disp_mils_pp: number;
} {
  const { value, type, unit, freq } = input;
  const omega = 2 * Math.PI * freq; // rad/s
  
  // First, let's normalize everything to Acceleration peak (g_pk) or Velocity peak (mm/s_pk)
  // Let's compute standard base metrics:
  // We'll calculate Accel (g Peak) as our standard intermediate representation.
  let a_pk = 0; // in g Peak

  if (freq <= 0) {
    // Edge case: if frequency is 0, we can't convert between different physical parameters.
    // We will just do amplitude conversions within the same type.
    let target = value;
    if (type === 'accel') {
      const isRms = unit.endsWith('rms');
      const gVal = isRms ? value * Math.sqrt(2) : value; // convert to pk
      return {
        accel_g_rms: gVal / Math.sqrt(2),
        accel_g_pk: gVal,
        vel_mms_rms: 0, vel_mms_pk: 0,
        vel_ips_rms: 0, vel_ips_pk: 0,
        disp_um_pp: 0, disp_mils_pp: 0
      };
    } else if (type === 'vel') {
      const isIps = unit.startsWith('ips');
      const isRms = unit.endsWith('rms');
      let mms_pk = value;
      if (isIps) {
        mms_pk = value * 25.4;
      }
      if (isRms) {
        mms_pk = mms_pk * Math.sqrt(2);
      }
      return {
        accel_g_rms: 0, accel_g_pk: 0,
        vel_mms_rms: mms_pk / Math.sqrt(2),
        vel_mms_pk: mms_pk,
        vel_ips_rms: (mms_pk / 25.4) / Math.sqrt(2),
        vel_ips_pk: mms_pk / 25.4,
        disp_um_pp: 0, disp_mils_pp: 0
      };
    } else {
      const isMils = unit.startsWith('mils');
      const um_pp = isMils ? value * 25.4 : value;
      return {
        accel_g_rms: 0, accel_g_pk: 0,
        vel_mms_rms: 0, vel_mms_pk: 0,
        vel_ips_rms: 0, vel_ips_pk: 0,
        disp_um_pp: um_pp,
        disp_mils_pp: um_pp / 25.4
      };
    }
  }

  // Frequency is > 0: Convert input unit to a_pk (g Peak)
  if (type === 'accel') {
    if (unit === 'g_rms') {
      a_pk = value * Math.sqrt(2);
    } else if (unit === 'g_pk') {
      a_pk = value;
    }
  } else if (type === 'vel') {
    let v_pk = 0; // mm/s Peak
    if (unit === 'mms_rms') {
      v_pk = value * Math.sqrt(2);
    } else if (unit === 'mms_pk') {
      v_pk = value;
    } else if (unit === 'ips_rms') {
      v_pk = value * 25.4 * Math.sqrt(2);
    } else if (unit === 'ips_pk') {
      v_pk = value * 25.4;
    }
    // Convert Velocity (mm/s pk) to Accel (g pk)
    // a(t) = v'(t) = omega * v_pk
    // a_pk in mm/s^2 = omega * v_pk
    // a_pk in g = (omega * v_pk) / 9806.65
    a_pk = (omega * v_pk) / (9.80665 * 1000);
  } else if (type === 'disp') {
    let d_pp = 0; // um Peak-to-Peak
    if (unit === 'um_pp') {
      d_pp = value;
    } else if (unit === 'mils_pp') {
      d_pp = value * 25.4;
    }
    // d_pk in mm = (d_pp / 2) * 10^-3
    // v_pk in mm/s = omega * d_pk = omega * (d_pp / 2) * 10^-3
    // a_pk in mm/s^2 = omega^2 * (d_pp / 2) * 10^-3
    // a_pk in g = omega^2 * (d_pp / 2) * 10^-3 / 9806.65
    a_pk = (Math.pow(omega, 2) * (d_pp / 2) * 0.001) / (9.80665 * 1000);
  }

  // Now convert a_pk (g peak) to all other units!
  const accel_g_pk = a_pk;
  const accel_g_rms = a_pk / Math.sqrt(2);

  // Accel peak in mm/s^2
  const a_pk_mms2 = a_pk * 9.80665 * 1000;
  // Velocity peak in mm/s = a_pk_mms2 / omega
  const vel_mms_pk = a_pk_mms2 / omega;
  const vel_mms_rms = vel_mms_pk / Math.sqrt(2);

  const vel_ips_pk = vel_mms_pk / 25.4;
  const vel_ips_rms = vel_ips_pk / Math.sqrt(2);

  // Displacement peak in mm = vel_mms_pk / omega
  const d_pk_mm = vel_mms_pk / omega;
  // Displacement peak-to-peak in um = d_pk_mm * 2 * 1000
  const disp_um_pp = d_pk_mm * 2 * 1000;
  const disp_mils_pp = disp_um_pp / 25.4;

  return {
    accel_g_rms,
    accel_g_pk,
    vel_mms_rms,
    vel_mms_pk,
    vel_ips_rms,
    vel_ips_pk,
    disp_um_pp,
    disp_mils_pp
  };
}
