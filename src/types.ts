export interface SignalComponent {
  id: string;
  type: 'sine' | 'square' | 'sawtooth' | 'noise';
  frequency: number; // Hz
  amplitude: number; // g or mm/s or um depending on module
  phase: number; // degrees
}

export interface ModulationSettings {
  enabled: boolean;
  type: 'AM' | 'FM';
  carrierFrequency: number; // Hz
  modulatingFrequency: number; // Hz
  index: number; // modulation index (0 to 1 for AM, beta for FM)
}

export type WindowType = 'rectangular' | 'hanning' | 'hamming' | 'flattop';

export interface BearingParams {
  name: string;
  rpm: number;
  numBalls: number;
  ballDiameter: number; // mm
  pitchDiameter: number; // mm
  contactAngle: number; // degrees
}

export interface BearingFrequencies {
  bpfi: number;
  bpfo: number;
  bsf: number;
  ftf: number;
}

export interface GearParams {
  rpm: number;
  teeth1: number;
  teeth2: number;
}

export interface MotorParams {
  lineFreq: number; // Hz (50 or 60)
  poles: number; // 2, 4, 6, 8...
  rpm: number; // operating RPM
  numRotorBars: number;
}

export interface PumpFanParams {
  rpm: number;
  numBlades: number;
}

export interface Vector2D {
  amplitude: number;
  phase: number; // degrees
}

export interface BalancingParams {
  original: Vector2D;
  trial: Vector2D;
  trialWeight: number; // g
  trialAngle: number; // degrees
}

export interface BalancingResult {
  effect: Vector2D;
  influenceCoeff: { amplitude: number; phase: number };
  correctionWeight: number;
  correctionAngle: number;
}
