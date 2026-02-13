import React, { useState } from 'react';
import CategoryBadge from './CategoryBadge';
import type { ActivityItem } from '../../types/nearby';
import { CATEGORIES } from '../../data/nearbyMockData';

interface ItemDetailPageProps {
  item: ActivityItem;
  lang: string;
  scaleSize: (size: number) => number;
  isDark: boolean;
  onBack: () => void;
}

const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  item,
  lang,
  scaleSize,
  isDark,
  onBack,
}) => {
  const [imageError, setImageError] = useState(false);
  const isKo = lang === 'ko';

  const title = isKo ? item.title : item.titleEn;
  const description = isKo ? item.description : item.descriptionEn;
  const location = isKo ? item.location : item.locationEn;
  const categoryConfig = CATEGORIES.find(c => c.id === item.category);
  const categoryLabel = categoryConfig
    ? (isKo ? categoryConfig.label : categoryConfig.labelEn)
    : item.category;

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: isDark ? '#1D1D1D' : '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${scaleSize(12)}px ${scaleSize(16)}px`,
    backgroundColor: isDark ? '#1D1D1D' : '#ffffff',
    borderBottom: `1px solid ${isDark ? '#333' : '#f0f0f0'}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    gap: scaleSize(12),
  };

  const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: scaleSize(4),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: scaleSize(16),
    fontWeight: 600,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#f0f0f0' : '#1d1d1d',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 10',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
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
    background: 'linear-gradient(135deg, #007cd4 0%, #00b4d8 100%)',
    fontSize: scaleSize(48),
  };

  const contentStyle: React.CSSProperties = {
    padding: `${scaleSize(20)}px ${scaleSize(16)}px`,
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scaleSize(20),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#f0f0f0' : '#1d1d1d',
    lineHeight: `${scaleSize(28)}px`,
    marginBottom: scaleSize(8),
  };

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: scaleSize(12),
    marginBottom: scaleSize(16),
    flexWrap: 'wrap',
  };

  const categoryTagStyle: React.CSSProperties = {
    backgroundColor: categoryConfig?.bgColor || '#e0e0e0',
    color: categoryConfig?.color || '#333',
    fontSize: scaleSize(12),
    fontWeight: 600,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    padding: `${scaleSize(4)}px ${scaleSize(10)}px`,
    borderRadius: scaleSize(4),
  };

  const ratingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: scaleSize(4),
    fontSize: scaleSize(13),
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#ccc' : '#555',
  };

  const locationStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: scaleSize(4),
    fontSize: scaleSize(13),
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#aaa' : '#777',
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    backgroundColor: isDark ? '#333' : '#f0f0f0',
    margin: `${scaleSize(16)}px 0`,
  };

  const descriptionTitleStyle: React.CSSProperties = {
    fontSize: scaleSize(15),
    fontWeight: 600,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#f0f0f0' : '#1d1d1d',
    marginBottom: scaleSize(8),
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: scaleSize(14),
    fontWeight: 400,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: isDark ? '#bbb' : '#555',
    lineHeight: `${scaleSize(22)}px`,
  };

  const priceBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${scaleSize(16)}px`,
    borderTop: `1px solid ${isDark ? '#333' : '#f0f0f0'}`,
    backgroundColor: isDark ? '#252525' : '#fafafa',
  };

  const priceStyle: React.CSSProperties = {
    fontSize: scaleSize(20),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#007cd4',
  };

  const bookButtonStyle: React.CSSProperties = {
    backgroundColor: '#b0b0b0',
    color: '#ffffff',
    border: 'none',
    borderRadius: scaleSize(8),
    padding: `${scaleSize(12)}px ${scaleSize(24)}px`,
    fontSize: scaleSize(14),
    fontWeight: 600,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    cursor: 'not-allowed',
    opacity: 0.7,
    WebkitTapHighlightColor: 'transparent',
  };

  const iconColor = isDark ? '#ccc' : '#555';
  const iconSize = scaleSize(20);

  return (
    <div style={containerStyle}>
      <div style={headerBarStyle}>
        <button style={backButtonStyle} onClick={onBack} aria-label="Back">
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={headerTitleStyle}>{title}</span>
      </div>

      <div style={imageContainerStyle}>
        <img
          src={item.imageUrl}
          alt={title}
          style={imageStyle}
          onError={() => setImageError(true)}
        />
        <div style={placeholderStyle}>
          <svg width={scaleSize(48)} height={scaleSize(48)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <CategoryBadge
          category={item.category}
          label={categoryLabel}
          scaleSize={scaleSize}
        />
      </div>

      <div style={contentStyle}>
        <div style={titleStyle}>{title}</div>

        <div style={metaRowStyle}>
          <span style={categoryTagStyle}>{categoryLabel}</span>
          {item.rating && (
            <span style={ratingStyle}>
              <svg width={scaleSize(14)} height={scaleSize(14)} viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {item.rating.toFixed(1)}
            </span>
          )}
          {location && (
            <span style={locationStyle}>
              <svg width={scaleSize(14)} height={scaleSize(14)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {location}
            </span>
          )}
        </div>

        <div style={dividerStyle} />

        <div style={descriptionTitleStyle}>
          {isKo ? '상세 정보' : 'Details'}
        </div>
        <div style={descriptionStyle}>{description}</div>
      </div>

      <div style={priceBarStyle}>
        <div style={priceStyle}>{item.priceFormatted}</div>
        <button style={bookButtonStyle} disabled>
          {isKo ? '예약하기' : 'Book Now'}
        </button>
      </div>
    </div>
  );
};

export default ItemDetailPage;
