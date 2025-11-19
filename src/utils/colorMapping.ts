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
export function getColorForRawSignal(raw: number, depthRatio: number = 0.5): ColorRGBA {
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
 * Convert ColorRGBA to CSS rgba string
 */
export function colorToRGBA(color: ColorRGBA): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}
