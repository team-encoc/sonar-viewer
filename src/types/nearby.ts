export type NearByCategory = 'leisure' | 'stay' | 'tour' | 'dining';

export interface CategoryConfig {
  id: NearByCategory;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface ActivityItem {
  id: string;
  category: NearByCategory;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  priceFormatted: string;
  imageUrl: string;
  rating?: number;
  location?: string;
  locationEn?: string;
}

export interface HeroBannerConfig {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  imageUrl: string;
}
