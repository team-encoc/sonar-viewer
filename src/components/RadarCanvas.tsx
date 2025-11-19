import { useRef, useEffect } from "react";
import { ParsedPacket } from "../utils/csvParser";
import { createRenderPacket } from "../utils/sonarDataConverter";
import { signalToColor, signalToColorIceFishing, getBottomHighlightColor, getBottomTextureColor } from "../utils/colorMapping";

interface RadarCanvasProps {
  currentPacket: ParsedPacket | null;
  packets: ParsedPacket[];
  currentIndex: number;
  resolutionMode: "144" | "360" | "720";
  colorMode: "standard" | "iceFishing";
  width?: number;
  height?: number;
}

export function RadarCanvas({ currentPacket, packets, currentIndex, resolutionMode, colorMode, width = 720, height = 500 }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRenderedIndexRef = useRef(-1);

  // ====================================================================
  // Temporal Smoothing 버퍼: 이전 프레임의 intensity 값 저장
  // ====================================================================
  // previousIntensityBuffer: 각 (x, y) 위치의 이전 프레임 신호 강도 (0-255)
  // 크기: width * height 배열
  const previousIntensityBufferRef = useRef<Uint8Array | null>(null);

  // Column width mapping
  const columnWidthMap = {
    "144": 4,
    "360": 2,
    "720": 1,
  };

  // Depth samples mapping
  const depthSamplesMap = {
    "144": 144,
    "360": 360,
    "720": 720,
  };

  // ====================================================================
  // Temporal Smoothing 초기화: 버퍼가 없으면 생성
  // ====================================================================
  if (!previousIntensityBufferRef.current) {
    previousIntensityBufferRef.current = new Uint8Array(width * height);
    // 초기값 0으로 채움
    previousIntensityBufferRef.current.fill(0);
  }

  // Helper function to render a single column
  const renderColumn = (
    pixelData: Uint8ClampedArray,
    packet: ParsedPacket,
    xPosition: number,
    columnWidth: number,
    depthSamples: number,
    previousIntensityBuffer: Uint8Array
  ) => {
    const renderData = createRenderPacket(packet.scanData, depthSamples);
    const MAX_RENDER_PIXELS = 200;
    const downsample = Math.max(1, Math.floor(depthSamples / MAX_RENDER_PIXELS));

    // ====================================================================
    // STEP 0: 노이즈 제거 및 신호 정리 (바닥선 감지 전 전처리)
    // ====================================================================
    const WEAK_SIGNAL_THRESHOLD = 5;        // raw < 5는 완전히 제거 (노이즈)
    const MID_SIGNAL_THRESHOLD = 12;        // raw < 12는 약한 수초/잔신호로 감쇠
    const MID_SIGNAL_ATTENUATION = 0.35;    // 약한 신호 감쇠 비율 (35%로 낮춤)
    const SURFACE_NOISE_THRESHOLD = 8;      // 수면 근처에서 raw < 8은 노이즈
    const SURFACE_DEPTH_PIXELS = 3;         // 상단 0~3번 인덱스를 수면 영역으로 간주

    // 노이즈 필터링된 데이터 배열 생성
    const cleanedData = new Uint8Array(depthSamples);

    for (let d = 0; d < depthSamples; d++) {
      const amplifiedSignal = renderData[d];
      let rawSignal = amplifiedSignal / 3.2; // gain 역계산 (0-80 range)

      // 1) 전체 수심: raw < 5는 완전히 제거 (의미 없는 노이즈)
      if (rawSignal < WEAK_SIGNAL_THRESHOLD) {
        rawSignal = 0;
      }
      // 2) raw 5~12: 약한 수초/잔신호로 유지 (35% 감쇠하여 중간층 질감 살림)
      else if (rawSignal < MID_SIGNAL_THRESHOLD) {
        rawSignal = rawSignal * MID_SIGNAL_ATTENUATION;
      }

      // 3) 수면 근처(상단 0~3 픽셀): raw < 8도 노이즈로 간주 → 0으로 클리핑
      if (d < SURFACE_DEPTH_PIXELS && rawSignal < SURFACE_NOISE_THRESHOLD) {
        rawSignal = 0;
      }

      // 정리된 raw 값을 다시 amplified signal로 변환하여 저장
      cleanedData[d] = Math.round(rawSignal * 3.2);
    }

    // ====================================================================
    // STEP 1: 바닥선(Bottom Line) 감지 (정리된 데이터로 수행)
    // ====================================================================
    let bottomDepthIndex = -1; // 바닥이 감지된 depth 인덱스
    const BOTTOM_THRESHOLD_RAW = 65; // raw 값 기준 바닥 임계값

    for (let d = 0; d < depthSamples; d++) {
      const amplifiedSignal = cleanedData[d]; // 정리된 데이터 사용
      const rawSignal = amplifiedSignal / 3.2; // gain 역계산

      if (rawSignal >= BOTTOM_THRESHOLD_RAW) {
        bottomDepthIndex = d;
        break; // 첫 번째 강한 신호를 바닥으로 간주
      }
    }

    // ====================================================================
    // STEP 2: 각 depth별로 색상 결정 및 렌더링 (정리된 데이터 사용)
    // ====================================================================
    // Temporal Smoothing 계수 (중간층 신호가 살아나도록 현재 프레임 비중 증가)
    const SMOOTHING_FACTOR_PREV = 0.7;  // 이전 프레임 가중치 (0.7 = 70%)
    const SMOOTHING_FACTOR_CURR = 0.3;  // 현재 프레임 가중치 (0.3 = 30%)

    for (let d = 0; d < depthSamples; d += downsample) {
      let maxSignal = 0;
      for (let i = 0; i < downsample && d + i < depthSamples; i++) {
        maxSignal = Math.max(maxSignal, cleanedData[d + i]); // 정리된 데이터 사용
      }

      const time = performance.now() / 1000;
      const depthRatio = d / depthSamples;

      if (depthRatio > 0.8) {
        const pattern1 = Math.sin(d * 0.6 + time * 0.06) * 8;
        const pattern2 = Math.sin(d * 1.8 + time * 0.12) * 5;
        const pattern3 = Math.sin(d * 0.2 + time * 0.03) * 3;
        maxSignal += pattern1 + pattern2 + pattern3;
      }

      if (maxSignal > 180) {
        const waveEffect = Math.sin(d * 0.8 + time * 4) * 6;
        maxSignal += waveEffect;
      }

      if (maxSignal < 96) {
        const thermocline = Math.abs(Math.sin(depthRatio * 0.2 + time * 0.1)) * 3;
        maxSignal += thermocline;
      }

      const signal = Math.max(0, Math.min(255, maxSignal));

      const y = Math.floor((d / depthSamples) * height);
      const pixelHeight = Math.ceil((downsample / depthSamples) * height * 1.2);

      for (let px = 0; px < columnWidth; px++) {
        for (let py = 0; py < pixelHeight; py++) {
          const drawY = y + py;
          if (drawY >= height) break;

          const x = xPosition + px;
          if (x < 0 || x >= width) continue;

          // ====================================================================
          // STEP 4: Temporal Smoothing 적용
          // ====================================================================
          const bufferIndex = drawY * width + x; // 1D 배열 인덱스
          const previousIntensity = previousIntensityBuffer[bufferIndex]; // 이전 프레임 값 (0-255)
          const currentIntensity = signal; // 현재 프레임 값 (0-255)

          // Temporal Smoothing 공식: filtered = prev * 0.7 + current * 0.3
          const filteredIntensity = Math.round(
            previousIntensity * SMOOTHING_FACTOR_PREV + currentIntensity * SMOOTHING_FACTOR_CURR
          );

          // 필터링된 intensity를 버퍼에 저장 (다음 프레임을 위해)
          previousIntensityBuffer[bufferIndex] = filteredIntensity;

          // ====================================================================
          // STEP 5: 필터링된 intensity로 색상 재계산 + 시각 강화
          // ====================================================================
          let finalColor;

          // VISUAL ENHANCEMENT 3: 바닥선 강조 (바닥 바로 위 1~2 픽셀)
          const isBottomHighlight = bottomDepthIndex !== -1 && d >= bottomDepthIndex - 2 && d < bottomDepthIndex;

          if (bottomDepthIndex !== -1 && d >= bottomDepthIndex) {
            // 바닥 아래: raw 값 기반 질감 색상 적용 (2D 일러스트처럼 평면적으로 보이지 않게)
            const rawSignal = cleanedData[d] / 3.2; // amplified signal을 raw로 역변환
            finalColor = getBottomTextureColor(rawSignal);
          } else if (isBottomHighlight) {
            // 바닥선 바로 위 1~2 픽셀: 황금색 테두리로 바닥 강조
            finalColor = getBottomHighlightColor();
          } else {
            // 바닥 위: 정상 컬러맵 적용 (depthRatio 전달)
            finalColor = colorMode === "iceFishing"
              ? signalToColorIceFishing(filteredIntensity)
              : signalToColor(filteredIntensity, depthRatio);
          }

          // ====================================================================
          // STEP 6: 픽셀 데이터에 최종 색상 기록
          // ====================================================================
          const index = (drawY * width + x) * 4;
          pixelData[index] = finalColor.r;
          pixelData[index + 1] = finalColor.g;
          pixelData[index + 2] = finalColor.b;
          pixelData[index + 3] = finalColor.a;
        }
      }
    }
  };

  // Main render effect - handles both sequential and seek scenarios
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const columnWidth = columnWidthMap[resolutionMode];
    const depthSamples = depthSamplesMap[resolutionMode];
    const numColumns = Math.floor(width / columnWidth);

    // Temporal smoothing 버퍼 가져오기
    const previousIntensityBuffer = previousIntensityBufferRef.current!;

    // Check if we need to redraw entire canvas (seek or reset)
    const isSeekOrReset = currentIndex <= lastRenderedIndexRef.current || lastRenderedIndexRef.current === -1 || currentIndex - lastRenderedIndexRef.current > 1;

    if (isSeekOrReset || packets.length === 0) {
      // Seek/Reset 시: 버퍼 초기화
      previousIntensityBuffer.fill(0);

      // Redraw entire canvas with history
      const imageData = ctx.createImageData(width, height);
      const pixelData = imageData.data;

      // Fill with background color (black for standard, white for ice fishing)
      const bgColor = colorMode === "iceFishing" ? 255 : 0;
      for (let i = 0; i < pixelData.length; i += 4) {
        pixelData[i] = bgColor;
        pixelData[i + 1] = bgColor;
        pixelData[i + 2] = bgColor;
        pixelData[i + 3] = 255;
      }

      if (packets.length > 0 && currentIndex >= 0) {
        // Calculate how many packets to show (fill the canvas)
        const startIndex = Math.max(0, currentIndex - numColumns + 1);
        const packetsToRender = packets.slice(startIndex, currentIndex + 1);

        // Render each packet as a column
        packetsToRender.forEach((packet, i) => {
          const xPos = width - (packetsToRender.length - i) * columnWidth;
          renderColumn(pixelData, packet, xPos, columnWidth, depthSamples, previousIntensityBuffer);
        });
      }

      ctx.putImageData(imageData, 0, 0);
      lastRenderedIndexRef.current = currentIndex;
    } else if (currentPacket && currentIndex > lastRenderedIndexRef.current) {
      // Sequential playback - shift and add new column
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixelData = imageData.data;

      // ====================================================================
      // Temporal Smoothing: 버퍼도 함께 shift
      // ====================================================================
      // Shift pixels left (화면)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width - columnWidth; x++) {
          const srcIndex = (y * width + x + columnWidth) * 4;
          const dstIndex = (y * width + x) * 4;
          pixelData[dstIndex] = pixelData[srcIndex];
          pixelData[dstIndex + 1] = pixelData[srcIndex + 1];
          pixelData[dstIndex + 2] = pixelData[srcIndex + 2];
          pixelData[dstIndex + 3] = pixelData[srcIndex + 3];

          // Shift intensity buffer left (버퍼)
          const srcBufferIdx = y * width + x + columnWidth;
          const dstBufferIdx = y * width + x;
          previousIntensityBuffer[dstBufferIdx] = previousIntensityBuffer[srcBufferIdx];
        }
      }

      // 새 컬럼 영역의 버퍼 초기화 (오른쪽 끝)
      for (let y = 0; y < height; y++) {
        for (let x = width - columnWidth; x < width; x++) {
          const bufferIdx = y * width + x;
          previousIntensityBuffer[bufferIdx] = 0;
        }
      }

      // Render new column on the right
      renderColumn(pixelData, currentPacket, width - columnWidth, columnWidth, depthSamples, previousIntensityBuffer);

      ctx.putImageData(imageData, 0, 0);
      lastRenderedIndexRef.current = currentIndex;
    }
  }, [currentPacket, currentIndex, packets, resolutionMode, colorMode, width, height]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          backgroundColor: colorMode === "iceFishing" ? "#fff" : "#000",
          border: "1px solid #333",
          borderRadius: "8px",
        }}
      />
      {currentPacket && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            color: colorMode === "iceFishing" ? "#000" : "#fff",
            backgroundColor: colorMode === "iceFishing" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          <div>Depth: {currentPacket.depth.toFixed(1)}m</div>
          <div>Temp: {currentPacket.temperature.toFixed(1)}°C</div>
          <div>
            Mode: {resolutionMode} ({columnWidthMap[resolutionMode]}px)
          </div>
        </div>
      )}
    </div>
  );
}
