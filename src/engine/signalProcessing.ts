/**
 * Signal processing utilities for tremor analysis.
 * These functions are designed to run in a Web Worker.
 */

/**
 * Compute RMS (Root Mean Square) of acceleration magnitude.
 */
export function computeRMS(
  samples: { x: number; y: number; z: number }[],
): number {
  if (samples.length === 0) return 0;
  const sumSq = samples.reduce(
    (acc, s) => acc + s.x * s.x + s.y * s.y + s.z * s.z,
    0,
  );
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Cooley-Tukey FFT (radix-2, in-place).
 * Input length must be a power of 2.
 */
export function fft(
  real: Float64Array,
  imag: Float64Array,
): { real: Float64Array; imag: Float64Array } {
  const n = real.length;
  if (n <= 1) return { real, imag };

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }

  // FFT butterfly
  for (let len = 2; len <= n; len *= 2) {
    const halfLen = len / 2;
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;

      for (let j = 0; j < halfLen; j++) {
        const u = i + j;
        const v = i + j + halfLen;

        const tReal = curReal * real[v] - curImag * imag[v];
        const tImag = curReal * imag[v] + curImag * real[v];

        real[v] = real[u] - tReal;
        imag[v] = imag[u] - tImag;
        real[u] = real[u] + tReal;
        imag[u] = imag[u] + tImag;

        const newCurReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newCurReal;
      }
    }
  }

  return { real, imag };
}

/**
 * Compute power spectrum band power in the 4-12Hz range.
 */
export function computeBandPower(
  samples: number[],
  sampleRate: number,
  freqMin: number,
  freqMax: number,
): number {
  // Pad to next power of 2
  const n = nextPow2(samples.length);
  const real = new Float64Array(n);
  const imag = new Float64Array(n);

  // Apply Hanning window
  for (let i = 0; i < samples.length; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
    real[i] = samples[i] * window;
  }

  const result = fft(real, imag);

  // Compute power spectrum and sum in target band
  const freqResolution = sampleRate / n;
  const binMin = Math.ceil(freqMin / freqResolution);
  const binMax = Math.floor(freqMax / freqResolution);

  let power = 0;
  for (let i = binMin; i <= binMax && i < n / 2; i++) {
    power += result.real[i] * result.real[i] + result.imag[i] * result.imag[i];
  }

  return power / n;
}

/**
 * Compute acceleration magnitude time series from 3-axis samples.
 */
export function magnitudeSeries(
  samples: { x: number; y: number; z: number }[],
): number[] {
  return samples.map((s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z));
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
