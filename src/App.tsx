import { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { RadarCanvas } from './components/RadarCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { useRadarPlayer } from './hooks/useRadarPlayer';
import { ParsedPacket } from './utils/csvParser';

type ResolutionMode = '144' | '360' | '720';
type ColorMode = 'standard' | 'iceFishing' | 't03Average';

function App() {
  const [packets, setPackets] = useState<ParsedPacket[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode>('360');
  const [colorMode, setColorMode] = useState<ColorMode>('standard');

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
              <option value="standard">Standard (투명 배경)</option>
              <option value="iceFishing">Ice Fishing (흰색 배경)</option>
              <option value="t03Average">T03 평균 기반 (노란색 물고기)</option>
            </select>
          </div>
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
