import { useRef, useEffect } from "react";
import { ParsedPacket } from "../utils/csvParser";
import { createRenderPacket } from "../utils/sonarDataConverter";
import { signalToColorIceFishing, signalToColorT03Average, getBottomHighlightColor } from "../utils/colorMapping";

interface RadarCanvasProps {
  currentPacket: ParsedPacket | null;
  packets: ParsedPacket[];
  currentIndex: number;
  resolutionMode: "144" | "360" | "720";
  colorMode: "iceFishing" | "t03Average";
  width?: number;
  height?: number;
}

export function RadarCanvas({ currentPacket, packets, currentIndex, resolutionMode, colorMode, width = 720, height = 500 }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRenderedIndexRef = useRef(-1);


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

  // Helper function to render a single column
  const renderColumn = (
    pixelData: Uint8ClampedArray,
    packet: ParsedPacket,
    xPosition: number,
    columnWidth: number,
    depthSamples: number
  ) => {
    const renderData = createRenderPacket(packet.scanData, depthSamples);
    const MAX_RENDER_PIXELS = 200;
    const downsample = Math.max(1, Math.floor(depthSamples / MAX_RENDER_PIXELS));

    // For T03Average mode: convert all depth values to raw for color mapping
    // IMPORTANT: Use ORIGINAL 90 samples, not expanded renderData
    let rawDepthValues: number[] | undefined;

    if (colorMode === "t03Average") {
      // Convert original 90 samples to raw values
      rawDepthValues = packet.scanData.map(sample => sample);
    }

    // ====================================================================
    // STEP 1: 바닥선(Bottom Line) 감지
    // ====================================================================
    // 바닥은 "마지막/가장 깊은" 지속적인 강한 신호 영역으로 감지
    // (중간에 떠있는 물체(루어)와 구분하기 위해)
    let bottomDepthIndex = -1; // 바닥이 감지된 depth 인덱스
    const BOTTOM_THRESHOLD_RAW = 65; // raw 값 기준 바닥 임계값
    const BOTTOM_CONTINUITY_COUNT = 10; // 바닥으로 인정하려면 최소 연속 10개 이상의 강한 신호 필요

    // 역방향 스캔: 깊은 곳에서 수면 방향으로 스캔
    for (let d = depthSamples - 1; d >= BOTTOM_CONTINUITY_COUNT; d--) {
      // 현재 위치부터 위쪽 10개 샘플을 확인
      let continuousCount = 0;
      for (let i = 0; i < BOTTOM_CONTINUITY_COUNT && (d - i) >= 0; i++) {
        const amplifiedSignal = renderData[d - i];
        const rawSignal = amplifiedSignal / 3.2;
        if (rawSignal >= BOTTOM_THRESHOLD_RAW) {
          continuousCount++;
        }
      }

      // 10개 중 9개 이상이 강한 신호면 바닥으로 간주 (더 엄격한 조건)
      // 이렇게 하면 루어(7개 샘플)는 검출되지 않고 바닥(13+ 샘플)만 검출됨
      if (continuousCount >= 9) {
        bottomDepthIndex = d - BOTTOM_CONTINUITY_COUNT + 1; // 연속 영역의 시작점
        break;
      }
    }

    // ====================================================================
    // STEP 2: 각 depth별로 색상 결정 및 렌더링
    // ====================================================================
    for (let d = 0; d < depthSamples; d += downsample) {
      let maxSignal = 0;
      for (let i = 0; i < downsample && d + i < depthSamples; i++) {
        maxSignal = Math.max(maxSignal, renderData[d + i]);
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
          // STEP 3: 색상 재계산 + 시각 강화
          // ====================================================================
          let finalColor;

          // VISUAL ENHANCEMENT 3: 바닥선 강조 (바닥 바로 위 1~2 픽셀)
          const isBottomHighlight = bottomDepthIndex !== -1 && d >= bottomDepthIndex - 2 && d < bottomDepthIndex;

          if (isBottomHighlight && colorMode !== "t03Average") {
            // 바닥선 바로 위 1~2 픽셀: 황금색 테두리로 바닥 강조 (t03Average 모드에서는 비활성화)
            finalColor = getBottomHighlightColor();
          } else {
            // 모든 영역: 정상 컬러맵 적용
            if (colorMode === "iceFishing") {
              finalColor = signalToColorIceFishing(signal);
            } else {
              // T03 Average 모드: signal을 raw로 변환하고 전체 깊이 값 배열 전달
              const raw = signal / 3.2;
              // Map screen depth index (d) to original 90-sample index
              const originalDepthIndex = Math.floor((d / depthSamples) * 90);
              // Pass all raw depth values for bottom detection and average calculation
              finalColor = signalToColorT03Average(raw, originalDepthIndex, rawDepthValues);
            }
          }

          // ====================================================================
          // STEP 4: 픽셀 데이터에 최종 색상 기록
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

    // Check if we need to redraw entire canvas (seek or reset)
    const isSeekOrReset = currentIndex <= lastRenderedIndexRef.current || lastRenderedIndexRef.current === -1 || currentIndex - lastRenderedIndexRef.current > 1;

    if (isSeekOrReset || packets.length === 0) {
      // Redraw entire canvas with history
      const imageData = ctx.createImageData(width, height);
      const pixelData = imageData.data;

      // Fill with background color (black for standard/t03Average, white for ice fishing)
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
          renderColumn(pixelData, packet, xPos, columnWidth, depthSamples);
        });
      }

      ctx.putImageData(imageData, 0, 0);
      lastRenderedIndexRef.current = currentIndex;
    } else if (currentPacket && currentIndex > lastRenderedIndexRef.current) {
      // Sequential playback - shift and add new column
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixelData = imageData.data;

      // Shift pixels left
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width - columnWidth; x++) {
          const srcIndex = (y * width + x + columnWidth) * 4;
          const dstIndex = (y * width + x) * 4;
          pixelData[dstIndex] = pixelData[srcIndex];
          pixelData[dstIndex + 1] = pixelData[srcIndex + 1];
          pixelData[dstIndex + 2] = pixelData[srcIndex + 2];
          pixelData[dstIndex + 3] = pixelData[srcIndex + 3];
        }
      }

      // Render new column on the right
      renderColumn(pixelData, currentPacket, width - columnWidth, columnWidth, depthSamples);

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
