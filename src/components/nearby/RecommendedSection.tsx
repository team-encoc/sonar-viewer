import React from 'react';
import ActivityCard from './ActivityCard';
import type { ActivityItem } from '../../types/nearby';

export type SortOrder = 'asc' | 'desc';

interface RecommendedSectionProps {
  items: ActivityItem[];
  lang: string;
  scaleSize: (size: number) => number;
  isDark: boolean;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  onItemClick: (itemId: string) => void;
}

const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  items,
  lang,
  scaleSize,
  isDark,
  sortOrder,
  onSortChange,
  onItemClick,
}) => {
  const isKo = lang === 'ko';

  const sectionStyle: React.CSSProperties = {
    padding: `${scaleSize(8)}px 0 ${scaleSize(24)}px`,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSize(14),
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scaleSize(16),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#f0f0f0' : '#1d1d1d',
  };

  const sortButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: scaleSize(4),
    fontSize: scaleSize(13),
    fontWeight: 500,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#007cd4',
    cursor: 'pointer',
    background: 'none',
    border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
    borderRadius: scaleSize(6),
    padding: `${scaleSize(4)}px ${scaleSize(10)}px`,
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: scaleSize(12),
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: `${scaleSize(40)}px 0`,
    color: isDark ? '#888' : '#999',
    fontSize: scaleSize(14),
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  };

  const nextOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  const sortLabel = sortOrder === 'asc'
    ? (isKo ? '낮은 가격순' : 'Price: Low')
    : (isKo ? '높은 가격순' : 'Price: High');

  const arrowSvg = (
    <svg
      width={scaleSize(14)}
      height={scaleSize(14)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#007cd4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s ease',
      }}
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>{isKo ? '추천 활동' : 'Recommended'}</div>
        <button style={sortButtonStyle} onClick={() => onSortChange(nextOrder)}>
          {arrowSvg}
          {sortLabel}
        </button>
      </div>
      {items.length > 0 ? (
        <div style={gridStyle}>
          {items.map(item => (
            <ActivityCard
              key={item.id}
              item={item}
              lang={lang}
              scaleSize={scaleSize}
              onClick={onItemClick}
            />
          ))}
        </div>
      ) : (
        <div style={emptyStyle}>
          {isKo ? '해당 카테고리에 항목이 없습니다.' : 'No items in this category.'}
        </div>
      )}
    </div>
  );
};

export default RecommendedSection;
