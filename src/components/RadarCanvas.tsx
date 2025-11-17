import { useRef, useEffect } from 'react';
import { ParsedPacket } from '../utils/csvParser';
import { createRenderPacket } from '../utils/sonarDataConverter';
import { signalToColor, signalToColorIceFishing } from '../utils/colorMapping';

interface RadarCanvasProps {
  currentPacket: ParsedPacket | null;
  resolutionMode: '144' | '360' | '720';
  colorMode: 'standard' | 'iceFishing';
  width?: number;
  height?: number;
}

export function RadarCanvas({
  currentPacket,
  resolutionMode,
  colorMode,
  width = 720,
  height = 500
}: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const currentXRef = useRef(0);

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

  // Initialize canvas and image data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create image data buffer
    imageDataRef.current = ctx.createImageData(width, height);

    // Fill with black background
    const data = imageDataRef.current.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 255; // A
    }
    ctx.putImageData(imageDataRef.current, 0, 0);
    currentXRef.current = 0;
  }, [width, height, resolutionMode]);

  // Render new packet
  useEffect(() => {
    if (!currentPacket || !canvasRef.current || !imageDataRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const columnWidth = columnWidthMap[resolutionMode];
    const depthSamples = depthSamplesMap[resolutionMode];

    // Convert packet to render data
    const renderData = createRenderPacket(currentPacket.scanData, depthSamples);

    // Shift existing image left by columnWidth pixels
    const imageData = imageDataRef.current;
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

    // Draw new column on the right
    const MAX_RENDER_PIXELS = 200;
    const downsample = Math.max(1, Math.floor(depthSamples / MAX_RENDER_PIXELS));

    for (let d = 0; d < depthSamples; d += downsample) {
      // Get max signal in downsample range
      let maxSignal = 0;
      for (let i = 0; i < downsample && d + i < depthSamples; i++) {
        maxSignal = Math.max(maxSignal, renderData[d + i]);
      }

      // Apply time-based effects for realism
      const time = performance.now() / 1000;
      const depthRatio = d / depthSamples;

      // Bottom texture
      if (depthRatio > 0.8) {
        const pattern1 = Math.sin(d * 0.6 + time * 0.06) * 8;
        const pattern2 = Math.sin(d * 1.8 + time * 0.12) * 5;
        const pattern3 = Math.sin(d * 0.2 + time * 0.03) * 3;
        maxSignal += pattern1 + pattern2 + pattern3;
      }

      // Wave effects for strong signals
      if (maxSignal > 180) {
        const waveEffect = Math.sin(d * 0.8 + time * 4) * 6;
        maxSignal += waveEffect;
      }

      // Thermocline effect
      if (maxSignal < 96) {
        const thermocline = Math.abs(Math.sin(depthRatio * 0.2 + time * 0.1)) * 3;
        maxSignal += thermocline;
      }

      const signal = Math.max(0, Math.min(255, maxSignal));
      const color = colorMode === 'iceFishing'
        ? signalToColorIceFishing(signal)
        : signalToColor(signal);

      // Calculate Y position
      const y = Math.floor((d / depthSamples) * height);
      const pixelHeight = Math.ceil((downsample / depthSamples) * height * 1.2);

      // Draw column (right side of canvas)
      for (let px = 0; px < columnWidth; px++) {
        for (let py = 0; py < pixelHeight; py++) {
          const drawY = y + py;
          if (drawY >= height) break;

          const x = width - columnWidth + px;
          const index = (drawY * width + x) * 4;

          pixelData[index] = color.r;
          pixelData[index + 1] = color.g;
          pixelData[index + 2] = color.b;
          pixelData[index + 3] = color.a;
        }
      }
    }

    // Update canvas
    ctx.putImageData(imageData, 0, 0);

  }, [currentPacket, resolutionMode, colorMode, width, height]);

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
