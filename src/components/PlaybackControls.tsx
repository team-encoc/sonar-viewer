interface PlaybackControlsProps {
  isPlaying: boolean;
  currentIndex: number;
  totalPackets: number;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (index: number) => void;
}

export function PlaybackControls({
  isPlaying,
  currentIndex,
  totalPackets,
  progress,
  onPlay,
  onPause,
  onReset,
  onSeek
}: PlaybackControlsProps) {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onSeek(value);
  };

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '16px'
    }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalPackets - 1)}
          value={currentIndex}
          onChange={handleProgressChange}
          style={{
            width: '100%',
            height: '8px',
            cursor: 'pointer'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#666',
          marginTop: '4px'
        }}>
          <span>{currentIndex + 1} / {totalPackets}</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <button
          onClick={onReset}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        >
          ⏮️ 초기화
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            style={{
              padding: '10px 30px',
              fontSize: '16px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0a800'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffc107'}
          >
            ⏸️ 일시정지
          </button>
        ) : (
          <button
            onClick={onPlay}
            style={{
              padding: '10px 30px',
              fontSize: '16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            ▶️ 재생
          </button>
        )}
      </div>
    </div>
  );
}
