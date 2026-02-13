import React, { useState } from 'react';
import CategoryBadge from './CategoryBadge';
import type { ActivityItem } from '../../types/nearby';
import { CATEGORIES } from '../../data/nearbyMockData';

interface ActivityCardProps {
  item: ActivityItem;
  lang: string;
  scaleSize: (size: number) => number;
  onClick: (itemId: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ item, lang, scaleSize, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const isKo = lang === 'ko';

  const title = isKo ? item.title : item.titleEn;
  const categoryConfig = CATEGORIES.find(c => c.id === item.category);
  const categoryLabel = categoryConfig
    ? (isKo ? categoryConfig.label : categoryConfig.labelEn)
    : item.category;

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    borderRadius: scaleSize(10),
    overflow: 'hidden',
    backgroundColor: '#fff',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: scaleSize(10),
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: imageError ? 'none' : 'block',
  };

  const placeholderStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: imageError ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e8e8',
    fontSize: scaleSize(32),
  };

  const infoStyle: React.CSSProperties = {
    padding: `${scaleSize(8)}px 0`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scaleSize(13),
    fontWeight: 500,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#1d1d1d',
    lineHeight: `${scaleSize(18)}px`,
    marginBottom: scaleSize(4),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: scaleSize(14),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#007cd4',
    lineHeight: `${scaleSize(20)}px`,
  };

  return (
    <div style={cardStyle} onClick={() => onClick(item.id)}>
      <div style={imageContainerStyle}>
        <img
          src={item.imageUrl}
          alt={title}
          style={imageStyle}
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div style={placeholderStyle}>{'\u{1F3A3}'}</div>
        <CategoryBadge
          category={item.category}
          label={categoryLabel}
          scaleSize={scaleSize}
        />
      </div>
      <div style={infoStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={priceStyle}>{item.priceFormatted}</div>
      </div>
    </div>
  );
};

export default ActivityCard;
