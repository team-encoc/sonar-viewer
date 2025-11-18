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
  // STEP 1: 감도 조절 (0.6배로 낮춤)
  // ====================================================================
  let adjusted = raw * 0.6;
  if (adjusted > 80) {
    adjusted = 80;
  }

  // ====================================================================
  // STEP 2: 정규화 (0~80 → 0~1)
  // ====================================================================
  const norm = Math.max(0, Math.min(1, adjusted / 80));

  // ====================================================================
  // STEP 3: 연속형 그라데이션 컬러맵 적용
  // ====================================================================
  // 색상 기준점 정의 (Gradient Color Stops)
  const colorStops = [
    { threshold: 0.00, color: hexToRgba('#020814') }, // Deep Navy (water)
    { threshold: 0.20, color: hexToRgba('#061B3A') }, // Dark Navy Blue
    { threshold: 0.35, color: hexToRgba('#0B3745') }, // Teal (turbid water)
    { threshold: 0.50, color: hexToRgba('#2F7D3C') }, // Green (vegetation)
    { threshold: 0.65, color: hexToRgba('#FFD700') }, // Bright Gold (fish - 더 눈에 띄게)
    { threshold: 0.80, color: hexToRgba('#FFA500') }, // Bright Orange (strong signal - 채도 높임)
    { threshold: 0.90, color: hexToRgba('#A8652E') }, // Brown (bottom)
    { threshold: 1.00, color: hexToRgba('#E53935') }, // Red (hard bottom)
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

      // ====================================================================
      // VISUAL ENHANCEMENT 1: 물고기 구간 채도 강조 (norm 0.50~0.80)
      // ====================================================================
      if (norm >= 0.50 && norm <= 0.80) {
        // 물고기 구간: 채도를 20% 증가시켜 더 눈에 띄게 만듦
        const saturationBoost = 1.2;
        baseColor.r = Math.min(255, Math.round(baseColor.r * saturationBoost));
        baseColor.g = Math.min(255, Math.round(baseColor.g * saturationBoost));
      }

      // ====================================================================
      // VISUAL ENHANCEMENT 2: 배경(물) 영역 깊이별 그라데이션 (norm 0~0.20)
      // ====================================================================
      if (norm <= 0.20) {
        // 배경색에 깊이에 따른 밝기 조절
        // 수면(depthRatio=0): +30% 밝게
        // 깊은 곳(depthRatio=1): 원래 색 유지
        const depthBrightness = 1.0 + (1.0 - depthRatio) * 0.3;
        baseColor.r = Math.min(255, Math.round(baseColor.r * depthBrightness));
        baseColor.g = Math.min(255, Math.round(baseColor.g * depthBrightness));
        baseColor.b = Math.min(255, Math.round(baseColor.b * depthBrightness));
      }

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
