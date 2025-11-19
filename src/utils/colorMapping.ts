/**
 * Color Mapping Utilities for Sonar Radar Display (Web Version)
 * Environmental-based color palette for raw signal range 0-80
 * Uses continuous gradient interpolation for smooth color transitions
 * With visual enhancements: depth gradient, fish highlighting, bottom emphasis
 */

export interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Convert hex color string to RGBA object
 * @param hex - Hex color string (e.g., "#020814" or "020814")
 * @param alpha - Alpha value (0-255), default 255
 */
function hexToRgba(hex: string, alpha: number = 255): ColorRGBA {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return { r, g, b, a: alpha };
}

/**
 * Linear interpolation between two colors
 * @param color1 - Start color
 * @param color2 - End color
 * @param t - Interpolation factor (0-1)
 */
function lerpColor(color1: ColorRGBA, color2: ColorRGBA, t: number): ColorRGBA {
  const clampedT = Math.max(0, Math.min(1, t));

  return {
    r: Math.round(color1.r + (color2.r - color1.r) * clampedT),
    g: Math.round(color1.g + (color2.g - color1.g) * clampedT),
    b: Math.round(color1.b + (color2.b - color1.b) * clampedT),
    a: Math.round(color1.a + (color2.a - color1.a) * clampedT),
  };
}

/**
 * Get color using continuous gradient interpolation for raw signal value (0-80 range)
 * With visual enhancements for depth gradient and fish highlighting
 *
 * @param raw - Raw signal value (0-80)
 * @param depthRatio - Depth ratio (0=surface, 1=bottom) for background gradient
 */
