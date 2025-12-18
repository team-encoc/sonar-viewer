/**
 * Color Mapping Utilities for Sonar Radar Display (Web Version)
 * Environmental-based color palette for raw signal range 0-255
 * Uses continuous gradient interpolation for smooth color transitions
 * With visual enhancements: depth gradient, fish highlighting, bottom emphasis
 */

/**
 * Maximum raw signal value from hardware
 * Updated from 80 to 255 to support new hardware capability
 */
export const MAX_RAW_SIGNAL = 255;

// ============================================================================
// KALMAN FILTER FOR BOTTOM TRACKING
// 바닥 깊이 추적을 위한 칼만 필터 - 바닥 구멍(dropout) 문제 해결
// ============================================================================

class BottomKalmanFilter {
  private x: number = -1; // 상태 (바닥 깊이 인덱스)
  private P: number = 1; // 추정 오차
  private Q: number = 0.00001; // 프로세스 노이즈 - 매우 낮춤 (바닥은 거의 안 변함)
  private R: number = 2.0; // 측정 노이즈 - 높임 (측정 불신, 부드러운 추적)
  private initialized: boolean = false;
  private stableCount: number = 0; // 안정화 카운터

  update(measurement: number, confidence: number): number {
    // 첫 번째 유효한 측정값으로 초기화
    if (!this.initialized && measurement > 0 && confidence > 0.3) {
      this.x = measurement;
      this.initialized = true;
      this.stableCount = 0;
      return this.x;
    }

    // 초기화 안됐으면 측정값 그대로 반환
    if (!this.initialized) {
      return measurement > 0 ? measurement : -1;
    }

    // 측정값이 없거나 신뢰도 낮으면 예측만 사용
    if (measurement <= 0 || confidence < 0.3) {
      // 예측 단계만 (측정 업데이트 없음)
      this.P += this.Q;
      return Math.round(this.x);
    }

    // 급격한 변화 감지 (바닥은 물리적으로 급변하지 않음)
    // 프레임당 최대 1 인덱스 변화 허용 (2→1로 더 엄격하게, 부드러운 추적)
    const maxPhysicalChange = 1;
    const diff = Math.abs(measurement - this.x);

    if (diff > maxPhysicalChange) {
      // 비정상적 변화 → 측정 오류로 간주, 예측값 사용
      // 단, 연속으로 같은 방향으로 변화하면 점진적으로 반영
      this.stableCount = 0;
      this.P += this.Q;
      return Math.round(this.x);
    }

    // 안정적인 측정이 반복되면 신뢰도 높임
    this.stableCount = Math.min(10, this.stableCount + 1);
    const stabilityBonus = this.stableCount / 10; // 0~1

    // 신뢰도에 따라 측정 노이즈 조정 (안정화될수록 측정 신뢰)
    const adjustedR = this.R / (confidence * (1 + stabilityBonus));

    // 예측 단계
    this.P += this.Q;

    // 업데이트 단계
    const K = this.P / (this.P + adjustedR); // 칼만 이득
    this.x += K * (measurement - this.x); // 상태 업데이트
    this.P *= 1 - K; // 오차 업데이트

    return Math.round(this.x);
  }

  reset(): void {
    this.x = -1;
    this.P = 1;
    this.initialized = false;
    this.stableCount = 0;
  }

  getState(): number {
    return this.initialized ? Math.round(this.x) : -1;
  }
}

// 전역 칼만 필터 인스턴스 (컬럼별로 관리)
const bottomKalmanFilters: Map<number, BottomKalmanFilter> = new Map();

/**
 * Get or create Kalman filter for a specific column
 */
function getBottomKalmanFilter(columnIndex: number): BottomKalmanFilter {
  if (!bottomKalmanFilters.has(columnIndex)) {
    bottomKalmanFilters.set(columnIndex, new BottomKalmanFilter());
  }
  return bottomKalmanFilters.get(columnIndex)!;
}

/**
 * Reset all Kalman filters (call when loading new file)
 */
export function resetBottomTracking(): void {
  bottomKalmanFilters.clear();
}

/**
 * Calculate confidence based on signal strength
 * 200+ = 높은 신뢰도, 100 이하 = 낮은 신뢰도
 */
function calculateBottomConfidence(signalStrength: number): number {
  if (signalStrength >= 200) return 1.0;
  if (signalStrength >= 150) return 0.8;
  if (signalStrength >= 100) return 0.5;
  if (signalStrength >= 50) return 0.2;
  return 0;
}

// ============================================================================
// TVG (Time Varied Gain) - 깊이에 따른 신호 감쇠 보정
// 음파는 거리가 멀어질수록 약해짐 (확산 손실 + 흡수 손실)
// ============================================================================

/**
 * 흡수 계수 (주파수 의존)
 * 675kHz: 약 0.15 dB/m (담수 기준)
 * 200kHz: 약 0.05 dB/m
 */
const ABSORPTION_COEFF = 0.15; // dB/m for 675kHz

/**
 * TVG 보정 적용
 * 깊이에 따른 신호 감쇠를 보상하여 같은 크기의 물고기가 같은 신호 강도를 갖게 함
 *
 * @param raw - 원본 신호 값 (0-255)
 * @param depthIndex - 깊이 인덱스 (0-89)
 * @param totalDepth - 전체 깊이 (미터, 기본 10m)
 * @returns TVG 보정된 신호 값
 */
