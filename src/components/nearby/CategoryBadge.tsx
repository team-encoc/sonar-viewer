import React from 'react';
import { CATEGORY_COLORS } from '../../data/nearbyMockData';
import type { NearByCategory } from '../../types/nearby';

interface CategoryBadgeProps {
  category: NearByCategory;
  label: string;
  scaleSize: (size: number) => number;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, label, scaleSize }) => {
  const colors = CATEGORY_COLORS[category];

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: scaleSize(8),
    left: scaleSize(8),
    backgroundColor: colors.bgColor,
    color: colors.color,
    fontSize: scaleSize(11),
    fontWeight: 600,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    padding: `${scaleSize(3)}px ${scaleSize(8)}px`,
    borderRadius: scaleSize(4),
    lineHeight: `${scaleSize(16)}px`,
  };

  return <span style={badgeStyle}>{label}</span>;
};

export default CategoryBadge;
