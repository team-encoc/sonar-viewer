import React from 'react';
import type { CategoryConfig } from '../../types/nearby';

interface CategoryIconProps {
  category: CategoryConfig;
  scaleSize: (size: number) => number;
  onClick: (categoryId: string) => void;
  isSelected: boolean;
}

const CategorySvgIcons: Record<string, (size: number, color: string) => React.ReactNode> = {
  leisure: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M15 9l-3 3-3-3" />
      <circle cx="9" cy="9" r="0.5" fill={color} />
      <circle cx="15" cy="9" r="0.5" fill={color} />
    </svg>
  ),
  stay: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M10 10h1" />
      <path d="M13 10h1" />
    </svg>
  ),
  tour: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20" />
      <path d="M5 20v-4l7-10 7 10v4" />
      <path d="M12 6v0" />
      <path d="M12 3v3" />
      <path d="M9 16h6" />
      <path d="M8 12h8" />
    </svg>
  ),
  dining: (size, color) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, scaleSize, onClick, isSelected }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: scaleSize(8),
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  };

  const circleStyle: React.CSSProperties = {
    width: scaleSize(60),
    height: scaleSize(60),
    borderRadius: '50%',
    backgroundColor: isSelected ? '#E8F4FD' : category.bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: isSelected ? `3px solid #007cd4` : '3px solid transparent',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: scaleSize(12),
    fontWeight: isSelected ? 700 : 500,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isSelected ? '#007cd4' : '#333',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  };

  const iconSize = scaleSize(26);
  const iconColor = isSelected ? '#007cd4' : category.color;
  const renderIcon = CategorySvgIcons[category.id];

  return (
    <div style={containerStyle} onClick={() => onClick(category.id)}>
      <div style={circleStyle}>
        {renderIcon ? renderIcon(iconSize, iconColor) : null}
      </div>
      <span style={labelStyle}>{category.label}</span>
    </div>
  );
};

export default CategoryIcon;