function applyTVG(raw: number, depthIndex: number, totalDepth: number = 10): number {
  // 0으로 나누기 방지 및 표면 근처 처리
  if (depthIndex <= 0 || raw <= 0) return raw;

  // 깊이 인덱스를 실제 깊이(미터)로 변환
  const depth = (depthIndex / 90) * totalDepth;
  if (depth < 0.5) return raw; // 0.5m 미만은 보정 불필요

  // 확산 손실: 20 * log10(depth) dB
  // 실제로는 2-way path이므로 40 * log10(depth)이지만,
  // 소나 데이터는 이미 일부 보정되어 있을 수 있으므로 20으로 사용
  const spreadingLoss = 20 * Math.log10(depth);

  // 흡수 손실: absorption_coeff * depth dB
  const absorptionLoss = ABSORPTION_COEFF * depth;

  // 총 손실 (dB)
  const totalLoss = spreadingLoss + absorptionLoss;

  // dB를 선형 배율로 변환하여 보정
  // 10^(loss/20) = 보정 배율
  const compensation = Math.pow(10, totalLoss / 20);

  // 보정 적용 (최대값 제한)
  const compensated = raw * compensation;

  // 0-255 범위 유지, 하지만 내부 계산용으로는 더 큰 값 허용
  return Math.min(1000, compensated); // 내부 처리용 최대값
}

/**
 * 노이즈 플로어 계산
 * 바닥 위 물 컬럼에서 하위 20% 신호의 평균
 *
 * @param columnData - 컬럼의 모든 깊이 값 (TVG 보정 후)
 * @param bottomIndex - 바닥 시작 인덱스 (-1이면 전체 사용)
 * @returns 노이즈 플로어 값
 */
function calculateNoiseFloor(columnData: number[], bottomIndex: number): number {
  // 바닥 위 데이터만 사용
  const waterColumn = bottomIndex > 0 ? columnData.slice(0, bottomIndex) : columnData;

  if (waterColumn.length === 0) return 1; // 0으로 나누기 방지

  // 정렬하여 하위 20% 평균 계산
  const sorted = [...waterColumn].sort((a, b) => a - b);
  const lower20Count = Math.max(1, Math.floor(sorted.length * 0.2));
  const lower20 = sorted.slice(0, lower20Count);

  const noiseFloor = lower20.reduce((a, b) => a + b, 0) / lower20.length;

  // 최소값 보장 (0으로 나누기 방지)
  return Math.max(1, noiseFloor);
}

/**
 * SNR (Signal-to-Noise Ratio) 계산
 *
 * @param tvgSignal - TVG 보정된 신호 값
 * @param noiseFloor - 노이즈 플로어 값
 * @returns SNR 값 (1.0 = 노이즈 수준, 3.0+ = 강한 타겟)
 */
function calculateSNR(tvgSignal: number, noiseFloor: number): number {
  return tvgSignal / Math.max(1, noiseFloor);
}

// ============================================================================
// DEEPER STYLE COLOR MAPPING (Option A)
// SNR 기반 연속 그라데이션: 어두운 노랑 → 밝은 노랑 → 연두 → 밝은 녹색 → 흰색
// ============================================================================

/**
 * Deeper 스타일 어군 색상 매핑 (실제 Deeper 앱 기반)
 * SNR 값에 따라 연속적인 그라데이션 적용
 *
 * 디퍼 실제 색상 분석:
 * - 약한 신호: 어두운 올리브/노랑 (#808000 ~ #B8860B)
 * - 중간 신호: 밝은 노랑 (#FFD700 ~ #FFFF00)
 * - 강한 신호: 연두/녹색 (#ADFF2F ~ #00FF00)
 * - 매우 강한: 밝은 녹색/민트 (#00FF7F ~ #7FFFD4)
 *
 * @param snr - Signal-to-Noise Ratio 값
 * @returns ColorRGBA 색상 객체
 */
