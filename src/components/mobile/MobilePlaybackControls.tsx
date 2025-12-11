import playIcon from '../../../assets/play-buttton.svg';
import pauseIcon from '../../../assets/pause.svg';

interface MobilePlaybackControlsProps {
  isPlaying: boolean;
  currentIndex: number;
  totalPackets: number;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (index: number) => void;
  visible?: boolean;
  onInteraction?: () => void;
}

export function MobilePlaybackControls({
  isPlaying,
  currentIndex,
  totalPackets,
  progress,
  onPlay,
  onPause,
  onReset,
  onSeek,
  visible = true,
  onInteraction,
}: MobilePlaybackControlsProps) {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onSeek(value);
  };

  // 상호작용 시 부모에게 알림
  const handleInteraction = () => {
    onInteraction?.();
  };

  return (
    <div
      style={{
        ...styles.controlsContainer,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onTouchStart={handleInteraction}
      onMouseDown={handleInteraction}
    >
      {/* Progress Bar */}
      <div style={styles.progressSection}>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalPackets - 1)}
          value={currentIndex}
          onChange={handleProgressChange}
          style={styles.progressSlider}
        />
        <div style={styles.progressInfo}>
          <span style={styles.progressText}>
            {currentIndex + 1} / {totalPackets}
          </span>
          <span style={styles.progressPercent}>{progress.toFixed(1)}%</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={styles.buttonsRow}>
        <button onClick={onReset} style={styles.resetButton}>
          <span style={styles.buttonIcon}>↺</span>
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          style={isPlaying ? styles.pauseButton : styles.playButton}
        >
          <img
            src={isPlaying ? pauseIcon : playIcon}
            alt={isPlaying ? 'Pause' : 'Play'}
            style={styles.playPauseIcon}
          />
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  controlsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
    padding: '12px 16px',
    paddingBottom: '24px', // Extra padding for safe area
    borderTop: '1px solid #333',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
  },
  progressSection: {
    marginBottom: '12px',
  },
  progressSlider: {
    width: '100%',
    height: '6px',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none',
    backgroundColor: '#444',
    borderRadius: '3px',
    outline: 'none',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  progressText: {
    color: '#aaa',
    fontSize: '12px',
  },
  progressPercent: {
    color: '#aaa',
    fontSize: '12px',
  },
  buttonsRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
  },
  resetButton: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    backgroundColor: '#444',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    backgroundColor: '#007CD4',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    backgroundColor: '#ffc107',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    color: '#fff',
    fontSize: '20px',
  },
  playPauseIcon: {
    width: '24px',
    height: '24px',
    filter: 'invert(1)', // SVG를 흰색으로 변환
  },
};
