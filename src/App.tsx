import { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { RadarCanvas } from './components/RadarCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { useRadarPlayer } from './hooks/useRadarPlayer';
import { ParsedPacket } from './utils/csvParser';

type ResolutionMode = '144' | '360' | '720';
type ColorMode = 'iceFishing' | 't03Average';

// Raw 값 범위 옵션 (16개 구간, 각 구간 16 단위)
const RAW_RANGE_OPTIONS = [
  { label: '전체 (0-255)', value: 'all', min: 0, max: 255 },
  { label: '0-15', value: '0-15', min: 0, max: 15 },
  { label: '16-31', value: '16-31', min: 16, max: 31 },
  { label: '32-47', value: '32-47', min: 32, max: 47 },
  { label: '48-63', value: '48-63', min: 48, max: 63 },
  { label: '64-79', value: '64-79', min: 64, max: 79 },
  { label: '80-95', value: '80-95', min: 80, max: 95 },
  { label: '96-111', value: '96-111', min: 96, max: 111 },
  { label: '112-127', value: '112-127', min: 112, max: 127 },
  { label: '128-143', value: '128-143', min: 128, max: 143 },
  { label: '144-159', value: '144-159', min: 144, max: 159 },
  { label: '160-175', value: '160-175', min: 160, max: 175 },
  { label: '176-191', value: '176-191', min: 176, max: 191 },
  { label: '192-207', value: '192-207', min: 192, max: 207 },
  { label: '208-223', value: '208-223', min: 208, max: 223 },
  { label: '224-239', value: '224-239', min: 224, max: 239 },
  { label: '240-255', value: '240-255', min: 240, max: 255 },
];

export type RawRangeOption = typeof RAW_RANGE_OPTIONS[number];

function App() {
  const [packets, setPackets] = useState<ParsedPacket[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode>('360');
  const [colorMode, setColorMode] = useState<ColorMode>('t03Average');
  const [selectedRawRange, setSelectedRawRange] = useState<RawRangeOption>(RAW_RANGE_OPTIONS[0]);
  const [sliderMinRaw, setSliderMinRaw] = useState<number>(0);

  const {
    isPlaying,
    currentIndex,
    currentPacket,
    progress,
    play,
    pause,
    reset,
    seek
  } = useRadarPlayer(packets);

  const handleFileLoaded = (loadedPackets: ParsedPacket[], name: string) => {
    setPackets(loadedPackets);
    setFileName(name);
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 8px 0'
        }}>
          CSV Radar Viewer - ULTRAX
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0
        }}>
          E2M Sonar 로그 파일을 업로드하여 레이더 화면을 재생합니다
        </p>
      </header>

      {/* File Uploader */}
      <FileUploader onFileLoaded={handleFileLoaded} />

      {/* File Info */}
      {fileName && (
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          <strong>파일:</strong> {fileName} | <strong>패킷 수:</strong> {packets.length}개
        </div>
      )}

      {/* Settings */}
      {packets.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Resolution Mode */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>
              해상도:
            </label>
            <select
              value={resolutionMode}
              onChange={(e) => setResolutionMode(e.target.value as ResolutionMode)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="144">144 (4px 컬럼)</option>
              <option value="360">360 (2px 컬럼)</option>
              <option value="720">720 (1px 컬럼)</option>
            </select>
          </div>

          {/* Color Mode */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>
              색상 모드:
            </label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            >
              <option value="iceFishing">Ice Fishing (흰색 배경)</option>
              <option value="t03Average">T03 평균 기반 (노란색 물고기)</option>
            </select>
          </div>

          {/* Raw Range Selector (T03 모드에서만 표시) */}
          {colorMode === 't03Average' && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>
                Raw 범위 (8색상):
              </label>
              <select
                value={selectedRawRange.value}
                onChange={(e) => {
                  const selected = RAW_RANGE_OPTIONS.find(opt => opt.value === e.target.value);
                  if (selected) setSelectedRawRange(selected);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              >
                {RAW_RANGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 전체 선택 시 슬라이더 + 입력창 표시 */}
          {colorMode === 't03Average' && selectedRawRange.value === 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>
                최소 Raw:
              </label>
              <input
                type="number"
                min={0}
                max={255}
                value={sliderMinRaw}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                  setSliderMinRaw(val);
                }}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  textAlign: 'center'
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((sliderMinRaw / 255) * 100)}
                onChange={(e) => setSliderMinRaw(Math.round((Number(e.target.value) / 100) * 255))}
                style={{ width: '200px' }}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>
                {Math.round((sliderMinRaw / 255) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Radar Canvas */}
      {packets.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <RadarCanvas
            currentPacket={currentPacket}
            packets={packets}
            currentIndex={currentIndex}
            resolutionMode={resolutionMode}
            colorMode={colorMode}
            rawRangeMin={selectedRawRange.value === 'all' ? sliderMinRaw : selectedRawRange.min}
            rawRangeMax={selectedRawRange.value === 'all' ? 255 : selectedRawRange.max}
            width={720}
            height={500}
          />
        </div>
      )}

      {/* Playback Controls */}
      {packets.length > 0 && (
        <PlaybackControls
          isPlaying={isPlaying}
          currentIndex={currentIndex}
          totalPackets={packets.length}
          progress={progress}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onSeek={seek}
        />
      )}

      {/* Footer */}
      <footer style={{
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#999'
      }}>
        ULTRAX Sonar Viewer &copy; 2025
      </footer>
    </div>
  );
}

export default App;
