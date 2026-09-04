/**
 * I-Dashboard Pro - Unified, Modular, High-Performance Application Logic
 * Pure Vanilla JavaScript (ES6+) - Apple iOS-Inspired Fluid Experience
 */

import {
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  resetPassword,
  resendVerificationEmail,
  refreshUserVerification,
  updateUserProfile,
  updateUserPassword,
  deleteUserAccount,
  subscribeToAuthState,
  getCurrentUser,
  translateFirebaseError
} from './src/lib/auth';
import { isFirebaseConfigured, auth } from './src/lib/firebase';

(function () {
  'use strict';

  /* ==========================================================================
     1. State Management & Storage Keys
     ========================================================================== */
  const STORAGE_KEYS = {
    BOOKMARKS: 'idash_bookmarks_v5',
    SETTINGS: 'idash_settings_v3',
    SEARCH_HISTORY: 'idash_search_history_v3',
    NOTES: 'idash_notes_v3',
    ACTIVE_PAGE: 'idash_active_page_v3',
    USER_PROFILE: 'idash_user_profile_v3',
    CACHED_NEWS: 'idash_cached_news_v3',
    CALENDAR_TASKS: 'idash_calendar_tasks_v3',
    MULTI_NOTES: 'idash_multi_notes_v3',
    POMODORO: 'idash_pomodoro_v3',
    USERS_DB: 'idash_users_db_v3',
    CUSTOM_RSS_SOURCES: 'idash_custom_rss_sources_v1',
    CACHED_TGJU_RATES: 'idash_cached_tgju_rates_v1',
    LAST_TGJU_SYNC_TIME: 'idash_last_tgju_sync_time_v1'
  };

  function getUsersDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading users DB:', e);
    }
    return [];
  }

  function saveUsersDB(users) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users DB:', e);
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeSearchText(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/ة/g, 'ه')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }

  const DEFAULT_WALLPAPERS = {
    nature: [
      { name: 'دریاچه آلپ و کوهستان', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
      { name: 'دره و رودخانه جنگلی', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
      { name: 'غروب کوهستان و افق', url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)' },
      { name: 'جنگل مه‌آلود و کاج', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
      { name: 'امواج اقیانوس آرام', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #001f3f 0%, #0074d9 60%, #7fdbff 100%)' },
      { name: 'کهکشان و شفق قطبی', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #051923 0%, #003554 40%, #006466 100%)' }
    ],
    abstract: [
      { name: 'امواج مایع کریستالی', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)' },
      { name: 'معماری مدرن و شیشه', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
      { name: 'سیال کیهانی نیلی', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)' },
      { name: 'امواج بنفش نئونی', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)' }
    ],
    minimal: [
      { name: 'تاریکی ستاره‌ها و فضا', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
      { name: 'گرادیان گرافیتی دارک', url: 'linear-gradient(135deg, #0a0e17 0%, #151d2f 50%, #0d131f 100%)', fallbackGradient: 'linear-gradient(135deg, #0a0e17 0%, #151d2f 50%, #0d131f 100%)' },
      { name: 'تایتانیوم مات AMOLED', url: 'linear-gradient(135deg, #18191a 0%, #242526 50%, #18191a 100%)', fallbackGradient: 'linear-gradient(135deg, #18191a 0%, #242526 50%, #18191a 100%)' },
      { name: 'شب تیره مینیمال', url: 'linear-gradient(135deg, #050505 0%, #111827 50%, #030712 100%)', fallbackGradient: 'linear-gradient(135deg, #050505 0%, #111827 50%, #030712 100%)' }
    ],
    cyber: [
      { name: 'توکیو نئونی در شب', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #ff007f 100%)' },
      { name: 'سایبرپانک سینث‌ویو', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #03001e 0%, #7303c0 40%, #ec38bc 75%, #fdeff9 100%)' },
      { name: 'تکنولوژی دارک و ماتریکس', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80', fallbackGradient: 'linear-gradient(135deg, #001100 0%, #003311 40%, #00aa44 80%, #00ff66 100%)' }
    ],
    gradients: [
      { name: 'شیشه مایع اپل (iOS Glass)', url: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 65%, #064e3b 100%)', fallbackGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 65%, #064e3b 100%)' },
      { name: 'شفق قطبی درخشان', url: 'radial-gradient(ellipse at top left, #1e3a8a 0%, #0f172a 50%, #022c22 100%)', fallbackGradient: 'radial-gradient(ellipse at top left, #1e3a8a 0%, #0f172a 50%, #022c22 100%)' },
      { name: 'غروب مخملی نیلگون', url: 'linear-gradient(135deg, #1e1b4b 0%, #4c0519 50%, #701a75 100%)', fallbackGradient: 'linear-gradient(135deg, #1e1b4b 0%, #4c0519 50%, #701a75 100%)' },
      { name: 'اقیانوس عمیق پترولیم', url: 'linear-gradient(135deg, #020617 0%, #0c4a6e 50%, #082f49 100%)', fallbackGradient: 'linear-gradient(135deg, #020617 0%, #0c4a6e 50%, #082f49 100%)' },
      { name: 'طیف نئونی بنفش و ارغوانی', url: 'linear-gradient(135deg, #2e0854 0%, #180033 50%, #581c87 100%)', fallbackGradient: 'linear-gradient(135deg, #2e0854 0%, #180033 50%, #581c87 100%)' }
    ]
  };

  // Flattened array of all wallpapers for single unified gallery display
  const ALL_WALLPAPERS = [
    ...DEFAULT_WALLPAPERS.nature,
    ...DEFAULT_WALLPAPERS.abstract,
    ...DEFAULT_WALLPAPERS.minimal,
    ...DEFAULT_WALLPAPERS.cyber,
    ...DEFAULT_WALLPAPERS.gradients
  ];

  function getWallpaperThumbnailUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('linear-gradient') || trimmed.startsWith('radial-gradient') || trimmed.startsWith('conic-gradient')) {
      return '';
    }
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    if (trimmed.includes('images.unsplash.com')) {
      return trimmed.replace('w=1920', 'w=480').replace('q=80', 'q=75');
    }
    return trimmed;
  }

  // Only Google, Bing, DuckDuckGo, and Zarebin
  const SEARCH_ENGINES = {
    google: { name: 'گوگل', icon: '🔍', url: 'https://www.google.com/search?q=' },
    bing: { name: 'بینگ', icon: '🌐', url: 'https://www.bing.com/search?q=' },
    duckduckgo: { name: 'داک‌داک‌گو', icon: '🦆', url: 'https://duckduckgo.com/?q=' },
    zarebin: { name: 'ذره‌بین', icon: '🔎', url: 'https://zarebin.ir/search?q=' }
  };

  const EMOJI_PALETTE = ['🌐', '⭐', '💻', '🎬', '🎵', '🛒', '📰', '📱', '📚', '🚀', '⚡', '🎮', '💡', '🔥', '🎨', '✈️', '💼', '📊', '🔍', '⚙️', '💬', '❤️', '🏆', '💎'];

  const DEFAULT_BOOKMARKS = [
    { id: 'bm_1', type: 'bookmark', title: 'یوتیوب', url: 'https://www.youtube.com', iconEmoji: '▶️', parentId: null, isPinned: true },
    { id: 'bm_2', type: 'bookmark', title: 'اینستاگرام', url: 'https://www.instagram.com', iconEmoji: '📸', parentId: null, isPinned: true },
    { id: 'bm_3', type: 'bookmark', title: 'آپارات', url: 'https://www.aparat.com', iconEmoji: '🎬', parentId: null, isPinned: true },
    { id: 'bm_4', type: 'bookmark', title: 'تلگرام', url: 'https://web.telegram.org', iconEmoji: '✈️', parentId: null, isPinned: true },
    { id: 'bm_5', type: 'bookmark', title: 'بله', url: 'https://web.bale.ai', iconEmoji: '💬', parentId: null, isPinned: true },
    { id: 'bm_6', type: 'bookmark', title: 'ChatGPT', url: 'https://chatgpt.com', iconEmoji: '🤖', parentId: null, isPinned: true },
    { id: 'bm_7', type: 'bookmark', title: 'گیت‌هاب', url: 'https://github.com', iconEmoji: '🐙', parentId: null, isPinned: true },
    { id: 'bm_8', type: 'bookmark', title: 'اسپاتیفای', url: 'https://open.spotify.com', iconEmoji: '🎵', parentId: null, isPinned: true }
  ];

  const DEFAULT_SETTINGS = {
    theme: 'liquid-glass',
    glassMode: 'frosted',
    accentColor: '#3b82f6',
    contrast: 'auto',
    cardSize: 120,
    iconSize: 'medium',
    cardRadius: 22,
    lowSpecMode: false,
    glassOpacity: 24,
    glassBlur: 32,
    bgBlur: 0,
    overlayOpacity: 44,
    wallpaperUrl: DEFAULT_WALLPAPERS.nature[0].url,
    searchEngine: 'google'
  };

  const ACCENT_COLOR_PRESETS = {
    '#3b82f6': { name: 'آبی', contrast: '#ffffff', hover: '#2563eb', glow: 'rgba(59, 130, 246, 0.5)', light: 'rgba(59, 130, 246, 0.16)' },
    '#8b5cf6': { name: 'بنفش', contrast: '#ffffff', hover: '#7c3aed', glow: 'rgba(139, 92, 246, 0.5)', light: 'rgba(139, 92, 246, 0.16)' },
    '#ec4899': { name: 'صورتی', contrast: '#ffffff', hover: '#db2777', glow: 'rgba(236, 72, 153, 0.5)', light: 'rgba(236, 72, 153, 0.16)' },
    '#10b981': { name: 'سبز', contrast: '#ffffff', hover: '#059669', glow: 'rgba(16, 185, 129, 0.5)', light: 'rgba(16, 185, 129, 0.16)' },
    '#06b6d4': { name: 'فیروزه‌ای', contrast: '#ffffff', hover: '#0891b2', glow: 'rgba(6, 182, 212, 0.5)', light: 'rgba(6, 182, 212, 0.16)' },
    '#f97316': { name: 'نارنجی', contrast: '#ffffff', hover: '#ea580c', glow: 'rgba(249, 115, 22, 0.5)', light: 'rgba(249, 115, 22, 0.16)' },
    '#ef4444': { name: 'قرمز', contrast: '#ffffff', hover: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)', light: 'rgba(239, 68, 68, 0.16)' },
    '#eab308': { name: 'زرد', contrast: '#1c1c1e', hover: '#ca8a04', glow: 'rgba(234, 179, 8, 0.5)', light: 'rgba(234, 179, 8, 0.16)' },
    '#18181b': { name: 'مشکی', contrast: '#ffffff', hover: '#09090b', glow: 'rgba(24, 24, 27, 0.6)', light: 'rgba(24, 24, 27, 0.16)' },
    '#ffffff': { name: 'سفید', contrast: '#1c1c1e', hover: '#f4f4f5', glow: 'rgba(255, 255, 255, 0.6)', light: 'rgba(255, 255, 255, 0.22)' }
  };

  function getHexLuminance(hex) {
    let clean = (hex || '').replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    if (clean.length !== 6) return 0.5;
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function applyAccentColor(hex) {
    if (!hex) hex = '#3b82f6';
    const root = document.documentElement;
    const currentTheme = (state && state.settings && state.settings.theme) || document.body.getAttribute('data-theme') || 'liquid-glass';
    const isLightTheme = currentTheme === 'light';
    const lum = getHexLuminance(hex);

    const preset = ACCENT_COLOR_PRESETS[hex.toLowerCase()];

    let contrast = lum > 0.62 ? '#18181b' : '#ffffff';
    let hover = hex;
    let glow = lum > 0.62 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)';
    let light = lum > 0.62 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)';

    if (preset) {
      contrast = preset.contrast;
      hover = preset.hover;
      glow = preset.glow;
      light = preset.light || light;
    } else {
      glow = `${hex}80`;
      light = `${hex}26`;
    }

    // High-contrast button border to guarantee distinct edges for white on light or black on dark
    let btnBorder = 'rgba(255, 255, 255, 0.28)';
    if (lum > 0.8) {
      btnBorder = isLightTheme ? 'rgba(15, 23, 42, 0.28)' : 'rgba(255, 255, 255, 0.6)';
    } else if (lum < 0.15) {
      btnBorder = isLightTheme ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.35)';
    }

    root.style.setProperty('--accent-color', hex);
    root.style.setProperty('--accent-contrast-text', contrast);
    root.style.setProperty('--accent-hover', hover);
    root.style.setProperty('--accent-glow', glow);
    root.style.setProperty('--accent-light', light);
    root.style.setProperty('--accent-btn-border', btnBorder);
    root.style.setProperty('--glow-color', glow);
  }

  const DEFAULT_USER_PROFILE = {
    uid: '',
    displayName: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: '',
    emailVerified: false,
    isLoggedIn: false
  };

  let state = {
    bookmarks: [],
    settings: { ...DEFAULT_SETTINGS },
    userProfile: { ...DEFAULT_USER_PROFILE },
    searchHistory: [],
    currentFolderId: null,
    activePage: 1,
    editingItemId: null,
    selectedAddEmoji: '🌐',
    selectedEditEmoji: '🌐'
  };

  /* ==========================================================================
     2. Jalali (Persian) Date Calculations
     ========================================================================== */
  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { year: jy, month: jm, day: jd };
  }

  function jalaliToGregorian(jy, jm, jd) {
    let gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13; gm++) {
      const v = sal_a[gm];
      if (days <= v) break;
      days -= v;
    }
    return { year: gy, month: gm, day: days };
  }

  const JALALI_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const PERSIAN_WEEKDAY_NAMES = [
    'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
  ];

  function toPersianDigits(n) {
    const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/[0-9]/g, (d) => pDigits[d]);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     3. State Initialization & Persistence
     ========================================================================== */
  function loadState() {
    try {
      const savedBm = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      state.bookmarks = savedBm ? JSON.parse(savedBm) : [...DEFAULT_BOOKMARKS];

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        if (!SEARCH_ENGINES[state.settings.searchEngine]) {
          state.settings.searchEngine = 'google';
        }
        if (!state.settings.wallpaperUrl) {
          state.settings.wallpaperUrl = DEFAULT_WALLPAPERS.nature[0].url;
        }
      }

      const savedHistory = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      if (savedHistory) {
        state.searchHistory = JSON.parse(savedHistory);
      } else {
        state.searchHistory = [];
      }

      // Guarantee app always defaults to Page 1 (Main Dashboard) on launch/new tab
      state.activePage = 1;

      const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (savedProfile) {
        state.userProfile = { ...DEFAULT_USER_PROFILE, ...JSON.parse(savedProfile) };
      } else {
        state.userProfile = { ...DEFAULT_USER_PROFILE };
      }
    } catch (e) {
      console.error('Error loading state:', e);
      state.bookmarks = [...DEFAULT_BOOKMARKS];
      state.settings = { ...DEFAULT_SETTINGS };
      state.userProfile = { ...DEFAULT_USER_PROFILE };
      state.searchHistory = [];
      state.activePage = 1;
    }
  }

  function saveUserProfile() {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(state.userProfile));
      renderUserProfile();
    } catch (e) {
      console.error('Error saving user profile:', e);
    }
  }

  function getRealDeviceDetails() {
    const ua = navigator.userAgent || '';
    let os = 'رایانه رومیزی';
    if (ua.includes('Win')) os = 'ویندوز (Windows)';
    else if (ua.includes('Mac')) os = 'مک‌اواس (macOS)';
    else if (ua.includes('Linux')) os = 'لینوکس (Linux)';
    else if (ua.includes('Android')) os = 'اندروید (Android)';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'آی‌اواس (iOS)';

    let browser = 'مرورگر پیش‌فرض';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/')) browser = 'Apple Safari';
    else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

    const isMobile = os.includes('اندروید') || os.includes('آی‌اواس');

    return {
      deviceName: `${browser} روی ${os}`,
      icon: isMobile ? '📱' : '💻',
      location: 'ایران',
      ip: 'نشست هم‌اکنون فعال (دسترسی جاری)'
    };
  }

  function renderUserProfile() {
    const prof = state.userProfile || DEFAULT_USER_PROFILE;
    const isLoggedIn = prof.isLoggedIn === true && !!prof.email;

    // Header Controls: Toggle between Login Button and User Chip
    const headerLoginBtn = document.getElementById('btn-header-login');
    const headerUserChip = document.getElementById('header-user-chip');
    const headerDisplayName = document.getElementById('header-user-displayname');
    const headerLetter = document.getElementById('header-user-letter');
    const headerImg = document.getElementById('header-user-img');

    if (headerLoginBtn) {
      headerLoginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
    }
    if (headerUserChip) {
      headerUserChip.style.display = isLoggedIn ? 'inline-flex' : 'none';
    }

    const emailName = prof.email ? prof.email.split('@')[0] : '';
    const displayLabel = prof.displayName || emailName || 'کاربر';
    const initial = (displayLabel || '👤').trim().charAt(0) || '👤';

    if (headerDisplayName) headerDisplayName.textContent = displayLabel;
    if (headerLetter) headerLetter.textContent = initial;

    // Settings Profile Top Card (Exclusively in Account Tab)
    const profileHeaderCard = document.getElementById('settings-profile-header');
    const dispName = document.getElementById('profile-display-name-text');
    const uname = document.getElementById('profile-username-text');
    const emailText = document.getElementById('profile-email-text');
    const avatarLetter = document.getElementById('profile-avatar-letter');
    const avatarImg = document.getElementById('profile-avatar-img');
    const verifiedBadge = document.getElementById('profile-verified-badge');
    const unverifiedBadge = document.getElementById('profile-unverified-badge');
    const unverifiedBanner = document.getElementById('account-unverified-banner');

    if (profileHeaderCard) {
      profileHeaderCard.style.display = isLoggedIn ? 'flex' : 'none';
    }

    if (dispName) dispName.textContent = prof.displayName || (isLoggedIn ? displayLabel : 'کاربر مهمان');
    if (uname) uname.textContent = prof.username ? `@${prof.username}` : (emailName ? `@${emailName}` : (isLoggedIn ? '@user' : '@guest'));
    if (emailText) emailText.textContent = prof.email || (isLoggedIn ? 'ایمیل ثبت نشده' : 'جهت همگام‌سازی وارد شوید');

    // Email verification badges & banner
    const isEmailVerified = isLoggedIn && prof.emailVerified === true;
    if (verifiedBadge) verifiedBadge.style.display = isEmailVerified ? 'inline-flex' : 'none';
    if (unverifiedBadge) unverifiedBadge.style.display = (isLoggedIn && !isEmailVerified) ? 'inline-flex' : 'none';
    if (unverifiedBanner) unverifiedBanner.style.display = (isLoggedIn && !isEmailVerified) ? 'flex' : 'none';

    if (avatarLetter) avatarLetter.textContent = initial;

    if (prof.avatarUrl && isLoggedIn) {
      if (avatarImg) { avatarImg.src = prof.avatarUrl; avatarImg.style.display = 'block'; }
      if (avatarLetter) avatarLetter.style.display = 'none';
      if (headerImg) { headerImg.src = prof.avatarUrl; headerImg.style.display = 'block'; }
      if (headerLetter) headerLetter.style.display = 'none';
    } else {
      if (avatarImg) avatarImg.style.display = 'none';
      if (avatarLetter) avatarLetter.style.display = 'block';
      if (headerImg) headerImg.style.display = 'none';
      if (headerLetter) headerLetter.style.display = 'block';
    }

    // Auth Switcher vs Profile Panels
    const switcher = document.getElementById('auth-mode-switcher');
    const loginPanel = document.getElementById('auth-login-panel');
    const registerPanel = document.getElementById('auth-register-panel');
    const forgotPanel = document.getElementById('auth-forgot-panel');
    const profilePanel = document.getElementById('auth-profile-panel');

    if (isLoggedIn) {
      if (switcher) switcher.style.display = 'none';
      if (loginPanel) loginPanel.style.display = 'none';
      if (registerPanel) registerPanel.style.display = 'none';
      if (forgotPanel) forgotPanel.style.display = 'none';
      if (profilePanel) profilePanel.style.display = 'flex';
    } else {
      if (profilePanel) profilePanel.style.display = 'none';
      if (forgotPanel && forgotPanel.style.display === 'flex') {
        if (switcher) switcher.style.display = 'none';
        if (loginPanel) loginPanel.style.display = 'none';
        if (registerPanel) registerPanel.style.display = 'none';
      } else {
        if (switcher) switcher.style.display = 'flex';
        const activeBtn = switcher ? switcher.querySelector('.auth-mode-btn.active') : null;
        const mode = activeBtn ? activeBtn.dataset.authMode : 'login';
        if (loginPanel) loginPanel.style.display = mode === 'login' ? 'flex' : 'none';
        if (registerPanel) registerPanel.style.display = mode === 'register' ? 'flex' : 'none';
      }
    }

    // Populate Account Tab Profile Management form inputs
    const inputDispName = document.getElementById('input-edit-displayname');
    const inputUname = document.getElementById('input-edit-username');
    const inputEmail = document.getElementById('input-edit-email');
    const inputPhone = document.getElementById('input-edit-phone');
    const inputBio = document.getElementById('input-edit-bio');
    const groupCurrentPass = document.getElementById('group-current-pass');
    const titlePasswordSection = document.getElementById('label-password-change-heading');

    if (inputDispName) inputDispName.value = prof.displayName || '';
    if (inputUname) inputUname.value = prof.username || (prof.email ? prof.email.split('@')[0] : '');
    if (inputEmail) inputEmail.value = prof.email || '';
    if (inputPhone) inputPhone.value = prof.phone || '';
    if (inputBio) inputBio.value = prof.bio || '';

    if (groupCurrentPass) groupCurrentPass.style.display = 'none'; // Firebase password update only needs new password
    if (titlePasswordSection) titlePasswordSection.textContent = '🔑 تغییر رمز عبور حساب (Firebase):';

    // Render Real Device Details
    const dev = getRealDeviceDetails();
    const devNameElem = document.getElementById('current-device-name');
    const devIconElem = document.getElementById('current-device-icon');
    const devMetaElem = document.getElementById('current-device-meta');
    if (devNameElem) devNameElem.textContent = dev.deviceName;
    if (devIconElem) devIconElem.textContent = dev.icon;
    if (devMetaElem) devMetaElem.textContent = `${dev.location} • ${dev.ip}`;
  }

  // Cross-Device Cloud Sync for Bookmarks
  let cloudSyncDebounceTimer = null;

  async function syncBookmarksToCloud() {
    if (!state.userProfile || !state.userProfile.isLoggedIn) return;
    const userIdentifier = state.userProfile.email || state.userProfile.username;
    if (!userIdentifier || userIdentifier === 'guest') return;

    try {
      await fetch('/api/sync/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdentifier,
          email: state.userProfile.email || '',
          bookmarks: state.bookmarks
        })
      });
      console.log('[Cloud Sync] Bookmarks synced to cloud.');
    } catch (err) {
      console.warn('[Cloud Sync] Cloud synchronization deferred:', err);
    }
  }

  function queueCloudSync() {
    if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = setTimeout(() => {
      syncBookmarksToCloud();
    }, 1000);
  }

  async function fetchCloudBookmarks(userIdentifier) {
    if (!userIdentifier || userIdentifier === 'guest') return;
    try {
      const res = await fetch(`/api/sync/bookmarks?userId=${encodeURIComponent(userIdentifier)}&email=${encodeURIComponent(state.userProfile.email || '')}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.bookmarks) && data.bookmarks.length > 0) {
          state.bookmarks = data.bookmarks;
          localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(state.bookmarks));
          renderBookmarks();
          showToast('☁️ بوکمارک‌های ابری شما بین دستگاه‌ها همگام‌سازی شدند');
        }
      }
    } catch (err) {
      console.warn('[Cloud Sync] Failed to fetch cloud bookmarks:', err);
    }
  }

  function saveBookmarks() {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(state.bookmarks));
      updateTotalBookmarksCounter();
      queueCloudSync();
    } catch (e) {
      console.error('Error saving bookmarks:', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
      applySettings();
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }

  function saveSearchHistory() {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(state.searchHistory.slice(0, 5)));
    } catch (e) {
      console.error('Error saving search history:', e);
    }
  }

  function findWallpaperPreset(url) {
    if (!url) return null;
    for (const cat in DEFAULT_WALLPAPERS) {
      const match = DEFAULT_WALLPAPERS[cat].find(w => w.url === url);
      if (match) return match;
    }
    return null;
  }

  // Universal Image Proxy Helper using https://wsrv.nl/?url=
  function getProxiedImageUrl(url, options = {}) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('linear-gradient') || trimmed.startsWith('radial-gradient')) {
      return trimmed;
    }
    // If it's already proxied, avoid double proxying
    if (trimmed.includes('wsrv.nl/?url=')) {
      return trimmed;
    }
    // Form wsrv.nl proxy URL
    let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}`;
    if (options.width) proxyUrl += `&w=${options.width}`;
    if (options.quality) proxyUrl += `&q=${options.quality}`;
    if (options.output) proxyUrl += `&output=${options.output}`;
    return proxyUrl;
  }

  function applyWallpaper(bgUrl) {
    const wallpaperLayer = document.getElementById('wallpaper-layer');
    if (!wallpaperLayer) return;

    if (!bgUrl) {
      bgUrl = ALL_WALLPAPERS[0] ? ALL_WALLPAPERS[0].url : DEFAULT_WALLPAPERS.nature[0].url;
    }

    wallpaperLayer.style.backgroundColor = 'transparent';

    // If it's a CSS gradient (100% offline & instant)
    if (bgUrl.startsWith('linear-gradient') || bgUrl.startsWith('radial-gradient') || bgUrl.startsWith('conic-gradient')) {
      wallpaperLayer.style.backgroundImage = bgUrl;
      return;
    }

    // If it's a data URL / base64 (e.g. user custom uploaded wallpaper)
    if (bgUrl.startsWith('data:') || bgUrl.startsWith('blob:')) {
      wallpaperLayer.style.backgroundImage = `url("${bgUrl}")`;
      return;
    }

    // Remote URL -> Find fallback gradient preset
    const preset = findWallpaperPreset(bgUrl);
    const fallbackGrad = (preset && preset.fallbackGradient) || 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%)';

    // Immediately set fallback gradient so wallpaper area is never empty or black
    wallpaperLayer.style.backgroundImage = fallbackGrad;

    if (!navigator.onLine) {
      return;
    }

    // Direct Unsplash loading is globally fast and CDN-cached
    let targetUrl = bgUrl;
    const img = new Image();
    let loaded = false;

    img.onload = () => {
      loaded = true;
      wallpaperLayer.style.backgroundImage = `url("${targetUrl}")`;
    };

    img.onerror = () => {
      // In case direct loading failed, try proxy
      const proxied = getProxiedImageUrl(bgUrl);
      if (proxied && proxied !== bgUrl) {
        const backupImg = new Image();
        backupImg.onload = () => {
          wallpaperLayer.style.backgroundImage = `url("${proxied}")`;
        };
        backupImg.src = proxied;
      }
    };

    img.src = targetUrl;
  }

  /* ==========================================================================
     4. Applying Themes & Visual Settings
     ========================================================================== */
  function applySettings() {
    const s = state.settings;
    const body = document.body;

    // Theme Attribute
    body.setAttribute('data-theme', s.theme || 'liquid-glass');

    // Dedicated Liquid Glass Mode (frosted, specular, smoked)
    let gMode = s.glassMode || 'frosted';
    if (gMode === 'blurred' || gMode === 'clear') {
      gMode = 'frosted';
      s.glassMode = 'frosted';
    }
    body.setAttribute('data-glass-mode', gMode);
    const boxLiquidGlass = document.getElementById('box-liquid-glass-options');
    if (boxLiquidGlass) {
      boxLiquidGlass.style.display = (s.theme === 'liquid-glass') ? 'block' : 'none';
    }

    // Dynamic Accent Color & Smart Contrast
    applyAccentColor(s.accentColor || '#3b82f6');

    // Contrast Attribute
    if (s.contrast && s.contrast !== 'auto') {
      body.setAttribute('data-contrast', s.contrast);
    } else {
      body.removeAttribute('data-contrast');
    }

    // Performance Mode for Low-Spec Hardware
    if (s.lowSpecMode) {
      body.classList.add('low-spec-mode');
    } else {
      body.classList.remove('low-spec-mode');
    }

    // Dynamic Root CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--card-size', `${s.cardSize || 120}px`);
    root.style.setProperty('--card-radius', `${s.cardRadius || 22}px`);

    // Icon Size
    let iconPx = 48;
    if (s.iconSize === 'small') iconPx = 38;
    if (s.iconSize === 'large') iconPx = 58;
    root.style.setProperty('--icon-size', `${iconPx}px`);

    // Glass Variables
    const glassOp = (s.glassOpacity !== undefined ? s.glassOpacity : 24) / 100;
    root.style.setProperty('--glass-opacity-high', `${glassOp}`);
    root.style.setProperty('--glass-opacity-low', `${Math.max(0.04, glassOp - 0.12)}`);
    root.style.setProperty('--glass-border-alpha', `${Math.min(0.75, Math.max(0.25, glassOp + 0.18))}`);
    root.style.setProperty('--glass-blur', `${s.glassBlur !== undefined ? s.glassBlur : 32}px`);
    root.style.setProperty('--bg-blur', `${s.bgBlur !== undefined ? s.bgBlur : 0}px`);
    root.style.setProperty('--bg-overlay-opacity', `${(s.overlayOpacity !== undefined ? s.overlayOpacity : 44) / 100}`);

    // Dynamic Wallpaper with Fallback
    applyWallpaper(s.wallpaperUrl);

    // Sync Search Engine UI
    updateSearchEngineUI();

    // Sync Theme Switcher Controls (Header & Settings Modal)
    const activeTheme = s.theme || 'liquid-glass';
    document.querySelectorAll('[data-theme-choice]').forEach((c) => {
      c.classList.toggle('active', c.dataset.themeChoice === activeTheme);
    });
    document.querySelectorAll('#header-theme-switcher .theme-switch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.themeTarget === activeTheme);
    });
  }

  /* ==========================================================================
     5. Date, Clock & Header Greeting
     ========================================================================== */
  function initClockAndDate() {
    function tick() {
      const now = new Date();

      // Digital Clock (English 00:00:00)
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const digitalClockElem = document.getElementById('digital-clock');
      if (digitalClockElem) {
        digitalClockElem.textContent = `${hours}:${minutes}:${seconds}`;
      }

      // Persian Date
      const jDate = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const weekdayName = PERSIAN_WEEKDAY_NAMES[now.getDay()];
      const monthName = JALALI_MONTH_NAMES[jDate.month - 1];
      const persianDateElem = document.getElementById('persian-date');
      if (persianDateElem) {
        persianDateElem.textContent = `${weekdayName}، ${toPersianDigits(jDate.day)} ${monthName} ${toPersianDigits(jDate.year)}`;
      }

      // Greeting
      const h = now.getHours();
      let greeting = 'درود';
      let iconSvg = '<svg class="greeting-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
      if (h >= 5 && h < 12) {
        greeting = 'صبح بخیر';
        iconSvg = '<svg class="greeting-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
      } else if (h >= 12 && h < 17) {
        greeting = 'عصر بخیر';
        iconSvg = '<svg class="greeting-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
      } else if (h >= 17 && h < 21) {
        greeting = 'غروب بخیر';
        iconSvg = '<svg class="greeting-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/></svg>';
      } else {
        greeting = 'شب بخیر';
        iconSvg = '<svg class="greeting-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      }

      const greetText = document.getElementById('greeting-text');
      const greetIcon = document.getElementById('greeting-icon');
      if (greetText) greetText.textContent = greeting;
      if (greetIcon) greetIcon.innerHTML = iconSvg;

      // Update Analog Clock Widget
      updateAnalogClock(now, jDate, weekdayName);
    }

    tick();
    setInterval(tick, 1000);
  }

  function updateTotalBookmarksCounter() {
    const totalCountElem = document.getElementById('total-bookmarks-count');
    if (totalCountElem) {
      const count = state.bookmarks.filter(b => b.type === 'bookmark').length;
      totalCountElem.textContent = `${toPersianDigits(count)} بوکمارک`;
    }
  }

  /* ==========================================================================
     6. Search Bar, Search History & Search Engines
     ========================================================================== */
  function initSearch() {
    const engineBtn = document.getElementById('engine-btn');
    const engineDropdown = document.getElementById('engine-dropdown');
    const searchInput = document.getElementById('search-input');
    const searchSubmitBtn = document.getElementById('search-submit-btn');
    const dropdownList = document.getElementById('engine-dropdown-list');
    const historyDropdown = document.getElementById('search-history-dropdown');
    const btnClearAllHistory = document.getElementById('btn-clear-all-history');

    // Populate search engines list
    if (dropdownList) {
      dropdownList.innerHTML = '';
      Object.entries(SEARCH_ENGINES).forEach(([key, engine]) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.dataset.engineKey = key;
        item.className = `engine-item ${state.settings.searchEngine === key ? 'active' : ''}`;
        item.innerHTML = `<span class="engine-item-icon">${engine.icon}</span><span>${engine.name}</span>`;
        item.addEventListener('click', () => {
          state.settings.searchEngine = key;
          saveSettings();
          updateSearchEngineUI();
          if (engineDropdown) engineDropdown.classList.remove('open');
        });
        dropdownList.appendChild(item);
      });
    }

    if (engineBtn && engineDropdown) {
      engineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        engineDropdown.classList.toggle('open');
        if (historyDropdown) historyDropdown.classList.remove('open');
      });
    }

    // Render Search History Dropdown
    function renderSearchHistoryUI() {
      const listContainer = document.getElementById('search-history-list');
      if (!listContainer) return;
      listContainer.innerHTML = '';

      if (state.searchHistory.length === 0) {
        listContainer.innerHTML = '<div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); padding: 0.75rem 0.5rem; text-align: center;">تاریخچه جستجو خالی است</div>';
        return;
      }

      state.searchHistory.slice(0, 5).forEach((query, index) => {
        const item = document.createElement('div');
        item.className = 'search-history-item';
        item.innerHTML = `
          <div class="history-item-query">
            <span class="history-item-icon">🕒</span>
            <span>${escapeHTML(query)}</span>
          </div>
          <button type="button" class="history-item-delete" title="حذف این مورد">✕</button>
        `;

        item.querySelector('.history-item-query').addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = query;
            executeSearch();
          }
        });

        item.querySelector('.history-item-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          state.searchHistory.splice(index, 1);
          saveSearchHistory();
          renderSearchHistoryUI();
        });

        listContainer.appendChild(item);
      });
    }

    function addSearchHistory(query) {
      if (!query || !query.trim()) return;
      const clean = query.trim();
      state.searchHistory = [clean, ...state.searchHistory.filter(q => q !== clean)].slice(0, 5);
      saveSearchHistory();
      renderSearchHistoryUI();
    }

    if (btnClearAllHistory) {
      btnClearAllHistory.addEventListener('click', (e) => {
        e.stopPropagation();
        state.searchHistory = [];
        saveSearchHistory();
        renderSearchHistoryUI();
      });
    }

    // Search Input Focus/Click for History Dropdown
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        if (engineDropdown) engineDropdown.classList.remove('open');
        renderSearchHistoryUI();
        if (historyDropdown && state.searchHistory.length > 0) {
          historyDropdown.classList.add('open');
        }
      });

      searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
        if (engineDropdown) engineDropdown.classList.remove('open');
        renderSearchHistoryUI();
        if (historyDropdown && state.searchHistory.length > 0) {
          historyDropdown.classList.add('open');
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-section')) {
        if (engineDropdown) engineDropdown.classList.remove('open');
        if (historyDropdown) historyDropdown.classList.remove('open');
      }
    });

    // Live Search & Filter across Bookmarks
    function applyBookmarkLiveFilter(rawQuery) {
      const query = normalizeSearchText(rawQuery);
      const grid = document.getElementById('bookmark-grid');
      if (!grid) return;

      const cards = grid.querySelectorAll('.bookmark-card');
      let visibleCount = 0;

      // Remove existing no-results banner if any
      const existingBanner = document.getElementById('search-no-results-banner');
      if (existingBanner) existingBanner.remove();

      if (!query) {
        // Reset all cards to visible
        cards.forEach((card) => {
          card.classList.remove('filter-hidden');
          card.classList.add('filter-visible');
        });
        return;
      }

      cards.forEach((card) => {
        if (card.classList.contains('add-bookmark-card')) {
          card.classList.add('filter-hidden');
          card.classList.remove('filter-visible');
          return;
        }
        const itemTitle = normalizeSearchText(card.dataset.title || '');
        const itemUrl = normalizeSearchText(card.dataset.url || '');
        const isMatch = itemTitle.includes(query) || itemUrl.includes(query);

        if (isMatch) {
          card.classList.remove('filter-hidden');
          card.classList.add('filter-visible');
          visibleCount++;
        } else {
          card.classList.add('filter-hidden');
          card.classList.remove('filter-visible');
        }
      });

      if (visibleCount === 0 && cards.length > 0) {
        const banner = document.createElement('div');
        banner.id = 'search-no-results-banner';
        banner.className = 'bookmark-search-no-results';
        banner.innerHTML = `
          <div class="no-results-icon">🔍</div>
          <div class="no-results-title">نتیجه‌ای برای «${escapeHTML(rawQuery)}» در این بخش پیدا نشد</div>
          <div class="no-results-desc">برای جستجوی این عبارت در وب، کلید Enter را بزنید یا دکمه جستجو را کلیک کنید.</div>
          <button type="button" class="btn-clear-search-filter" id="btn-clear-search-filter">پاک کردن فیلتر</button>
        `;
        banner.querySelector('#btn-clear-search-filter').addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            applyBookmarkLiveFilter('');
            searchInput.focus();
          }
        });
        grid.appendChild(banner);
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const val = searchInput.value;
        if (val.trim().length > 0 && historyDropdown) {
          historyDropdown.classList.remove('open');
        }
        applyBookmarkLiveFilter(val);
      });
    }

    function executeSearch() {
      const query = (searchInput ? searchInput.value : '').trim();
      if (!query) return;

      addSearchHistory(query);
      if (historyDropdown) historyDropdown.classList.remove('open');
      if (engineDropdown) engineDropdown.classList.remove('open');

      if (!navigator.onLine) {
        showToast('📡 شما در حالت آفلاین هستید. جستجو در وب نیازمند اتصال اینترنت است.');
        return;
      }

      // URL detection (direct navigation)
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
      if (urlPattern.test(query) && !query.includes(' ')) {
        const targetUrl = query.startsWith('http://') || query.startsWith('https://') ? query : `https://${query}`;
        window.open(targetUrl, '_blank');
      } else {
        const engineKey = state.settings.searchEngine || 'google';
        const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;
        window.open(engine.url + encodeURIComponent(query), '_blank');
      }

      // Cleanly clear and reset input, filter, and focus state
      if (searchInput) {
        searchInput.value = '';
        applyBookmarkLiveFilter('');
        searchInput.blur();
      }
    }

    if (searchSubmitBtn) {
      searchSubmitBtn.addEventListener('click', executeSearch);
    }

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeSearch();
        }
      });
    }

    // Reset search on tab return/focus if empty or done
    window.addEventListener('focus', () => {
      if (searchInput && document.activeElement !== searchInput) {
        searchInput.value = '';
        applyBookmarkLiveFilter('');
      }
    });

    renderSearchHistoryUI();
  }

  function updateSearchEngineUI() {
    const engineKey = state.settings.searchEngine || 'google';
    const engine = SEARCH_ENGINES[engineKey] || SEARCH_ENGINES.google;

    const iconElem = document.getElementById('selected-engine-icon');
    const nameElem = document.getElementById('selected-engine-name');
    if (iconElem) iconElem.textContent = engine.icon;
    if (nameElem) nameElem.textContent = engine.name;

    const items = document.querySelectorAll('.engine-item');
    items.forEach((item) => {
      if (item.dataset.engineKey === engineKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     7. Bookmarks Grid, HD Favicons, Folder Badge & Drag & Drop
     ========================================================================== */
  function getHighQualityFavicon(url) {
    try {
      if (!url) return null;
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;
    } catch (e) {
      return null;
    }
  }

  function getFolderChain(folderId) {
    const chain = [];
    let curId = folderId;
    const visited = new Set();
    while (curId && !visited.has(curId)) {
      visited.add(curId);
      const folder = state.bookmarks.find(b => b.id === curId);
      if (!folder) break;
      chain.unshift(folder);
      curId = folder.parentId || null;
    }
    return chain;
  }

  // Mouse Side Buttons Navigation (Back: Button 3 / Forward: Button 4)
  let folderNavHistory = [];
  let folderNavForwardHistory = [];

  function navigateToFolder(targetFolderId, addToHistory = true) {
    if (state.currentFolderId === targetFolderId) return;
    if (addToHistory) {
      folderNavHistory.push(state.currentFolderId);
      folderNavForwardHistory = [];
    }
    state.currentFolderId = targetFolderId;
    renderBookmarks();
  }

  function navigateFolderBack() {
    if (state.currentFolderId) {
      const chain = getFolderChain(state.currentFolderId);
      const parentFolder = chain.length > 1 ? chain[chain.length - 2] : null;
      folderNavForwardHistory.push(state.currentFolderId);
      state.currentFolderId = parentFolder ? parentFolder.id : null;
      renderBookmarks();
      return true;
    }
    return false;
  }

  function navigateFolderForward() {
    if (folderNavForwardHistory.length > 0) {
      const nextId = folderNavForwardHistory.pop();
      folderNavHistory.push(state.currentFolderId);
      state.currentFolderId = nextId;
      renderBookmarks();
      return true;
    }
    return false;
  }

  // Global Mouse Side Buttons Event Listener
  window.addEventListener('mouseup', (e) => {
    // e.button === 3: Mouse Back Button
    if (e.button === 3) {
      if (state.currentFolderId) {
        e.preventDefault();
        e.stopPropagation();
        navigateFolderBack();
      }
    }
    // e.button === 4: Mouse Forward Button
    else if (e.button === 4) {
      if (folderNavForwardHistory.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        navigateFolderForward();
      }
    }
  });

  function renderBookmarks() {
    const grid = document.getElementById('bookmark-grid');
    const breadcrumbNav = document.getElementById('breadcrumb-container');
    if (!grid) return;

    grid.innerHTML = '';

    // Filter items by current folder
    let currentItems = state.bookmarks.filter(item => (item.parentId || null) === (state.currentFolderId || null));

    // Sort: Pinned first, then folders, then bookmarks
    currentItems.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return 0;
    });

    // Update Multi-level Breadcrumb UI
    if (breadcrumbNav) {
      if (state.currentFolderId) {
        breadcrumbNav.style.display = 'flex';
        const chain = getFolderChain(state.currentFolderId);
        const parentFolder = chain.length > 1 ? chain[chain.length - 2] : null;

        let chainHtml = `<span class="breadcrumb-item" data-bc-target="root">صفحه اصلی</span>`;
        chain.forEach((f, idx) => {
          chainHtml += ` <span>/</span> `;
          if (idx === chain.length - 1) {
            chainHtml += `<span class="breadcrumb-item current">${escapeHTML(f.title)}</span>`;
          } else {
            chainHtml += `<span class="breadcrumb-item" data-bc-target="${f.id}">${escapeHTML(f.title)}</span>`;
          }
        });

        breadcrumbNav.innerHTML = `
          <button type="button" class="btn-breadcrumb-back" id="btn-bc-back">← بازگشت</button>
          <div class="breadcrumb-trail" style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            ${chainHtml}
          </div>
        `;

        const btnBack = document.getElementById('btn-bc-back');
        if (btnBack) {
          btnBack.addEventListener('click', () => {
            navigateFolderBack();
          });
        }

        breadcrumbNav.querySelectorAll('.breadcrumb-item[data-bc-target]').forEach((item) => {
          item.addEventListener('click', () => {
            const targetId = item.dataset.bcTarget;
            navigateToFolder(targetId === 'root' ? null : targetId);
          });
        });
      } else {
        breadcrumbNav.style.display = 'none';
      }
    }

    if (currentItems.length === 0) {
      grid.innerHTML = '';
      const emptyAddCard = document.createElement('div');
      emptyAddCard.className = 'bookmark-card add-bookmark-card';
      emptyAddCard.id = 'btn-card-add-bookmark';
      emptyAddCard.setAttribute('role', 'button');
      emptyAddCard.setAttribute('tabindex', '0');
      emptyAddCard.title = 'افزودن اولین بوکمارک یا پوشه (کلید N)';
      emptyAddCard.innerHTML = `
        <div class="add-icon-wrap">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div class="add-card-title">افزودن بوکمارک</div>
        <div class="add-card-subtitle">+ شروع ساخت اولین بوکمارک</div>
      `;
      emptyAddCard.addEventListener('click', () => {
        openAddModal();
      });
      emptyAddCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAddModal();
        }
      });
      grid.appendChild(emptyAddCard);
      return;
    }

    currentItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = `bookmark-card ${item.isPinned ? 'is-pinned' : ''}`;
      card.setAttribute('draggable', 'true');
      card.dataset.id = item.id;
      card.dataset.title = item.title || '';
      card.dataset.url = item.url || '';

      // Icon Display Logic: HD favicon with fallback, or Folder with translucent count badge
      let iconMarkup = '';
      if (item.type === 'folder') {
        const countInside = state.bookmarks.filter(b => b.parentId === item.id).length;
        iconMarkup = `
          <div class="folder-icon-container">
            <span class="folder-base-icon">📁</span>
            <span class="folder-count-badge">${toPersianDigits(countInside)}</span>
          </div>
        `;
      } else {
        const hdIconUrl = item.customIconUrl || getHighQualityFavicon(item.url);
        if (hdIconUrl) {
          iconMarkup = `<img src="${hdIconUrl}" alt="${item.title}" class="bookmark-icon-img" onerror="this.outerHTML='<span class=\\'bookmark-icon-emoji\\'>${item.iconEmoji || '🌐'}</span>'" />`;
        } else {
          iconMarkup = `<span class="bookmark-icon-emoji">${item.iconEmoji || '🌐'}</span>`;
        }
      }

      // Lock Badge if item is password protected
      const hasPinLock = !!(item.pin && item.pin.length === 4);
      const lockBadgeMarkup = hasPinLock ? `
        <span class="bookmark-lock-badge" title="قفل شده با رمز عبور ۴ رقمی">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </span>
      ` : '';

      card.innerHTML = `
        ${lockBadgeMarkup}
        <div class="bookmark-icon-wrap">
          ${iconMarkup}
        </div>
        <div class="bookmark-title" title="${item.title}">${item.title}</div>
        
        <div class="card-actions-overlay">
          <button type="button" class="btn-card-action btn-pin" title="${item.isPinned ? 'حذف پین' : 'پین به اول'}">📌</button>
          <button type="button" class="btn-card-action btn-edit" title="ویرایش">✏️</button>
          <button type="button" class="btn-card-action btn-delete" title="حذف">🗑️</button>
        </div>
      `;

      // Click: Open or Enter Folder (Prompt PIN if locked)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-actions-overlay')) return;

        if (hasPinLock) {
          openPinModal(item);
          return;
        }

        if (item.type === 'folder') {
          navigateToFolder(item.id);
        } else if (item.url) {
          window.open(item.url, '_blank');
        }
      });

      // Actions
      const btnPin = card.querySelector('.btn-pin');
      const btnEdit = card.querySelector('.btn-edit');
      const btnDelete = card.querySelector('.btn-delete');

      if (btnPin) {
        btnPin.addEventListener('click', (e) => {
          e.stopPropagation();
          item.isPinned = !item.isPinned;
          saveBookmarks();
          renderBookmarks();
          showToast(item.isPinned ? 'بوکمارک پین شد' : 'پین برداشته شد');
        });
      }

      if (btnEdit) {
        btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditModal(item.id);
        });
      }

      if (btnDelete) {
        btnDelete.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteItem(item.id);
        });
      }

      // Enhanced Drag & Drop: Group into folder, Create folder on center, or Reorder between
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.id);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.bookmark-card').forEach((c) => {
          c.classList.remove('drag-over-folder', 'drag-over-create-folder', 'drag-over-swap');
        });
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.types.includes('text/plain');
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (item.type === 'folder') {
          // Dropping directly into an existing folder
          card.classList.add('drag-over-folder');
          card.classList.remove('drag-over-create-folder', 'drag-over-swap');
        } else {
          // Regular bookmark: center = create new folder, edges = reorder
          const isCenter = mouseX > rect.width * 0.22 && mouseX < rect.width * 0.78 && mouseY > rect.height * 0.22 && mouseY < rect.height * 0.78;
          if (isCenter) {
            card.classList.add('drag-over-create-folder');
            card.classList.remove('drag-over-folder', 'drag-over-swap');
          } else {
            card.classList.add('drag-over-swap');
            card.classList.remove('drag-over-folder', 'drag-over-create-folder');
          }
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over-folder', 'drag-over-create-folder', 'drag-over-swap');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const wasCreateFolder = card.classList.contains('drag-over-create-folder');
        const wasFolder = card.classList.contains('drag-over-folder') || item.type === 'folder';
        card.classList.remove('drag-over-folder', 'drag-over-create-folder', 'drag-over-swap');

        const draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId || draggedId === item.id) return;

        const draggedItem = state.bookmarks.find((b) => b.id === draggedId);
        if (!draggedItem) return;

        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const isCenter = mouseX > rect.width * 0.22 && mouseX < rect.width * 0.78 && mouseY > rect.height * 0.22 && mouseY < rect.height * 0.78;

        if (item.type === 'folder') {
          // Drop inside existing folder
          draggedItem.parentId = item.id;
          saveBookmarks();
          renderBookmarks();
          showToast(`«${draggedItem.title}» به پوشه «${item.title}» منتقل شد`);
        } else if (wasCreateFolder || isCenter) {
          // Drop directly onto center of another bookmark -> create a brand new combined folder
          const newFolderId = 'folder_' + Date.now();
          const newFolder = {
            id: newFolderId,
            type: 'folder',
            title: `پوشه ${item.title}`,
            iconEmoji: '📁',
            parentId: state.currentFolderId || null,
            isPinned: false
          };
          item.parentId = newFolderId;
          draggedItem.parentId = newFolderId;
          state.bookmarks.push(newFolder);
          saveBookmarks();
          renderBookmarks();
          showToast(`پوشه جدید «${newFolder.title}» ایجاد شد`);
        } else {
          // Move / reorder between bookmarks
          const draggedIndex = state.bookmarks.findIndex((b) => b.id === draggedId);
          if (draggedIndex > -1) {
            const [movedItem] = state.bookmarks.splice(draggedIndex, 1);
            let targetIndex = state.bookmarks.findIndex((b) => b.id === item.id);
            if (targetIndex > -1) {
              // In RTL, mouse on right half is before target, left half is after target
              const insertAfter = mouseX < rect.width * 0.5 ? 1 : 0;
              state.bookmarks.splice(targetIndex + insertAfter, 0, movedItem);
            } else {
              state.bookmarks.push(movedItem);
            }
            saveBookmarks();
            renderBookmarks();
            showToast('ترتیب بوکمارک‌ها جابه‌جا شد');
          }
        }
      });

      grid.appendChild(card);
    });

    // Dedicated Add Card styled identically to the other bookmark cards, placed right after the last card
    const addCard = document.createElement('div');
    addCard.className = 'bookmark-card add-bookmark-card';
    addCard.id = 'btn-card-add-bookmark';
    addCard.setAttribute('role', 'button');
    addCard.setAttribute('tabindex', '0');
    addCard.title = 'افزودن بوکمارک یا پوشه جدید (کلید N)';
    addCard.innerHTML = `
      <div class="add-icon-wrap">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <div class="add-card-title">افزودن بوکمارک</div>
      <div class="add-card-subtitle">+ پوشه یا سایت</div>
    `;
    addCard.addEventListener('click', () => {
      openAddModal();
    });
    addCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAddModal();
      }
    });
    grid.appendChild(addCard);

    const searchInputElem = document.getElementById('search-input');
    if (searchInputElem && searchInputElem.value.trim().length > 0) {
      searchInputElem.dispatchEvent(new Event('input'));
    }
  }

  function deleteItem(id) {
    const item = state.bookmarks.find(b => b.id === id);
    if (!item) return;
    state.bookmarks = state.bookmarks.filter(b => b.id !== id && b.parentId !== id);
    saveBookmarks();
    renderBookmarks();
    showToast('آیتم حذف شد');
  }

  /* ==========================================================================
     8. Modals (Add, Edit, Settings)
     ========================================================================== */
  function initModals() {
    // Universal Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeAllModals();
      });
    });

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeAllModals();
        }
      });
    });

    // Escape Key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });

    // Add Modal Open Button
    const btnOpenAdd = document.getElementById('btn-open-add');
    if (btnOpenAdd) {
      btnOpenAdd.addEventListener('click', openAddModal);
    }

    // Settings Modal Open Button
    const btnOpenSettings = document.getElementById('btn-open-settings');
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        openSettingsModal();
      });
    }

    // Header Profile Button
    const btnHeaderProfile = document.getElementById('btn-header-profile');
    if (btnHeaderProfile) {
      btnHeaderProfile.addEventListener('click', () => {
        openSettingsModal();
        switchSettingsTab('account');
      });
    }

    // Add Form Submit
    const addForm = document.getElementById('add-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = (document.getElementById('add-title')?.value || '').trim();
        const url = (document.getElementById('add-url')?.value || '').trim();
        const isFolder = document.getElementById('seg-add-folder')?.classList.contains('active');
        const parentId = document.getElementById('add-folder-select')?.value || null;

        if (!title) return;

        const newItem = {
          id: 'bm_' + Date.now(),
          type: isFolder ? 'folder' : 'bookmark',
          title: title,
          url: isFolder ? null : (url.startsWith('http') ? url : `https://${url}`),
          iconEmoji: state.selectedAddEmoji || (isFolder ? '📁' : '🌐'),
          parentId: parentId === 'root' ? null : parentId,
          isPinned: false
        };

        state.bookmarks.push(newItem);
        saveBookmarks();
        renderBookmarks();
        closeAllModals();
        showToast(isFolder ? 'پوشه جدید ایجاد شد' : 'بوکمارک ذخیره شد');
      });
    }

    // Edit Form Submit
    const editForm = document.getElementById('edit-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = state.bookmarks.find(b => b.id === state.editingItemId);
        if (!item) return;

        const title = (document.getElementById('edit-title')?.value || '').trim();
        const url = (document.getElementById('edit-url')?.value || '').trim();
        const iconUrl = (document.getElementById('edit-icon-url')?.value || '').trim();

        // 🔐 Handle 4-Digit PIN Protection
        const isLockEnabled = document.getElementById('toggle-edit-lock')?.checked;
        const pinInputVal = (document.getElementById('edit-pin-input')?.value || '').trim();

        if (isLockEnabled) {
          if (!/^\d{4}$/.test(pinInputVal)) {
            showToast('⚠️ رمز عبور باید دقیقاً یک عدد ۴ رقمی باشد (مثلاً ۱۲۳۴)');
            return;
          }
          item.pin = pinInputVal;
        } else {
          item.pin = null;
        }

        item.title = title || item.title;
        if (item.type !== 'folder') {
          item.url = url ? (url.startsWith('http') ? url : `https://${url}`) : item.url;
        }
        item.customIconUrl = iconUrl || null;
        item.iconEmoji = state.selectedEditEmoji || item.iconEmoji;

        saveBookmarks();
        renderBookmarks();
        closeAllModals();
        showToast(item.pin ? '🔒 تغییرات و رمز عبور ذخیره شد' : 'تغییرات ذخیره شد');
      });
    }

    // Toggle Edit Lock Switch & Visibility
    const toggleEditLock = document.getElementById('toggle-edit-lock');
    const editPinContainer = document.getElementById('edit-pin-container');
    const editPinInput = document.getElementById('edit-pin-input');
    const btnTogglePinVis = document.getElementById('btn-toggle-pin-visibility');

    if (toggleEditLock) {
      toggleEditLock.addEventListener('change', (e) => {
        if (editPinContainer) {
          editPinContainer.style.display = e.target.checked ? 'block' : 'none';
        }
        if (e.target.checked && editPinInput) {
          editPinInput.focus();
        }
      });
    }

    if (btnTogglePinVis && editPinInput) {
      btnTogglePinVis.addEventListener('click', () => {
        if (editPinInput.type === 'password') {
          editPinInput.type = 'text';
          btnTogglePinVis.textContent = '🙈';
        } else {
          editPinInput.type = 'password';
          btnTogglePinVis.textContent = '👁️';
        }
      });
    }

    initPinUnlockControls();

    // Add Modal: Bookmark vs Folder Toggle
    const segAddSite = document.getElementById('seg-add-site');
    const segAddFolder = document.getElementById('seg-add-folder');
    const addUrlGroup = document.getElementById('add-url-group');

    if (segAddSite && segAddFolder) {
      segAddSite.addEventListener('click', () => {
        segAddSite.classList.add('active');
        segAddFolder.classList.remove('active');
        if (addUrlGroup) addUrlGroup.style.display = 'flex';
      });

      segAddFolder.addEventListener('click', () => {
        segAddFolder.classList.add('active');
        segAddSite.classList.remove('active');
        if (addUrlGroup) addUrlGroup.style.display = 'none';
      });
    }

    // Populate Emoji Pickers
    populateEmojiPicker('add-emoji-picker', (emoji) => { state.selectedAddEmoji = emoji; });
    populateEmojiPicker('edit-emoji-picker', (emoji) => { state.selectedEditEmoji = emoji; });

    // Settings Tabs
    const settingsTabs = document.querySelectorAll('.settings-tab-btn');
    settingsTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        switchSettingsTab(targetTab);
      });
    });

    initSettingsControls();
    initAccountControls();
  }

  function switchSettingsTab(tabName) {
    if (!tabName) return;
    const settingsTabs = document.querySelectorAll('.settings-tab-btn');
    settingsTabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    document.querySelectorAll('.settings-tab-panel').forEach((panel) => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`tab-content-${tabName}`);
    if (targetPanel) targetPanel.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.classList.remove('open');
    });
    state.editingItemId = null;
  }

  function populateFolderSelect(selectElement, selectedFolderId, excludeItemId = null) {
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="root">صفحه اصلی (بدون پوشه)</option>';

    function appendOptions(parentId = null, depth = 0) {
      const folders = state.bookmarks.filter(b => b.type === 'folder' && (b.parentId || null) === (parentId || null));
      folders.forEach((folder) => {
        if (excludeItemId && folder.id === excludeItemId) return;
        const opt = document.createElement('option');
        opt.value = folder.id;
        const indent = depth > 0 ? '　'.repeat(depth) + '↳ ' : '';
        opt.textContent = `${indent}📁 ${folder.title}`;
        if (folder.id === selectedFolderId) opt.selected = true;
        selectElement.appendChild(opt);
        appendOptions(folder.id, depth + 1);
      });
    }
    appendOptions(null, 0);
  }

  function openAddModal() {
    const modal = document.getElementById('add-modal');
    if (!modal) return;

    // Reset fields
    const titleInput = document.getElementById('add-title');
    const urlInput = document.getElementById('add-url');
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';

    // Folder Selector Options with Nested Hierarchy
    const folderSelect = document.getElementById('add-folder-select');
    populateFolderSelect(folderSelect, state.currentFolderId);

    state.selectedAddEmoji = '🌐';
    modal.classList.add('open');
  }

  function openEditModal(id, isVerified = false) {
    const item = state.bookmarks.find(b => b.id === id);
    if (!item) return;

    // 🔐 Security check: If item has a 4-digit PIN and user hasn't verified it yet, prompt PIN first!
    if (item.pin && item.pin.length === 4 && !isVerified) {
      openPinModal(item, 'edit');
      return;
    }

    state.editingItemId = id;

    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    const titleInput = document.getElementById('edit-title');
    const urlInput = document.getElementById('edit-url');
    const iconUrlInput = document.getElementById('edit-icon-url');
    const urlGroup = document.getElementById('edit-url-group');

    const toggleLock = document.getElementById('toggle-edit-lock');
    const pinContainer = document.getElementById('edit-pin-container');
    const pinInput = document.getElementById('edit-pin-input');
    const btnTogglePinVis = document.getElementById('btn-toggle-pin-visibility');

    if (titleInput) titleInput.value = item.title || '';
    if (urlInput) urlInput.value = item.url || '';
    if (iconUrlInput) iconUrlInput.value = item.customIconUrl || '';

    if (urlGroup) {
      urlGroup.style.display = item.type === 'folder' ? 'none' : 'flex';
    }

    const hasPin = !!(item.pin && item.pin.length === 4);
    if (toggleLock) toggleLock.checked = hasPin;
    if (pinContainer) pinContainer.style.display = hasPin ? 'block' : 'none';
    if (pinInput) {
      pinInput.value = item.pin || '';
      pinInput.type = 'password';
    }
    if (btnTogglePinVis) btnTogglePinVis.textContent = '👁️';

    state.selectedEditEmoji = item.iconEmoji || '🌐';
    modal.classList.add('open');
  }

  /* ==========================================================================
     PIN Protection & Verification Modal Logic
     ========================================================================== */
  let currentUnlockingItem = null;
  let currentUnlockMode = 'open'; // 'open' or 'edit'

  function openPinModal(item, mode = 'open') {
    if (!item) return;
    currentUnlockingItem = item;
    currentUnlockMode = mode;

    const modal = document.getElementById('pin-modal');
    if (!modal) return;

    const headerIcon = document.getElementById('pin-modal-header-icon');
    const headerText = document.getElementById('pin-modal-header-text');
    const titleElem = document.getElementById('pin-modal-title');
    const subtitleElem = document.getElementById('pin-modal-subtitle');
    const iconWrap = document.getElementById('pin-modal-icon-wrap');
    const errorMsg = document.getElementById('pin-error-msg');
    const digitsContainer = document.getElementById('pin-digits-container');
    const digitInputs = document.querySelectorAll('.pin-digit-input');
    const submitIcon = document.getElementById('pin-modal-submit-icon');
    const submitText = document.getElementById('pin-modal-submit-text');

    if (mode === 'edit') {
      if (headerIcon) headerIcon.textContent = '✏️';
      if (headerText) headerText.textContent = 'احراز هویت جهت ویرایش';
      if (subtitleElem) {
        subtitleElem.textContent = 'برای دسترسی به تنظیمات ویرایش و تغییر یا غیرفعال‌سازی رمز، لطفاً رمز ۴ رقمی فعلی را وارد کنید:';
      }
      if (submitIcon) submitIcon.textContent = '✏️';
      if (submitText) submitText.textContent = 'تایید و ورود به ویرایش';
    } else {
      if (headerIcon) headerIcon.textContent = '🔐';
      if (headerText) headerText.textContent = 'ورود رمز عبور امنیتی';
      if (subtitleElem) {
        subtitleElem.textContent = item.type === 'folder' 
          ? 'لطفاً رمز عبور ۴ رقمی این پوشه را وارد کنید:' 
          : 'لطفاً رمز عبور ۴ رقمی این بوکمارک را وارد کنید:';
      }
      if (submitIcon) submitIcon.textContent = '🔓';
      if (submitText) submitText.textContent = 'تایید و بازگشایی';
    }

    if (titleElem) titleElem.textContent = item.title || (item.type === 'folder' ? 'پوشه قفل شده' : 'بوکمارک قفل شده');

    if (iconWrap) {
      if (item.type === 'folder') {
        iconWrap.innerHTML = '📁';
      } else {
        const hdIcon = item.customIconUrl || (item.url ? getHighQualityFavicon(item.url) : null);
        if (hdIcon) {
          iconWrap.innerHTML = `<img src="${hdIcon}" alt="" style="width: 70%; height: 70%; object-fit: contain; border-radius: 6px;" onerror="this.outerHTML='<span>${item.iconEmoji || '🌐'}</span>'" />`;
        } else {
          iconWrap.textContent = item.iconEmoji || '🌐';
        }
      }
    }

    if (errorMsg) errorMsg.textContent = '';
    if (digitsContainer) digitsContainer.classList.remove('shake');

    digitInputs.forEach(input => {
      input.value = '';
      input.classList.remove('filled');
    });

    modal.classList.add('open');

    // Auto-focus first digit
    setTimeout(() => {
      if (digitInputs[0]) digitInputs[0].focus();
    }, 120);
  }

  function initPinUnlockControls() {
    const digitInputs = Array.from(document.querySelectorAll('.pin-digit-input'));
    const form = document.getElementById('pin-unlock-form');
    const errorMsg = document.getElementById('pin-error-msg');
    const digitsContainer = document.getElementById('pin-digits-container');

    digitInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val.slice(-1) : '';

        if (e.target.value) {
          input.classList.add('filled');
          if (index < digitInputs.length - 1) {
            digitInputs[index + 1].focus();
          } else {
            verifyEnteredPin();
          }
        } else {
          input.classList.remove('filled');
        }
        if (errorMsg) errorMsg.textContent = '';
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          digitInputs[index - 1].focus();
          digitInputs[index - 1].value = '';
          digitInputs[index - 1].classList.remove('filled');
        } else if (e.key === 'ArrowLeft' && index > 0) {
          digitInputs[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < digitInputs.length - 1) {
          digitInputs[index + 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text') || '';
        const digits = pasteData.replace(/\D/g, '').slice(0, 4).split('');
        if (digits.length > 0) {
          digits.forEach((digit, i) => {
            if (digitInputs[i]) {
              digitInputs[i].value = digit;
              digitInputs[i].classList.add('filled');
            }
          });
          const nextIdx = Math.min(digits.length, digitInputs.length - 1);
          digitInputs[nextIdx].focus();
          if (digits.length === 4) {
            verifyEnteredPin();
          }
        }
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        verifyEnteredPin();
      });
    }

    function verifyEnteredPin() {
      if (!currentUnlockingItem) return;
      const enteredCode = digitInputs.map(inp => inp.value).join('');

      if (enteredCode.length < 4) {
        if (errorMsg) errorMsg.textContent = 'لطفاً هر ۴ رقم رمز عبور را وارد نمایید';
        return;
      }

      if (enteredCode === currentUnlockingItem.pin) {
        const itemToOpen = currentUnlockingItem;
        const mode = currentUnlockMode;
        currentUnlockingItem = null;
        closeAllModals();

        if (mode === 'edit') {
          showToast('🔓 هویت تایید شد');
          openEditModal(itemToOpen.id, true);
        } else {
          showToast('🔓 قفل با موفقیت باز شد');
          if (itemToOpen.type === 'folder') {
            state.currentFolderId = itemToOpen.id;
            renderBookmarks();
          } else if (itemToOpen.url) {
            window.open(itemToOpen.url, '_blank');
          }
        }
      } else {
        if (errorMsg) errorMsg.textContent = '⚠️ رمز عبور ۴ رقمی نادرست است';
        if (digitsContainer) {
          digitsContainer.classList.remove('shake');
          void digitsContainer.offsetWidth;
          digitsContainer.classList.add('shake');
        }
        digitInputs.forEach(inp => {
          inp.value = '';
          inp.classList.remove('filled');
        });
        if (digitInputs[0]) digitInputs[0].focus();
      }
    }
  }

  function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    renderUserProfile();
    syncSettingsToUI();
    modal.classList.add('open');
  }

  function setInputError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (input) {
      if (message) input.classList.add('has-error');
      else input.classList.remove('has-error');
    }
    if (errorEl) {
      errorEl.textContent = message || '';
    }
    return !message;
  }

  function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    form.querySelectorAll('.form-error-msg').forEach(el => { el.textContent = ''; });
  }

  function initAccountControls() {
    let regCountdownTimer = null;
    let forgotCountdownTimer = null;
    let lastRegisteredEmail = '';
    let lastForgotEmail = '';

    // Helper: calculate password strength (0 to 100)
    function calculatePasswordStrength(pass) {
      if (!pass) return { score: 0, label: '', color: '' };
      let score = 0;
      if (pass.length >= 6) score += 25;
      if (pass.length >= 8) score += 15;
      if (/[A-Z]/.test(pass)) score += 15;
      if (/[a-z]/.test(pass)) score += 15;
      if (/[0-9]/.test(pass)) score += 15;
      if (/[^A-Za-z0-9]/.test(pass)) score += 15;

      if (score < 40) return { score: Math.max(score, 20), label: 'رمز ضعیف', color: '#f43f5e' };
      if (score < 70) return { score, label: 'رمز متوسط', color: '#f59e0b' };
      if (score < 90) return { score, label: 'رمز قوی', color: '#3b82f6' };
      return { score: 100, label: 'بسیار قوی و امن', color: '#10b981' };
    }

    // Helper: Switch Auth Panels ('login', 'register', 'forgot')
    function setAuthView(mode) {
      const switcher = document.getElementById('auth-mode-switcher');
      const loginPanel = document.getElementById('auth-login-panel');
      const registerPanel = document.getElementById('auth-register-panel');
      const forgotPanel = document.getElementById('auth-forgot-panel');
      const btnLoginTab = document.getElementById('btn-auth-mode-login');
      const btnRegTab = document.getElementById('btn-auth-mode-register');

      clearAllErrors('auth-login-panel');
      clearAllErrors('auth-register-panel');
      clearAllErrors('auth-forgot-panel');

      const alertLoginErr = document.getElementById('alert-login-error');
      const alertLoginSucc = document.getElementById('alert-login-success');
      if (alertLoginErr) alertLoginErr.style.display = 'none';
      if (alertLoginSucc) alertLoginSucc.style.display = 'none';

      const alertRegErr = document.getElementById('alert-register-error');
      const alertRegSucc = document.getElementById('alert-register-success');
      if (alertRegErr) alertRegErr.style.display = 'none';
      if (alertRegSucc) alertRegSucc.style.display = 'none';

      const alertForgotErr = document.getElementById('alert-forgot-error');
      const alertForgotSucc = document.getElementById('alert-forgot-success');
      if (alertForgotErr) alertForgotErr.style.display = 'none';
      if (alertForgotSucc) alertForgotSucc.style.display = 'none';

      if (mode === 'login') {
        if (switcher) switcher.style.display = 'flex';
        if (btnLoginTab) btnLoginTab.classList.add('active');
        if (btnRegTab) btnRegTab.classList.remove('active');
        if (loginPanel) loginPanel.style.display = 'flex';
        if (registerPanel) registerPanel.style.display = 'none';
        if (forgotPanel) forgotPanel.style.display = 'none';
      } else if (mode === 'register') {
        if (switcher) switcher.style.display = 'flex';
        if (btnRegTab) btnRegTab.classList.add('active');
        if (btnLoginTab) btnLoginTab.classList.remove('active');
        if (loginPanel) loginPanel.style.display = 'none';
        if (registerPanel) registerPanel.style.display = 'flex';
        if (forgotPanel) forgotPanel.style.display = 'none';
        const s1 = document.getElementById('register-step-1');
        const s2 = document.getElementById('register-step-2');
        if (s1) s1.style.display = 'block';
        if (s2) s2.style.display = 'none';
      } else if (mode === 'forgot') {
        if (switcher) switcher.style.display = 'none';
        if (loginPanel) loginPanel.style.display = 'none';
        if (registerPanel) registerPanel.style.display = 'none';
        if (forgotPanel) forgotPanel.style.display = 'flex';
        const fs1 = document.getElementById('forgot-step-1');
        const fs2 = document.getElementById('forgot-step-2');
        if (fs1) fs1.style.display = 'block';
        if (fs2) fs2.style.display = 'none';
      }
    }

    // 0. Listen to live Firebase Auth state changes
    try {
      subscribeToAuthState((user) => {
        if (user) {
          const emailName = user.email ? user.email.split('@')[0] : 'user';
          state.userProfile = {
            ...state.userProfile,
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || emailName || 'کاربر',
            username: emailName,
            emailVerified: !!user.emailVerified,
            avatarUrl: user.photoURL || state.userProfile.avatarUrl || '',
            isLoggedIn: true
          };
          saveUserProfile();
          renderUserProfile();
        } else {
          state.userProfile = {
            ...DEFAULT_USER_PROFILE,
            isLoggedIn: false
          };
          saveUserProfile();
          renderUserProfile();
        }
      });
    } catch (e) {
      console.warn('Firebase subscribe notice:', e);
    }

    // 1. Password Visibility Toggle Buttons
    document.querySelectorAll('.btn-toggle-password').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.dataset.target;
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          const isPass = targetInput.type === 'password';
          targetInput.type = isPass ? 'text' : 'password';
          btn.textContent = isPass ? '🙈' : '👁️';
        }
      });
    });

    // 2. Header Auth Integration (Open Login / Settings)
    const btnHeaderLogin = document.getElementById('btn-header-login');
    if (btnHeaderLogin) {
      btnHeaderLogin.addEventListener('click', () => {
        openSettingsModal();
        switchSettingsTab('account');
        setAuthView('login');
      });
    }

    const headerUserChip = document.getElementById('header-user-chip');
    if (headerUserChip) {
      headerUserChip.addEventListener('click', (e) => {
        if (e.target.closest('#btn-header-logout')) return;
        openSettingsModal();
        switchSettingsTab('account');
      });
    }

    const btnHeaderLogout = document.getElementById('btn-header-logout');
    if (btnHeaderLogout) {
      btnHeaderLogout.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await logoutUser();
          showToast('🚪 با موفقیت از حساب کاربری خارج شدید');
        } catch (err) {
          showToast(translateFirebaseError(err));
        }
      });
    }

    // 3. Profile Header Quick Action Buttons
    const btnQuickEdit = document.getElementById('btn-quick-edit-profile');
    if (btnQuickEdit) {
      btnQuickEdit.addEventListener('click', () => {
        switchSettingsTab('account');
        const inputDisp = document.getElementById('input-edit-displayname');
        if (inputDisp) {
          inputDisp.focus();
          inputDisp.select();
        }
      });
    }

    const btnQuickLogout = document.getElementById('btn-quick-logout-profile');
    if (btnQuickLogout) {
      btnQuickLogout.addEventListener('click', async () => {
        try {
          await logoutUser();
          setAuthView('login');
          showToast('🚪 با موفقیت از حساب کاربری خارج شدید');
        } catch (err) {
          showToast(translateFirebaseError(err));
        }
      });
    }

    // 4. Tab Switchers between Login / Register / Forgot
    const btnAuthLogin = document.getElementById('btn-auth-mode-login');
    const btnAuthRegister = document.getElementById('btn-auth-mode-register');
    if (btnAuthLogin) btnAuthLogin.addEventListener('click', () => setAuthView('login'));
    if (btnAuthRegister) btnAuthRegister.addEventListener('click', () => setAuthView('register'));

    const btnSwitchToReg = document.getElementById('btn-switch-to-register-link');
    if (btnSwitchToReg) btnSwitchToReg.addEventListener('click', () => setAuthView('register'));

    const btnSwitchToLogin = document.getElementById('btn-switch-to-login-link');
    if (btnSwitchToLogin) btnSwitchToLogin.addEventListener('click', () => setAuthView('login'));

    const btnForgotLink = document.getElementById('btn-forgot-password-link');
    if (btnForgotLink) btnForgotLink.addEventListener('click', () => setAuthView('forgot'));

    const btnForgotBackLogin = document.getElementById('btn-forgot-back-to-login');
    if (btnForgotBackLogin) btnForgotBackLogin.addEventListener('click', () => setAuthView('login'));

    // 5. Live Form Validation & Password Strength Indicator in Sign Up
    const regPassInput = document.getElementById('reg-input-pass');
    const regConfPassInput = document.getElementById('reg-input-confpass');
    const regEmailInput = document.getElementById('reg-input-email');
    const regStrengthBox = document.getElementById('reg-pass-strength');
    const regStrengthFill = document.getElementById('reg-strength-fill');
    const regStrengthText = document.getElementById('reg-strength-text');

    if (regPassInput) {
      regPassInput.addEventListener('input', () => {
        const val = regPassInput.value;
        if (!val) {
          if (regStrengthBox) regStrengthBox.style.display = 'none';
          setInputError('reg-input-pass', 'err-reg-pass', '');
          return;
        }

        if (regStrengthBox) regStrengthBox.style.display = 'flex';
        const str = calculatePasswordStrength(val);
        if (regStrengthFill) {
          regStrengthFill.style.width = `${str.score}%`;
          regStrengthFill.style.background = str.color;
        }
        if (regStrengthText) {
          regStrengthText.textContent = `قدرت رمز: ${str.label}`;
          regStrengthText.style.color = str.color;
        }

        if (val.length < 6) {
          setInputError('reg-input-pass', 'err-reg-pass', 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
        } else {
          setInputError('reg-input-pass', 'err-reg-pass', '');
        }

        if (regConfPassInput && regConfPassInput.value) {
          if (regConfPassInput.value !== val) {
            setInputError('reg-input-confpass', 'err-reg-confpass', 'رمز عبور با تکرار آن یکسان نیست.');
          } else {
            setInputError('reg-input-confpass', 'err-reg-confpass', '');
          }
        }
      });
    }

    if (regConfPassInput) {
      regConfPassInput.addEventListener('input', () => {
        const pass = regPassInput ? regPassInput.value : '';
        const conf = regConfPassInput.value;
        if (!conf) {
          setInputError('reg-input-confpass', 'err-reg-confpass', '');
          return;
        }
        if (pass !== conf) {
          setInputError('reg-input-confpass', 'err-reg-confpass', 'رمز عبور با تکرار آن یکسان نیست.');
        } else {
          setInputError('reg-input-confpass', 'err-reg-confpass', '');
        }
      });
    }

    if (regEmailInput) {
      regEmailInput.addEventListener('input', () => {
        const email = regEmailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
          setInputError('reg-input-email', 'err-reg-email', '');
          return;
        }
        if (!emailRegex.test(email)) {
          setInputError('reg-input-email', 'err-reg-email', 'فرمت آدرس ایمیل نامعتبر است (مثال: name@domain.com)');
        } else {
          setInputError('reg-input-email', 'err-reg-email', '');
        }
      });
    }

    // 6. Registration Flow: createUserWithEmailAndPassword + sendEmailVerification
    function startRegisterCooldownTimer() {
      if (regCountdownTimer) clearInterval(regCountdownTimer);
      let timeLeft = 60;
      const countdownElem = document.getElementById('reg-countdown');
      const btnResend = document.getElementById('btn-reg-resend-email');
      if (btnResend) btnResend.disabled = true;

      function updateUI() {
        if (countdownElem) {
          const s = timeLeft < 10 ? `۰${toPersianDigits(timeLeft)}` : toPersianDigits(timeLeft);
          countdownElem.textContent = `۰۰:${s}`;
        }
      }
      updateUI();

      regCountdownTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(regCountdownTimer);
          if (countdownElem) countdownElem.textContent = '۰۰:۰۰';
          if (btnResend) btnResend.disabled = false;
        } else {
          updateUI();
        }
      }, 1000);
    }

    const formRegister = document.getElementById('form-account-register');
    if (formRegister) {
      formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('reg-input-name');
        const emailInput = document.getElementById('reg-input-email');
        const passInput = document.getElementById('reg-input-pass');
        const confInput = document.getElementById('reg-input-confpass');
        const alertErr = document.getElementById('alert-register-error');
        const alertSucc = document.getElementById('alert-register-success');
        const submitBtn = document.getElementById('btn-submit-register');
        const submitText = document.getElementById('btn-register-text');

        if (alertErr) alertErr.style.display = 'none';
        if (alertSucc) alertSucc.style.display = 'none';

        const nameVal = (nameInput?.value || '').trim();
        const emailVal = (emailInput?.value || '').trim().toLowerCase();
        const passVal = (passInput?.value || '').trim();
        const confVal = (confInput?.value || '').trim();

        let isValid = true;
        if (!nameVal) {
          setInputError('reg-input-name', 'err-reg-name', 'لطفاً نام و نام خانوادگی را وارد کنید.');
          isValid = false;
        } else {
          setInputError('reg-input-name', 'err-reg-name', '');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
          setInputError('reg-input-email', 'err-reg-email', 'لطفاً آدرس ایمیل را وارد کنید.');
          isValid = false;
        } else if (!emailRegex.test(emailVal)) {
          setInputError('reg-input-email', 'err-reg-email', 'فرمت آدرس ایمیل نامعتبر است.');
          isValid = false;
        } else {
          setInputError('reg-input-email', 'err-reg-email', '');
        }

        if (!passVal) {
          setInputError('reg-input-pass', 'err-reg-pass', 'لطفاً رمز عبور را وارد کنید.');
          isValid = false;
        } else if (passVal.length < 6) {
          setInputError('reg-input-pass', 'err-reg-pass', 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
          isValid = false;
        } else {
          setInputError('reg-input-pass', 'err-reg-pass', '');
        }

        if (!confVal) {
          setInputError('reg-input-confpass', 'err-reg-confpass', 'لطفاً تکرار رمز عبور را وارد کنید.');
          isValid = false;
        } else if (passVal !== confVal) {
          setInputError('reg-input-confpass', 'err-reg-confpass', 'رمز عبور با تکرار آن یکسان نیست.');
          isValid = false;
        } else {
          setInputError('reg-input-confpass', 'err-reg-confpass', '');
        }

        if (!isValid) return;

        if (!isFirebaseConfigured) {
          if (alertErr) {
            alertErr.textContent = 'تنظیمات Firebase در فایل .env تعریف نشده است. لطفاً کلیدهای VITE_FIREBASE_* را وارد نمایید.';
            alertErr.style.display = 'flex';
          }
          return;
        }

        try {
          if (submitBtn) submitBtn.disabled = true;
          if (submitText) submitText.textContent = 'در حال ایجاد حساب و ارسال لینک فعال‌سازی...';

          lastRegisteredEmail = emailVal;
          await registerWithEmail(emailVal, passVal, nameVal);

          const s1 = document.getElementById('register-step-1');
          const s2 = document.getElementById('register-step-2');
          const targetEmailText = document.getElementById('register-target-email-text');
          if (targetEmailText) targetEmailText.textContent = emailVal;

          if (s1) s1.style.display = 'none';
          if (s2) s2.style.display = 'block';

          startRegisterCooldownTimer();
          showToast('✨ ثبت‌نام با موفقیت انجام شد و لینک فعال‌سازی ارسال گردید');
        } catch (err) {
          const errMsg = translateFirebaseError(err);
          if (alertErr) {
            alertErr.textContent = errMsg;
            alertErr.style.display = 'flex';
          }
          showToast(errMsg);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitText) submitText.textContent = 'ثبت‌نام و ارسال ایمیل تأیید';
        }
      });
    }

    // Resend Verification Email Button in Register Screen
    const btnRegResend = document.getElementById('btn-reg-resend-email');
    if (btnRegResend) {
      btnRegResend.addEventListener('click', async () => {
        try {
          btnRegResend.disabled = true;
          await resendVerificationEmail();
          startRegisterCooldownTimer();
          showToast('📩 لینک فعال‌سازی مجدداً به ایمیل شما ارسال شد');
        } catch (err) {
          showToast(translateFirebaseError(err));
          btnRegResend.disabled = false;
        }
      });
    }

    // Go to Login from Register Success
    const btnRegGotoLogin = document.getElementById('btn-reg-goto-login');
    if (btnRegGotoLogin) {
      btnRegGotoLogin.addEventListener('click', () => {
        setAuthView('login');
        if (lastRegisteredEmail) {
          const loginUserInput = document.getElementById('login-input-email');
          if (loginUserInput) loginUserInput.value = lastRegisteredEmail;
        }
      });
    }

    // Go to Dashboard from Register Success
    const btnRegGotoDashboard = document.getElementById('btn-reg-goto-dashboard');
    if (btnRegGotoDashboard) {
      btnRegGotoDashboard.addEventListener('click', () => {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.remove('open');
      });
    }

    // 7. Login Flow: signInWithEmailAndPassword
    const formLogin = document.getElementById('form-account-login');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = document.getElementById('login-input-email');
        const passInput = document.getElementById('login-input-pass');
        const alertErr = document.getElementById('alert-login-error');
        const alertSucc = document.getElementById('alert-login-success');
        const submitBtn = document.getElementById('btn-submit-login');
        const submitText = document.getElementById('btn-login-text');

        const emailVal = (userInput?.value || '').trim();
        const passVal = (passInput?.value || '').trim();

        if (alertErr) alertErr.style.display = 'none';
        if (alertSucc) alertSucc.style.display = 'none';

        let isValid = true;
        if (!emailVal) {
          setInputError('login-input-email', 'err-login-email', 'لطفاً آدرس ایمیل خود را وارد کنید.');
          isValid = false;
        } else {
          setInputError('login-input-email', 'err-login-email', '');
        }

        if (!passVal) {
          setInputError('login-input-pass', 'err-login-pass', 'لطفاً رمز عبور را وارد کنید.');
          isValid = false;
        } else {
          setInputError('login-input-pass', 'err-login-pass', '');
        }

        if (!isValid) return;

        if (!isFirebaseConfigured) {
          if (alertErr) {
            alertErr.textContent = 'تنظیمات Firebase در محیط برنامه تعریف نشده است.';
            alertErr.style.display = 'flex';
          }
          return;
        }

        try {
          if (submitBtn) submitBtn.disabled = true;
          if (submitText) submitText.textContent = 'در حال بررسی اطلاعات و ورود...';

          const res = await loginWithEmail(emailVal, passVal);
          if (alertSucc) {
            alertSucc.textContent = '✅ ورود با موفقیت انجام شد.';
            alertSucc.style.display = 'flex';
          }

          if (res.user && !res.user.emailVerified) {
            showToast('⚠️ ورود انجام شد؛ ایمیل شما هنوز تأیید نشده است.');
          } else {
            showToast('🎉 ورود با موفقیت انجام شد!');
          }

          if (userInput) userInput.value = '';
          if (passInput) passInput.value = '';
        } catch (err) {
          const errMsg = translateFirebaseError(err);
          if (alertErr) {
            alertErr.textContent = errMsg;
            alertErr.style.display = 'flex';
          }
          showToast(errMsg);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitText) submitText.textContent = 'ورود به حساب کاربری';
        }
      });
    }

    // 8. Forgot Password Flow: sendPasswordResetEmail
    function startForgotCooldownTimer() {
      if (forgotCountdownTimer) clearInterval(forgotCountdownTimer);
      let timeLeft = 60;
      const countdownElem = document.getElementById('forgot-countdown');
      const btnResend = document.getElementById('btn-forgot-resend-link');
      if (btnResend) btnResend.disabled = true;

      function updateUI() {
        if (countdownElem) {
          const s = timeLeft < 10 ? `۰${toPersianDigits(timeLeft)}` : toPersianDigits(timeLeft);
          countdownElem.textContent = `۰۰:${s}`;
        }
      }
      updateUI();

      forgotCountdownTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(forgotCountdownTimer);
          if (countdownElem) countdownElem.textContent = '۰۰:۰۰';
          if (btnResend) btnResend.disabled = false;
        } else {
          updateUI();
        }
      }, 1000);
    }

    const formForgotRequest = document.getElementById('form-forgot-request');
    if (formForgotRequest) {
      formForgotRequest.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('forgot-input-email');
        const alertErr = document.getElementById('alert-forgot-error');
        const alertSucc = document.getElementById('alert-forgot-success');
        const submitBtn = document.getElementById('btn-submit-forgot');
        const submitText = document.getElementById('btn-forgot-text');

        if (alertErr) alertErr.style.display = 'none';
        if (alertSucc) alertSucc.style.display = 'none';

        const emailVal = (emailInput?.value || '').trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailVal || !emailRegex.test(emailVal)) {
          setInputError('forgot-input-email', 'err-forgot-email', 'لطفاً یک آدرس ایمیل معتبر وارد کنید.');
          return;
        }
        setInputError('forgot-input-email', 'err-forgot-email', '');

        if (!isFirebaseConfigured) {
          if (alertErr) {
            alertErr.textContent = 'تنظیمات Firebase تعریف نشده است.';
            alertErr.style.display = 'flex';
          }
          return;
        }

        try {
          if (submitBtn) submitBtn.disabled = true;
          if (submitText) submitText.textContent = 'در حال ارسال پیوند بازیابی...';

          lastForgotEmail = emailVal;
          await resetPassword(emailVal);

          const targetText = document.getElementById('forgot-target-email-text');
          if (targetText) targetText.textContent = emailVal;

          const fs1 = document.getElementById('forgot-step-1');
          const fs2 = document.getElementById('forgot-step-2');
          if (fs1) fs1.style.display = 'none';
          if (fs2) fs2.style.display = 'block';

          startForgotCooldownTimer();
          showToast('📬 لینک بازیابی رمز عبور به ایمیل شما ارسال شد');
        } catch (err) {
          const errMsg = translateFirebaseError(err);
          if (alertErr) {
            alertErr.textContent = errMsg;
            alertErr.style.display = 'flex';
          }
          showToast(errMsg);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitText) submitText.textContent = 'ارسال لینک بازیابی رمز عبور';
        }
      });
    }

    const btnForgotResend = document.getElementById('btn-forgot-resend-link');
    if (btnForgotResend) {
      btnForgotResend.addEventListener('click', async () => {
        if (!lastForgotEmail) return;
        try {
          btnForgotResend.disabled = true;
          await resetPassword(lastForgotEmail);
          startForgotCooldownTimer();
          showToast('📬 لینک بازیابی جدید ارسال گردید');
        } catch (err) {
          showToast(translateFirebaseError(err));
          btnForgotResend.disabled = false;
        }
      });
    }

    const btnForgotGotoLogin = document.getElementById('btn-forgot-goto-login');
    if (btnForgotGotoLogin) {
      btnForgotGotoLogin.addEventListener('click', () => {
        setAuthView('login');
        if (lastForgotEmail) {
          const loginInp = document.getElementById('login-input-email');
          if (loginInp) loginInp.value = lastForgotEmail;
        }
      });
    }

    // 9. Email Verification Banner Controls (Account Tab)
    const btnBannerResend = document.getElementById('btn-banner-resend-verification');
    const bannerResendText = document.getElementById('banner-resend-text');
    if (btnBannerResend) {
      btnBannerResend.addEventListener('click', async () => {
        try {
          btnBannerResend.disabled = true;
          if (bannerResendText) bannerResendText.textContent = 'در حال ارسال ایمیل...';
          await resendVerificationEmail();
          showToast('📩 ایمیل تأیید هویت با موفقیت ارسال شد. لطفاً صندوق ورودی یا اسپم را بررسی کنید.');
          if (bannerResendText) bannerResendText.textContent = 'ایمیل ارسال شد ✓';
          setTimeout(() => {
            btnBannerResend.disabled = false;
            if (bannerResendText) bannerResendText.textContent = 'ارسال مجدد ایمیل تأیید';
          }, 30000);
        } catch (err) {
          showToast(translateFirebaseError(err));
          btnBannerResend.disabled = false;
          if (bannerResendText) bannerResendText.textContent = 'ارسال مجدد ایمیل تأیید';
        }
      });
    }

    const btnBannerRefresh = document.getElementById('btn-banner-refresh-verification');
    if (btnBannerRefresh) {
      btnBannerRefresh.addEventListener('click', async () => {
        try {
          btnBannerRefresh.disabled = true;
          const user = await refreshUserVerification();
          if (user && user.emailVerified) {
            state.userProfile.emailVerified = true;
            saveUserProfile();
            renderUserProfile();
            showToast('🎉 تبریک! آدرس ایمیل شما با موفقیت تأیید شد.');
          } else {
            showToast('⚠️ ایمیل شما هنوز تأیید نشده است. لطفاً ابتدا روی لینک دریافتی در ایمیل کلیک کنید.');
          }
        } catch (err) {
          showToast(translateFirebaseError(err));
        } finally {
          btnBannerRefresh.disabled = false;
        }
      });
    }

    // 10. Avatar Upload Handler
    const inputAvatar = document.getElementById('input-profile-avatar');
    if (inputAvatar) {
      inputAvatar.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 3 * 1024 * 1024) {
            showToast('حجم تصویر نباید بیشتر از ۳ مگابایت باشد');
            return;
          }
          const reader = new FileReader();
          reader.onload = async (event) => {
            state.userProfile.avatarUrl = event.target.result;
            saveUserProfile();
            renderUserProfile();
            showToast('تصویر پروفایل به‌روزرسانی شد');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 11. Save Profile Info & Password Change Button
    const btnSaveProfile = document.getElementById('btn-save-profile-info');
    if (btnSaveProfile) {
      btnSaveProfile.addEventListener('click', async () => {
        const dispName = (document.getElementById('input-edit-displayname')?.value || '').trim();
        const uname = (document.getElementById('input-edit-username')?.value || '').trim().replace(/^@/, '');
        const phone = (document.getElementById('input-edit-phone')?.value || '').trim();
        const bio = (document.getElementById('input-edit-bio')?.value || '').trim();
        const curPass = (document.getElementById('input-current-pass')?.value || '').trim();
        const newPass = (document.getElementById('input-new-pass')?.value || '').trim();
        const confPass = (document.getElementById('input-confirm-pass')?.value || '').trim();

        let hasError = false;

        if (curPass || newPass || confPass) {
          if (!curPass) {
            setInputError('input-current-pass', 'err-profile-curpass', 'برای تغییر رمز عبور، وارد کردن رمز عبور فعلی الزامی است.');
            hasError = true;
          } else {
            setInputError('input-current-pass', 'err-profile-curpass', '');
          }

          if (!newPass) {
            setInputError('input-new-pass', 'err-profile-newpass', 'لطفاً رمز عبور جدید را وارد نمایید.');
            hasError = true;
          } else if (newPass.length < 6) {
            setInputError('input-new-pass', 'err-profile-newpass', 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
            hasError = true;
          } else if (curPass && curPass === newPass) {
            setInputError('input-new-pass', 'err-profile-newpass', 'رمز عبور جدید نمی‌تواند همان رمز فعلی باشد.');
            hasError = true;
          } else {
            setInputError('input-new-pass', 'err-profile-newpass', '');
          }

          if (!confPass) {
            setInputError('input-confirm-pass', 'err-profile-confpass', 'لطفاً تکرار رمز عبور جدید را وارد نمایید.');
            hasError = true;
          } else if (newPass !== confPass) {
            setInputError('input-confirm-pass', 'err-profile-confpass', 'رمز عبور جدید با تکرار آن یکسان نیست.');
            hasError = true;
          } else {
            setInputError('input-confirm-pass', 'err-profile-confpass', '');
          }
        }

        if (hasError) return;

        try {
          if (dispName) {
            state.userProfile.displayName = dispName;
            await updateUserProfile({ displayName: dispName });
          }
          if (uname) state.userProfile.username = uname;
          if (phone) state.userProfile.phone = phone;
          state.userProfile.bio = bio;

          if (newPass) {
            await updateUserPassword(curPass, newPass);
            const p0 = document.getElementById('input-current-pass');
            const p1 = document.getElementById('input-new-pass');
            const p2 = document.getElementById('input-confirm-pass');
            if (p0) p0.value = '';
            if (p1) p1.value = '';
            if (p2) p2.value = '';
            setInputError('input-current-pass', 'err-profile-curpass', '');
            setInputError('input-new-pass', 'err-profile-newpass', '');
            setInputError('input-confirm-pass', 'err-profile-confpass', '');
            showToast('🔑 رمز عبور با موفقیت تغییر یافت');
          }

          saveUserProfile();
          renderUserProfile();
          showToast('💾 مشخصات حساب کاربری با موفقیت ذخیره شد');
        } catch (err) {
          const errMsg = translateFirebaseError(err);
          if (errMsg.includes('فعلی')) {
            setInputError('input-current-pass', 'err-profile-curpass', errMsg);
          }
          showToast(errMsg);
        }
      });
    }

    // 12. Logout Buttons
    const handleLogout = async () => {
      try {
        await logoutUser();
        setAuthView('login');
        showToast('🚪 با موفقیت از حساب کاربری خارج شدید');
      } catch (err) {
        showToast(translateFirebaseError(err));
      }
    };

    const btnLogout = document.getElementById('btn-account-logout');
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    const btnTerminate = document.getElementById('btn-terminate-sessions');
    if (btnTerminate) {
      btnTerminate.addEventListener('click', async () => {
        await handleLogout();
        showToast('🚪 از تمامی دستگاه‌ها و نشست‌ها با موفقیت خارج شدید');
      });
    }

    // 13. Delete Account Flow (using in-app modal, avoiding iframe window.confirm blocks)
    const btnDelete = document.getElementById('btn-account-delete');
    const deleteModal = document.getElementById('delete-account-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete-account');
    const deletePassInput = document.getElementById('input-delete-account-pass');
    const deleteErrBox = document.getElementById('err-delete-account');
    const deleteSpinner = document.getElementById('btn-delete-account-spinner');
    const deleteBtnText = document.getElementById('btn-delete-account-text');

    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (deletePassInput) deletePassInput.value = '';
        if (deleteErrBox) deleteErrBox.textContent = '';
        if (deleteModal) {
          deleteModal.classList.add('open');
          setTimeout(() => deletePassInput?.focus(), 120);
        }
      });
    }

    const btnCancelDelete = document.getElementById('btn-cancel-delete-account');
    const btnCloseDeleteX = document.getElementById('btn-close-delete-modal-x');
    if (btnCancelDelete) {
      btnCancelDelete.addEventListener('click', () => {
        deleteModal?.classList.remove('open');
      });
    }
    if (btnCloseDeleteX) {
      btnCloseDeleteX.addEventListener('click', () => {
        deleteModal?.classList.remove('open');
      });
    }
    if (deleteModal) {
      deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
          deleteModal.classList.remove('open');
        }
      });
    }

    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', async () => {
        const password = deletePassInput ? deletePassInput.value.trim() : '';

        if (deleteErrBox) deleteErrBox.textContent = '';
        btnConfirmDelete.disabled = true;
        if (deleteSpinner) deleteSpinner.style.display = 'inline';
        if (deleteBtnText) deleteBtnText.textContent = 'در حال حذف حساب...';

        try {
          // Permanently delete user from Firebase Auth
          await deleteUserAccount(password);

          // Reset local profile state to clean unauthenticated defaults
          state.userProfile = {
            ...DEFAULT_USER_PROFILE,
            isLoggedIn: false,
          };
          saveUserProfile();
          renderUserProfile();

          // Close all open modals
          deleteModal?.classList.remove('open');
          document.getElementById('settings-modal')?.classList.remove('open');

          // Switch auth panel view to login
          setAuthView('login');
          showToast('🗑️ حساب کاربری شما با موفقیت به طور کامل حذف گردید.');
        } catch (err) {
          const errMsg = translateFirebaseError(err);
          if (deleteErrBox) deleteErrBox.textContent = errMsg;
          showToast(errMsg);
        } finally {
          btnConfirmDelete.disabled = false;
          if (deleteSpinner) deleteSpinner.style.display = 'none';
          if (deleteBtnText) deleteBtnText.textContent = 'بله، حذف دائمی حساب';
        }
      });
    }
  }

  function populateEmojiPicker(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    EMOJI_PALETTE.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-pick-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.emoji-pick-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        onSelect(emoji);
      });
      container.appendChild(btn);
    });
  }

  function initSettingsControls() {
    // 3-State Theme Switcher in Header
    document.querySelectorAll('#header-theme-switcher .theme-switch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.themeTarget;
        if (theme) {
          state.settings.theme = theme;
          saveSettings();
          syncSettingsToUI();
          showToast(
            theme === 'dark' ? '🌙 تم تاریک عمیق (AMOLED) فعال شد' :
            theme === 'light' ? '☀️ تم روشن لایت (Light Mode) فعال شد' :
            '💎 تم شیشه‌ای آیفون (iOS Glass) فعال شد'
          );
        }
      });
    });

    // Theme Presets in Settings Modal
    document.querySelectorAll('[data-theme-choice]').forEach((card) => {
      card.addEventListener('click', () => {
        const theme = card.dataset.themeChoice;
        if (theme) {
          state.settings.theme = theme;
          saveSettings();
          syncSettingsToUI();
          showToast(
            theme === 'dark' ? '🌙 تم تاریک عمیق (AMOLED) فعال شد' :
            theme === 'light' ? '☀️ تم روشن لایت (Light Mode) فعال شد' :
            '💎 تم شیشه‌ای آیفون (iOS Glass) فعال شد'
          );
        }
      });
    });

    // Text Contrast
    document.querySelectorAll('#seg-text-contrast .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.contrast = btn.dataset.contrast;
        saveSettings();
        syncSettingsToUI();
      });
    });

    // Card Size
    document.querySelectorAll('#seg-card-size .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.cardSize = parseInt(btn.dataset.cardSize, 10);
        saveSettings();
        syncSettingsToUI();
      });
    });

    // Icon Size
    document.querySelectorAll('#seg-icon-size .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.iconSize = btn.dataset.iconSize;
        saveSettings();
        syncSettingsToUI();
      });
    });

    // Card Radius
    document.querySelectorAll('#seg-card-radius .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.cardRadius = parseInt(btn.dataset.cardRadius, 10);
        saveSettings();
        syncSettingsToUI();
      });
    });

    // Liquid Glass Sub-options (Frosted, Specular, Smoked)
    document.querySelectorAll('#seg-glass-mode .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.glassMode;
        if (mode) {
          state.settings.glassMode = mode;
          saveSettings();
          applySettings();
          syncSettingsToUI();
          const modeLabels = {
            frosted: '🌫️ قالب شیشه مات آیفون (Frosted)',
            specular: '✨ قالب کریستالی براق (Specular)',
            smoked: '🌑 قالب شیشه دودی پرکنتراست (Smoked)'
          };
          showToast(`${modeLabels[mode] || mode} فعال شد`);
        }
      });
    });

    // Accent Color Palette Swatches & Custom Color Picker
    document.querySelectorAll('.accent-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.accent || swatch.dataset.accentColor;
        if (color) {
          state.settings.accentColor = color;
          saveSettings();
          syncSettingsToUI();
          const p = ACCENT_COLOR_PRESETS[color.toLowerCase()];
          showToast(`🎨 رنگ تاکیدی «${p ? p.name : color}» اعمال شد`);
        }
      });
    });

    const customColorInput = document.getElementById('accent-custom-color-input');
    if (customColorInput) {
      customColorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        if (color) {
          state.settings.accentColor = color;
          applyAccentColor(color);
        }
      });
      customColorInput.addEventListener('change', (e) => {
        const color = e.target.value;
        if (color) {
          state.settings.accentColor = color;
          saveSettings();
          syncSettingsToUI();
          showToast(`🎨 رنگ تاکیدی سفارشی «${color}» ذخیره و اعمال شد`);
        }
      });
    }

    // Performance Low Spec Toggle
    const toggleLowSpec = document.getElementById('toggle-low-spec');
    if (toggleLowSpec) {
      toggleLowSpec.addEventListener('change', () => {
        state.settings.lowSpecMode = toggleLowSpec.checked;
        saveSettings();
      });
    }

    // Glass Opacity
    document.querySelectorAll('#seg-glass-opacity .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.glassOpacity = parseInt(btn.dataset.glassOpacity, 10);
        saveSettings();
        applySettings();
        syncSettingsToUI();
      });
    });

    // Glass Blur
    document.querySelectorAll('#seg-glass-blur .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.glassBlur = parseInt(btn.dataset.glassBlur, 10);
        saveSettings();
        applySettings();
        syncSettingsToUI();
      });
    });

    // Background Blur
    document.querySelectorAll('#seg-bg-blur .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.bgBlur = parseInt(btn.dataset.bgBlur, 10);
        saveSettings();
        syncSettingsToUI();
      });
    });

    // Overlay Darkness
    document.querySelectorAll('#seg-overlay-opacity .segment-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.settings.overlayOpacity = parseInt(btn.dataset.overlayOpacity, 10);
        saveSettings();
        syncSettingsToUI();
      });
    });

    // Dedicated Wallpaper Modal Open/Close
    const btnOpenWpModal = document.getElementById('btn-open-wallpaper-modal');
    const wpModal = document.getElementById('wallpaper-modal');
    if (btnOpenWpModal && wpModal) {
      btnOpenWpModal.addEventListener('click', () => {
        wpModal.classList.add('open');
        renderWallpaperPresets();
      });
    }

    // Render unified gallery on launch
    renderWallpaperPresets();

    // Custom Wallpaper Upload from Settings Tab
    const customWpInput = document.getElementById('input-custom-wallpaper');
    if (customWpInput) {
      customWpInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            state.settings.wallpaperUrl = event.target.result;
            saveSettings();
            showToast('والپیپر اختصاصی بارگذاری شد');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Custom Wallpaper Upload inside Modal
    const modalCustomWpInput = document.getElementById('input-modal-custom-wallpaper');
    if (modalCustomWpInput) {
      modalCustomWpInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            state.settings.wallpaperUrl = event.target.result;
            saveSettings();
            showToast('والپیپر اختصاصی با موفقیت اعمال شد');
            if (wpModal) wpModal.classList.remove('open');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Chrome / Browser Bookmarks Auto-Sync (Preserves 100% Nested Folder Hierarchy)
    const btnSyncChrome = document.getElementById('btn-sync-browser-bookmarks');
    if (btnSyncChrome) {
      btnSyncChrome.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.bookmarks.getTree) {
          chrome.bookmarks.getTree((tree) => {
            if (tree && tree.length > 0) {
              const imported = [];
              const idMap = new Map();

              function processNode(node, ourParentId) {
                if (!node) return;

                // Chrome root nodes ("0", "1" = Bookmarks Bar, "2" = Other Bookmarks, "3" = Mobile Bookmarks)
                const isSystemRoot = node.id === '0' || (node.parentId === '0' && (!node.url && (!node.title || node.title === 'Bookmarks bar' || node.title === 'Other bookmarks' || node.title === 'Mobile bookmarks')));

                let currentOurId = ourParentId;

                if (!isSystemRoot) {
                  if (node.url) {
                    // Bookmark Item with stable ID
                    const bmId = node.id ? `bm_chrome_${node.id}` : `bm_chrome_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                    imported.push({
                      id: bmId,
                      type: 'bookmark',
                      title: (node.title || 'بوکمارک مرورگر').trim(),
                      url: node.url,
                      iconEmoji: '🌐',
                      parentId: ourParentId || null,
                      isPinned: false
                    });
                    return;
                  } else if (node.title && (node.children || []).length > 0) {
                    // Folder Item with nested children and stable ID
                    const folderId = node.id ? `folder_chrome_${node.id}` : `folder_chrome_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                    idMap.set(node.id, folderId);
                    imported.push({
                      id: folderId,
                      type: 'folder',
                      title: (node.title || 'پوشه مرورگر').trim(),
                      parentId: ourParentId || null,
                      isPinned: false
                    });
                    currentOurId = folderId;
                  }
                }

                if (node.children && node.children.length > 0) {
                  node.children.forEach(child => {
                    processNode(child, currentOurId);
                  });
                }
              }

              tree.forEach(rootNode => processNode(rootNode, null));

              if (imported.length > 0) {
                // Smart Deduplication & Upsert
                const existingBookmarkKeys = new Set(
                  state.bookmarks
                    .filter(b => b.type === 'bookmark')
                    .map(b => `${(b.url || '').toLowerCase().trim()}__${b.parentId || 'root'}`)
                );
                const existingFolderKeys = new Set(
                  state.bookmarks
                    .filter(b => b.type === 'folder')
                    .map(b => `${(b.title || '').trim()}__${b.parentId || 'root'}`)
                );
                const existingIds = new Set(state.bookmarks.map(b => b.id));

                const freshItems = [];
                let duplicateCount = 0;

                imported.forEach(item => {
                  if (existingIds.has(item.id)) {
                    duplicateCount++;
                    return;
                  }
                  if (item.type === 'bookmark') {
                    const key = `${(item.url || '').toLowerCase().trim()}__${item.parentId || 'root'}`;
                    if (existingBookmarkKeys.has(key)) {
                      duplicateCount++;
                      return;
                    }
                    existingBookmarkKeys.add(key);
                    existingIds.add(item.id);
                    freshItems.push(item);
                  } else {
                    const key = `${(item.title || '').trim()}__${item.parentId || 'root'}`;
                    if (existingFolderKeys.has(key)) {
                      duplicateCount++;
                      return;
                    }
                    existingFolderKeys.add(key);
                    existingIds.add(item.id);
                    freshItems.push(item);
                  }
                });

                if (freshItems.length > 0) {
                  const folderCount = freshItems.filter(i => i.type === 'folder').length;
                  const bmCount = freshItems.filter(i => i.type === 'bookmark').length;
                  state.bookmarks = [...state.bookmarks, ...freshItems];
                  saveBookmarks();
                  renderBookmarks();
                  showToast(`✅ همگام‌سازی موفق: ${toPersianDigits(folderCount)} پوشه و ${toPersianDigits(bmCount)} بوکمارک افزوده شدند (موارد تکراری نادیده گرفته شدند)`);
                } else {
                  showToast('ℹ️ همه بوکمارک‌های مرورگر از قبل همگام هستند؛ داده تکراری افزوده نشد.');
                }
              } else {
                showToast('بوکمارکی در مرورگر یافت نشد');
              }
            }
          });
        } else {
          showToast('همگام‌سازی خودکار در محیط افزونه مرورگر (Extension) با دسترسی به Bookmarks API فعال است.');
        }
      });
    }

    // Export JSON Backup
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const backupData = {
          bookmarks: state.bookmarks,
          settings: state.settings,
          notes: localStorage.getItem(STORAGE_KEYS.NOTES) || '',
          exportedAt: new Date().toISOString()
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `idashboard_backup_${Date.now()}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showToast('فایل پشتیبان دانلود شد');
      });
    }

    // Import JSON Backup
    const inputImport = document.getElementById('input-import-json');
    if (inputImport) {
      inputImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              if (data.bookmarks && Array.isArray(data.bookmarks)) {
                state.bookmarks = data.bookmarks;
                saveBookmarks();
              }
              if (data.settings) {
                state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
                saveSettings();
              }
              if (data.notes) {
                localStorage.setItem(STORAGE_KEYS.NOTES, data.notes);
                const notesTextarea = document.getElementById('widget-notes-textarea');
                if (notesTextarea) notesTextarea.value = data.notes;
              }
              renderBookmarks();
              showToast('اطلاعات با موفقیت بازیابی شد');
            } catch (err) {
              alert('فایل وارد شده معتبر نمی‌باشد.');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Widgets Settings Panel Controls
    const btnExportCalTasks = document.getElementById('btn-export-cal-tasks');
    if (btnExportCalTasks) {
      btnExportCalTasks.addEventListener('click', () => {
        const tasksStr = localStorage.getItem(STORAGE_KEYS.CALENDAR_TASKS) || '{}';
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(tasksStr);
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `calendar_tasks_${Date.now()}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showToast('فایل تسک‌ها دانلود شد');
      });
    }

    const btnClearCompletedTasks = document.getElementById('btn-clear-completed-tasks');
    if (btnClearCompletedTasks) {
      btnClearCompletedTasks.addEventListener('click', () => {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.CALENDAR_TASKS);
          if (stored) {
            const map = JSON.parse(stored);
            let removedCount = 0;
            Object.keys(map).forEach(dayKey => {
              const beforeLen = map[dayKey].length;
              map[dayKey] = map[dayKey].filter(t => !t.completed);
              removedCount += (beforeLen - map[dayKey].length);
              if (map[dayKey].length === 0) delete map[dayKey];
            });
            localStorage.setItem(STORAGE_KEYS.CALENDAR_TASKS, JSON.stringify(map));
            showToast(`${toPersianDigits(removedCount)} تسک انجام‌شده پاک‌سازی شد`);
            renderJalaliCalendarGrid();
          }
        } catch (e) {
          showToast('خطا در پاک‌سازی تسک‌ها');
        }
      });
    }

    const btnExportAllNotes = document.getElementById('btn-export-all-notes');
    if (btnExportAllNotes) {
      btnExportAllNotes.addEventListener('click', () => {
        let fullText = '=== یادداشت‌های آی‌داشبورد ===\n\n';
        multiNotesList.forEach((n, i) => {
          const div = document.createElement('div');
          div.innerHTML = n.content || '';
          const plain = div.innerText || div.textContent || '';
          fullText += `[${i + 1}] ${n.title || 'بدون عنوان'}\nتاریخ: ${new Date(n.updatedAt || Date.now()).toLocaleString('fa-IR')}\n--------------------\n${plain}\n\n====================\n\n`;
        });
        const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(fullText);
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute('href', dataStr);
        dlAnchor.setAttribute('download', `all_notes_${Date.now()}.txt`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        showToast('فایل تمامی یادداشت‌ها دانلود شد');
      });
    }

    const btnCreateQuickNote = document.getElementById('btn-create-quick-note');
    if (btnCreateQuickNote) {
      btnCreateQuickNote.addEventListener('click', () => {
        closeAllModals();
        switchPage(2);
        const btnNew = document.getElementById('btn-new-note');
        if (btnNew) btnNew.click();
      });
    }

    // Factory Reset Defaults
    const btnReset = document.getElementById('btn-reset-defaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('آیا از ریست کامل داشبورد به تنظیمات اولیه اطمینان دارید؟')) {
          state.bookmarks = [...DEFAULT_BOOKMARKS];
          state.settings = { ...DEFAULT_SETTINGS };
          localStorage.removeItem(STORAGE_KEYS.NOTES);
          saveBookmarks();
          saveSettings();
          renderBookmarks();
          closeAllModals();
          showToast('تنظیمات به حالت اولیه بازگشت');
        }
      });
    }
  }

  function renderWallpaperPresets() {
    const grid = document.getElementById('wallpaper-preset-grid');
    if (!grid) return;

    grid.innerHTML = '';
    ALL_WALLPAPERS.forEach((wp) => {
        const card = document.createElement('div');
        const isActive = state.settings.wallpaperUrl === wp.url;
        card.className = `preset-card wallpaper-preset-card ${isActive ? 'active' : ''}`;
        
        const isGradient = wp.url.startsWith('linear-gradient') || wp.url.startsWith('radial-gradient') || wp.url.startsWith('conic-gradient');
        if (isGradient) {
          card.style.background = wp.url;
          card.innerHTML = `
            <div class="preset-card-name">${escapeHTML(wp.name)}</div>
          `;
        } else {
          const thumb = getWallpaperThumbnailUrl(wp.url);
          card.style.background = wp.fallbackGradient || '#1e293b';
          card.innerHTML = `
            <img class="preset-card-img" src="${thumb}" alt="${escapeHTML(wp.name)}" loading="lazy" onerror="this.style.opacity='0';" />
            <div class="preset-card-name">${escapeHTML(wp.name)}</div>
          `;
        }

        card.addEventListener('click', () => {
          state.settings.wallpaperUrl = wp.url;
          saveSettings();
          renderWallpaperPresets();
          showToast(`🖼️ والپیپر «${wp.name}» با موفقیت اعمال شد`);
        });

        grid.appendChild(card);
      });
  }

  function syncSettingsToUI() {
    const s = state.settings;

    // Theme Presets
    document.querySelectorAll('[data-theme-choice]').forEach((c) => {
      c.classList.toggle('active', c.dataset.themeChoice === s.theme);
    });

    // 3-State Header Theme Switcher
    document.querySelectorAll('#header-theme-switcher .theme-switch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.themeTarget === s.theme);
    });

    // Contrast
    document.querySelectorAll('#seg-text-contrast .segment-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.contrast === s.contrast);
    });

    // Card Size
    document.querySelectorAll('#seg-card-size .segment-btn').forEach((b) => {
      b.classList.toggle('active', parseInt(b.dataset.cardSize, 10) === s.cardSize);
    });

    // Icon Size
    document.querySelectorAll('#seg-icon-size .segment-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.iconSize === s.iconSize);
    });

    // Card Radius
    document.querySelectorAll('#seg-card-radius .segment-btn').forEach((b) => {
      b.classList.toggle('active', parseInt(b.dataset.cardRadius, 10) === s.cardRadius);
    });

    // Low Spec Mode
    const toggleLowSpec = document.getElementById('toggle-low-spec');
    if (toggleLowSpec) toggleLowSpec.checked = !!s.lowSpecMode;

    // Glass Opacity
    const currentOpacity = s.glassOpacity !== undefined ? s.glassOpacity : 24;
    const opacityButtons = document.querySelectorAll('#seg-glass-opacity .segment-btn');
    let hasExactOp = false;
    opacityButtons.forEach((b) => {
      const val = parseInt(b.dataset.glassOpacity, 10);
      const isMatch = val === currentOpacity;
      if (isMatch) hasExactOp = true;
      b.classList.toggle('active', isMatch);
    });
    if (!hasExactOp && opacityButtons.length >= 2) {
      // Pick middle button if no exact match
      opacityButtons[1].classList.add('active');
    }

    // Glass Blur
    const currentBlur = s.glassBlur !== undefined ? s.glassBlur : 32;
    const blurButtons = document.querySelectorAll('#seg-glass-blur .segment-btn');
    let hasExactBlur = false;
    blurButtons.forEach((b) => {
      const val = parseInt(b.dataset.glassBlur, 10);
      const isMatch = val === currentBlur;
      if (isMatch) hasExactBlur = true;
      b.classList.toggle('active', isMatch);
    });
    if (!hasExactBlur && blurButtons.length >= 2) {
      blurButtons[1].classList.add('active');
    }

    // Background Blur
    document.querySelectorAll('#seg-bg-blur .segment-btn').forEach((b) => {
      b.classList.toggle('active', parseInt(b.dataset.bgBlur, 10) === (s.bgBlur !== undefined ? s.bgBlur : 0));
    });

    // Overlay Darkness
    document.querySelectorAll('#seg-overlay-opacity .segment-btn').forEach((b) => {
      b.classList.toggle('active', parseInt(b.dataset.overlayOpacity, 10) === (s.overlayOpacity !== undefined ? s.overlayOpacity : 45));
    });

    // Liquid Glass Sub-options (Frosted, Specular, Smoked)
    let currentGlassMode = s.glassMode || 'frosted';
    if (currentGlassMode === 'blurred' || currentGlassMode === 'clear') currentGlassMode = 'frosted';
    document.querySelectorAll('#seg-glass-mode .segment-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.glassMode === currentGlassMode);
    });

    // Accent Color Swatches & Custom Color Picker UI Sync
    const currentAccent = (s.accentColor || '#3b82f6').toLowerCase();
    let isPresetSelected = false;

    document.querySelectorAll('.accent-swatch').forEach((swatch) => {
      const swatchColor = (swatch.dataset.accent || swatch.dataset.accentColor || '').toLowerCase();
      const isActive = swatchColor === currentAccent;
      swatch.classList.toggle('active', isActive);
      if (isActive) isPresetSelected = true;
    });

    const customWrap = document.querySelector('.accent-swatch-custom-wrap');
    const customInput = document.getElementById('accent-custom-color-input');
    if (customWrap && customInput) {
      customWrap.classList.toggle('active', !isPresetSelected);
      customInput.value = s.accentColor || '#3b82f6';
    }
  }

  /* ==========================================================================
     9. Page Navigation & Rail Handling
     ========================================================================== */
  function initPageNavigation() {
    const navBtn1 = document.getElementById('nav-btn-page-1');
    const navBtn2 = document.getElementById('nav-btn-page-2');
    const btnBackToPage1 = document.getElementById('btn-back-to-page1');
    let lastActivePage = null;

    function switchPage(pageNumber, isInitial = false) {
      const prev = lastActivePage !== null ? lastActivePage : (state.activePage || 1);
      state.activePage = pageNumber;
      lastActivePage = pageNumber;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PAGE, String(pageNumber));

      const page1 = document.getElementById('page-bookmarks');
      const page2 = document.getElementById('page-widgets');
      const header = document.getElementById('main-header');

      const isForward = pageNumber > prev;
      const animClass = isInitial ? 'anim-fade-in' : (isForward ? 'anim-slide-forward' : 'anim-slide-backward');

      if (page1) page1.classList.remove('anim-slide-forward', 'anim-slide-backward', 'anim-fade-in');
      if (page2) page2.classList.remove('anim-slide-forward', 'anim-slide-backward', 'anim-fade-in');

      // Trigger reflow to restart CSS animation cleanly
      if (page1) void page1.offsetWidth;
      if (page2) void page2.offsetWidth;

      if (pageNumber === 1) {
        if (page1) {
          page1.classList.add('active', animClass);
        }
        if (page2) page2.classList.remove('active');
        if (navBtn1) navBtn1.classList.add('active');
        if (navBtn2) navBtn2.classList.remove('active');
        if (header) {
          header.style.display = 'flex';
          header.style.opacity = '1';
          header.style.transform = 'translateY(0)';
        }
      } else {
        if (page2) {
          page2.classList.add('active', animClass);
        }
        if (page1) page1.classList.remove('active');
        if (navBtn2) navBtn2.classList.add('active');
        if (navBtn1) navBtn1.classList.remove('active');
        if (header) {
          header.style.display = 'none';
        }
      }
    }

    if (navBtn1) navBtn1.addEventListener('click', () => switchPage(1));
    if (navBtn2) navBtn2.addEventListener('click', () => switchPage(2));
    if (btnBackToPage1) btnBackToPage1.addEventListener('click', () => switchPage(1));

    // Keyboard Page Shortcuts
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('.modal-overlay.open') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }
      if (e.key === '1') {
        switchPage(1);
      } else if (e.key === '2') {
        switchPage(2);
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          switchPage(1);
          searchInput.focus();
        }
      }
    });

    switchPage(state.activePage || 1, true);
  }

  /* ==========================================================================
     10. Widgets Engine (6 Large Widgets)
     ========================================================================== */

  /* ==========================================================================
     10. Widgets Engine (6 Large Widgets)
     ========================================================================== */

  // --- AUDIO & BROWSER NOTIFICATION HELPERS (100% OFFLINE & VPN-FREE) ---
  function playToneAlert(type = 'complete') {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'complete') {
        // Melodic 4-note ascending bell chime: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.13);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.13);
          gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + idx * 0.13 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.13 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.13);
          osc.stop(ctx.currentTime + idx * 0.13 + 0.65);
        });
      } else if (type === 'task') {
        // Double gentle bell chime for calendar reminders
        [659.25, 880.00].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + idx * 0.16 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.16 + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.16);
          osc.stop(ctx.currentTime + idx * 0.16 + 0.75);
        });
      } else if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch (err) {
      console.warn('Web Audio notification error:', err);
    }
  }

  function sendBrowserNotification(title, options = {}) {
    if (typeof chrome !== 'undefined' && chrome.notifications && chrome.notifications.create) {
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: title,
          message: options.body || '',
          priority: 2
        });
        return;
      } catch (e) {
        console.warn('Chrome notification fallback:', e);
      }
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, options);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, options);
          }
        });
      }
    }
  }

  // --- WIDGET 1: LIVE ANALOG CLOCK & POMODORO TIMER ---
  let pomodoroState = {
    mode: 'work', // 'work' (25m), 'shortBreak' (5m), 'longBreak' (15m)
    durations: {
      work: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60
    },
    remainingSeconds: 25 * 60,
    isRunning: false,
    timerId: null,
    cyclesCompleted: 0,
    soundEnabled: true
  };

  function initAnalogClockWidget() {
    // 1. Generate Analog Clock Dial Ticks
    const ticksGroup = document.getElementById('clock-ticks-group');
    if (ticksGroup) {
      ticksGroup.innerHTML = '';
      for (let i = 0; i < 60; i++) {
        const isMajor = (i % 5 === 0);
        const angle = (i * 6) * (Math.PI / 180);
        const rOuter = 110;
        const rInner = isMajor ? 98 : 104;

        const x1 = 120 + rOuter * Math.sin(angle);
        const y1 = 120 - rOuter * Math.cos(angle);
        const x2 = 120 + rInner * Math.sin(angle);
        const y2 = 120 - rInner * Math.cos(angle);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1.toFixed(2));
        line.setAttribute('y1', y1.toFixed(2));
        line.setAttribute('x2', x2.toFixed(2));
        line.setAttribute('y2', y2.toFixed(2));
        line.setAttribute('class', isMajor ? 'clock-tick clock-tick-major' : 'clock-tick');
        ticksGroup.appendChild(line);
      }
    }

    // 2. Mode Switcher (Clock vs Pomodoro)
    const btnTabClock = document.getElementById('btn-tab-clock');
    const btnTabPomodoro = document.getElementById('btn-tab-pomodoro');
    const viewAnalog = document.getElementById('clock-view-analog');
    const viewPomodoro = document.getElementById('clock-view-pomodoro');
    const widgetTitle = document.getElementById('clock-widget-title-text');
    const widgetIcon = document.getElementById('clock-widget-icon');

    if (btnTabClock && btnTabPomodoro && viewAnalog && viewPomodoro) {
      btnTabClock.addEventListener('click', () => {
        btnTabClock.classList.add('active');
        btnTabPomodoro.classList.remove('active');
        viewAnalog.style.display = 'flex';
        viewPomodoro.style.display = 'none';
        if (widgetTitle) widgetTitle.textContent = 'ساعت آنالوگ زنده';
        if (widgetIcon) widgetIcon.textContent = '🕒';
      });

      btnTabPomodoro.addEventListener('click', () => {
        btnTabPomodoro.classList.add('active');
        btnTabClock.classList.remove('active');
        viewAnalog.style.display = 'none';
        viewPomodoro.style.display = 'flex';
        if (widgetTitle) widgetTitle.textContent = 'تایمر تمرکز پومودورو';
        if (widgetIcon) widgetIcon.textContent = '🍅';
      });
    }

    // 3. Pomodoro Mode Strip
    const modeButtons = document.querySelectorAll('.pomo-mode-btn');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!mode || !pomodoroState.durations[mode]) return;

        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        switchPomodoroMode(mode);
      });
    });

    // 4. Pomodoro Controls
    const btnToggle = document.getElementById('btn-pomo-toggle');
    const btnReset = document.getElementById('btn-pomo-reset');
    const btnSound = document.getElementById('btn-pomo-sound-toggle');

    if (btnToggle) {
      btnToggle.addEventListener('click', togglePomodoro);
    }

    if (btnReset) {
      btnReset.addEventListener('click', resetPomodoro);
    }

    if (btnSound) {
      btnSound.addEventListener('click', () => {
        pomodoroState.soundEnabled = !pomodoroState.soundEnabled;
        btnSound.classList.toggle('active', pomodoroState.soundEnabled);
        const icon = document.getElementById('pomo-sound-icon');
        if (icon) icon.textContent = pomodoroState.soundEnabled ? '🔔' : '🔕';
        showToast(pomodoroState.soundEnabled ? 'هشدار صوتی پومودورو فعال شد' : 'هشدار صوتی پومودورو غیرفعال شد');
      });
    }

    updatePomodoroUI();
  }

  function switchPomodoroMode(mode) {
    if (pomodoroState.isRunning) {
      clearInterval(pomodoroState.timerId);
      pomodoroState.isRunning = false;
    }
    pomodoroState.mode = mode;
    pomodoroState.remainingSeconds = pomodoroState.durations[mode];

    const toggleText = document.getElementById('pomo-toggle-text');
    const toggleIcon = document.getElementById('pomo-toggle-icon');
    if (toggleText) toggleText.textContent = mode === 'work' ? 'شروع تمرکز' : 'شروع استراحت';
    if (toggleIcon) toggleIcon.textContent = '▶';

    const stateLabel = document.getElementById('pomo-state-label');
    if (stateLabel) {
      if (mode === 'work') stateLabel.textContent = 'زمان تمرکز و بازدهی';
      else if (mode === 'shortBreak') stateLabel.textContent = 'زمان استراحت کوتاه';
      else stateLabel.textContent = 'زمان استراحت طولانی و ریکاوری';
    }

    updatePomodoroUI();
  }

  function togglePomodoro() {
    if (pomodoroState.isRunning) {
      // Pause
      clearInterval(pomodoroState.timerId);
      pomodoroState.isRunning = false;

      const toggleText = document.getElementById('pomo-toggle-text');
      const toggleIcon = document.getElementById('pomo-toggle-icon');
      if (toggleText) toggleText.textContent = 'ادامه تایمر';
      if (toggleIcon) toggleIcon.textContent = '▶';
    } else {
      // Start
      if (pomodoroState.soundEnabled) {
        playToneAlert('tick');
      }

      pomodoroState.isRunning = true;
      const toggleText = document.getElementById('pomo-toggle-text');
      const toggleIcon = document.getElementById('pomo-toggle-icon');
      if (toggleText) toggleText.textContent = 'توقف موقت';
      if (toggleIcon) toggleIcon.textContent = '⏸';

      pomodoroState.timerId = setInterval(() => {
        if (pomodoroState.remainingSeconds > 0) {
          pomodoroState.remainingSeconds--;
          updatePomodoroUI();
        } else {
          // Timer Completed!
          clearInterval(pomodoroState.timerId);
          pomodoroState.isRunning = false;
          onPomodoroCompleted();
        }
      }, 1000);
    }
  }

  function resetPomodoro() {
    if (pomodoroState.isRunning) {
      clearInterval(pomodoroState.timerId);
      pomodoroState.isRunning = false;
    }
    pomodoroState.remainingSeconds = pomodoroState.durations[pomodoroState.mode];

    const toggleText = document.getElementById('pomo-toggle-text');
    const toggleIcon = document.getElementById('pomo-toggle-icon');
    if (toggleText) toggleText.textContent = pomodoroState.mode === 'work' ? 'شروع تمرکز' : 'شروع استراحت';
    if (toggleIcon) toggleIcon.textContent = '▶';

    updatePomodoroUI();
    showToast('تایمر به زمان اولیه بازنشانی شد');
  }

  function onPomodoroCompleted() {
    if (pomodoroState.soundEnabled) {
      playToneAlert('complete');
    }

    if (pomodoroState.mode === 'work') {
      pomodoroState.cyclesCompleted++;
      const isLongBreakDue = pomodoroState.cyclesCompleted % 4 === 0;

      sendBrowserNotification('🎉 پایان زمان تمرکز پومودورو!', {
        body: isLongBreakDue ? 'آفرین! ۴ دوره تمرکز به پایان رسید. اکنون زمان یک استراحت طولانی (۱۵ دقیقه) است.' : 'زمان کار به اتمام رسید. ۵ دقیقه استراحت کنید.'
      });
      showToast('🎉 زمان تمرکز پومودورو به پایان رسید!');

      // Auto prepare break
      const nextMode = isLongBreakDue ? 'longBreak' : 'shortBreak';
      const targetBtn = document.querySelector(`.pomo-mode-btn[data-mode="${nextMode}"]`);
      if (targetBtn) targetBtn.click();
    } else {
      sendBrowserNotification('⏰ پایان زمان استراحت پومودورو', {
        body: 'استراحت تمام شد! آماده شروع یک دوره تمرکز و خلاقیت جدید شوید.'
      });
      showToast('⏰ استراحت تمام شد! آماده تمرکز جدید شوید.');

      const workBtn = document.querySelector(`.pomo-mode-btn[data-mode="work"]`);
      if (workBtn) workBtn.click();
    }

    updatePomodoroUI();
  }

  function updatePomodoroUI() {
    const mins = Math.floor(pomodoroState.remainingSeconds / 60);
    const secs = pomodoroState.remainingSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const displayElem = document.getElementById('pomo-timer-display');
    if (displayElem) {
      displayElem.textContent = timeFormatted;
    }

    // Circular ring progress (total circumference = 2 * PI * 84 = 527.78)
    const ringProgress = document.getElementById('pomo-ring-progress');
    if (ringProgress) {
      const total = pomodoroState.durations[pomodoroState.mode] || 1500;
      const progress = pomodoroState.remainingSeconds / total;
      const circumference = 527.78;
      const offset = circumference * (1 - progress);
      ringProgress.style.strokeDashoffset = offset;
      
      // Dynamic color by mode
      if (pomodoroState.mode === 'work') {
        ringProgress.style.stroke = 'var(--accent-color)';
      } else if (pomodoroState.mode === 'shortBreak') {
        ringProgress.style.stroke = '#10b981';
      } else {
        ringProgress.style.stroke = '#38bdf8';
      }
    }

    // Cycle dots indicator (up to 4)
    const dotsContainer = document.getElementById('pomo-cycles-dots');
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.cycle-dot');
      const activeCount = pomodoroState.cyclesCompleted % 4;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('filled', idx < activeCount);
      });
    }
  }

  function updateAnalogClock(now, jDate, weekdayName) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Exact geometric hand endpoints (No transform origin artifacts)
    const minAngle = (minutes * 6) + (seconds * 0.1);
    const hourAngle = ((hours % 12) * 30) + (minutes * 0.5);

    const hRad = (hourAngle - 90) * (Math.PI / 180);
    const mRad = (minAngle - 90) * (Math.PI / 180);

    const hourHand = document.getElementById('analog-hour-hand');
    const minuteHand = document.getElementById('analog-minute-hand');

    if (hourHand) {
      hourHand.setAttribute('x1', '120');
      hourHand.setAttribute('y1', '120');
      hourHand.setAttribute('x2', (120 + 48 * Math.cos(hRad)).toFixed(2));
      hourHand.setAttribute('y2', (120 + 48 * Math.sin(hRad)).toFixed(2));
      hourHand.removeAttribute('transform');
    }

    if (minuteHand) {
      minuteHand.setAttribute('x1', '120');
      minuteHand.setAttribute('y1', '120');
      minuteHand.setAttribute('x2', (120 + 72 * Math.cos(mRad)).toFixed(2));
      minuteHand.setAttribute('y2', (120 + 72 * Math.sin(mRad)).toFixed(2));
      minuteHand.removeAttribute('transform');
    }

    const dateText = document.getElementById('analog-clock-date-text');
    if (dateText) dateText.textContent = `${toPersianDigits(jDate.day)} ${JALALI_MONTH_NAMES[jDate.month - 1]}`;

    const digitalVal = document.getElementById('analog-digital-time-val');
    if (digitalVal) digitalVal.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const weekdayVal = document.getElementById('analog-persian-weekday-val');
    if (weekdayVal) weekdayVal.textContent = weekdayName;
  }

  // --- WIDGET 2: PERSIAN JALALI CALENDAR & TASKS / REMINDERS ---
  let calViewYear = 1405;
  let calViewMonth = 6;
  let calSelectedDate = null; // { year, month, day }
  let calendarTasks = [];

  function loadCalendarTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CALENDAR_TASKS);
      if (stored) {
        calendarTasks = JSON.parse(stored);
      } else {
        calendarTasks = [
          {
            id: 'task_demo_1',
            dateKey: '1405-6-1',
            title: 'برنامه‌ریزی اهداف ماهانه',
            time: '09:30',
            tag: 'work',
            desc: 'بررسی پروژه‌ها و زمان‌بندی هفتگی',
            completed: false,
            notified: false
          }
        ];
        saveCalendarTasks();
      }
    } catch (e) {
      calendarTasks = [];
    }
  }

  function saveCalendarTasks() {
    try {
      localStorage.setItem(STORAGE_KEYS.CALENDAR_TASKS, JSON.stringify(calendarTasks));
    } catch (e) {
      console.warn('Failed to save calendar tasks:', e);
    }
  }

  function initCalendarWidget() {
    loadCalendarTasks();

    const now = new Date();
    const jToday = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    calViewYear = jToday.year;
    calViewMonth = jToday.month;
    calSelectedDate = { year: jToday.year, month: jToday.month, day: jToday.day };

    const btnPrev = document.getElementById('btn-cal-prev');
    const btnNext = document.getElementById('btn-cal-next');
    const btnToday = document.getElementById('btn-cal-today');
    const btnOpenTaskAdd = document.getElementById('btn-open-task-add');
    const formAddCalTask = document.getElementById('form-add-cal-task');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        calViewMonth--;
        if (calViewMonth < 1) {
          calViewMonth = 12;
          calViewYear--;
        }
        renderCalendar();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        calViewMonth++;
        if (calViewMonth > 12) {
          calViewMonth = 1;
          calViewYear++;
        }
        renderCalendar();
      });
    }

    if (btnToday) {
      btnToday.addEventListener('click', () => {
        const cur = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        calViewYear = cur.year;
        calViewMonth = cur.month;
        calSelectedDate = { year: cur.year, month: cur.month, day: cur.day };
        renderCalendar();
      });
    }

    if (btnOpenTaskAdd) {
      btnOpenTaskAdd.addEventListener('click', () => {
        openCalendarTaskModal();
      });
    }

    // All day toggle in task modal
    const allDayCheckbox = document.getElementById('task-all-day-checkbox');
    const timeInput = document.getElementById('task-input-time');
    if (allDayCheckbox && timeInput) {
      allDayCheckbox.addEventListener('change', () => {
        if (allDayCheckbox.checked) {
          timeInput.disabled = true;
          timeInput.style.opacity = '0.5';
        } else {
          timeInput.disabled = false;
          timeInput.style.opacity = '1';
        }
      });
    }

    if (formAddCalTask) {
      formAddCalTask.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('task-input-title');
        const timeInput = document.getElementById('task-input-time');
        const allDayCheck = document.getElementById('task-all-day-checkbox');
        const tagInput = document.getElementById('task-input-tag');
        const descInput = document.getElementById('task-input-desc');

        if (!titleInput || !titleInput.value.trim()) return;

        const isAllDay = allDayCheck ? allDayCheck.checked : false;
        const taskTime = isAllDay ? '' : (timeInput && timeInput.value ? timeInput.value : '');

        const dateKey = `${calSelectedDate.year}-${calSelectedDate.month}-${calSelectedDate.day}`;
        const newTask = {
          id: 'task_' + Date.now(),
          dateKey: dateKey,
          title: titleInput.value.trim(),
          time: taskTime,
          isAllDay: isAllDay || !taskTime,
          tag: tagInput ? tagInput.value : 'work',
          desc: descInput ? descInput.value.trim() : '',
          completed: false,
          notified: false
        };

        calendarTasks.push(newTask);
        saveCalendarTasks();

        // Close modal
        const modal = document.getElementById('cal-task-modal');
        if (modal) modal.classList.remove('open');
        formAddCalTask.reset();
        if (timeInput) {
          timeInput.disabled = false;
          timeInput.style.opacity = '1';
        }

        renderCalendar();
        showToast('🔔 رویداد و یادآور با موفقیت ثبت شد');

        // Prompt notification permission if not yet requested
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      });
    }

    // Start Real-time Task Reminder Watcher (checks every 10 seconds)
    initTaskReminderWatcher();

    renderCalendar();
  }

  function openCalendarTaskModal() {
    const modal = document.getElementById('cal-task-modal');
    const dateDisplay = document.getElementById('task-input-date-display');
    const timeInput = document.getElementById('task-input-time');
    const allDayCheckbox = document.getElementById('task-all-day-checkbox');

    if (dateDisplay && calSelectedDate) {
      dateDisplay.value = `${toPersianDigits(calSelectedDate.day)} ${JALALI_MONTH_NAMES[calSelectedDate.month - 1]} ${toPersianDigits(calSelectedDate.year)}`;
    }

    if (allDayCheckbox) allDayCheckbox.checked = false;
    if (timeInput) {
      timeInput.disabled = false;
      timeInput.style.opacity = '1';
      const now = new Date();
      const nextHour = (now.getHours() + 1) % 24;
      timeInput.value = `${String(nextHour).padStart(2, '0')}:00`;
    }

    if (modal) {
      modal.classList.add('open');
      const titleInput = document.getElementById('task-input-title');
      if (titleInput) setTimeout(() => titleInput.focus(), 100);
    }
  }

  const TAG_LABELS = {
    important: '🔴 فوری و مهم',
    work: '💼 کار و پروژه',
    personal: '🌿 زندگی شخصی',
    meeting: '👥 جلسه و تماس',
    finance: '💳 امور مالی'
  };

  let activeDetailTask = null;

  function openTaskDetailModal(task) {
    activeDetailTask = task;
    const modal = document.getElementById('cal-task-detail-modal');
    if (!modal) return;

    const nameEl = document.getElementById('task-detail-name');
    const badgeEl = document.getElementById('task-detail-badge');
    const dtEl = document.getElementById('task-detail-datetime');
    const statusEl = document.getElementById('task-detail-status');
    const notesEl = document.getElementById('task-detail-notes');
    const toggleBtnText = document.getElementById('btn-detail-toggle-text');

    if (nameEl) nameEl.textContent = task.title;
    if (badgeEl) badgeEl.textContent = TAG_LABELS[task.tag] || 'عمومی';

    const parts = (task.dateKey || '').split('-');
    let dateStr = task.dateKey;
    if (parts.length === 3) {
      const mName = JALALI_MONTH_NAMES[parseInt(parts[1], 10) - 1] || '';
      dateStr = `${toPersianDigits(parts[2])} ${mName} ${toPersianDigits(parts[0])}`;
    }

    const timeStr = task.time ? `ساعت ${toPersianDigits(task.time)}` : 'رویداد تمام‌روز (بدون ساعت)';
    if (dtEl) dtEl.textContent = `${dateStr} • ${timeStr}`;

    if (statusEl) {
      statusEl.textContent = task.completed ? '✅ انجام شده' : '⏳ در انتظار انجام';
      statusEl.style.color = task.completed ? '#10b981' : 'var(--text-secondary)';
    }

    if (toggleBtnText) {
      toggleBtnText.textContent = task.completed ? 'علامت به عنوان انجام‌نشده' : 'علامت به عنوان انجام‌شده';
    }

    if (notesEl) {
      if (task.desc && task.desc.trim()) {
        notesEl.textContent = task.desc;
        notesEl.style.fontStyle = 'normal';
        notesEl.style.opacity = '1';
      } else {
        notesEl.textContent = 'یادداشت یا توضیحات تکمیلی برای این تسک ثبت نشده است.';
        notesEl.style.fontStyle = 'italic';
        notesEl.style.opacity = '0.7';
      }
    }

    // Bind Detail Modal actions
    const btnToggle = document.getElementById('btn-detail-toggle-task');
    if (btnToggle) {
      btnToggle.onclick = () => {
        if (!activeDetailTask) return;
        activeDetailTask.completed = !activeDetailTask.completed;
        saveCalendarTasks();
        renderCalendar();
        openTaskDetailModal(activeDetailTask);
        showToast(activeDetailTask.completed ? 'تسک به عنوان انجام‌شده علامت‌گذاری شد' : 'وضعیت تسک بازنشانی شد');
      };
    }

    const btnDelete = document.getElementById('btn-detail-delete-task');
    if (btnDelete) {
      btnDelete.onclick = () => {
        if (!activeDetailTask) return;
        calendarTasks = calendarTasks.filter(t => t.id !== activeDetailTask.id);
        saveCalendarTasks();
        renderCalendar();
        modal.classList.remove('open');
        showToast('یادآور حذف شد');
      };
    }

    modal.classList.add('open');
  }

  function renderCalendar() {
    const headingElem = document.getElementById('calendar-month-heading-text');
    const gridElem = document.getElementById('calendar-days-grid');
    if (!gridElem) return;

    if (headingElem) {
      headingElem.textContent = `${JALALI_MONTH_NAMES[calViewMonth - 1]} ${toPersianDigits(calViewYear)}`;
    }

    gridElem.innerHTML = '';

    // Days count in Persian month
    let totalDays = 30;
    if (calViewMonth <= 6) totalDays = 31;
    else if (calViewMonth === 12) totalDays = 29;

    // Starting Day of week (0: Shanbeh, 6: Jomeh)
    const gStart = jalaliToGregorian(calViewYear, calViewMonth, 1);
    const startDate = new Date(gStart.year, gStart.month - 1, gStart.day);
    const startWeekday = (startDate.getDay() + 1) % 7;

    // Empty lead cells
    for (let i = 0; i < startWeekday; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      gridElem.appendChild(emptyCell);
    }

    const now = new Date();
    const todayJalali = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const officialHolidaysByMonth = {
      1: [1, 2, 3, 4, 12, 13],
      3: [14, 15],
      11: [22],
      12: [29]
    };
    const monthHolidays = officialHolidaysByMonth[calViewMonth] || [];

    for (let d = 1; d <= totalDays; d++) {
      const cell = document.createElement('div');
      const dayOfWeekIndex = (startWeekday + d - 1) % 7;
      const isFriday = (dayOfWeekIndex === 6);
      const isHoliday = isFriday || monthHolidays.includes(d);
      const isToday = (calViewYear === todayJalali.year && calViewMonth === todayJalali.month && d === todayJalali.day);
      const isSelected = calSelectedDate && (calViewYear === calSelectedDate.year && calViewMonth === calSelectedDate.month && d === calSelectedDate.day);

      const dateKey = `${calViewYear}-${calViewMonth}-${d}`;
      const dayTasks = calendarTasks.filter(t => t.dateKey === dateKey);

      cell.className = `cal-day-cell ${isHoliday ? 'friday' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;
      cell.textContent = toPersianDigits(d);

      // Task dot indicator
      if (dayTasks.length > 0) {
        const dot = document.createElement('span');
        dot.className = `cal-task-dot ${dayTasks.length > 1 ? 'has-multiple' : ''}`;
        cell.appendChild(dot);
      }

      cell.addEventListener('click', () => {
        gridElem.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        calSelectedDate = { year: calViewYear, month: calViewMonth, day: d };
        renderSelectedDateTasks();
      });

      gridElem.appendChild(cell);
    }

    renderSelectedDateTasks();
  }

  function renderSelectedDateTasks() {
    if (!calSelectedDate) return;
    const dateBadge = document.getElementById('calendar-selected-day-text');
    const tasksCount = document.getElementById('cal-selected-tasks-count');
    const tasksList = document.getElementById('cal-tasks-list');

    if (dateBadge) {
      dateBadge.textContent = `${toPersianDigits(calSelectedDate.day)} ${JALALI_MONTH_NAMES[calSelectedDate.month - 1]} ${toPersianDigits(calSelectedDate.year)}`;
    }

    const dateKey = `${calSelectedDate.year}-${calSelectedDate.month}-${calSelectedDate.day}`;
    const dayTasks = calendarTasks.filter(t => t.dateKey === dateKey);

    if (tasksCount) {
      tasksCount.textContent = `${toPersianDigits(dayTasks.length)} یادآور`;
    }

    if (!tasksList) return;
    tasksList.innerHTML = '';

    if (dayTasks.length === 0) {
      tasksList.innerHTML = '<div class="cal-empty-tasks">هیچ یادآوری برای این تاریخ ثبت نشده است. روی ➕ کلیک کنید.</div>';
      return;
    }

    dayTasks.forEach((task) => {
      const item = document.createElement('div');
      item.className = `cal-task-item ${task.completed ? 'completed' : ''}`;
      item.title = 'جهت مشاهده جزئیات و متن کامل کلیک کنید';

      const left = document.createElement('div');
      left.className = 'cal-task-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'cal-task-checkbox';
      checkbox.checked = !!task.completed;
      checkbox.title = 'تغییر وضعیت انجام';

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        saveCalendarTasks();
        renderCalendar();
      });

      const timeBadge = document.createElement('span');
      timeBadge.className = 'cal-task-time-badge';
      if (task.time) {
        timeBadge.textContent = `⏰ ${toPersianDigits(task.time)}`;
      } else {
        timeBadge.textContent = '🗓️ تمام‌روز';
        timeBadge.style.background = 'rgba(99, 102, 241, 0.18)';
        timeBadge.style.color = '#818cf8';
      }

      const titleSpan = document.createElement('span');
      titleSpan.className = 'cal-task-title';
      titleSpan.textContent = task.title;

      if (task.desc && task.desc.trim()) {
        const noteIcon = document.createElement('span');
        noteIcon.className = 'cal-task-note-indicator';
        noteIcon.textContent = '📝';
        noteIcon.title = 'دارای توضیحات و یادداشت';
        titleSpan.appendChild(noteIcon);
      }

      left.appendChild(checkbox);
      left.appendChild(timeBadge);
      left.appendChild(titleSpan);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-task-del';
      delBtn.textContent = '✕';
      delBtn.title = 'حذف یادآور';

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        calendarTasks = calendarTasks.filter(t => t.id !== task.id);
        saveCalendarTasks();
        renderCalendar();
        showToast('یادآور حذف شد');
      });

      item.appendChild(left);
      item.appendChild(delBtn);

      // Open Detail modal on clicking task item
      item.addEventListener('click', () => {
        openTaskDetailModal(task);
      });

      tasksList.appendChild(item);
    });
  }

  function initTaskReminderWatcher() {
    setInterval(() => {
      const now = new Date();
      const jToday = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const todayKey = `${jToday.year}-${jToday.month}-${jToday.day}`;
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      calendarTasks.forEach((task) => {
        if (!task.completed && !task.notified && task.dateKey === todayKey && task.time === currentTimeStr) {
          task.notified = true;
          saveCalendarTasks();

          playToneAlert('task');
          sendBrowserNotification(`⏰ سررسید یادآور: ${task.title}`, {
            body: task.desc || `زمان ثبت‌شده برای این کار: ساعت ${task.time}`
          });
          showToast(`⏰ سررسید یادآور: ${task.title} (ساعت ${task.time})`);
        }
      });
    }, 10000);
  }

  // --- WIDGET 3: REDESIGNED CLEAN MULTI-NOTES SYSTEM & DEDICATED MODAL ---
  let multiNotesList = [];
  let activeEditingNoteId = null;
  let noteAutoSaveTimer = null;
  let notesSearchQuery = '';

  function loadMultiNotes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MULTI_NOTES);
      if (stored !== null) {
        multiNotesList = JSON.parse(stored);
        if (!Array.isArray(multiNotesList)) {
          multiNotesList = [];
        }
      } else {
        // Migrate from old single note if exists
        const oldNote = localStorage.getItem(STORAGE_KEYS.NOTES);
        multiNotesList = [
          {
            id: 'note_' + Date.now(),
            title: 'یادداشت‌های روزانه و برنامه‌ریزی',
            content: oldNote ? escapeHTML(oldNote).replace(/\n/g, '<br>') : 'خوش آمدید! برای ویرایش این یادداشت روی کارت کلیک کنید یا دکمه «یادداشت جدید» را بزنید. ویرایشگر اختصاصی از قالب‌بندی غنی، لیست و درج تصویر پشتیبانی می‌کند.',
            bg: 'glass',
            updatedAt: Date.now()
          }
        ];
        saveMultiNotes();
      }
    } catch (e) {
      multiNotesList = [];
    }
  }

  function saveMultiNotes() {
    try {
      localStorage.setItem(STORAGE_KEYS.MULTI_NOTES, JSON.stringify(multiNotesList));
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [STORAGE_KEYS.MULTI_NOTES]: multiNotesList });
      }
    } catch (e) {
      console.warn('Failed to save notes to storage:', e);
    }
  }

  function deleteNote(noteId, animate = true) {
    if (!noteId) return;
    const note = multiNotesList.find(n => n.id === noteId);
    if (!note) return;

    const performDelete = () => {
      multiNotesList = multiNotesList.filter(n => n.id !== noteId);
      saveMultiNotes();
      renderNotesOverview();

      // If modal was open for this deleted note, close it cleanly
      if (activeEditingNoteId === noteId) {
        activeEditingNoteId = null;
        const modal = document.getElementById('note-edit-modal');
        if (modal) modal.classList.remove('open');
      }
      showToast(`یادداشت «${note.title || 'بدون عنوان'}» با موفقیت حذف شد`);
    };

    const card = document.querySelector(`.note-overview-card[data-note-id="${noteId}"]`);
    if (animate && card) {
      card.style.transition = 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.opacity = '0';
      card.style.transform = 'scale(0.92) translateY(10px)';
      card.style.maxHeight = '0px';
      card.style.paddingTop = '0px';
      card.style.paddingBottom = '0px';
      card.style.marginTop = '0px';
      card.style.marginBottom = '0px';
      card.style.pointerEvents = 'none';
      setTimeout(performDelete, 200);
    } else {
      performDelete();
    }
  }

  function formatNoteDate(timestamp) {
    if (!timestamp) return 'چند لحظه پیش';
    try {
      const d = new Date(timestamp);
      const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${toPersianDigits(j.day)} ${JALALI_MONTH_NAMES[j.month - 1]} ${toPersianDigits(j.year)} • ${hours}:${mins}`;
    } catch (e) {
      return 'به‌تازگی';
    }
  }

  function extractPlainText(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.innerText || temp.textContent || '').trim();
  }

  function getActiveEditingNote() {
    return multiNotesList.find(n => n.id === activeEditingNoteId) || multiNotesList[0];
  }

  function renderNotesOverview() {
    const container = document.getElementById('notes-cards-container');
    const totalBadge = document.getElementById('notes-total-count-badge');
    if (!container) return;

    if (totalBadge) {
      totalBadge.textContent = `${toPersianDigits(multiNotesList.length)} یادداشت`;
    }

    const filtered = multiNotesList.filter((note) => {
      if (!notesSearchQuery) return true;
      const q = notesSearchQuery.toLowerCase();
      const titleMatch = (note.title || '').toLowerCase().includes(q);
      const contentMatch = extractPlainText(note.content || '').toLowerCase().includes(q);
      return titleMatch || contentMatch;
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="notes-empty-state">
          <div class="notes-empty-icon">${notesSearchQuery ? '🔍' : '📝'}</div>
          <div class="notes-empty-title">${notesSearchQuery ? 'یادداشتی با این جستجو یافت نشد' : 'دفترچه یادداشت خالی است'}</div>
          <div class="notes-empty-desc">${notesSearchQuery ? 'عبارت جستجو را تغییر دهید یا یادداشت جدیدی اضافه کنید.' : 'روی دکمه «یادداشت جدید» کلیک کنید تا اولین یادداشت خود را ایجاد کنید.'}</div>
        </div>
      `;
      return;
    }

    filtered.forEach((note) => {
      const card = document.createElement('div');
      const themeClass = note.bg ? `theme-${note.bg}` : '';
      card.className = `note-overview-card ${themeClass}`;
      card.dataset.noteId = note.id;

      const plainSnippet = extractPlainText(note.content);
      const snippetText = plainSnippet ? escapeHTML(plainSnippet) : '<span style="color: var(--text-muted); font-style: italic;">(بدون متن - برای نوشتن کلیک کنید)</span>';
      const dateText = formatNoteDate(note.updatedAt);
      const charCount = plainSnippet.length;

      card.innerHTML = `
        <div class="note-card-header-row">
          <div class="note-card-title">${escapeHTML(note.title || 'بدون عنوان')}</div>
          <div class="note-card-actions">
            <button type="button" class="btn-note-card-action btn-copy-card" title="کپی متن">📋</button>
            <button type="button" class="btn-note-card-action btn-edit-card" title="ویرایش در مدال اختصاصی">✏️</button>
            <button type="button" class="btn-note-card-action danger btn-del-card" title="حذف یادداشت">🗑️</button>
          </div>
        </div>
        <div class="note-card-snippet">${snippetText}</div>
        <div class="note-card-footer">
          <span class="note-card-date">🕒 ${dateText}</span>
          <span class="note-card-badge-preview">${toPersianDigits(charCount)} نویسه</span>
        </div>
      `;

      // Clicking card opens dedicated modal
      card.addEventListener('click', (e) => {
        if (e.target.closest('.note-card-actions')) return;
        openNoteEditModal(note.id);
      });

      const editBtn = card.querySelector('.btn-edit-card');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openNoteEditModal(note.id);
        });
      }

      const copyBtn = card.querySelector('.btn-copy-card');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const text = extractPlainText(note.content) || note.title;
          navigator.clipboard.writeText(text).then(() => {
            showToast('متن یادداشت در کلیپ‌بورد کپی شد');
          });
        });
      }

      const delBtn = card.querySelector('.btn-del-card');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteNote(note.id, true);
        });
      }

      container.appendChild(card);
    });
  }

  function openNoteEditModal(noteId = null) {
    const modal = document.getElementById('note-edit-modal');
    if (!modal) return;

    let targetNote = multiNotesList.find(n => n.id === noteId);
    if (!targetNote) {
      targetNote = {
        id: 'note_' + Date.now(),
        title: `یادداشت جدید ${toPersianDigits(multiNotesList.length + 1)}`,
        content: '',
        bg: 'glass',
        updatedAt: Date.now()
      };
      multiNotesList.unshift(targetNote);
      saveMultiNotes();
    }

    activeEditingNoteId = targetNote.id;

    // Populate modal inputs
    const headerTitle = document.getElementById('modal-note-header-title');
    const titleInput = document.getElementById('modal-note-title');
    const editor = document.getElementById('modal-notes-editor');
    const updatedTime = document.getElementById('modal-notes-updated-time');

    if (headerTitle) headerTitle.textContent = targetNote.content ? 'ویرایش یادداشت' : 'یادداشت جدید';
    if (titleInput) titleInput.value = targetNote.title || '';
    if (editor) editor.innerHTML = targetNote.content || '';
    if (updatedTime) updatedTime.textContent = `آخرین تغییر: ${formatNoteDate(targetNote.updatedAt)}`;

    // Set theme in modal
    applyModalNoteTheme(targetNote.bg || 'glass');

    // Update Swatches UI
    document.querySelectorAll('#modal-palette-swatches .palette-swatch').forEach((swatch) => {
      swatch.classList.toggle('active', swatch.dataset.bg === (targetNote.bg || 'glass'));
    });

    updateModalNotesStats();
    modal.classList.add('open');

    setTimeout(() => {
      if (titleInput && !targetNote.content) {
        titleInput.focus();
        titleInput.select();
      } else if (editor) {
        editor.focus();
      }
    }, 120);
  }

  function applyModalNoteTheme(bgKey) {
    const editor = document.getElementById('modal-notes-editor');
    if (!editor) return;

    const bgMap = {
      glass: 'rgba(15, 23, 42, 0.6)',
      navy: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,58,138,0.75))',
      emerald: 'linear-gradient(135deg, rgba(6,78,59,0.9), rgba(4,120,87,0.75))',
      amethyst: 'linear-gradient(135deg, rgba(76,29,149,0.9), rgba(124,58,237,0.75))',
      amber: 'linear-gradient(135deg, rgba(120,53,15,0.9), rgba(217,119,6,0.75))',
      rose: 'linear-gradient(135deg, rgba(136,19,55,0.9), rgba(225,29,72,0.75))',
      titanium: 'linear-gradient(135deg, rgba(24,24,27,0.95), rgba(39,39,42,0.85))'
    };

    editor.style.background = bgMap[bgKey] || bgMap.glass;
  }

  function updateModalNotesStats() {
    const editor = document.getElementById('modal-notes-editor');
    const statsBadge = document.getElementById('modal-notes-stats-badge');
    if (!editor || !statsBadge) return;

    const text = (editor.innerText || editor.textContent || '').trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    statsBadge.textContent = `${toPersianDigits(chars)} کاراکتر • ${toPersianDigits(words)} کلمه`;
  }

  function triggerNoteAutoSave() {
    if (noteAutoSaveTimer) clearTimeout(noteAutoSaveTimer);
    noteAutoSaveTimer = setTimeout(() => {
      saveMultiNotes();
      renderNotesOverview();
      const updatedTime = document.getElementById('modal-notes-updated-time');
      if (updatedTime) updatedTime.textContent = 'آخرین تغییر: چند لحظه پیش';
    }, 400);
  }

  function initNotesWidget() {
    loadMultiNotes();

    const btnNewModal = document.getElementById('btn-open-new-note-modal');
    const searchInput = document.getElementById('notes-search-input');
    const titleInput = document.getElementById('modal-note-title');
    const editor = document.getElementById('modal-notes-editor');
    const btnSaveModal = document.getElementById('modal-btn-save-note');
    const btnDeleteModal = document.getElementById('modal-btn-delete-note');
    const btnClearModal = document.getElementById('modal-btn-clear-note');
    const btnCopyModal = document.getElementById('modal-btn-copy-note');
    const btnTimestampModal = document.getElementById('modal-btn-notes-timestamp');
    const fontColorPicker = document.getElementById('modal-note-font-color-picker');
    const inputNoteImage = document.getElementById('modal-input-note-image');

    // Initial Overview rendering
    renderNotesOverview();

    // Create New Note button on widget header
    if (btnNewModal) {
      btnNewModal.addEventListener('click', () => {
        openNoteEditModal(null);
      });
    }

    // Search bar filtering
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        notesSearchQuery = e.target.value.trim();
        renderNotesOverview();
      });
    }

    // Modal Title changes
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const note = getActiveEditingNote();
        if (!note) return;
        note.title = titleInput.value.trim() || 'بدون عنوان';
        note.updatedAt = Date.now();
        triggerNoteAutoSave();
      });
    }

    // Modal Content Editable changes
    if (editor) {
      editor.addEventListener('input', () => {
        const note = getActiveEditingNote();
        if (!note) return;
        note.content = editor.innerHTML;
        note.updatedAt = Date.now();
        updateModalNotesStats();
        triggerNoteAutoSave();
      });
    }

    // Swatches inside modal
    const swatches = document.querySelectorAll('#modal-palette-swatches .palette-swatch');
    swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const bg = swatch.dataset.bg || 'glass';
        const note = getActiveEditingNote();
        if (note) {
          note.bg = bg;
          applyModalNoteTheme(bg);
          triggerNoteAutoSave();
        }
      });
    });

    // Rich Toolbar Formatting Commands
    const richButtons = document.querySelectorAll('#modal-rich-toolbar .rich-btn[data-command]');
    richButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.command;
        if (!cmd) return;
        document.execCommand(cmd, false, null);
        if (editor) {
          editor.focus();
          const note = getActiveEditingNote();
          if (note) {
            note.content = editor.innerHTML;
            triggerNoteAutoSave();
          }
        }
      });
    });

    // Font Color
    if (fontColorPicker) {
      fontColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        document.execCommand('foreColor', false, color);
        if (editor) {
          editor.focus();
          const note = getActiveEditingNote();
          if (note) {
            note.content = editor.innerHTML;
            triggerNoteAutoSave();
          }
        }
      });
    }

    // Image Upload in Editor
    if (inputNoteImage) {
      inputNoteImage.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result;
          if (editor) {
            editor.focus();
            document.execCommand('insertImage', false, base64);
            const note = getActiveEditingNote();
            if (note) {
              note.content = editor.innerHTML;
              triggerNoteAutoSave();
            }
            showToast('تصویر در متن یادداشت قرار گرفت');
          }
        };
        reader.readAsDataURL(file);
        inputNoteImage.value = '';
      });
    }

    // Timestamp
    if (btnTimestampModal) {
      btnTimestampModal.addEventListener('click', () => {
        if (!editor) return;
        const now = new Date();
        const j = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const timeHtml = `<strong>[${toPersianDigits(j.day)} ${JALALI_MONTH_NAMES[j.month - 1]} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}]</strong> `;
        editor.focus();
        document.execCommand('insertHTML', false, timeHtml);
        const note = getActiveEditingNote();
        if (note) {
          note.content = editor.innerHTML;
          triggerNoteAutoSave();
        }
      });
    }

    // Copy Button inside modal
    if (btnCopyModal) {
      btnCopyModal.addEventListener('click', () => {
        if (!editor) return;
        const text = editor.innerText || editor.textContent;
        navigator.clipboard.writeText(text).then(() => {
          showToast('متن یادداشت در کلیپ‌بورد کپی شد');
        });
      });
    }

    // Clear Button with 2-step confirmation
    if (btnClearModal) {
      let clearConfirmTimer = null;
      btnClearModal.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editor) return;

        if (btnClearModal.dataset.confirming === 'true') {
          editor.innerHTML = '';
          editor.innerText = '';
          const note = getActiveEditingNote();
          if (note) {
            note.content = '';
            note.updatedAt = Date.now();
            saveMultiNotes();
          }
          updateModalNotesStats();
          btnClearModal.dataset.confirming = 'false';
          btnClearModal.innerHTML = '<span>🧹 پاک‌سازی متن</span>';
          if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
          showToast('✨ متن یادداشت پاک شد');
        } else {
          btnClearModal.dataset.confirming = 'true';
          btnClearModal.innerHTML = '<span>⚠️ کلیک مجدد برای تایید</span>';
          if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
          clearConfirmTimer = setTimeout(() => {
            btnClearModal.dataset.confirming = 'false';
            btnClearModal.innerHTML = '<span>🧹 پاک‌سازی متن</span>';
          }, 3500);
        }
      });
    }

    // Delete Button inside modal
    if (btnDeleteModal) {
      btnDeleteModal.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeEditingNoteId) {
          deleteNote(activeEditingNoteId, false);
        } else {
          closeAllModals();
        }
      });
    }

    // Save & Close Button
    if (btnSaveModal) {
      btnSaveModal.addEventListener('click', () => {
        const note = getActiveEditingNote();
        if (note && titleInput && editor) {
          note.title = titleInput.value.trim() || 'بدون عنوان';
          note.content = editor.innerHTML;
          note.updatedAt = Date.now();
          saveMultiNotes();
        }
        renderNotesOverview();
        closeAllModals();
        showToast('✓ یادداشت با موفقیت ذخیره شد');
      });
    }
  }

  // --- WIDGET 4: 4 DISTINCT RICH AUDIO SYNTHESIZERS ---
  const MUSIC_TRACKS = [
    {
      title: 'Lofi Chill & Cozy Rain',
      artist: 'موسیقی آرامش‌بخش و باران ملایم',
      duration: 210,
      type: 'lofi_rain',
      chordSets: [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [293.66, 349.23, 440.00, 523.25], // Dm7
        [196.00, 246.94, 293.66, 349.23]  // G7
      ]
    },
    {
      title: 'Sunset Synthwave Horizon',
      artist: 'سینت‌ویو ملایم و گرم غروب آفتاب',
      duration: 240,
      type: 'synthwave',
      chordSets: [
        [146.83, 220.00, 293.66, 369.99], // D minor 80s
        [174.61, 261.63, 349.23, 440.00], // F major
        [130.81, 196.00, 261.63, 329.63], // C major
        [110.00, 164.81, 220.00, 277.18]  // A minor
      ]
    },
    {
      title: 'Piano Reverie & Nature',
      artist: 'پیانو هارمونیک و نغمه‌های طبیعت',
      duration: 195,
      type: 'piano_nature',
      chordSets: [
        [329.63, 392.00, 493.88, 587.33, 659.25], // E minor pentatonic
        [261.63, 329.63, 392.00, 523.25, 659.25], // C major pentatonic
        [220.00, 261.63, 329.63, 440.00, 523.25], // A minor pentatonic
        [196.00, 246.94, 293.66, 392.00, 493.88]  // G major pentatonic
      ]
    },
    {
      title: 'Deep Space Zen Ambient',
      artist: 'فرکانس‌های ۴۳۲Hz مدیتیشن و تمرکز عمیق',
      duration: 300,
      type: 'deep_zen',
      chordSets: [
        [108.00, 216.00, 432.00, 864.00], // 432Hz harmonic series
        [114.75, 229.50, 459.00, 918.00],
        [101.25, 202.50, 405.00, 810.00],
        [108.00, 162.00, 324.00, 648.00]
      ]
    }
  ];

  let audioCtx = null;
  let isMusicPlaying = false;
  let currentTrackIdx = 0;
  let synthGainNode = null;
  let ambientNoiseSource = null;
  let synthInterval = null;
  let musicProgressTimer = null;
  let currentPlaybackSeconds = 0;
  let chordSequenceStep = 0;
  let activeAudioNodes = [];

  function initMusicWidget() {
    const playBtn = document.getElementById('btn-music-play');
    const prevBtn = document.getElementById('btn-music-prev');
    const nextBtn = document.getElementById('btn-music-next');
    const volSlider = document.getElementById('music-vol-slider');
    const stations = document.querySelectorAll('.station-btn');
    const seekTrack = document.getElementById('music-seek-track');

    if (playBtn) {
      playBtn.addEventListener('click', toggleMusicPlay);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentTrackIdx = (currentTrackIdx - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
        switchTrack(currentTrackIdx);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentTrackIdx = (currentTrackIdx + 1) % MUSIC_TRACKS.length;
        switchTrack(currentTrackIdx);
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        if (synthGainNode && audioCtx && audioCtx.state === 'running') {
          synthGainNode.gain.setValueAtTime(val * 0.18, audioCtx.currentTime);
        }
      });
    }

    stations.forEach((st) => {
      st.addEventListener('click', () => {
        const tIdx = parseInt(st.dataset.track, 10);
        if (!isNaN(tIdx)) switchTrack(tIdx);
      });
    });

    if (seekTrack) {
      const seekHandler = (e) => {
        const rect = seekTrack.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const track = MUSIC_TRACKS[currentTrackIdx];
        if (track) {
          currentPlaybackSeconds = Math.floor(ratio * track.duration);
          updateMusicProgressUI();
        }
      };
      seekTrack.addEventListener('click', seekHandler);
    }

    updateTrackUI();
  }

  function toggleMusicPlay() {
    if (isMusicPlaying) {
      stopAudioSynthesis();
    } else {
      startAudioSynthesis();
    }
  }

  function startAudioSynthesis() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      synthGainNode = audioCtx.createGain();
      const vol = (document.getElementById('music-vol-slider')?.value || 70) / 100;
      synthGainNode.gain.setValueAtTime(vol * 0.18, audioCtx.currentTime);
      synthGainNode.connect(audioCtx.destination);

      const track = MUSIC_TRACKS[currentTrackIdx];
      chordSequenceStep = 0;

      // Specialized Ambience per Track
      if (track.type === 'lofi_rain') {
        createRainAmbience();
      } else if (track.type === 'deep_zen') {
        createBinauralDrone();
      } else if (track.type === 'piano_nature') {
        createWindChimesAmbience();
      } else if (track.type === 'synthwave') {
        createSynthwaveChorusBass();
      }

      // Start distinctive chord sequencer
      playTrackMusicalSequence();
      synthInterval = setInterval(playTrackMusicalSequence, track.type === 'synthwave' ? 2400 : 3800);

      isMusicPlaying = true;
      startProgressTimer();
      setPlayerUIState(true);
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  function createRainAmbience() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }
    ambientNoiseSource = audioCtx.createBufferSource();
    ambientNoiseSource.buffer = noiseBuffer;
    ambientNoiseSource.loop = true;
    ambientNoiseSource.connect(synthGainNode);
    ambientNoiseSource.start();
    activeAudioNodes.push(ambientNoiseSource);
  }

  function createBinauralDrone() {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(108, audioCtx.currentTime); // 432 / 4
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(114, audioCtx.currentTime); // 6Hz Theta binaural beat

    droneGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(synthGainNode);

    osc1.start();
    osc2.start();

    activeAudioNodes.push(osc1, osc2, droneGain);
  }

  function createWindChimesAmbience() {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.015;
    }
    ambientNoiseSource = audioCtx.createBufferSource();
    ambientNoiseSource.buffer = noiseBuffer;
    ambientNoiseSource.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 3.0;
    ambientNoiseSource.connect(filter);
    filter.connect(synthGainNode);
    ambientNoiseSource.start();
    activeAudioNodes.push(ambientNoiseSource, filter);
  }

  function createSynthwaveChorusBass() {
    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(73.42, audioCtx.currentTime); // D2
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, audioCtx.currentTime);
    subGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(synthGainNode);
    subOsc.start();

    activeAudioNodes.push(subOsc, subGain, filter);
  }

  function playTrackMusicalSequence() {
    if (!audioCtx || !synthGainNode || !isMusicPlaying) return;
    const track = MUSIC_TRACKS[currentTrackIdx];
    const chords = track.chordSets || [];
    if (chords.length === 0) return;

    const currentChord = chords[chordSequenceStep % chords.length];
    chordSequenceStep++;

    if (track.type === 'lofi_rain') {
      // Warm Rhodes 7th chord
      currentChord.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime + idx * 0.08);

        oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.07, audioCtx.currentTime + 0.3 + idx * 0.08);
        oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.4);

        osc.connect(oscGain);
        oscGain.connect(synthGainNode);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + 3.6);
        activeAudioNodes.push(osc, oscGain);
      });
    } else if (track.type === 'synthwave') {
      // 80s Arpeggiated sequence
      currentChord.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2200, audioCtx.currentTime + 0.4);
        filter.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 2.0);

        oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime + 0.15 + (idx * 0.15));
        oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.2);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(synthGainNode);

        osc.start(audioCtx.currentTime + (idx * 0.15));
        osc.stop(audioCtx.currentTime + 2.3);
        activeAudioNodes.push(osc, oscGain, filter);
      });
    } else if (track.type === 'piano_nature') {
      // Grand Piano Pentatonic Reverie
      currentChord.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);

        oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.05 + (idx * 0.2));
        oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.0);

        osc.connect(oscGain);
        oscGain.connect(synthGainNode);

        osc.start(audioCtx.currentTime + (idx * 0.2));
        osc.stop(audioCtx.currentTime + 3.2);
        activeAudioNodes.push(osc, oscGain);
      });
    } else {
      // Deep Space Tibetan Zen Bowl
      currentChord.forEach((f, idx) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);

        oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 1.2);
        oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3.6);

        osc.connect(oscGain);
        oscGain.connect(synthGainNode);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 3.8);
        activeAudioNodes.push(osc, oscGain);
      });
    }
  }

  function stopAudioSynthesis() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    if (musicProgressTimer) {
      clearInterval(musicProgressTimer);
      musicProgressTimer = null;
    }

    if (ambientNoiseSource) {
      try {
        ambientNoiseSource.stop();
        ambientNoiseSource.disconnect();
      } catch (e) {}
      ambientNoiseSource = null;
    }

    // Stop and disconnect every active oscillator and node immediately to prevent any lingering sound or beep
    activeAudioNodes.forEach((node) => {
      try {
        if (typeof node.stop === 'function') node.stop();
        if (typeof node.disconnect === 'function') node.disconnect();
      } catch (e) {}
    });
    activeAudioNodes = [];

    // Mute and disconnect master synth gain node
    if (synthGainNode && audioCtx) {
      try {
        synthGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        synthGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        synthGainNode.disconnect();
      } catch (e) {}
      synthGainNode = null;
    }

    // Suspend audio context safely
    if (audioCtx && audioCtx.state === 'running') {
      try {
        audioCtx.suspend();
      } catch (e) {}
    }

    isMusicPlaying = false;
    setPlayerUIState(false);
  }

  function switchTrack(idx) {
    currentTrackIdx = idx;
    currentPlaybackSeconds = 0;
    updateTrackUI();
    if (isMusicPlaying) {
      stopAudioSynthesis();
      startAudioSynthesis();
    }
  }

  function startProgressTimer() {
    if (musicProgressTimer) clearInterval(musicProgressTimer);
    musicProgressTimer = setInterval(() => {
      currentPlaybackSeconds++;
      const track = MUSIC_TRACKS[currentTrackIdx];
      if (track && currentPlaybackSeconds >= track.duration) {
        currentPlaybackSeconds = 0;
        currentTrackIdx = (currentTrackIdx + 1) % MUSIC_TRACKS.length;
        switchTrack(currentTrackIdx);
      }
      updateMusicProgressUI();
    }, 1000);
  }

  function updateTrackUI() {
    const track = MUSIC_TRACKS[currentTrackIdx];
    if (!track) return;
    const titleElem = document.getElementById('music-track-title');
    const artistElem = document.getElementById('music-track-artist');
    const totalTimeElem = document.getElementById('music-time-duration') || document.getElementById('music-total-time');

    if (titleElem) titleElem.textContent = track.title;
    if (artistElem) artistElem.textContent = track.artist;
    if (totalTimeElem) totalTimeElem.textContent = formatDuration(track.duration);

    document.querySelectorAll('.station-btn').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.track, 10) === currentTrackIdx);
    });

    updateMusicProgressUI();
  }

  function updateMusicProgressUI() {
    const track = MUSIC_TRACKS[currentTrackIdx];
    if (!track) return;
    const curTimeElem = document.getElementById('music-time-current') || document.getElementById('music-current-time');
    const fillElem = document.getElementById('music-seek-progress') || document.getElementById('music-seek-fill');

    if (curTimeElem) curTimeElem.textContent = formatDuration(currentPlaybackSeconds);
    if (fillElem) {
      const pct = Math.min(100, Math.max(0, (currentPlaybackSeconds / track.duration) * 100));
      fillElem.style.width = `${pct}%`;
    }
  }

  function setPlayerUIState(playing) {
    const playIcon = document.getElementById('music-play-icon');
    const disc = document.getElementById('music-disc');
    const eqBars = document.querySelectorAll('.eq-bar');

    if (playIcon) playIcon.textContent = playing ? '⏸' : '▶';
    if (disc) disc.classList.toggle('spinning', playing);
    eqBars.forEach((bar) => {
      bar.classList.toggle('playing', playing);
    });
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // --- WIDGET 6: DAILY NEWS HUB & STREAM (MODERN GLASSMORPHIC CARD) ---
  const CURATED_NEWS_DATA = {
    general: {
      badge: '🔥 داغ‌ترین خبر',
      featured: {
        title: 'تازه‌ترین دستاوردهای علمی و فناوری در صدر توجه مجامع بین‌المللی',
        source: 'خبرگزاری دانشجویان',
        time: '۱۰ دقیقه پیش',
        link: 'https://isna.ir',
        image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=700&q=80'
      },
      stream: [
        {
          title: 'بررسی آخرین تحولات اقتصادی و گزارش دوره‌ای رشد بازارهای مالی',
          source: 'ایسنا',
          time: '۳۵ دقیقه پیش',
          link: 'https://isna.ir',
          image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'برگزاری رویدادهای نوآوری و استارتاپی جوانان با استقبال گسترده',
          source: 'آخرین خبر',
          time: '۱ ساعت پیش',
          link: 'https://akharinkhabar.ir',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'گسترش انرژی‌های پاک و پروژه‌های عظیم خورشیدی در سراسر کشور',
          source: 'ایرنا',
          time: '۲ ساعت پیش',
          link: 'https://irna.ir',
          image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'پیروزی‌های چشمگیر ورزشکاران ملی در رقابت‌های قهرمانی قاره‌ای',
          source: 'ورزش ۳',
          time: '۳ ساعت پیش',
          link: 'https://varzesh3.com',
          image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=150&q=80'
        }
      ]
    },
    tech: {
      badge: '⚡ فناوری و هوش مصنوعی',
      featured: {
        title: 'رونمایی از نسل نوین هوش مصنوعی چندوجهی با قابلیت تحلیل بلادرنگ',
        source: 'دیجیاتو',
        time: '۱۵ دقیقه پیش',
        link: 'https://digiato.com',
        image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=700&q=80'
      },
      stream: [
        {
          title: 'معماری مدرن مرورگرها و ارتقای امنیت و سرعت بارگذاری صفحات وب',
          source: 'زومیت',
          time: '۴۰ دقیقه پیش',
          link: 'https://zoomit.ir',
          image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'توسعه شبکه‌های اینترنت کوانتومی و الگوریتم‌های رمزنگاری پیشرفته',
          source: 'تک‌کرانچ',
          time: '۱ ساعت پیش',
          link: 'https://techcrunch.com',
          image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'افزایش چشمگیر راندمان مهندسی نرم‌افزار با دستیارهای هوشمند کدنویسی',
          source: 'گیت‌هاب',
          time: '۲ ساعت پیش',
          link: 'https://github.blog',
          image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'استانداردهای جدید طراحی رابط کاربری شیشه‌ای و گرافیک روان وب',
          source: 'زومجی',
          time: '۴ ساعت پیش',
          link: 'https://zoomg.ir',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'
        }
      ]
    },
    economy: {
      badge: '📊 نبض بازار و طلا',
      featured: {
        title: 'تحلیل جامع نوسانات بازار طلا، سکه بهار آزادی و چشم‌انداز ارزهای بین‌المللی',
        source: 'شبکه اطلاع‌رسانی طلا',
        time: '۲۰ دقیقه پیش',
        link: 'https://tgju.org',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=700&q=80'
      },
      stream: [
        {
          title: 'رشد حجم معاملات و تقویت استیبل‌کوین‌ها در بازارهای مالی کریپتو',
          source: 'کوین‌دسک',
          time: '۴۵ دقیقه پیش',
          link: 'https://coindesk.com',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'گزارش ماهانه وضعیت نقدینگی و سیاست‌های پولی بانک‌های مرکزی',
          source: 'بلومبرگ',
          time: '۱ ساعت پیش',
          link: 'https://bloomberg.com',
          image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'تداوم ثبات در نرخ عرضه فلزات گرانبها و شمش استاندارد در بورس کالا',
          source: 'دنیای اقتصاد',
          time: '۲ ساعت پیش',
          link: 'https://donya-e-eqtesad.com',
          image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80'
        },
        {
          title: 'ثبت رکوردهای جدید در شاخص‌های سهام شرکت‌های برتر فناوری جهانی',
          source: 'فایننشال تایمز',
          time: '۳ ساعت پیش',
          link: 'https://ft.com',
          image: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=150&q=80'
        }
      ]
    }
  };

  function initNewsWidget() {
    const featuredImg = document.getElementById('news-featured-img');
    const featuredBadge = document.getElementById('news-featured-badge');
    const featuredTitle = document.getElementById('news-featured-title');
    const featuredSource = document.getElementById('news-featured-source');
    const featuredTime = document.getElementById('news-featured-time');
    const featuredLink = document.getElementById('news-featured-link');
    const secondaryStream = document.getElementById('news-secondary-stream');
    const filterPills = document.querySelectorAll('#news-filter-pills .news-pill');
    const btnRefresh = document.getElementById('btn-news-refresh');

    let currentCategory = 'general';

    function getDirectNewsArticleUrl(item) {
      if (!item) return '#';
      const link = item.link || '';
      try {
        if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
          const parsed = new URL(link);
          if (parsed.pathname && parsed.pathname.length > 2 && parsed.pathname !== '/') {
            return link;
          }
        }
      } catch (e) {}
      const query = `${item.title || ''} ${item.source || ''}`.trim();
      return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    function renderCategoryNews(category) {
      const data = CURATED_NEWS_DATA[category] || CURATED_NEWS_DATA.general;

      // 1. Render Featured Card
      if (featuredImg && data.featured.image) {
        const proxiedFeatured = getProxiedImageUrl(data.featured.image, { width: 700, quality: 80 });
        featuredImg.src = proxiedFeatured;
        featuredImg.onerror = () => {
          featuredImg.src = data.featured.image;
        };
      }
      const featuredUrl = getDirectNewsArticleUrl(data.featured);
      if (featuredBadge) featuredBadge.textContent = data.badge || '🔥 خبر داغ';
      if (featuredTitle) featuredTitle.textContent = data.featured.title;
      if (featuredSource) featuredSource.textContent = data.featured.source;
      if (featuredTime) featuredTime.textContent = data.featured.time;
      if (featuredLink) {
        featuredLink.href = featuredUrl;
        featuredLink.target = '_blank';
        featuredLink.rel = 'noopener noreferrer';
        featuredLink.title = `مشاهده کامل مقاله در ${data.featured.source}`;
      }

      // Allow clicking anywhere on the featured card to open the exact article
      const featuredCard = document.getElementById('news-featured-card');
      if (featuredCard) {
        featuredCard.style.cursor = 'pointer';
        featuredCard.onclick = (e) => {
          if (e.target.closest('#news-featured-link')) return;
          window.open(featuredUrl, '_blank', 'noopener,noreferrer');
        };
      }

      // 2. Render Secondary Stream
      if (secondaryStream) {
        secondaryStream.innerHTML = '';
        data.stream.forEach((item) => {
          const streamEl = document.createElement('a');
          streamEl.className = 'news-stream-item';
          const streamUrl = getDirectNewsArticleUrl(item);
          streamEl.href = streamUrl;
          streamEl.target = '_blank';
          streamEl.rel = 'noopener noreferrer';
          streamEl.title = `${item.title} (${item.source})`;

          const proxiedThumb = getProxiedImageUrl(item.image, { width: 160, quality: 80 });

          streamEl.innerHTML = `
            <img src="${proxiedThumb}" alt="${escapeHTML(item.title)}" class="news-stream-thumb" loading="lazy" onerror="this.src='${item.image}'; this.onerror=null;" />
            <div class="news-stream-info">
              <h5 class="news-stream-title">${escapeHTML(item.title)}</h5>
              <div class="news-stream-meta">
                <span class="stream-source">${escapeHTML(item.source)}</span>
                <span>•</span>
                <span>${escapeHTML(item.time)}</span>
              </div>
            </div>
          `;
          secondaryStream.appendChild(streamEl);
        });
      }
    }

    // Category Pill Click Handler
    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.dataset.category || 'general';
        currentCategory = cat;
        renderCategoryNews(cat);
      });
    });

    // Refresh News Handler
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        btnRefresh.classList.add('spinning');
        
        try {
          let rssUrl = 'https://digiato.com/feed';
          if (currentCategory === 'general') rssUrl = 'https://www.isna.ir/rss';
          if (currentCategory === 'economy') rssUrl = 'https://digiato.com/feed';

          const res = await safeFetchWithTimeout(`/api/rss?url=${encodeURIComponent(rssUrl)}&limit=5&_t=${Date.now()}`, {}, 4000);
          if (res && res.ok) {
            const json = await res.json().catch(() => null);
            if (json && Array.isArray(json.items) && json.items.length > 0) {
              const top = json.items[0];
              if (featuredTitle && top.title) featuredTitle.textContent = top.title;
              if (featuredSource) featuredSource.textContent = top.source || json.title || 'خبرگزاری';
              if (featuredLink && top.link) featuredLink.href = top.link;
            }
          }
        } catch (e) {}

        setTimeout(() => {
          btnRefresh.classList.remove('spinning');
          showToast('📰 تازه‌ترین خبرهای روز با موفقیت بروزرسانی شدند');
        }, 600);
      });
    }

    // Initial render
    renderCategoryNews('general');
  }

  // --- WIDGET 6: WEATHER & FORECAST (LIVE FETCH + CITY CHANGER) ---
  const CITY_COORDINATES = {
    tehran: { name: 'تهران', lat: 35.6892, lon: 51.3890, fallback: { temp: '۲۴°', desc: 'آفتابی و معتدل', icon: '☀️', feels: '۲۳°', hum: '۲۸٪', wind: '۱۲ کیلومتر/ساعت', uv: '۴ از ۱۱', aqi: '۶۸ (سالم)' } },
    mashhad: { name: 'مشهد', lat: 36.2605, lon: 59.6168, fallback: { temp: '۲۱°', desc: 'صاف با باد ملایم', icon: '🌤️', feels: '۲۰°', hum: '۳۴٪', wind: '۱۸ کیلومتر/ساعت', uv: '۵ از ۱۱', aqi: '۵۵ (خوب)' } },
    isfahan: { name: 'اصفهان', lat: 32.6539, lon: 51.6660, fallback: { temp: '۲۵°', desc: 'کاملاً آفتابی', icon: '☀️', feels: '۲۴°', hum: '۲۲٪', wind: '۱۰ کیلومتر/ساعت', uv: '۶ از ۱۱', aqi: '۷۲ (معمولی)' } },
    shiraz: { name: 'شیراز', lat: 29.5918, lon: 52.5837, fallback: { temp: '۲۶°', desc: 'دلپذیر و بهاری', icon: '🌸', feels: '۲۵°', hum: '۳۰٪', wind: '۱۴ کیلومتر/ساعت', uv: '۵ از ۱۱', aqi: '۴۵ (پاک)' } },
    tabriz: { name: 'تبریز', lat: 38.0962, lon: 46.2738, fallback: { temp: '۱۸°', desc: 'نیمه‌ابری و خنک', icon: '⛅', feels: '۱۷°', hum: '۴۵٪', wind: '۱۶ کیلومتر/ساعت', uv: '۳ از ۱۱', aqi: '۵۰ (پاک)' } },
    rasht: { name: 'رشت', lat: 37.2809, lon: 49.5924, fallback: { temp: '۲۰°', desc: 'بارانی و مرطوب', icon: '🌧️', feels: '۲۱°', hum: '۷۸٪', wind: '۸ کیلومتر/ساعت', uv: '۲ از ۱۱', aqi: '۳۵ (بسیار پاک)' } },
    karaj: { name: 'کرج', lat: 35.8400, lon: 50.9391, fallback: { temp: '۲۳°', desc: 'آفتابی و معتدل', icon: '☀️', feels: '۲۲°', hum: '۳۰٪', wind: '۱۴ کیلومتر/ساعت', uv: '۴ از ۱۱', aqi: '۷۵ (معمولی)' } },
    ahvaz: { name: 'اهواز', lat: 31.3183, lon: 48.6706, fallback: { temp: '۳۴°', desc: 'گرم و آفتابی', icon: '☀️', feels: '۳۶°', hum: '۲۰٪', wind: '۲۲ کیلومتر/ساعت', uv: '۸ از ۱۱', aqi: '۸۵ (معمولی)' } },
    yazd: { name: 'یزد', lat: 31.8974, lon: 54.3569, fallback: { temp: '۲۷°', desc: 'صاف و خشک', icon: '☀️', feels: '۲۶°', hum: '۱۸٪', wind: '۱۱ کیلومتر/ساعت', uv: '۶ از ۱۱', aqi: '۵۸ (خوب)' } },
    dubai: { name: 'دبی', lat: 25.2048, lon: 55.2708, fallback: { temp: '۳۲°', desc: 'آفتابی و گرم', icon: '☀️', feels: '۳۵°', hum: '۵۵٪', wind: '۱۵ کیلومتر/ساعت', uv: '۷ از ۱۱', aqi: '۷۰ (معمولی)' } },
    istanbul: { name: 'استانبول', lat: 41.0082, lon: 28.9784, fallback: { temp: '۱۹°', desc: 'نیمه‌ابری و مطبوع', icon: '⛅', feels: '۱۸°', hum: '۶۰٪', wind: '۱۸ کیلومتر/ساعت', uv: '۴ از ۱۱', aqi: '۴۸ (پاک)' } }
  };

  const WMO_WEATHER_MAP = {
    0: { desc: 'کاملاً صاف و آفتابی', icon: '☀️' },
    1: { desc: 'غالباً آفتابی', icon: '🌤️' },
    2: { desc: 'نیمه‌ابری', icon: '⛅' },
    3: { desc: 'ابری و گرفته', icon: '☁️' },
    45: { desc: 'مه‌آلود', icon: '🌫️' },
    48: { desc: 'مه و یخبندان', icon: '🌫️' },
    51: { desc: 'نم‌نم باران سبک', icon: '🌦️' },
    53: { desc: 'باران ملایم', icon: '🌧️' },
    55: { desc: 'بارش باران مداوم', icon: '🌧️' },
    61: { desc: 'باران پراکنده', icon: '🌧️' },
    63: { desc: 'بارش باران', icon: '🌧️' },
    65: { desc: 'رگبار شدید باران', icon: '⛈️' },
    71: { desc: 'بارش برف سبک', icon: '🌨️' },
    73: { desc: 'بارش برف', icon: '❄️' },
    75: { desc: 'برف سنگین', icon: '❄️' },
    80: { desc: 'رگبار باران', icon: '🌦️' },
    81: { desc: 'رگبار باران متناوب', icon: '🌧️' },
    82: { desc: 'بارش شدید و رگباری', icon: '⛈️' },
    95: { desc: 'رعد و برق و توفان', icon: '⚡' },
    96: { desc: 'توفان همراه با تگرگ', icon: '⛈️' }
  };

  const PERSIAN_WEEKDAYS_SHORT = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

  function initWeatherWidget() {
    const citySelect = document.getElementById('weather-city-select');
    const tempElem = document.getElementById('weather-big-temp');
    const descElem = document.getElementById('weather-condition-text');
    const iconElem = document.getElementById('weather-hero-icon');
    const feelsElem = document.getElementById('weather-feels-like');
    const humidityElem = document.getElementById('weather-humidity');
    const windElem = document.getElementById('weather-wind');
    const uvElem = document.getElementById('weather-uv');
    const aqiElem = document.getElementById('weather-aqi');
    const forecastRow = document.getElementById('weather-forecast-row');

    function applyWeatherData(data, cityName, forecastList) {
      if (tempElem) tempElem.textContent = toPersianDigits(data.temp);
      if (descElem) descElem.textContent = data.desc;
      if (iconElem) iconElem.textContent = data.icon;
      if (feelsElem) feelsElem.textContent = `احساس: ${toPersianDigits(data.feels)}`;
      if (humidityElem) humidityElem.textContent = toPersianDigits(data.hum);
      if (windElem) windElem.textContent = toPersianDigits(data.wind);
      if (uvElem) uvElem.textContent = toPersianDigits(data.uv || '۴ از ۱۱');
      if (aqiElem) aqiElem.textContent = toPersianDigits(data.aqi || '۶۲ (سالم)');

      if (forecastRow && forecastList && forecastList.length > 0) {
        forecastRow.innerHTML = '';
        forecastList.forEach((f) => {
          const card = document.createElement('div');
          card.className = 'forecast-mini-card';
          card.innerHTML = `
            <span class="forecast-day-name">${escapeHTML(f.day)}</span>
            <span class="forecast-icon">${f.icon}</span>
            <span class="forecast-temp">${toPersianDigits(f.high)} <span class="forecast-temp-low">/ ${toPersianDigits(f.low)}</span></span>
          `;
          forecastRow.appendChild(card);
        });
      }
    }

    async function fetchWeatherForCity(cityKey) {
      const cityInfo = CITY_COORDINATES[cityKey] || CITY_COORDINATES.tehran;
      const fallback = cityInfo.fallback;

      // Default forecast days fallback
      const defaultForecast = [
        { day: 'فردا', icon: '🌤️', high: '۲۴°', low: '۱۳°' },
        { day: '۲ روز بعد', icon: '⛅', high: '۲۲°', low: '۱۲°' },
        { day: '۳ روز بعد', icon: '🌧️', high: '۱۹°', low: '۱۰°' },
        { day: '۴ روز بعد', icon: '☀️', high: '۲۳°', low: '۱۱°' }
      ];

      applyWeatherData(fallback, cityInfo.name, defaultForecast);

      if (!navigator.onLine) return;

      try {
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Weather API error ' + response.status);

        const resData = await response.json();
        if (resData && resData.current) {
          const cur = resData.current;
          const wCode = cur.weather_code || 0;
          const wInfo = WMO_WEATHER_MAP[wCode] || { desc: 'صاف', icon: '☀️' };

          const liveData = {
            temp: `${Math.round(cur.temperature_2m)}°`,
            desc: wInfo.desc,
            icon: wInfo.icon,
            feels: `${Math.round(cur.apparent_temperature)}°`,
            hum: `${Math.round(cur.relative_humidity_2m)}٪`,
            wind: `${Math.round(cur.wind_speed_10m)} کیلومتر/ساعت`,
            uv: resData.daily && resData.daily.uv_index_max ? `${Math.round(resData.daily.uv_index_max[0])} از ۱۱` : fallback.uv,
            aqi: fallback.aqi
          };

          const dynamicForecast = [];
          if (resData.daily && resData.daily.time && resData.daily.time.length > 1) {
            for (let i = 1; i < Math.min(5, resData.daily.time.length); i++) {
              const dateObj = new Date(resData.daily.time[i]);
              const dayName = i === 1 ? 'فردا' : PERSIAN_WEEKDAYS_SHORT[dateObj.getDay()];
              const dayCode = resData.daily.weather_code ? resData.daily.weather_code[i] : 0;
              const dayInfo = WMO_WEATHER_MAP[dayCode] || { icon: '🌤️' };
              const maxT = Math.round(resData.daily.temperature_2m_max[i]);
              const minT = Math.round(resData.daily.temperature_2m_min[i]);

              dynamicForecast.push({
                day: dayName,
                icon: dayInfo.icon,
                high: `${maxT}°`,
                low: `${minT}°`
              });
            }
          }

          applyWeatherData(liveData, cityInfo.name, dynamicForecast.length > 0 ? dynamicForecast : defaultForecast);
        }
      } catch (err) {}
    }

    if (citySelect) {
      citySelect.addEventListener('change', (e) => {
        const selectedCity = e.target.value;
        fetchWeatherForCity(selectedCity);
        const cityName = citySelect.options[citySelect.selectedIndex]?.text || selectedCity;
        showToast(`🌤️ آب و هوای ${cityName} به‌روزرسانی شد`);
      });
    }

    // Initial weather load
    fetchWeatherForCity('tehran');
  }

  /* ==========================================================================
     11. Toast Notification Utility
     ========================================================================== */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-notification glass-panel';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  /* ==========================================================================
     12. Main Orchestrator & App Bootstrap
     ========================================================================== */
  function initApp() {
    loadState();
    applySettings();
    renderUserProfile();
    initClockAndDate();
    initSearch();
    renderBookmarks();
    initModals();
    initPageNavigation();

    // Init Page 2 Widgets
    initAnalogClockWidget();
    initCalendarWidget();
    initNotesWidget();
    initMusicWidget();
    initWeatherWidget();
    initNewsWidget();

    updateTotalBookmarksCounter();

    // Initial Cloud Sync for Logged-In User
    if (state.userProfile && state.userProfile.isLoggedIn && state.userProfile.username !== 'guest') {
      fetchCloudBookmarks(state.userProfile.email || state.userProfile.username);
    }

    // Online / Offline Global State listeners
    window.addEventListener('online', () => {
      showToast('🟢 اتصال به اینترنت برقرار شد');
    });

    window.addEventListener('offline', () => {
      showToast('⚠️ اتصال اینترنت قطع شد - حالت آفلاین فعال است');
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