export function getColorForRawSignal(raw: number, _depthRatio: number = 0.5): ColorRGBA {
  // ====================================================================
  // STEP 1: Raw 값 클램핑 (0-80 범위)
  // ====================================================================
  const clampedRaw = Math.max(0, Math.min(80, raw));

  // ====================================================================
  // STEP 2: 정규화 (0~80 → 0~1)
  // ====================================================================
  const norm = clampedRaw / 80;

  // ====================================================================
  // STEP 3: 연속형 그라데이션 컬러맵 적용
  // ====================================================================
  // 색상 기준점 정의 (Gradient Color Stops)
  // 0-4: Black
  // 5: Yellow
  // 6-19: Black
  // 20-21: Chartreuse (전환)
  // 22-24: Bright Green (수중 신호)
  // 25-27: Pale Green (약한 수중 신호)
  // 28-48: Peru (바닥 중간)
  // 49-64: Saddle Brown (바닥)
  // 65-80: Dark Brown (바닥 깊이)
  const colorStops = [
    { threshold: 0.000, color: hexToRgba('#000000') },   // raw 0: Black ⬛
    { threshold: 0.0125, color: hexToRgba('#000000') },  // raw 1: Black ⬛
    { threshold: 0.025, color: hexToRgba('#000000') },   // raw 2: Black ⬛
    { threshold: 0.0375, color: hexToRgba('#000000') },  // raw 3: Black ⬛
    { threshold: 0.05, color: hexToRgba('#000000') },    // raw 4: Black ⬛
    { threshold: 0.0625, color: hexToRgba('#FFFF00') },  // raw 5: Yellow 🟡
    { threshold: 0.075, color: hexToRgba('#000000') },   // raw 6: Black ⬛
    { threshold: 0.0875, color: hexToRgba('#000000') },  // raw 7: Black ⬛
    { threshold: 0.1, color: hexToRgba('#000000') },     // raw 8: Black ⬛
    { threshold: 0.1125, color: hexToRgba('#000000') },  // raw 9: Black ⬛
    { threshold: 0.125, color: hexToRgba('#000000') },   // raw 10: Black ⬛
    { threshold: 0.1375, color: hexToRgba('#000000') },  // raw 11: Black ⬛
    { threshold: 0.15, color: hexToRgba('#000000') },    // raw 12: Black ⬛
    { threshold: 0.1625, color: hexToRgba('#000000') },  // raw 13: Black ⬛
    { threshold: 0.175, color: hexToRgba('#000000') },   // raw 14: Black ⬛
    { threshold: 0.1875, color: hexToRgba('#000000') },  // raw 15: Black ⬛
    { threshold: 0.2, color: hexToRgba('#000000') },     // raw 16: Black ⬛
    { threshold: 0.2125, color: hexToRgba('#000000') },  // raw 17: Black ⬛
    { threshold: 0.225, color: hexToRgba('#000000') },   // raw 18: Black ⬛
    { threshold: 0.2375, color: hexToRgba('#000000') },  // raw 19: Black ⬛
    { threshold: 0.25, color: hexToRgba('#7FFF00') },    // raw 20: Chartreuse (시작) 🟢
    { threshold: 0.2625, color: hexToRgba('#7FFF00') },  // raw 21: Chartreuse (끝) 🟢
    { threshold: 0.275, color: hexToRgba('#00FF00') },   // raw 22: Bright Green (시작) 🟢
    { threshold: 0.300, color: hexToRgba('#00FF00') },   // raw 24: Bright Green (끝) 🟢
    { threshold: 0.3125, color: hexToRgba('#E0FFE0') },  // raw 25: Pale Green (시작) ⬜
    { threshold: 0.3375, color: hexToRgba('#E0FFE0') },  // raw 27: Pale Green (끝) ⬜
    { threshold: 0.350, color: hexToRgba('#CD853F') },   // raw 28: Peru (시작) 🟫
    { threshold: 0.600, color: hexToRgba('#CD853F') },   // raw 48: Peru (끝) 🟫
    { threshold: 0.6125, color: hexToRgba('#8B4513') },  // raw 49: Saddle Brown (시작) 🟫
    { threshold: 0.800, color: hexToRgba('#8B4513') },   // raw 64: Saddle Brown (끝) 🟫
    { threshold: 0.8125, color: hexToRgba('#654321') },  // raw 65: Dark Brown (시작) 🟫
    { threshold: 1.000, color: hexToRgba('#654321') },   // raw 80: Dark Brown (끝) 🟫
  ];

  // ====================================================================
  // STEP 4: norm 값에 해당하는 구간 찾기 및 보간
  // ====================================================================
  let baseColor: ColorRGBA;

  for (let i = 0; i < colorStops.length - 1; i++) {
    const currentStop = colorStops[i];
    const nextStop = colorStops[i + 1];

    if (norm >= currentStop.threshold && norm <= nextStop.threshold) {
      const rangeSize = nextStop.threshold - currentStop.threshold;
      const t = rangeSize > 0 ? (norm - currentStop.threshold) / rangeSize : 0;
      baseColor = lerpColor(currentStop.color, nextStop.color, t);

      return baseColor;
    }
  }

  // Fallback
  return colorStops[colorStops.length - 1].color;
}

/**
 * Get bottom highlight color (for bottom line emphasis)
 * Returns a brighter color to emphasize the bottom boundary
 */
export function getBottomHighlightColor(): ColorRGBA {
  // 바닥선 강조: 밝은 갈색/황금색 테두리 효과
  return hexToRgba('#D4AF37', 255); // Gold color
}

/**
 * Get bottom area color with texture variation based on raw signal
 * Creates subtle color variations to avoid flat 2D illustration look
 *
 * @param raw - Raw signal value (0-80) at this pixel
 * @returns ColorRGBA with subtle texture variation
 */
export function getBottomTextureColor(raw: number): ColorRGBA {
  // 기본 바닥색 (갈색 계열)
  const baseColor = hexToRgba('#A8652E'); // Brown from color palette

  // raw 값을 0~1로 정규화
  const strength = Math.max(0, Math.min(1, raw / 80));

  // 신호 강도에 따라 색상 변화 적용
  // 강한 신호(strength 높음): 더 어둡고 붉게
  // 약한 신호(strength 낮음): 기본색 유지

  // 어두워지는 효과 (최대 15%)
  const darkenFactor = 1 - (strength * 0.15);

  // 빨강 채널 강조 (최대 +20)
  const redBoost = strength * 20;

  return {
    r: Math.min(255, Math.round(baseColor.r * darkenFactor + redBoost)),
    g: Math.round(baseColor.g * darkenFactor),
    b: Math.round(baseColor.b * darkenFactor),
    a: 255
  };
}

