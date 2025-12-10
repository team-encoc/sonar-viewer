/**
 * Sonar Data Converter - Web Version
 * Converts hardware sonar samples to full depth array for rendering
 */

/**
 * Expand 90 sonar samples to target depth resolution
 * @param samples - Raw 90 samples from hardware
 * @param targetDepth - Target depth resolution (144/360/720)
 */
export function expandSonarSamples(samples: number[], targetDepth: number): Uint8Array {
  const expanded = new Uint8Array(targetDepth);

  for (let i = 0; i < targetDepth; i++) {
    const sourceIndex = (i / targetDepth) * samples.length;
    const index0 = Math.floor(sourceIndex);
    const index1 = Math.min(samples.length - 1, index0 + 1);
    const fraction = sourceIndex - index0;

    // Linear interpolation
    const value0 = samples[index0] || 0;
    const value1 = samples[index1] || 0;
    const interpolated = value0 * (1 - fraction) + value1 * fraction;

    // Raw 값 그대로 사용 (0-255 범위)
    expanded[i] = Math.min(255, Math.floor(interpolated));
  }

  return expanded;
}

/**
 * Create render packet from raw sonar samples
 * @param samples - Raw 90 samples
 * @param depthSamples - Target depth (144/360/720)
 */
export function createRenderPacket(
  samples: number[],
  depthSamples: number
): Uint8Array {
  if (!samples || samples.length === 0) {
    return new Uint8Array(depthSamples);
  }

  return expandSonarSamples(samples, depthSamples);
}
