import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 800;

// WebView 환경 감지
const isReactNativeWebView = () => {
  return typeof window !== "undefined" && window.ReactNativeWebView !== undefined;
};

export const useScale = () => {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : DESIGN_WIDTH,
    height: typeof window !== "undefined" ? window.innerHeight : DESIGN_HEIGHT,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scaleData = useMemo(() => {
    const { width: screenWidth, height: screenHeight } = dimensions;

    // WebView 환경에서는 viewport meta tag가 처리하므로 scale = 1 사용
    if (isReactNativeWebView()) {
      return {
        scale: 1,
        screenWidth,
        screenHeight,
        designWidth: DESIGN_WIDTH,
        designHeight: DESIGN_HEIGHT,
      };
    }

    const safeScreenWidth = screenWidth > 0 ? screenWidth : DESIGN_WIDTH;
    const safeScreenHeight = screenHeight > 0 ? screenHeight : DESIGN_HEIGHT;

    // 가로모드 감지
    const isLandscape = safeScreenWidth > safeScreenHeight;

    // 가로모드일 때는 디자인 기준을 회전 (360x800 → 800x360)
    const scaleX = isLandscape
      ? safeScreenWidth / DESIGN_HEIGHT // 가로모드: width를 800 기준으로
      : safeScreenWidth / DESIGN_WIDTH; // 세로모드: width를 360 기준으로

    const scaleY = isLandscape
      ? safeScreenHeight / DESIGN_WIDTH // 가로모드: height를 360 기준으로
      : safeScreenHeight / DESIGN_HEIGHT; // 세로모드: height를 800 기준으로

    // 가로모드든 세로모드든 동일하게 Math.min 사용
    // 최소 스케일은 1로 보장 (디자인 크기보다 작아지지 않도록)
    const scale = Math.max(Math.min(scaleX, scaleY), 1);

    return {
      scale,
      screenWidth: safeScreenWidth,
      screenHeight: safeScreenHeight,
      designWidth: DESIGN_WIDTH,
      designHeight: DESIGN_HEIGHT,
    };
  }, [dimensions]);

  // useRef를 사용하여 최신 scale 값을 저장
  // 이렇게 하면 scaleSize 함수가 재생성되지 않음
  const scaleRef = useRef(scaleData.scale);
  scaleRef.current = scaleData.scale;

  // scaleSize 함수를 완전히 안정적으로 만듦 (dependency 없음)
  const scaleSize = useCallback((size: number) => {
    if (typeof size !== "number" || isNaN(size)) {
      return 0;
    }
    return size * scaleRef.current;
  }, []); // dependency 없음 - 절대 재생성되지 않음

  return {
    ...scaleData,
    scaleSize,
  };
};
