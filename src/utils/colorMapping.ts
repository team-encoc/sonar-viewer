/**
 * Color Mapping Utilities for Sonar Radar Display (Web Version)
 */

export interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Standard Mode - Transparent background, 8-color gradient
 */
export function signalToColor(signal: number): ColorRGBA {
  const BACKGROUND_THRESHOLD = 96;  // 원본 8 * 12
  const MAX_SIGNAL = 192;            // 원본 16 * 12

  // 0-7 range: Transparent background
  if (signal < BACKGROUND_THRESHOLD) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // 16+ range: Fixed dark brown
  if (signal >= MAX_SIGNAL) {
    return { r: 110, g: 40, b: 20, a: 255 };
  }

  // 8-16 range: 8-color gradient
  const STEP = 12;

  if (signal < BACKGROUND_THRESHOLD + STEP) {
    return { r: 204, g: 255, b: 0, a: 255 }; // Lime Yellow
  } else if (signal < BACKGROUND_THRESHOLD + STEP * 2) {
    return { r: 150, g: 205, b: 60, a: 255 }; // Yellow-Green
  } else if (signal < BACKGROUND_THRESHOLD + STEP * 3) {
    return { r: 100, g: 200, b: 70, a: 255 }; // Light Green
  } else if (signal < BACKGROUND_THRESHOLD + STEP * 4) {
    return { r: 75, g: 170, b: 50, a: 255 }; // Grass Green
  } else if (signal < BACKGROUND_THRESHOLD + STEP * 5) {
    return { r: 220, g: 140, b: 30, a: 255 }; // Orange
  } else if (signal < BACKGROUND_THRESHOLD + STEP * 6) {
    return { r: 200, g: 110, b: 20, a: 255 }; // Dark Orange
  } else if (signal < BACKGROUND_THRESHOLD + STEP * 7) {
    return { r: 170, g: 75, b: 30, a: 255 }; // Orange-Brown
  } else {
    return { r: 110, g: 40, b: 20, a: 255 }; // Dark Brown
  }
}

/**
 * Ice Fishing Mode - White background, blue/brown signals
 */
export function signalToColorIceFishing(signal: number): ColorRGBA {
  const BACKGROUND_THRESHOLD = 96;
  const MAX_SIGNAL = 192;

  if (signal < BACKGROUND_THRESHOLD) {
    return { r: 248, g: 248, b: 248, a: 255 }; // White/light gray
  }

  const remappedSignal = ((signal - BACKGROUND_THRESHOLD) / (MAX_SIGNAL - BACKGROUND_THRESHOLD)) * 255;

  if (remappedSignal < 15) {
    return { r: 248, g: 248, b: 248, a: 255 };
  } else if (remappedSignal < 30) {
    return { r: 232, g: 232, b: 232, a: 255 };
  } else if (remappedSignal < 50) {
    return { r: 208, g: 208, b: 208, a: 255 };
  } else if (remappedSignal < 80) {
    return { r: 160, g: 160, b: 160, a: 255 };
  } else if (remappedSignal < 110) {
    return { r: 102, g: 102, b: 170, a: 255 };
  } else if (remappedSignal < 140) {
    return { r: 68, g: 68, b: 204, a: 255 };
  } else if (remappedSignal < 170) {
    return { r: 34, g: 34, b: 238, a: 255 };
  } else if (remappedSignal < 200) {
    return { r: 153, g: 102, b: 51, a: 255 };
  } else if (remappedSignal < 230) {
    return { r: 170, g: 51, b: 34, a: 255 };
  } else if (remappedSignal < 250) {
    return { r: 119, g: 68, b: 119, a: 255 };
  } else {
    return { r: 85, g: 51, b: 85, a: 255 };
  }
}

/**
 * Convert ColorRGBA to CSS rgba string
 */
export function colorToRGBA(color: ColorRGBA): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}
