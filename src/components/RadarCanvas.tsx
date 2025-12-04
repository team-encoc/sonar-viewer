import { useRef, useEffect } from "react";
import { ParsedPacket } from "../utils/csvParser";
import { createRenderPacket } from "../utils/sonarDataConverter";
import { signalToColorIceFishing, signalToColorT03Average } from "../utils/colorMapping";

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

  // Depth samples mapping (6x for higher vertical resolution)
  const depthSamplesMap = {
    "144": 144,
    "360": 360,
    "720": 720,
  };

  // Helper function to render a single column
  const renderColumn = (pixelData: Uint8ClampedArray, packet: ParsedPacket, xPosition: number, columnWidth: number, depthSamples: number) => {
    const renderData = createRenderPacket(packet.scanData, depthSamples);
    const MAX_RENDER_PIXELS = height; // Use full canvas height for maximum detail

    // Skip first 24 raw samples (0-23) and only show raw samples 24-88
    // Calculate START_DEPTH based on raw sample index: raw_index * (depthSamples / 90)
    const START_DEPTH = Math.floor(1 * (depthSamples / 90));
    const effectiveDepthSamples = depthSamples - START_DEPTH;
    const downsample = Math.max(1, Math.floor(effectiveDepthSamples / MAX_RENDER_PIXELS));

    // For T03Average mode: convert all depth values to raw for color mapping
    // IMPORTANT: Use ORIGINAL 90 samples, not expanded renderData
    let rawDepthValues: number[] | undefined;

    if (colorMode === "t03Average") {
      // Convert original 90 samples to raw values
      rawDepthValues = packet.scanData.map(sample => sample);
    }

    // ====================================================================
    // Render each depth with pure data colors (START_DEPTH부터 시작)
    // ====================================================================
    for (let d = START_DEPTH; d < depthSamples; d += downsample) {
      let maxSignal = 0;
      for (let i = 0; i < downsample && d + i < depthSamples; i++) {
        maxSignal = Math.max(maxSignal, renderData[d + i]);
      }

      const signal = Math.max(0, Math.min(255, maxSignal));

      // Map the visible depth range (START_DEPTH to depthSamples) to canvas height (0 to height)
      const y = Math.floor(((d - START_DEPTH) / effectiveDepthSamples) * height);
      const pixelHeight = Math.ceil((downsample / effectiveDepthSamples) * height);

      for (let px = 0; px < columnWidth; px++) {
        for (let py = 0; py < pixelHeight; py++) {
          const drawY = y + py;
          if (drawY >= height) break;

          const x = xPosition + px;
          if (x < 0 || x >= width) continue;

          // Apply color mapping based on color mode
          let finalColor;
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

          // Write final color to pixel data
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
