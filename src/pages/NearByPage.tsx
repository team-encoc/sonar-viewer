import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useScale } from '../hooks/useScale';
import NearByHeader from '../components/nearby/NearByHeader';
import HeroBanner from '../components/nearby/HeroBanner';
import CategorySection from '../components/nearby/CategorySection';
import RecommendedSection from '../components/nearby/RecommendedSection';
import ItemDetailPage from '../components/nearby/ItemDetailPage';
import { CATEGORIES, HERO_BANNER, MOCK_ITEMS } from '../data/nearbyMockData';
import type { NearByCategory, ActivityItem } from '../types/nearby';
import type { SortOrder } from '../components/nearby/RecommendedSection';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

const sendMessage = (data: Record<string, unknown>) => {
  const message = JSON.stringify(data);
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(message);
  } else {
    console.log('[NearBy] Message:', message);
  }
};

const NearByPage: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const lang = searchParams.get('lang') || 'ko';
  const theme = searchParams.get('theme') || 'light';
  const isDark = theme === 'dark';

  const { scaleSize } = useScale();

  const [selectedCategory, setSelectedCategory] = useState<NearByCategory | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);

  useEffect(() => {
    sendMessage({ type: 'NEARBY_LOADED' });
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setSelectedCategory(prev =>
      prev === categoryId ? null : categoryId as NearByCategory
    );
    sendMessage({ type: 'NEARBY_NAVIGATE', action: 'category', id: categoryId });
  }, []);

  const handleItemClick = useCallback((itemId: string) => {
    const item = MOCK_ITEMS.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
    }
    sendMessage({ type: 'NEARBY_NAVIGATE', action: 'item', id: itemId });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleSearch = useCallback(() => {
    sendMessage({ type: 'NEARBY_NAVIGATE', action: 'search' });
  }, []);

  const handleNotification = useCallback(() => {
    sendMessage({ type: 'NEARBY_NAVIGATE', action: 'notification' });
  }, []);

  const handleSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order);
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    const filtered = selectedCategory
      ? MOCK_ITEMS.filter(item => item.category === selectedCategory)
      : MOCK_ITEMS;

    return [...filtered].sort((a, b) =>
      sortOrder === 'asc' ? a.price - b.price : b.price - a.price
    );
  }, [selectedCategory, sortOrder]);

  if (selectedItem) {
    return (
      <ItemDetailPage
        item={selectedItem}
        lang={lang}
        scaleSize={scaleSize}
        isDark={isDark}
        onBack={handleBack}
      />
    );
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: isDark ? '#1D1D1D' : '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: `0 ${scaleSize(16)}px`,
    paddingBottom: scaleSize(24),
    overflowY: 'auto',
  };

  return (
    <div style={containerStyle}>
      <NearByHeader
        scaleSize={scaleSize}
        isDark={isDark}
        onSearch={handleSearch}
        onNotification={handleNotification}
      />
      <div style={contentStyle}>
        <HeroBanner
          banner={HERO_BANNER}
          lang={lang}
          scaleSize={scaleSize}
        />
        <CategorySection
          categories={CATEGORIES}
          lang={lang}
          scaleSize={scaleSize}
          selectedCategory={selectedCategory}
          onCategoryClick={handleCategoryClick}
          isDark={isDark}
        />
        <RecommendedSection
          items={filteredAndSortedItems}
          lang={lang}
          scaleSize={scaleSize}
          isDark={isDark}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
};

export default NearByPage;
