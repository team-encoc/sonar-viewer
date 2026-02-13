import React from 'react';
import CategoryIcon from './CategoryIcon';
import type { CategoryConfig, NearByCategory } from '../../types/nearby';

interface CategorySectionProps {
  categories: CategoryConfig[];
  lang: string;
  scaleSize: (size: number) => number;
  selectedCategory: NearByCategory | null;
  onCategoryClick: (categoryId: string) => void;
  isDark: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  lang,
  scaleSize,
  selectedCategory,
  onCategoryClick,
  isDark,
}) => {
  const isKo = lang === 'ko';

  const sectionStyle: React.CSSProperties = {
    padding: `${scaleSize(16)}px 0`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scaleSize(16),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#f0f0f0' : '#1d1d1d',
    marginBottom: scaleSize(14),
  };

  const gridStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  };

  const localizedCategories = categories.map(cat => ({
    ...cat,
    label: isKo ? cat.label : cat.labelEn,
  }));

  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>{isKo ? '카테고리' : 'Categories'}</div>
      <div style={gridStyle}>
        {localizedCategories.map(cat => (
          <CategoryIcon
            key={cat.id}
            category={cat}
            scaleSize={scaleSize}
            onClick={onCategoryClick}
            isSelected={selectedCategory === cat.id}
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