/**
 * Legacy function for compatibility with existing code
 * Converts amplified signal (0-256) to raw (0-80) and applies color mapping
 * @param signal - Amplified signal value (0-256)
 * @param depthRatio - Optional depth ratio for background gradient
 * @deprecated Use getColorForRawSignal with raw values instead
 */
export function signalToColor(signal: number, depthRatio: number = 0.5): ColorRGBA {
  // Convert amplified signal back to raw (reverse 3.2x gain)
  const raw = signal / 3.2;
  return getColorForRawSignal(raw, depthRatio);
}

/**
 * Ice Fishing Mode v2
 * - 대부분의 물/노이즈는 흰색
 * - 바닥/강한 에코만 오렌지→빨강→보라로 표시
 */
export function signalToColorIceFishing(signal: number): ColorRGBA {
  const MAX_SIGNAL = 256;

  // 1) 배경 threshold를 과감하게 높여서,
  //    웬만한 수중 노이즈는 전부 "물(흰색)"로 처리
  const BACKGROUND_THRESHOLD = 80; // ← 기존 26/30보다 훨씬 높게

  // 거의 신호 없는 영역 = 물
  if (signal < BACKGROUND_THRESHOLD) {
    return { r: 255, g: 255, b: 255, a: 255 }; // pure white
  }

  // 2) 80~256 범위만 0~255로 다시 매핑
  const remapped = ((signal - BACKGROUND_THRESHOLD) / (MAX_SIGNAL - BACKGROUND_THRESHOLD)) * 255;

  const c = (r: number, g: number, b: number): ColorRGBA => ({
    r,
    g,
    b,
    a: 255,
  });

  // 3) 색 구간
  if (remapped < 40) {
    // 바닥 윗부분/약한 물체
    return c(255, 245, 220);      // 아주 연한 노랑빛
  } else if (remapped < 90) {
    return c(255, 225, 170);      // 연한 오렌지
  } else if (remapped < 140) {
    return c(255, 200, 120);      // 오렌지
  } else if (remapped < 190) {
    return c(245, 150, 80);       // 진한 오렌지
  } else if (remapped < 230) {
    return c(235, 90, 50);        // 빨강/오렌지
  } else if (remapped < 250) {
    return c(170, 90, 170);       // 보라
  } else {
    return c(110, 60, 150);       // 진한 보라 (최강)
  }
}

/**
 * T03 Depth-based averages (AGGREGATE data from T03.md)
 * This lookup table contains the average signal value for each depth index (0-89)
 */
const T03_DEPTH_AVERAGES: number[] = [
  0.00, 0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.01, 0.01, 0.02,
  0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
  4.19, 1.34, 1.34, 2.27, 1.58, 2.34, 2.51, 2.12, 2.10, 1.85,
  2.71, 3.91, 7.02, 6.34, 7.58, 7.19, 6.76, 7.28, 7.15, 7.40,
  11.27, 18.57, 32.69, 69.91, 79.74, 73.76, 67.83, 56.64, 52.94, 56.55,
  57.64, 53.87, 54.94, 59.16, 58.84, 57.80, 60.30, 55.26, 54.47, 54.21,
  34.84, 54.47, 38.19, 53.92, 31.84, 32.10, 37.69, 33.84, 35.56, 49.53,
  31.31, 50.12, 49.46, 56.80, 44.31, 79.45, 79.92, 79.52, 77.69, 75.80,
  68.05, 65.13, 62.41, 58.63, 59.17, 66.68, 66.44, 69.30, 68.06, 0.02
];