function getFishColorDeeper(snr: number): ColorRGBA {
  // SNR 3 미만: 투명 (노이즈)
  if (snr < 3.0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // SNR 3~5: 어두운 올리브/노랑 (약한 신호)
  if (snr < 5.0) {
    const t = (snr - 3.0) / 2.0;
    return {
      r: Math.floor(128 + t * 56), // 128 → 184 (올리브 → 다크골드)
      g: Math.floor(128 + t * 6), // 128 → 134
      b: 0,
      a: Math.floor(150 + t * 55), // 150 → 205
    };
  }

  // SNR 5~8: 다크골드 → 밝은 노랑 (중약 신호)
  if (snr < 8.0) {
    const t = (snr - 5.0) / 3.0;
    return {
      r: Math.floor(184 + t * 71), // 184 → 255
      g: Math.floor(134 + t * 81), // 134 → 215
      b: 0,
      a: 255,
    };
  }

  // SNR 8~12: 밝은 노랑 → 연두 (중간 신호)
  if (snr < 12.0) {
    const t = (snr - 8.0) / 4.0;
    return {
      r: Math.floor(255 - t * 82), // 255 → 173 (노랑 → 연두)
      g: Math.floor(215 + t * 40), // 215 → 255
      b: Math.floor(t * 47), // 0 → 47
      a: 255,
    };
  }

  // SNR 12~20: 연두 → 밝은 녹색 (강한 신호)
  if (snr < 20.0) {
    const t = (snr - 12.0) / 8.0;
    return {
      r: Math.floor(173 - t * 173), // 173 → 0
      g: 255,
      b: Math.floor(47 + t * 80), // 47 → 127
      a: 255,
    };
  }

  // SNR 20~35: 밝은 녹색 → 민트/청록 (매우 강한 신호)
  if (snr < 35.0) {
    const t = (snr - 20.0) / 15.0;
    return {
      r: Math.floor(t * 127), // 0 → 127
      g: 255,
      b: Math.floor(127 + t * 85), // 127 → 212
      a: 255,
    };
  }

  // SNR 35+: 민트 → 거의 흰색 (바닥 근처 극강 신호)
  const t = Math.min(1, (snr - 35.0) / 25.0);
  return {
    r: Math.floor(127 + t * 128), // 127 → 255
    g: 255,
    b: Math.floor(212 + t * 43), // 212 → 255
    a: 255,
  };
}

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
  const cleanHex = hex.replace("#", "");

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
 * Get color using continuous gradient interpolation for raw signal value (0-255 range)
 * With visual enhancements for depth gradient and fish highlighting
 *
 * @param raw - Raw signal value (0-255)
 * @param depthRatio - Depth ratio (0=surface, 1=bottom) for background gradient
 */
export function getColorForRawSignal(raw: number, _depthRatio: number = 0.5): ColorRGBA {
  // ====================================================================
  // STEP 1: Raw 값 클램핑 (0-255 범위)
  // ====================================================================
  const clampedRaw = Math.max(0, Math.min(MAX_RAW_SIGNAL, raw));

  // ====================================================================
  // STEP 2: 정규화 (0~255 → 0~1)
  // ====================================================================
  const norm = clampedRaw / MAX_RAW_SIGNAL;

  // ====================================================================
  // STEP 3: 연속형 그라데이션 컬러맵 적용
  // ====================================================================
  // 색상 기준점 정의 (Gradient Color Stops)
  // 기존 80 기준 threshold를 255 기준으로 유지 (비율 동일)
  // 0-12: Black
  // 16: Yellow
  // 17-60: Black
  // 64-67: Chartreuse (전환)
  // 70-77: Bright Green (수중 신호)
  // 80-86: Pale Green (약한 수중 신호)
  // 89-153: Peru (바닥 중간)
  // 156-204: Saddle Brown (바닥)
  // 207-255: Dark Brown (바닥 깊이)
  const colorStops = [
    { threshold: 0.0, color: hexToRgba("#000000") }, // raw 0: Black (완전 빈 공간)
    { threshold: 0.0125, color: hexToRgba("#000000") }, // raw ~3: Pure Black ⬛
    { threshold: 0.0625, color: hexToRgba("#001a33") }, // raw ~16: Deep Navy Blue 🔵
    { threshold: 0.125, color: hexToRgba("#FFFF00") }, // raw ~32: Bright Yellow 🟡
    { threshold: 0.1375, color: hexToRgba("#7FFF00") }, // raw ~35: Chartreuse 🟢
    // ======== 8가지 색상 구간 (raw 36~51, 정규화 0.141~0.20) ========
    { threshold: 0.141, color: hexToRgba("#FF0000") }, // raw 36: Red 🔴
    { threshold: 0.149, color: hexToRgba("#FF8C00") }, // raw 38: Dark Orange 🟠
    { threshold: 0.157, color: hexToRgba("#FFD700") }, // raw 40: Gold 🟡
    { threshold: 0.165, color: hexToRgba("#00FF00") }, // raw 42: Lime Green 🟢
    { threshold: 0.173, color: hexToRgba("#00FFFF") }, // raw 44: Cyan 🔵
    { threshold: 0.181, color: hexToRgba("#0080FF") }, // raw 46: Azure Blue 🔵
    { threshold: 0.189, color: hexToRgba("#8000FF") }, // raw 48: Purple 🟣
    { threshold: 0.197, color: hexToRgba("#FF00FF") }, // raw 50: Magenta 🩷
    // ======== 8가지 색상 구간 끝 ========
    { threshold: 0.2, color: hexToRgba("#FFFFFF") }, // raw ~51: Bright White ⬜
    { threshold: 0.3, color: hexToRgba("#E0FFE0") }, // raw ~77: Pale Green ⬜
    { threshold: 0.375, color: hexToRgba("#E0FFE0") }, // raw ~96: Pale Green ⬜
    { threshold: 0.3875, color: hexToRgba("#D2691E") }, // raw ~99: Chocolate Brown 🟫
    { threshold: 0.6, color: hexToRgba("#CD853F") }, // raw ~153: Peru 🟫
    { threshold: 0.8, color: hexToRgba("#8B4513") }, // raw ~204: Saddle Brown 🟫
    { threshold: 1.0, color: hexToRgba("#654321") }, // raw 255: Dark Brown 🟫
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
  return hexToRgba("#D4AF37", 255); // Gold color
}

/**
 * Get bottom area color with texture variation based on raw signal
 * Creates subtle color variations to avoid flat 2D illustration look
 *
 * @param raw - Raw signal value (0-255) at this pixel
 * @returns ColorRGBA with subtle texture variation
 */
export function getBottomTextureColor(raw: number): ColorRGBA {
  // 기본 바닥색 (갈색 계열)
  const baseColor = hexToRgba("#A8652E"); // Brown from color palette

  // raw 값을 0~1로 정규화
  const strength = Math.max(0, Math.min(1, raw / MAX_RAW_SIGNAL));

  // 신호 강도에 따라 색상 변화 적용
  // 강한 신호(strength 높음): 더 어둡고 붉게
  // 약한 신호(strength 낮음): 기본색 유지

  // 어두워지는 효과 (최대 15%)
  const darkenFactor = 1 - strength * 0.15;

  // 빨강 채널 강조 (최대 +20)
  const redBoost = strength * 20;

  return {
    r: Math.min(255, Math.round(baseColor.r * darkenFactor + redBoost)),
    g: Math.round(baseColor.g * darkenFactor),
    b: Math.round(baseColor.b * darkenFactor),
    a: 255,
  };
}

/**
 * Legacy function for compatibility with existing code
 * Converts amplified signal (0-256) to raw (0-255) and applies color mapping
 * @param signal - Amplified signal value (0-256)
 * @param depthRatio - Optional depth ratio for background gradient
 * @deprecated Use getColorForRawSignal with raw values instead
 */
export function signalToColor(signal: number, depthRatio: number = 0.5): ColorRGBA {
  // With MAX_RAW_SIGNAL=255, signal and raw are now equivalent (no gain conversion needed)
  // Clamp to MAX_RAW_SIGNAL for safety
  const raw = Math.min(signal, MAX_RAW_SIGNAL);
  return getColorForRawSignal(raw, depthRatio);
}

/**
 * ICE FISHING MODE - Inverted colors (bright background, strong signals = dark)
 * White/Light Gray → Gray → Blue → Brown/Red → Purple
 */
export function signalToColorIceFishing(signal: number): ColorRGBA {
  // CSV data range: 0-16 with FIXED_GAIN 12 = 0-192
  const BACKGROUND_THRESHOLD = 96; // 원본 8 * 12
  const MAX_SIGNAL = 192; // 원본 16 * 12

  // 0-7 range: Ice fishing background (white/light gray)
  if (signal < BACKGROUND_THRESHOLD) {
    return { r: 248, g: 248, b: 248, a: 255 };
  }

  // Remap 96-192 to 0-255 for full color spectrum
  const remappedSignal = ((signal - BACKGROUND_THRESHOLD) / (MAX_SIGNAL - BACKGROUND_THRESHOLD)) * 255;

  let r: number, g: number, b: number, a: number;

  if (remappedSignal < 15) {
    // 0-14: Water background - white/very light gray
    r = 248;
    g = 248;
    b = 248;
    a = 255;
  } else if (remappedSignal < 30) {
    // 15-29: Very light gray
    r = 232;
    g = 232;
    b = 232;
    a = 255;
  } else if (remappedSignal < 50) {
    // 30-49: Light gray
    r = 208;
    g = 208;
    b = 208;
    a = 255;
  } else if (remappedSignal < 80) {
    // 50-79: Medium gray
    r = 160;
    g = 160;
    b = 160;
    a = 255;
  } else if (remappedSignal < 110) {
    // 80-109: Light blue/purple (weak signal)
    r = 102;
    g = 102;
    b = 170;
    a = 255;
  } else if (remappedSignal < 140) {
    // 110-139: Blue (medium signal)
    r = 68;
    g = 68;
    b = 204;
    a = 255;
  } else if (remappedSignal < 170) {
    // 140-169: Dark blue (strong signal)
    r = 34;
    g = 34;
    b = 238;
    a = 255;
  } else if (remappedSignal < 200) {
    // 170-199: Brown/orange (very strong signal)
    r = 153;
    g = 102;
    b = 51;
    a = 255;
  } else if (remappedSignal < 230) {
    // 200-229: Soft red (max signal)
    r = 170;
    g = 51;
    b = 34;
    a = 255;
  } else if (remappedSignal < 250) {
    // 230-249: Dark purple (surface/bottom reflection)
    r = 119;
    g = 68;
    b = 119;
    a = 255;
  } else {
    // 250-255: Very dark purple (strongest reflection)
    r = 85;
    g = 51;
    b = 85;
    a = 255;
  }

  return { r, g, b, a };
}

/**
 * Depth-based averages (AGGREGATE data from 675khz_with_Lure.csv)
 * This lookup table contains the average signal value for each depth index (0-89)
 * Values are in raw 0-255 range from actual hardware data
 */
const T03_DEPTH_AVERAGES: number[] = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.13, 0.82, 1.77, 29.73, 29.15, 33.49, 37.21, 40.51,
  26.65, 3.1, 0.02, 0.02, 0.0, 0.03, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 2.09, 15.65, 22.78, 6.07, 4.35, 8.83, 115.36, 154.15, 174.72, 176.19, 212.57, 213.76, 209.98, 208.59, 15.23, 56.78,
  7.61, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.46, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
];

/**
 * T03 Average-based Color Mapping (Bottom-Relative Strategy)
 * Enhanced with Kalman Filter for bottom tracking and physics-based 2nd reflection removal
 *
 * Strategy:
 * 1. Find bottom start depth (first depth with sustained high signals)
 * 2. Apply Kalman filter to stabilize bottom depth (prevents dropout holes)
 * 3. Remove 2nd reflection using physics-based prediction (depth × 2)
 * 4. Calculate average ONLY from above-bottom region (depth 0 to bottom-1)
 * 5. Fish/Lure = signals higher than above-bottom average
 *
 * @param raw - Raw signal value (0-255)
 * @param depthIndex - Depth index (0-89)
 * @param allDepthValues - All raw values for current column (for calculating bottom & average)
 * @param rawRangeMin - Minimum raw value for 8-color mapping (default: 0)
 * @param rawRangeMax - Maximum raw value for 8-color mapping (default: 255)
 * @param columnIndex - Column index for Kalman filter tracking (default: 0)
 * @param sensitivity - Sensitivity setting 0-100 (default: 50). Higher = only strong signals shown
 */
export function signalToColorT03Average(raw: number, depthIndex: number, allDepthValues?: number[], rawRangeMin: number = 0, rawRangeMax: number = 255, columnIndex: number = 0, sensitivity: number = 50): ColorRGBA {
  // ====================================================================
  // STEP 1: BOTTOM DETECTION FIRST (before noise filtering)
  // 바닥 영역이면 raw 값이 0이어도 바닥 색상으로 처리해야 함
  // ====================================================================
  if (allDepthValues && allDepthValues.length > 0) {
    // ====================================================================
    // STEP 3.1: FIND BOTTOM START INDEX
    // Bottom = first depth index where sustained high signals begin
    // ====================================================================

    // Calculate percentiles for dynamic thresholding
    // IMPORTANT: Filter out MAX_RAW_SIGNAL (0xFF) as it's a special "out of range" marker, not real data
    const sortedValues = [...allDepthValues]
      .filter((v) => v >= 2.0 && v < MAX_RAW_SIGNAL) // Exclude MAX_RAW_SIGNAL (special value)
      .sort((a, b) => a - b);
    const validCount = sortedValues.length;

    // validCount가 0이어도 MAX_RAW_SIGNAL(255)이 있으면 바닥이 있을 수 있음
    // 255 값을 찾아서 바닥 처리
    if (validCount === 0) {
      // 255 값이 있는지 확인
      let has255 = false;
      let first255Index = -1;
      for (let i = 0; i < allDepthValues.length; i++) {
        if (allDepthValues[i] >= MAX_RAW_SIGNAL) {
          has255 = true;
          first255Index = i;
          break;
        }
      }

      if (has255 && depthIndex >= first255Index) {
        // 바닥 영역으로 처리
        return hexToRgba("#8B4513"); // Saddle Brown
      }
      // No valid signals, return transparent
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const p75 = sortedValues[Math.floor(validCount * 0.75)] || 32;
    const p90 = sortedValues[Math.floor(validCount * 0.9)] || 64;
    const p95 = sortedValues[Math.floor(validCount * 0.95)] || 128;
    const maxSignal = sortedValues[validCount - 1] || 254;

    // BOTTOM_THRESHOLD: Use 90th percentile or 75% of max
    // Adjusted to be less strict since we filtered out MAX_RAW_SIGNAL values
    // Note: This threshold is used for reference/debugging, detection uses STRONG_SIGNAL_THRESHOLD
    const _BOTTOM_THRESHOLD = Math.max(p90, maxSignal * 0.75);
    void _BOTTOM_THRESHOLD; // Suppress unused variable warning

    // ====================================================================
    // STEP 1.2: RAW BOTTOM DETECTION (before Kalman filter)
    // ====================================================================

    let rawBottomStartIndex = -1;
    let bottomPeakSignal = 0;
    let bottomEndIndex = -1;

    // Thresholds for bottom detection (based on actual 675kHz data analysis)
    // 어군 신호: 15-80 (일시적), 바닥 신호: 100+ (연속적)
    // 200+ 또는 255는 확실한 바닥
    const NEAR_MAX_THRESHOLD = 180; // 강한 바닥 신호 기준

    // ====================================================================
    // EDGE DETECTION HELPER: 급격한 신호 상승 지점 찾기
    // 바닥은 갑자기 신호가 올라가는 지점에서 시작됨
    // ====================================================================
    const findBottomEdge = (roughBottomIndex: number): number => {
      if (roughBottomIndex <= 0) return roughBottomIndex;

      // roughBottomIndex 근처에서 가장 급격한 상승 지점 찾기
      const searchStart = Math.max(0, roughBottomIndex - 5);
      const searchEnd = Math.min(allDepthValues.length - 1, roughBottomIndex + 2);

      let maxGradient = 0;
      let edgeIndex = roughBottomIndex;

      for (let i = searchStart; i < searchEnd; i++) {
        const gradient = allDepthValues[i + 1] - allDepthValues[i];
        if (gradient > maxGradient) {
          maxGradient = gradient;
          edgeIndex = i;
        }
      }

      // 기울기가 50 이상일 때만 에지로 인정 (더 급격한 상승만)
      // 그렇지 않으면 기존 roughBottomIndex 사용
      return maxGradient >= 50 ? edgeIndex : roughBottomIndex;
    };

    // ====================================================================
    // Strategy: Find bottom - 매우 관대한 감지 로직 (검은 빈공간 제거용)
    // ====================================================================

    // Step 1: 먼저 255 또는 200+ 값이 있는 첫 번째 위치 찾기
    let first255Index = -1;
    let firstHighIndex = -1;
    for (let i = 0; i < allDepthValues.length; i++) {
      const val = allDepthValues[i];
      if (val >= MAX_RAW_SIGNAL && first255Index === -1) {
        first255Index = i;
        bottomPeakSignal = MAX_RAW_SIGNAL;
      }
      if (val >= NEAR_MAX_THRESHOLD && firstHighIndex === -1) {
        firstHighIndex = i;
        if (bottomPeakSignal < val) bottomPeakSignal = val;
      }
      if (first255Index !== -1 && firstHighIndex !== -1) break;
    }

    // Step 2: 바닥 시작점 결정
    // 바닥은 연속적으로 강한 신호가 유지되어야 함 (어군 신호와 구분)
    // 어군: 일시적 강한 신호 (1-2개)
    // 바닥: 지속적 강한 신호 (3개 이상 연속 또는 200+ 값)
    for (let i = 0; i < allDepthValues.length - 2; i++) {
      const current = allDepthValues[i];
      const next = allDepthValues[i + 1];
      const next2 = allDepthValues[i + 2];

      // ------------------------------------------------------------------
      // Condition 0: MAX_RAW_SIGNAL(255) 값이 나오면 바로 바닥 시작
      // 255는 확실한 바닥 신호
      // ------------------------------------------------------------------
      if (current >= MAX_RAW_SIGNAL) {
        rawBottomStartIndex = findBottomEdge(i);
        bottomPeakSignal = current;
        break;
      }

      // ------------------------------------------------------------------
      // Condition 1: 200+ 값이 나오면 바닥 시작
      // 200 이상은 확실한 바닥
      // ------------------------------------------------------------------
      if (current >= NEAR_MAX_THRESHOLD) {
        rawBottomStartIndex = findBottomEdge(i);
        bottomPeakSignal = current;
        break;
      }

      // ------------------------------------------------------------------
      // Condition 2: 연속 3개 값이 100 이상이면 → 바닥 시작
      // 어군은 보통 1-2개 샘플에서만 강한 신호, 바닥은 연속적
      // 임계값을 80→100으로 올려서 어군과 구분
      // ------------------------------------------------------------------
      if (current >= 100 && next >= 100 && next2 >= 100) {
        rawBottomStartIndex = findBottomEdge(i);
        bottomPeakSignal = Math.max(current, next, next2);
        break;
      }

      // ------------------------------------------------------------------
      // Condition 3: 현재 100+ 이고 다음 3개 내에 180+ 있으면 → 바닥 시작
      // 바닥 직전 신호가 100 이상이고 곧 강한 바닥이 오는 경우
      // ------------------------------------------------------------------
      if (current >= 100) {
        let hasHighSignal = false;
        for (let j = 1; j <= 3 && i + j < allDepthValues.length; j++) {
          if (allDepthValues[i + j] >= NEAR_MAX_THRESHOLD) {
            hasHighSignal = true;
            bottomPeakSignal = Math.max(bottomPeakSignal, allDepthValues[i + j]);
            break;
          }
        }
        if (hasHighSignal) {
          rawBottomStartIndex = findBottomEdge(i);
          break;
        }
      }
    }

    // ------------------------------------------------------------------
    // Fallback: 아직 바닥을 못 찾았으면 255 또는 180+ 위치 사용
    // 에지 감지로 정확한 시작점 찾기
    // ------------------------------------------------------------------
    if (rawBottomStartIndex === -1 && first255Index !== -1) {
      rawBottomStartIndex = findBottomEdge(first255Index);
      bottomPeakSignal = MAX_RAW_SIGNAL;
    }
    if (rawBottomStartIndex === -1 && firstHighIndex !== -1) {
      rawBottomStartIndex = findBottomEdge(firstHighIndex);
      bottomPeakSignal = allDepthValues[firstHighIndex];
    }

    // ====================================================================
    // STEP 1.3: APPLY KALMAN FILTER FOR STABLE BOTTOM TRACKING
    // 칼만 필터로 바닥 깊이 안정화 - 구멍(dropout) 방지
    // ====================================================================
    const kalmanFilter = getBottomKalmanFilter(columnIndex);
    const confidence = calculateBottomConfidence(bottomPeakSignal);
    const stableBottomStartIndex = kalmanFilter.update(rawBottomStartIndex, confidence);

    // 최종 바닥 시작 인덱스 (칼만 필터 적용)
    const bottomStartIndex = stableBottomStartIndex;

    // If bottom found, determine bottom end index
    if (bottomStartIndex !== -1) {
      // Find where bottom region ends
      // Bottom ends when we see low values (< 10) for 3+ consecutive samples after the peak
      let peakIndex = bottomStartIndex;

      // First, find the peak (highest signal or first MAX_RAW_SIGNAL)
      for (let i = bottomStartIndex; i < Math.min(bottomStartIndex + 10, allDepthValues.length); i++) {
        if (allDepthValues[i] >= MAX_RAW_SIGNAL) {
          peakIndex = i;
          break;
        }
        if (allDepthValues[i] > allDepthValues[peakIndex]) {
          peakIndex = i;
        }
      }

      // Bottom region extends from bottomStartIndex to where signal drops back to noise level
      bottomEndIndex = peakIndex;
      for (let i = peakIndex + 1; i < allDepthValues.length - 2; i++) {
        const current = allDepthValues[i];
        const next1 = allDepthValues[i + 1];
        const next2 = allDepthValues[i + 2];

        // If we're still seeing high values (including MAX_RAW_SIGNAL), extend bottom
        if (current >= 80 || current >= MAX_RAW_SIGNAL) {
          bottomEndIndex = i;
        }

        // Bottom ends when 3 consecutive low values appear (< 40)
        if (current < 40 && next1 < 40 && next2 < 40) {
          break;
        }
      }
    }

    // ====================================================================
    // STEP 2: SIGNAL STRENGTH-BASED 2ND REFLECTION REMOVAL
    // 2차 반사는 1차 바닥 신호보다 약함 (30~60%)
    // 바닥 이후 영역에서 피크 신호 대비 약한 신호는 2차 반사로 판단
    // ====================================================================

    // 2차 반사 판단 기준:
    // 1. 바닥 이후 영역이어야 함 (depthIndex > bottomEndIndex)
    // 2. 바닥 피크 신호의 60% 이하 (2차 반사 특성)
    // 3. 너무 강한 신호(200+)는 실제 바닥일 수 있음
    const SECOND_REFLECTION_RATIO = 0.6; // 1차 바닥의 60% 이하면 2차 반사
    const secondReflectionThreshold = bottomPeakSignal * SECOND_REFLECTION_RATIO;

    const isSecondReflection =
      bottomStartIndex !== -1 &&
      bottomEndIndex !== -1 &&
      depthIndex > bottomEndIndex + 3 && // 바닥 끝 이후 (약간의 여유)
      raw > 30 && // 노이즈가 아님
      raw < secondReflectionThreshold && // 바닥 피크의 60% 이하
      raw < NEAR_MAX_THRESHOLD; // 200 미만 (200+는 실제 바닥)

    // 2차 반사 신호는 투명 처리 (제거)
    if (isSecondReflection) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    // ====================================================================
    // STEP 3: TVG + SNR BASED SIGNAL PROCESSING
    // 1. TVG 보정: 깊이에 따른 신호 감쇠 보상
    // 2. 노이즈 플로어 계산: 바닥 위 물 컬럼의 하위 20% 평균
    // 3. SNR 계산: TVG 보정 신호 / 노이즈 플로어
    // ====================================================================

    // 3.1: TVG 보정 적용 (모든 깊이 값에 대해)
    const tvgCorrectedValues = allDepthValues.map((val, idx) => {
      if (val >= MAX_RAW_SIGNAL) return val; // 255는 특수 값, 보정 안함
      return applyTVG(val, idx);
    });

    // 3.2: 노이즈 플로어 계산 (TVG 보정된 바닥 위 영역)
    const noiseFloor = calculateNoiseFloor(tvgCorrectedValues, bottomStartIndex);

    // 3.3: 현재 픽셀의 TVG 보정값과 SNR 계산
    const tvgSignal = applyTVG(raw, depthIndex);
    const snr = calculateSNR(tvgSignal, noiseFloor);

    // 기존 평균값도 계산 (디버깅용)
    let sum = 0;
    let count = 0;
    const upperLimit = bottomStartIndex !== -1 ? bottomStartIndex : allDepthValues.length;

    for (let i = 0; i < upperLimit; i++) {
      const value = allDepthValues[i];
      if (value < MAX_RAW_SIGNAL) {
        sum += value;
        count++;
      }
    }
    const aboveBottomAverage = count > 0 ? sum / count : p75;

    // DEBUG: Log values for first pixel only (to avoid spam)
    if (depthIndex === 0) {
      console.log("[T03Average Debug - TVG+SNR]", {
        rawBottomStartIndex,
        stableBottomStartIndex: bottomStartIndex,
        bottomEndIndex,
        bottomPeakSignal,
        secondReflectionThreshold,
        confidence,
        noiseFloor: noiseFloor.toFixed(2),
        sampleSNR: (tvgCorrectedValues[30] / noiseFloor).toFixed(2),
        aboveBottomAverage: aboveBottomAverage.toFixed(2),
        p95,
        maxSignal,
      });
    }

    // ====================================================================
    // STEP 4: BOTTOM AREA RENDERING
    // 바닥 영역은 칼만 필터로 안정화된 위치 사용
    // ====================================================================

    // Determine if current pixel is in bottom area
    // 바닥 시작 이후 모든 영역은 바닥으로 처리 (검은 빈공간 제거)
    const isBottomArea = bottomStartIndex !== -1 && depthIndex >= bottomStartIndex;

    // 추가 체크: 현재 위치에서 강한 신호(200+)가 있으면 바닥으로 처리
    const hasStrongSignalHere = raw >= NEAR_MAX_THRESHOLD || raw >= MAX_RAW_SIGNAL;
    const forceBottomArea = hasStrongSignalHere && bottomStartIndex === -1;

    // If we detected second reflection, we know where it starts, but we still render it as bottom
    // The detection is just for logging/debugging purposes

    if (isBottomArea || forceBottomArea) {
      // ✅ 바닥 영역: 갈색 그라데이션 적용
      // raw 값이 0이어도 바닥으로 인식되면 갈색으로 채움 (검은 빈 공간 방지)
      // 바닥은 민감도 필터링 제외 - 항상 표시

      // Normalize signal to 0.0 ~ 1.0 range (raw=0도 바닥 색상으로 처리)
      const normalizedSignal = Math.min(MAX_RAW_SIGNAL, Math.max(0, raw)) / MAX_RAW_SIGNAL;

      // 바닥 색상 그라데이션: 밝은 갈색 → 진한 갈색
      // raw 0-100: 밝은 갈색 (바닥 시작 또는 신호 약한 바닥)
      // raw 100-200: 중간 갈색 (일반 바닥)
      // raw 200-255: 진한 갈색 (강한 바닥 반사)
      const veryLightBrown = hexToRgba("#D2B48C"); // Tan (아주 밝은 갈색 - raw=0용)
      const lightBrown = hexToRgba("#CD853F"); // Peru (밝은 갈색)
      const mediumBrown = hexToRgba("#8B4513"); // Saddle Brown (중간 갈색)
      const darkBrown = hexToRgba("#5D3A1A"); // 진한 갈색

      if (normalizedSignal < 0.1) {
        // raw 0-25: 아주 밝은 갈색 (빈 공간도 바닥으로 채움)
        const t = normalizedSignal / 0.1;
        return lerpColor(veryLightBrown, lightBrown, t);
      } else if (normalizedSignal < 0.4) {
        // raw 25-100: 밝은 갈색 → 중간 갈색
        const t = (normalizedSignal - 0.1) / 0.3;
        return lerpColor(lightBrown, mediumBrown, t);
      } else if (normalizedSignal < 0.78) {
        // raw 100-200: 중간 갈색 유지
        const t = (normalizedSignal - 0.4) / 0.38;
        return lerpColor(mediumBrown, mediumBrown, t);
      } else {
        // raw 200-255: 중간 갈색 → 진한 갈색
        const t = (normalizedSignal - 0.78) / 0.22;
        return lerpColor(mediumBrown, darkBrown, t);
      }
    } else {
      // ====================================================================
      // ABOVE BOTTOM AREA: SNR-based fish detection (Deeper Style)
      // TVG 보정 + SNR 기반 연속 그라데이션
      // 어두운 노랑 → 밝은 노랑 → 연두 → 밝은 녹색 → 흰색
      // ====================================================================

      // ====================================================================
      // SENSITIVITY-BASED SNR FILTERING (UI 기준)
      // 실제 데이터 SNR 범위: 14~74
      // sensitivity 0   → threshold 70.0 (강한 신호만, 깔끔)
      // sensitivity 50  → threshold 40.0 (기본값, 균형)
      // sensitivity 100 → threshold 10.0 (약한 신호도 표시, 노이즈 많음)
      // ====================================================================
      const snrThreshold = 70.0 - (sensitivity / 100) * 60.0;

      // DEBUG: Log sample values (테이블 형식으로 보기 쉽게)
      if (depthIndex === 30 && columnIndex % 50 === 0) {
        console.log(`[민감도=${sensitivity}] SNR=${snr.toFixed(1)} (임계값=${snrThreshold.toFixed(1)}) raw=${raw} → ${snr >= snrThreshold ? '✅표시' : '❌숨김'}`);
      }

      // Noise filtering - 민감도 기준 이하는 노이즈로 처리
      if (raw < 0.5 || snr < snrThreshold) {
        return { r: 0, g: 0, b: 0, a: 0 }; // Fully transparent
      }

      // ====================================================================
      // SNR >= 3.0: Deeper 스타일 컬러 매핑
      // 범위 필터링 후 getFishColorDeeper 사용
      // ====================================================================

      // 범위 체크 (선택된 raw 범위 내에 있는 값만 표시)
      const isInSelectedRange = raw >= rawRangeMin && raw <= rawRangeMax;
      const isFullRange = rawRangeMin === 0 && rawRangeMax === 255;

      if (!isFullRange && !isInSelectedRange) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }

      // Deeper 스타일 색상 반환 (임계값 상향)
      // SNR 3~5: 어두운 노랑 (약한 신호)
      // SNR 5~10: 노랑 → 연두 (일반 어군)
      // SNR 10~20: 연두 → 밝은 녹색 (강한 어군)
      // SNR 20+: 밝은 녹색 → 흰색 (매우 강한 신호)
      return getFishColorDeeper(snr);
    }
  }

  // Fallback: Apply noise filtering first
  if (raw < 0.5) {
    return { r: 0, g: 0, b: 0, a: 0 }; // Fully transparent
  }
  if (raw < 2.0) {
    const alpha = Math.floor(((raw - 0.5) / 1.5) * 80);
    return { r: 7, g: 7, b: 7, a: alpha };
  }

  // Fallback: Use old depth-based average method
  const clampedDepth = Math.max(0, Math.min(89, Math.floor(depthIndex)));
  const average = T03_DEPTH_AVERAGES[clampedDepth];

  // IMPORTANT: Increased thresholds to prevent excessive yellow/green from noise
  // Original thresholds were too low causing all noise to appear yellow
  // New thresholds require much stronger signals to trigger fish/bottom colors
  // Thresholds scaled from 80 to 255 (3.1875x)

  if (raw > average + 96) {
    // Very high signal: Orange/Brown (bottom)
    // Only values significantly above average (96+) are considered bottom
    const excessRatio = Math.min(1, (raw - average - 96) / 96);
    const orange = hexToRgba("#FF8C00");
    const brown = hexToRgba("#8B4513");
    return lerpColor(orange, brown, excessRatio);
  } else if (raw > average + 64) {
    // High signal: Green/Yellow (fish)
    // Requires 64+ above average to be considered fish
    const excessRatio = Math.min(1, (raw - average - 64) / 32);
    const darkYellow = hexToRgba("#CCB800");
    const brightYellow = hexToRgba("#FFFF00");
    return lerpColor(darkYellow, brightYellow, excessRatio);
  } else if (raw > average + 32) {
    // Moderate signal: Semi-transparent yellow
    // 32-64 above average shows as faint yellow
    const alpha = Math.floor(((raw - average - 32) / 32) * 120);
    return { r: 20, g: 20, b: 0, a: alpha };
  } else if (raw > average + 16) {
    // Slightly above average: Very faint gray
    // 16-32 above average shows as barely visible
    const alpha = Math.floor(((raw - average - 16) / 16) * 60);
    return { r: 60, g: 60, b: 60, a: alpha };
  } else {
    // Below average + 16: Transparent (background)
    return { r: 0, g: 0, b: 0, a: 0 };
  }
}

/**
 * Convert ColorRGBA to CSS rgba string
 */
export function colorToRGBA(color: ColorRGBA): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}
