import { BookmarkItem, DashboardSettings, SearchEngineOption, UserProfile } from '../types';

export const SEARCH_ENGINES: SearchEngineOption[] = [
  {
    id: 'google',
    name: 'گوگل (Google)',
    queryUrl: 'https://www.google.com/search?q=',
    icon: '🌐',
    color: '#4285F4',
    placeholder: 'جستجو در گوگل یا آدرس سایت...'
  },
  {
    id: 'bing',
    name: 'بینگ (Bing)',
    queryUrl: 'https://www.bing.com/search?q=',
    icon: '🔍',
    color: '#00809D',
    placeholder: 'جستجو با موتور هوشمند بینگ...'
  },
  {
    id: 'duckduckgo',
    name: 'داک‌داک‌گو (DuckDuckGo)',
    queryUrl: 'https://duckduckgo.com/?q=',
    icon: '🦆',
    color: '#DE5833',
    placeholder: 'جستجوی خصوصی در DuckDuckGo...'
  },
  {
    id: 'youtube',
    name: 'یوتیوب (YouTube)',
    queryUrl: 'https://www.youtube.com/results?search_query=',
    icon: '▶️',
    color: '#FF0000',
    placeholder: 'جستجوی ویدیوها در یوتیوب...'
  },
  {
    id: 'aparat',
    name: 'آپارات (Aparat)',
    queryUrl: 'https://www.aparat.com/search/',
    icon: '🎬',
    color: '#ED145B',
    placeholder: 'جستجوی ویدیو و کلیپ در آپارات...'
  },
  {
    id: 'digikala',
    name: 'دیجی‌کالا (Digikala)',
    queryUrl: 'https://www.digikala.com/search/?q=',
    icon: '🛍️',
    color: '#EF394E',
    placeholder: 'جستجوی کالا و خرید در دیجی‌کالا...'
  },
  {
    id: 'zarebin',
    name: 'ذره‌بین (Zarebin)',
    queryUrl: 'https://zarebin.ir/search?q=',
    icon: '🔎',
    color: '#00A859',
    placeholder: 'جستجو در وب فارسی با ذره‌بین...'
  },
  {
    id: 'gerdoo',
    name: 'گردو (Gerdoo)',
    queryUrl: 'https://gerdoo.me/search?q=',
    icon: '🌰',
    color: '#8D6E63',
    placeholder: 'جستجو در موتور جستجوی گردو...'
  },
  {
    id: 'wikipedia',
    name: 'ویکی‌پدیا (Wikipedia)',
    queryUrl: 'https://fa.wikipedia.org/wiki/Special:Search?search=',
    icon: '📖',
    color: '#636466',
    placeholder: 'جستجوی مقالات در دانشنامه ویکی‌پدیا...'
  }
];

export const DEFAULT_BOOKMARKS: BookmarkItem[] = [];

export const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'liquid-glass',
  cardStyle: 'standard',
  cardRadius: 'lg',
  glassIntensity: 'medium',
  textContrast: 'auto',
  iconSize: 56,
  cardPadding: 18,
  cardScale: 100,
  backgroundType: 'default',
  backgroundValue: '',
  showClock: true,
  showDate: true,
  showGreeting: true,
  searchEngine: 'google'
};

export const EMOJI_PRESETS = [
  '🚀', '🔥', '💻', '🌐', '🎮', '📱', '📚', '🎵',
  '🛍️', '⚽', '🎨', '💼', '💡', '🤖', '⭐', '❤️',
  '🎬', '📰', '🔒', '⚙️', '📂', '☕', '🧠', '✨'
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: 'ابوالفضل زارعی',
  username: 'abolking2077',
  email: 'lxabolzz32@gmail.com',
  phone: '+98 912 345 6789',
  recoveryEmail: 'backup.abolking@gmail.com',
  bio: 'توسعه‌دهنده فرانت‌اند و طراح رابط کاربری | کاربر ویژه I-Dashboard Pro',
  isVerified: true,
  plan: 'pro',
  planExpiryDate: '۱۴۰۵/۱۲/۲۹',
  cloudSyncEnabled: true,
  lastSyncedAt: Date.now() - 1000 * 60 * 12, // 12 minutes ago
  sessions: [
    {
      id: 'session-1',
      deviceName: 'Windows 11 PC - Google Chrome',
      deviceType: 'desktop',
      browser: 'Chrome 128.0 (دسکتاپ)',
      ipAddress: '5.120.88.14',
      location: 'تهران، ایران',
      lastActive: 'همین الان (جلسه جاری)',
      isCurrent: true
    },
    {
      id: 'session-2',
      deviceName: 'Samsung Galaxy S24 Ultra',
      deviceType: 'mobile',
      browser: 'Chrome Mobile 128',
      ipAddress: '185.110.22.9',
      location: 'تهران، ایران',
      lastActive: '۲ ساعت پیش',
      isCurrent: false
    },
    {
      id: 'session-3',
      deviceName: 'MacBook Pro M3 - Safari',
      deviceType: 'desktop',
      browser: 'Safari 17.5',
      ipAddress: '91.99.102.50',
      location: 'اصفهان، ایران',
      lastActive: 'دیروز ۱۸:۴۵',
      isCurrent: false
    }
  ]
};