/**
 * T03 Average-based Color Mapping (Bottom-Relative Strategy)
 *
 * Strategy:
 * 1. Find bottom start depth (first depth with sustained high signals)
 * 2. Calculate average ONLY from above-bottom region (depth 0 to bottom-1)
 * 3. Fish/Lure = signals higher than above-bottom average
 *
 * Color mapping:
 * - Noise (< 0.5): Transparent
 * - Very weak (0.5-2.0): Semi-transparent dark
 * - Bottom area (high signals at/below bottom depth): Orange → Brown gradient
 * - Above average (fish/lure): Bright Green → Yellow gradient
 * - Below average: Dark/semi-transparent
 *
 * @param raw - Raw signal value (0-80)
 * @param depthIndex - Depth index (0-89)
 * @param allDepthValues - All raw values for current column (for calculating bottom & average)
 */
export function signalToColorT03Average(
  raw: number,
  depthIndex: number,
  allDepthValues?: number[]
): ColorRGBA {
  // Step 1: Special value filtering - 80 is "out of range" marker
  if (raw >= 79.5) {
    return { r: 0, g: 0, b: 0, a: 0 }; // Fully transparent (invalid data)
  }

  // Step 2: Noise filtering - values below 0.5 are transparent
  if (raw < 0.5) {
    return { r: 0, g: 0, b: 0, a: 0 }; // Fully transparent
  }

  // Step 3: Very weak signals (0.5 ~ 2.0) - semi-transparent dark
  if (raw < 2.0) {
    const alpha = Math.floor(((raw - 0.5) / 1.5) * 80); // 0-80 alpha
    return { r: 20, g: 20, b: 20, a: alpha };
  }

  // Step 3: If we have depth values, use bottom-relative strategy
  if (allDepthValues && allDepthValues.length > 0) {
    // ====================================================================
    // STEP 3.1: FIND BOTTOM START INDEX
    // Bottom = first depth index where sustained high signals begin
    // ====================================================================

    // Calculate percentiles for dynamic thresholding
    // IMPORTANT: Filter out 80 (0x50) as it's a special "out of range" marker, not real data
    const sortedValues = [...allDepthValues]
      .filter(v => v >= 2.0 && v < 80)  // Exclude 80 (special value)
      .sort((a, b) => a - b);
    const validCount = sortedValues.length;

    if (validCount === 0) {
      // No valid signals, return transparent
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const p75 = sortedValues[Math.floor(validCount * 0.75)] || 10;
    const p90 = sortedValues[Math.floor(validCount * 0.90)] || 20;
    const p95 = sortedValues[Math.floor(validCount * 0.95)] || 40;
    const maxSignal = sortedValues[validCount - 1] || 79;

    // BOTTOM_THRESHOLD: Use 90th percentile or 75% of max
    // Adjusted to be less strict since we filtered out 80 values
    const BOTTOM_THRESHOLD = Math.max(p90, maxSignal * 0.75);

    // Find where bottom starts: look for sudden signal jump OR appearance of 80 values
    // Strategy: Bottom zone is indicated by:
    //   1. Appearance of 80 (0x50) values - these mark the sonar range limit
    //   2. Look backwards from first 80 to find where strong signal started
    //   3. OR sustained high signal above threshold (if no 80 values)
    let bottomStartIndex = -1;

    // First, check if there are any 80 values
    let first80Index = -1;
    for (let i = 0; i < allDepthValues.length; i++) {
      if (allDepthValues[i] >= 80) {
        first80Index = i;
        break;
      }
    }

    if (first80Index !== -1) {
      // Found 80 values - look backwards to find where strong signal started
      // The bottom typically starts 1-3 samples before the first 80
      bottomStartIndex = first80Index;

      // Look backwards for the start of the strong signal
      for (let i = first80Index - 1; i >= Math.max(0, first80Index - 5); i--) {
        const val = allDepthValues[i];
        // If we find a value significantly above average water column noise (>20), use that
        if (val > 20 && val < 80) {
          bottomStartIndex = i;
          break;
        }
      }
    } else {
      // No 80 values found, look for sustained high signal (original logic)
      for (let i = 0; i < allDepthValues.length - 2; i++) {
        const current = allDepthValues[i];
        const next1 = allDepthValues[i + 1];
        const next2 = allDepthValues[i + 2];

        // Skip if any value is 80
        if (current >= 80 || next1 >= 80 || next2 >= 80) {
          continue;
        }

        // Check if current and next 2 samples are all above threshold
        if (current > BOTTOM_THRESHOLD && next1 > BOTTOM_THRESHOLD && next2 > BOTTOM_THRESHOLD) {
          bottomStartIndex = i;
          break;
        }
      }
    }

    // ====================================================================
    // STEP 3.2: CALCULATE AVERAGE FROM ABOVE-BOTTOM REGION ONLY
    // Only use depth indices BEFORE bottom (0 to bottomStartIndex-1)
    // Include ALL values including 0 (noise) for accurate average
    // ====================================================================
    let sum = 0;
    let count = 0;

    // If bottom found, calculate average from 0 to bottomStartIndex-1
    // If no bottom, use all values
    const upperLimit = bottomStartIndex !== -1 ? bottomStartIndex : allDepthValues.length;

    for (let i = 0; i < upperLimit; i++) {
      const value = allDepthValues[i];
      // Include ALL values (even 0) for accurate average calculation
      // BUT exclude 80 (special "out of range" marker)
      if (value < 80) {
        sum += value;
        count++;
      }
    }

    // Above-bottom average: average of ALL signals from depth 0 to bottom-1
    // This includes noise (0 values), representing true water column average
    const aboveBottomAverage = count > 0 ? sum / count : p75;

    // DEBUG: Log values for first pixel only (to avoid spam)
    if (depthIndex === 0) {
      console.log('[T03Average Debug]', {
        first80Index,
        bottomStartIndex,
        BOTTOM_THRESHOLD,
        aboveBottomAverage,
        minFishThreshold: Math.max(aboveBottomAverage * 2, 5),
        p95,
        maxSignal,
        sampleValues: allDepthValues.slice(0, 50) // First 50 depths
      });
    }

    // Determine if current pixel is in bottom area
    // Must satisfy BOTH conditions:
    // 1. Depth is at or below bottom start (depthIndex >= bottomStartIndex)
    // 2. Signal strength above threshold (raw > BOTTOM_THRESHOLD) - optional for texture
    const isBottomArea = bottomStartIndex !== -1 && depthIndex >= bottomStartIndex;

    if (isBottomArea) {
      // BOTTOM AREA: Bright red/orange boundary line + brown gradient
      // Based on real sonar display (capture screenshot)

      const bottomDepthOffset = depthIndex - (bottomStartIndex || 0);

      // CRITICAL: First line of bottom (bottomStartIndex) = BRIGHT RED/ORANGE boundary
      if (bottomDepthOffset === 0) {
        // Bright red-orange boundary line (like in the screenshot)
        return hexToRgba('#FF4500'); // OrangeRed - very visible boundary
      }

      // Rest of bottom: Brown gradient based on depth
      // Texture variation using depth offset
      const textureDepthIndex = bottomStartIndex > 0
        ? Math.min(bottomStartIndex - 1, Math.abs(bottomDepthOffset % bottomStartIndex))
        : 0;

      const textureValue = textureDepthIndex < allDepthValues.length
        ? allDepthValues[textureDepthIndex]
        : raw;

      // Subtle noise for texture
      const noisePattern = Math.sin(depthIndex * 0.3 + raw * 0.5) * 0.12;
      const noiseFactor = 1 + noisePattern;

      // Calculate depth ratio (how deep into bottom area)
      const maxBottomDepth = allDepthValues.length - bottomStartIndex;
      const depthRatio = maxBottomDepth > 0 ? bottomDepthOffset / maxBottomDepth : 0;

      // Apply texture influence
      const textureInfluence = textureValue / Math.max(maxSignal, 1) * 0.2;
      const finalRatio = Math.max(0, Math.min(1, (depthRatio + textureInfluence) * noiseFactor));

      // Brown gradient (like in screenshot)
      if (finalRatio < 0.25) {
        // Just below boundary: Dark Orange to Sandy Brown
        const darkOrange = hexToRgba('#FF8C00');
        const sandyBrown = hexToRgba('#CD853F');
        return lerpColor(darkOrange, sandyBrown, finalRatio / 0.25);
      } else if (finalRatio < 0.5) {
        // Middle bottom: Sandy Brown to Chocolate
        const sandyBrown = hexToRgba('#CD853F');
        const chocolate = hexToRgba('#D2691E');
        return lerpColor(sandyBrown, chocolate, (finalRatio - 0.25) / 0.25);
      } else if (finalRatio < 0.75) {
        // Lower bottom: Chocolate to Saddle Brown
        const chocolate = hexToRgba('#D2691E');
        const saddleBrown = hexToRgba('#8B4513');
        return lerpColor(chocolate, saddleBrown, (finalRatio - 0.5) / 0.25);
      } else {
        // Deep bottom: Saddle Brown to Dark Brown
        const saddleBrown = hexToRgba('#8B4513');
        const darkBrown = hexToRgba('#654321');
        return lerpColor(saddleBrown, darkBrown, (finalRatio - 0.75) / 0.25);
      }
    } else {
      // ABOVE BOTTOM AREA: Check if signal is higher than average
      const difference = raw - aboveBottomAverage;

      // Fish/Lure detection: Signal must be significantly higher than average
      // Minimum threshold: at least 2x average or raw > 5
      const minFishThreshold = Math.max(aboveBottomAverage * 2, 5);

      if (raw > minFishThreshold) {
        // FISH/LURE: Signal significantly HIGHER than average
        // Dark yellow tones for weak/moderate, bright green for strong
        const excessRatio = Math.min(1, (raw - minFishThreshold) / Math.max(minFishThreshold, 10));

        const darkYellow1 = hexToRgba('#CCB800');   // Dark Yellow (weak fish)
        const darkYellow2 = hexToRgba('#E6D200');   // Brighter Dark Yellow (moderate fish)
        const brightGreen = hexToRgba('#00FF00');   // Bright Green (strong fish)

        if (excessRatio > 0.5) {
          // Very strong fish: Dark Yellow 2 to Bright Green
          const t = (excessRatio - 0.5) / 0.5;
          return lerpColor(darkYellow2, brightGreen, t);
        } else {
          // Moderate fish: Dark Yellow 1 to Dark Yellow 2
          const t = excessRatio / 0.5;
          return lerpColor(darkYellow1, darkYellow2, t);
        }
      } else if (difference > 0) {
        // Slightly above average but not fish: bright semi-transparent yellow
        const alpha = Math.min(200, Math.floor((raw / minFishThreshold) * 150));
        return { r: 255, g: 255, b: 0, a: alpha }; // Brighter yellow
      } else {
        // BELOW AVERAGE: Background/weak signals
        const deficitRatio = Math.abs(difference) / aboveBottomAverage;

        if (deficitRatio < 0.3) {
          // Slightly below average: Dark gray/semi-transparent
          const alpha = Math.floor((1 - deficitRatio / 0.3) * 100);
          return { r: 60, g: 60, b: 60, a: alpha };
        } else {
          // Well below average: Very transparent (background)
          const alpha = Math.max(20, 60 - Math.floor(deficitRatio * 50));
          return { r: 30, g: 30, b: 30, a: alpha };
        }
      }
    }
  }

  // Fallback: Use old depth-based average method
  const clampedDepth = Math.max(0, Math.min(89, Math.floor(depthIndex)));
  const average = T03_DEPTH_AVERAGES[clampedDepth];

  if (raw > average + 10) {
    // High signal: Orange/Brown (bottom)
    const excessRatio = Math.min(1, (raw - average - 10) / 30);
    const orange = hexToRgba('#FF8C00');
    const brown = hexToRgba('#8B4513');
    return lerpColor(orange, brown, excessRatio);
  } else {
    // Near average: Green gradient
    const deviation = Math.abs(raw - average);
    const alpha = Math.max(100, 255 - deviation * 20);
    return { r: 50, g: 200, b: 50, a: alpha };
  }
}

/**
 * Convert ColorRGBA to CSS rgba string
 */
export function colorToRGBA(color: ColorRGBA): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}
