import React from 'react';

interface NearByHeaderProps {
  scaleSize: (size: number) => number;
  isDark: boolean;
  // onSearch: () => void;
  // onNotification: () => void;
}

const NearByHeader: React.FC<NearByHeaderProps> = ({ scaleSize, isDark }) => {
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${scaleSize(12)}px ${scaleSize(16)}px`,
    backgroundColor: isDark ? '#1D1D1D' : '#ffffff',
    borderBottom: `1px solid ${isDark ? '#333' : '#f0f0f0'}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const brandStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: scaleSize(8),
  };

  const logoCircleStyle: React.CSSProperties = {
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: '50%',
    backgroundColor: '#007cd4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: scaleSize(14),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  };

  const brandTextStyle: React.CSSProperties = {
    fontSize: scaleSize(16),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#f0f0f0' : '#1d1d1d',
  };

  /* const iconsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: scaleSize(12),
  };

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: scaleSize(4),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
  };

  const iconColor = isDark ? '#ccc' : '#555';
  const iconSize = scaleSize(20); */

  return (
    <header style={headerStyle}>
      <div style={brandStyle}>
        <div style={logoCircleStyle}>W</div>
        <span style={brandTextStyle}>World Sukwang</span>
      </div>
      {/* <div style={iconsContainerStyle}>
        <button style={iconButtonStyle} onClick={onSearch} aria-label="Search">
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button style={iconButtonStyle} onClick={onNotification} aria-label="Notifications">
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div> */}
    </header>
  );
};

export default NearByHeader;
