import React, { useState } from 'react';
import type { HeroBannerConfig } from '../../types/nearby';

interface HeroBannerProps {
  banner: HeroBannerConfig;
  lang: string;
  scaleSize: (size: number) => number;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ banner, lang, scaleSize }) => {
  const [imageError, setImageError] = useState(false);
  const isKo = lang === 'ko';

  const title = isKo ? banner.title : banner.titleEn;
  const subtitle = isKo ? banner.subtitle : banner.subtitleEn;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: scaleSize(180),
    borderRadius: scaleSize(12),
    overflow: 'hidden',
    margin: `${scaleSize(12)}px 0`,
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: imageError ? 'none' : 'block',
  };

  const fallbackStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: imageError ? 'flex' : 'none',
    background: 'linear-gradient(135deg, #007cd4 0%, #00b4d8 50%, #0096c7 100%)',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(20),
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scaleSize(22),
    fontWeight: 700,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#ffffff',
    textAlign: 'center',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
    marginBottom: scaleSize(6),
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: scaleSize(13),
    fontWeight: 400,
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  };

  return (
    <div style={containerStyle}>
      <img
        src={banner.imageUrl}
        alt={title}
        style={imageStyle}
        onError={() => setImageError(true)}
      />
      <div style={fallbackStyle} />
      <div style={overlayStyle}>
        <div style={titleStyle}>{title}</div>
        <div style={subtitleStyle}>{subtitle}</div>
      </div>
    </div>
  );
};

export default HeroBanner;
