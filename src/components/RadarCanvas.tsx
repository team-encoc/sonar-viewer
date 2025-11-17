import { useRef, useEffect } from 'react';
import { ParsedPacket } from '../utils/csvParser';
import { createRenderPacket } from '../utils/sonarDataConverter';
import { signalToColor, signalToColorIceFishing } from '../utils/colorMapping';

interface RadarCanvasProps {
  currentPacket: ParsedPacket | null;
  packets: ParsedPacket[];
  currentIndex: number;
  resolutionMode: '144' | '360' | '720';
  colorMode: 'standard' | 'iceFishing';
  width?: number;
  height?: number;
}

export function RadarCanvas({
  currentPacket,
  packets,
  currentIndex,
  resolutionMode,
  colorMode,
  width = 720,
  height = 500
}: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRenderedIndexRef = useRef(-1);

  // Column width mapping
  const columnWidthMap = {
    '144': 8,
    '360': 4,
    '720': 2
  };

  // Depth samples mapping
  const depthSamplesMap = {
    '144': 144,
    '360': 360,
    '720': 720
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
      const color = colorMode === 'iceFishing'
        ? signalToColorIceFishing(signal)
        : signalToColor(signal);

      const y = Math.floor((d / depthSamples) * height);
      const pixelHeight = Math.ceil((downsample / depthSamples) * height * 1.2);

      for (let px = 0; px < columnWidth; px++) {
        for (let py = 0; py < pixelHeight; py++) {
          const drawY = y + py;
          if (drawY >= height) break;

          const x = xPosition + px;
          if (x < 0 || x >= width) continue;

          const index = (drawY * width + x) * 4;
          pixelData[index] = color.r;
          pixelData[index + 1] = color.g;
          pixelData[index + 2] = color.b;
          pixelData[index + 3] = color.a;
        }
      }
    }
  };

  // Main render effect - handles both sequential and seek scenarios
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const columnWidth = columnWidthMap[resolutionMode];
    const depthSamples = depthSamplesMap[resolutionMode];
    const numColumns = Math.floor(width / columnWidth);

    // Check if we need to redraw entire canvas (seek or reset)
    const isSeekOrReset = currentIndex <= lastRenderedIndexRef.current ||
                          lastRenderedIndexRef.current === -1 ||
                          currentIndex - lastRenderedIndexRef.current > 1;

    if (isSeekOrReset || packets.length === 0) {
      // Redraw entire canvas with history
      const imageData = ctx.createImageData(width, height);
      const pixelData = imageData.data;

      // Fill with black background
      for (let i = 0; i < pixelData.length; i += 4) {
        pixelData[i] = 0;
        pixelData[i + 1] = 0;
        pixelData[i + 2] = 0;
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
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          backgroundColor: '#000',
          border: '1px solid #333',
          borderRadius: '8px'
        }}
      />
      {currentPacket && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: '#fff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div>Depth: {currentPacket.depth.toFixed(1)}m</div>
          <div>Temp: {currentPacket.temperature.toFixed(1)}°C</div>
          <div>Mode: {resolutionMode} ({columnWidthMap[resolutionMode]}px)</div>
        </div>
      )}
    </div>
  );
}
