import React from 'react';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'assistive' | 'kakao' | 'google' | 'naver';
  style?: 'solid' | 'line';
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isDark?: boolean;
  scaleSize: (size: number) => number;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style = 'solid',
  disabled = false,
  icon,
  iconPosition = 'left',
  isDark = false,
  scaleSize,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  // Background colors based on variant and style (with dark mode support)
  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#323232' : '#f4f4f4';

    // Dark mode color mappings (matching React Native colorMap)
    const lightColorMap: Record<string, { normal: string; pressed: string }> = {
      'primary-solid': { normal: '#007cd4', pressed: '#005cc4' },
      'primary-line': { normal: 'transparent', pressed: 'rgba(0, 124, 212, 0.1)' },
      'assistive-solid': { normal: '#f4f4f4', pressed: '#cfcfcf' },
      'assistive-line': { normal: '#fbfbfb', pressed: '#e7e7e7' },
      'kakao-solid': { normal: '#FFEB3B', pressed: '#F9D71C' },
      'kakao-line': { normal: 'transparent', pressed: 'rgba(255, 235, 59, 0.1)' },
      'google-solid': { normal: '#ffffff', pressed: '#f4f4f4' },
      'google-line': { normal: 'transparent', pressed: 'rgba(0, 0, 0, 0.05)' },
      'naver-solid': { normal: '#03C75A', pressed: '#02B050' },
      'naver-line': { normal: 'transparent', pressed: 'rgba(3, 199, 90, 0.1)' },
    };

    const darkColorMap: Record<string, { normal: string; pressed: string }> = {
      'primary-solid': { normal: '#007cd4', pressed: '#005cc4' },
      'primary-line': { normal: 'transparent', pressed: 'rgba(0, 124, 212, 0.1)' },
      'assistive-solid': { normal: '#323232', pressed: '#505050' },
      'assistive-line': { normal: '#1D1D1D', pressed: '#323232' },
      'kakao-solid': { normal: '#FFEB3B', pressed: '#F9D71C' },
      'kakao-line': { normal: 'transparent', pressed: 'rgba(255, 235, 59, 0.1)' },
      'google-solid': { normal: '#323232', pressed: '#505050' },
      'google-line': { normal: 'transparent', pressed: 'rgba(255, 255, 255, 0.05)' },
      'naver-solid': { normal: '#03C75A', pressed: '#02B050' },
      'naver-line': { normal: 'transparent', pressed: 'rgba(3, 199, 90, 0.1)' },
    };

    const colorMap = isDark ? darkColorMap : lightColorMap;
    const key = `${variant}-${style}`;
    const colors = colorMap[key] || colorMap['primary-solid'];
    return isPressed ? colors.pressed : colors.normal;
  };

  // Text color based on variant and style (with dark mode support)
  const getTextColor = () => {
    if (disabled) return isDark ? '#808080' : '#737373';

    const lightTextColorMap: Record<string, Record<string, string>> = {
      primary: { solid: '#fbfbfb', line: '#007cd4' },
      assistive: { solid: '#505050', line: '#505050' },
      kakao: { solid: '#1d1d1d', line: '#FFEB3B' },
      google: { solid: '#1d1d1d', line: '#1d1d1d' },
      naver: { solid: '#fbfbfb', line: '#03C75A' },
    };

    const darkTextColorMap: Record<string, Record<string, string>> = {
      primary: { solid: '#fbfbfb', line: '#007cd4' },
      assistive: { solid: '#aeaeae', line: '#aeaeae' },
      kakao: { solid: '#1d1d1d', line: '#FFEB3B' },
      google: { solid: '#fbfbfb', line: '#fbfbfb' },
      naver: { solid: '#fbfbfb', line: '#03C75A' },
    };

    const textColorMap = isDark ? darkTextColorMap : lightTextColorMap;
    return textColorMap[variant]?.[style] || '#fbfbfb';
  };

  // Border color for line style (with dark mode support)
  const getBorderColor = () => {
    if (style !== 'line') return 'transparent';

    const lightBorderColorMap: Record<string, string> = {
      primary: '#007cd4',
      assistive: '#505050',
      kakao: '#FFEB3B',
      google: '#aeaeae',
      naver: '#03C75A',
    };

    const darkBorderColorMap: Record<string, string> = {
      primary: '#007cd4',
      assistive: '#808080',
      kakao: '#FFEB3B',
      google: '#808080',
      naver: '#03C75A',
    };

    const borderColorMap = isDark ? darkBorderColorMap : lightBorderColorMap;
    return borderColorMap[variant] || '#007cd4';
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: scaleSize(48),
    backgroundColor: getBackgroundColor(),
    border: style === 'line' ? `1px solid ${getBorderColor()}` : 'none',
    borderRadius: scaleSize(8),
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.15s ease',
    padding: `0 ${scaleSize(16)}px`,
    boxSizing: 'border-box',
  };

  const textStyle: React.CSSProperties = {
    color: getTextColor(),
    fontSize: scaleSize(16),
    fontWeight: 500,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    letterSpacing: '-0.01em',
    textAlign: 'center',
  };

  const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: iconPosition === 'left' ? scaleSize(8) : 0,
    marginLeft: iconPosition === 'right' ? scaleSize(8) : 0,
  };

  const handleClick = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      {icon && iconPosition === 'left' && (
        <span style={iconContainerStyle}>{icon}</span>
      )}
      <span style={textStyle}>{title}</span>
      {icon && iconPosition === 'right' && (
        <span style={iconContainerStyle}>{icon}</span>
      )}
    </button>
  );
};

export { Button };
