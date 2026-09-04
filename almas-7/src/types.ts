export type ThemeMode = 'dark' | 'light' | 'liquid-glass';

export type CardRadius = 'sm' | 'md' | 'lg' | 'xl';
export type GlassIntensity = 'low' | 'medium' | 'high';

export type CardStyle = 'standard' | 'compact' | 'minimal';

export type SearchEngineId =
  | 'google'
  | 'bing'
  | 'duckduckgo'
  | 'youtube'
  | 'aparat'
  | 'digikala'
  | 'zarebin'
  | 'gerdoo'
  | 'wikipedia';

export interface SearchEngineOption {
  id: SearchEngineId;
  name: string;
  queryUrl: string;
  icon: string;
  color: string;
  placeholder: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  parentId?: string | null;
  isFolder?: boolean;
  createdAt: number;
  iconType?: 'emoji' | 'image' | 'favicon';
  iconValue?: string;
  colorTag?: string;
  clicks?: number;
  isBrowserSync?: boolean;
}

export type TextContrastMode = 'auto' | 'light' | 'dark';

export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserProfile {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  recoveryEmail?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  plan: 'free' | 'pro';
  planExpiryDate?: string;
  cloudSyncEnabled: boolean;
  lastSyncedAt?: number;
  sessions?: UserSession[];
}

export interface DashboardSettings {
  theme: ThemeMode;
  cardStyle: CardStyle;
  cardRadius: CardRadius;
  glassIntensity: GlassIntensity;
  textContrast: TextContrastMode;
  iconSize: number; // in px: 36 to 80 (default 56)
  cardPadding: number; // in px: 10 to 34 (default 18)
  cardScale?: number; // 80 to 130 (default 100)
  backgroundType: 'default' | 'custom-url' | 'custom-image';
  backgroundValue: string;
  showClock: boolean;
  showDate: boolean;
  showGreeting: boolean;
  searchEngine: SearchEngineId;
}

