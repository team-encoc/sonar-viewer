import { useState, useEffect, useCallback, useRef } from 'react';
import { parseCSVFile, ParsedPacket } from '../utils/csvParser';
import { useRadarPlayer } from '../hooks/useRadarPlayer';
import { RadarCanvas } from '../components/RadarCanvas';
import { MobilePlaybackControls } from '../components/mobile/MobilePlaybackControls';
import '../types/global.d.ts';

type ViewerState = 'waiting' | 'loading' | 'ready' | 'error';

interface Metadata {
  fileName: string;
  resolution: '144' | '360' | '720';
  sensitivity: number;
}

export default function MobileViewer() {
  const [viewerState, setViewerState] = useState<ViewerState>('waiting');
  const [packets, setPackets] = useState<ParsedPacket[]>([]);
  const [metadata, setMetadata] = useState<Metadata>({
    fileName: '',
    resolution: '360',
    sensitivity: 50,
  });
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  const {
    isPlaying,
    currentIndex,
    currentPacket,
    progress,
    play,
    pause,
    reset,
    seek,
  } = useRadarPlayer(packets);

  // 타이머 클리어
  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // 자동 숨김 타이머 시작 (재생 중일 때만)
  const startHideTimer = useCallback(() => {
    clearHideTimer();
    if (isPlaying) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying, clearHideTimer]);

  // 컨트롤 표시 및 타이머 재시작
  const showControlsAndResetTimer = useCallback(() => {
    setControlsVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  // 캔버스 탭 핸들러
  const handleCanvasTap = useCallback(() => {
    if (controlsVisible) {
      setControlsVisible(false);
      clearHideTimer();
    } else {
      showControlsAndResetTimer();
    }
  }, [controlsVisible, clearHideTimer, showControlsAndResetTimer]);

  // 재생 상태 변경 시 타이머 관리
  useEffect(() => {
    if (isPlaying && controlsVisible) {
      startHideTimer();
    } else {
      clearHideTimer();
    }
    return () => clearHideTimer();
  }, [isPlaying, controlsVisible, startHideTimer, clearHideTimer]);

  // Handle messages from React Native WebView
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      // Handle both window.postMessage and ReactNativeWebView message formats
      let data;
      if (typeof event.data === 'string') {
        data = JSON.parse(event.data);
      } else {
        data = event.data;
      }

      if (data.type === 'CSV_DATA') {
        setViewerState('loading');

        const parsedPackets = parseCSVFile(data.csvContent);

        if (parsedPackets.length === 0) {
          setError('CSV 파일에서 패킷을 찾을 수 없습니다.');
          setViewerState('error');
          return;
        }

        setPackets(parsedPackets);
        setMetadata({
          fileName: data.fileName || 'Unknown',
          resolution: data.resolution || '360',
          sensitivity: data.sensitivity ?? 50,
        });
        setViewerState('ready');

        // Notify React Native that viewer is ready
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: 'VIEWER_READY',
            packetCount: parsedPackets.length,
          })
        );
      }

      // Handle settings update from React Native
      if (data.type === 'UPDATE_SETTINGS') {
        setMetadata(prev => ({
          ...prev,
          resolution: data.resolution || prev.resolution,
          sensitivity: data.sensitivity ?? prev.sensitivity,
        }));
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
      setError('메시지 파싱 실패');
      setViewerState('error');
    }
  }, []);

  // Setup message listeners on mount
  useEffect(() => {
    // Standard window message (for browser testing)
    window.addEventListener('message', handleMessage);

    // React Native WebView specific (document level)
    document.addEventListener('message', handleMessage as EventListener);

    // Notify React Native that viewer is loaded and ready to receive data
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: 'VIEWER_LOADED' })
    );

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as EventListener);
    };
  }, [handleMessage]);

  // Calculate canvas dimensions for mobile (full screen)
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;

  // Render based on state
  if (viewerState === 'waiting') {
    return (
      <div style={styles.container}>
        <div style={styles.centerContent}>
          <div style={styles.loadingText}>데이터 대기 중...</div>
          <div style={styles.subText}>앱에서 CSV 데이터를 전송해주세요</div>
        </div>
      </div>
    );
  }

  if (viewerState === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.centerContent}>
          <div style={styles.loadingText}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (viewerState === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.centerContent}>
          <div style={styles.errorText}>오류 발생</div>
          <div style={styles.subText}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.canvasContainer} onClick={handleCanvasTap}>
        <RadarCanvas
          currentPacket={currentPacket}
          packets={packets}
          currentIndex={currentIndex}
          resolutionMode={metadata.resolution}
          colorMode="t03Average"
          sensitivity={metadata.sensitivity}
          width={canvasWidth}
          height={canvasHeight}
        />
      </div>
      <MobilePlaybackControls
        isPlaying={isPlaying}
        currentIndex={currentIndex}
        totalPackets={packets.length}
        progress={progress}
        onPlay={play}
        onPause={pause}
        onReset={reset}
        onSeek={seek}
        visible={controlsVisible}
        onInteraction={showControlsAndResetTimer}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  centerContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  loadingText: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  subText: {
    color: '#888',
    fontSize: '14px',
  },
  errorText: {
    color: '#ff4444',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};
