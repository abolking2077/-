/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookmarkItem, DashboardSettings, ThemeMode, SearchEngineId, UserProfile } from './types';
import { DEFAULT_BOOKMARKS, DEFAULT_SETTINGS, DEFAULT_USER_PROFILE } from './utils/constants';
import { detectImageBrightness } from './utils/persianDate';
import { setAsset, getAsset, deleteAsset } from './utils/assetStorage';
import { subscribeToAuthState } from './lib/auth';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { Breadcrumb } from './components/Breadcrumb';
import { BookmarkGrid } from './components/BookmarkGrid';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { EditIconModal } from './components/EditIconModal';
import { SettingsModal } from './components/SettingsModal';

const BOOKMARKS_STORAGE_KEY = 'i_dashboard_bookmarks_v2';
const SETTINGS_STORAGE_KEY = 'i_dashboard_settings_v2';
const USER_PROFILE_STORAGE_KEY = 'i_dashboard_user_profile_v2';
const ASSET_BG_KEY = 'custom_background_image';

export default function App() {
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) };
      }
      return DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  });

  // Bookmarks State - Only user-added items (empty by default)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If saved list contains legacy sample bookmarks, clear to empty clean slate
        const hasLegacySampleItems =
          Array.isArray(parsed) &&
          parsed.some(
            (b: BookmarkItem) =>
              b.id === 'folder-browser-bar' ||
              b.id === 'folder-work' ||
              b.id === 'bm-gmail' ||
              b.id === 'bm-digikala' ||
              b.id === 'bm-aparat' ||
              b.id === 'bm-varzesh3'
          );
        if (hasLegacySampleItems) {
          // Filter out legacy samples or start clean if only samples existed
          const userOnly = parsed.filter(
            (b: BookmarkItem) =>
              !b.id.startsWith('bm-') &&
              !b.id.startsWith('folder-browser-bar') &&
              !b.id.startsWith('folder-work') &&
              !b.id.startsWith('folder-social')
          );
          return userOnly;
        }
        return parsed;
      }
      return DEFAULT_BOOKMARKS;
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  });

  // Settings State
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Background detected brightness state ('light' | 'dark')
  const [detectedBgTone, setDetectedBgTone] = useState<'light' | 'dark'>('dark');

  // Load custom background from IndexedDB if stored there
  useEffect(() => {
    getAsset(ASSET_BG_KEY).then((cachedBg) => {
      if (cachedBg && (!settings.backgroundValue || settings.backgroundValue.startsWith('indexeddb:'))) {
        setSettings((prev) => {
          if (prev.backgroundType === 'custom-image') {
            return { ...prev, backgroundValue: cachedBg };
          }
          return prev;
        });
      }
    });
  }, []);

  // Listen to Firebase Auth state across the whole app
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || '';
        const isEmailConfirmed = Boolean(user.emailVerified);
        setUserProfile((prev) => ({
          ...prev,
          email: user.email || prev.email,
          displayName: name || prev.displayName,
          avatarUrl: user.photoURL || prev.avatarUrl,
          isVerified: isEmailConfirmed,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingBrowser, setIsSyncingBrowser] = useState(false);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookmarkItem | null>(null);

  // Save to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage, quota may be exceeded', e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save user profile to localStorage', e);
    }
  }, [userProfile]);

  useEffect(() => {
    // If background image is a large base64 data URL, store it in IndexedDB and keep light reference in localStorage
    const persistSettings = async () => {
      try {
        const settingsToStore = { ...settings };
        if (
          settings.backgroundType === 'custom-image' &&
          settings.backgroundValue &&
          settings.backgroundValue.startsWith('data:image')
        ) {
          // Store huge binary string safely in IndexedDB (unlimited quota)
          await setAsset(ASSET_BG_KEY, settings.backgroundValue);
          // Keep lightweight marker in localStorage so settings don't exceed 5MB
          settingsToStore.backgroundValue = 'indexeddb:' + ASSET_BG_KEY;
        } else if (settings.backgroundType === 'default') {
          deleteAsset(ASSET_BG_KEY);
        }

        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToStore));
      } catch (e) {
        console.warn('LocalStorage save fallback triggered:', e);
        // Fallback: strip heavy custom background value from localStorage if quota still exceeded
        try {
          const minimalSettings = { ...settings, backgroundValue: '' };
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(minimalSettings));
        } catch {
          // Ignore
        }
      }
    };

    persistSettings();
  }, [settings]);

  // Background brightness detection for dynamic text contrast
  useEffect(() => {
    if (settings.backgroundType === 'custom-image' || settings.backgroundType === 'custom-url') {
      if (settings.backgroundValue) {
        detectImageBrightness(settings.backgroundValue).then((tone) => {
          setDetectedBgTone(tone);
        });
      }
    } else {
      setDetectedBgTone(settings.theme === 'light' ? 'light' : 'dark');
    }
  }, [settings.backgroundType, settings.backgroundValue, settings.theme]);

  // Calculate effective text tone based on contrast mode and background
  const effectiveTextTone: 'light' | 'dark' =
    settings.textContrast === 'light'
      ? 'light'
      : settings.textContrast === 'dark'
      ? 'dark'
      : settings.backgroundType === 'default'
      ? settings.theme === 'light'
        ? 'dark'
        : 'light'
      : detectedBgTone === 'light'
      ? 'dark'
      : 'light';

  // Read real browser bookmarks if chrome.bookmarks API is present (Extension mode)
  const syncFromBrowser = useCallback(() => {
    setIsSyncingBrowser(true);
    // Check if chrome.bookmarks is available
    const chromeApi = (window as unknown as { chrome?: { bookmarks?: { getTree: (cb: (tree: unknown[]) => void) => void } } }).chrome;

    if (chromeApi?.bookmarks?.getTree) {
      chromeApi.bookmarks.getTree((tree: unknown[]) => {
        try {
          const imported: BookmarkItem[] = [];
          
          interface ChromeNode {
            id: string;
            title: string;
            url?: string;
            children?: ChromeNode[];
          }

          const traverse = (nodes: ChromeNode[], parentFolderId: string | null = null) => {
            nodes.forEach((node) => {
              if (node.url) {
                imported.push({
                  id: `chrome-bm-${node.id}`,
                  title: node.title || 'بوکمارک مرورگر',
                  url: node.url,
                  parentId: parentFolderId || 'folder-browser-bar',
                  createdAt: Date.now(),
                  iconType: 'favicon',
                  isBrowserSync: true,
                });
              } else if (node.children && node.children.length > 0) {
                // Folder node
                if (node.id !== '0') {
                  const fId = `chrome-folder-${node.id}`;
                  imported.push({
                    id: fId,
                    title: node.title || 'پوشه بوکمارک',
                    isFolder: true,
                    parentId: parentFolderId,
                    createdAt: Date.now(),
                    iconType: 'emoji',
                    iconValue: '📁',
                    isBrowserSync: true,
                  });
                  traverse(node.children, fId);
                } else {
                  traverse(node.children, parentFolderId);
                }
              }
            });
          };

          traverse(tree as ChromeNode[]);
          if (imported.length > 0) {
            setBookmarks((prev) => {
              const nonBrowser = prev.filter((b) => !b.isBrowserSync);
              return [...imported, ...nonBrowser];
            });
            alert(`تعداد ${imported.length} بوکمارک از مرورگر شما با موفقیت دریافت و همگام شد!`);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSyncingBrowser(false);
        }
      });
    } else {
      // In web preview mode without chrome.bookmarks API
      setTimeout(() => {
        setIsSyncingBrowser(false);
        alert(
          'نکته: در محیط پیش‌نمایش وب، برای وارد کردن بوکمارک‌های واقعی مرورگر خود می‌توانید از تب «بوکمارک مرورگر» در منوی تنظیمات، فایل خروجی Bookmarks (HTML یا JSON) را آپلود کنید یا این پروژه را به عنوان Extension بارگذاری نمایید.'
        );
      }, 400);
    }
  }, []);

  // Update theme handler
  const handleThemeChange = (newTheme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  // Add new bookmark / folder
  const handleAddBookmark = (itemData: Omit<BookmarkItem, 'id' | 'createdAt'>) => {
    const newItem: BookmarkItem = {
      ...itemData,
      id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    setBookmarks((prev) => [newItem, ...prev]);
  };

  // Save edited bookmark / icon
  const handleSaveEditedItem = (updatedItem: BookmarkItem) => {
    setBookmarks((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  // Delete bookmark / folder
  const handleDeleteBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToDelete = bookmarks.find((b) => b.id === id);
    if (!itemToDelete) return;

    if (confirm(`آیا از حذف «${itemToDelete.title}» اطمینان دارید؟`)) {
      // If it's a folder, also delete child bookmarks inside it
      setBookmarks((prev) =>
        prev.filter((item) => item.id !== id && item.parentId !== id)
      );
    }
  };

  // Reset to default bookmarks
  const handleResetBookmarks = () => {
    setBookmarks(DEFAULT_BOOKMARKS);
    setCurrentFolderId(null);
  };

  // Click on a bookmark item
  const handleItemClick = (item: BookmarkItem) => {
    if (item.isFolder) {
      setCurrentFolderId(item.id);
      setSearchQuery('');
    } else if (item.url) {
      const targetUrl = item.url.startsWith('http') ? item.url : `https://${item.url}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Filter bookmarks by current folder and search query
  const filteredBookmarks = bookmarks.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = item.title.toLowerCase().includes(q);
      const urlMatch = item.url?.toLowerCase().includes(q);
      return titleMatch || urlMatch;
    }
    return item.parentId === currentFolderId;
  });

  // Current folder name for breadcrumb
  const currentFolder = bookmarks.find((b) => b.id === currentFolderId);

  // Dynamic CSS variables for card corner radius & glass intensity
  const getCardRadiusValue = () => {
    switch (settings.cardRadius) {
      case 'sm':
        return '8px';
      case 'md':
        return '16px';
      case 'lg':
        return '24px';
      case 'xl':
        return '32px';
      default:
        return '24px';
    }
  };

  const getGlassValues = () => {
    switch (settings.glassIntensity) {
      case 'low':
        return { blur: '10px', opacity: '0.08', saturate: '140%' };
      case 'medium':
        return { blur: '20px', opacity: '0.14', saturate: '190%' };
      case 'high':
        return { blur: '36px', opacity: '0.24', saturate: '220%' };
      default:
        return { blur: '20px', opacity: '0.14', saturate: '190%' };
    }
  };

  const glassParams = getGlassValues();

  // Background styling computation
  const getBackgroundStyle = () => {
    const customCssVars = {
      '--card-radius': getCardRadiusValue(),
      '--glass-blur': glassParams.blur,
      '--glass-opacity': glassParams.opacity,
      '--glass-saturate': glassParams.saturate,
      '--bookmark-icon-size': `${settings.iconSize || 56}px`,
      '--bookmark-card-padding': `${settings.cardPadding || 18}px`,
    } as React.CSSProperties;

    if (settings.backgroundType === 'custom-image' || settings.backgroundType === 'custom-url') {
      return {
        ...customCssVars,
        backgroundImage: `url("${settings.backgroundValue}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    if (settings.theme === 'light') {
      return {
        ...customCssVars,
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      };
    }

    if (settings.theme === 'dark') {
      return {
        ...customCssVars,
        backgroundColor: '#000000',
        backgroundImage:
          'radial-gradient(at 50% 0%, #0a0f1d 0%, #000000 70%), radial-gradient(at 100% 100%, #050811 0%, #000000 65%)',
      };
    }

    // Liquid glass default gradient - AMOLED Deep Space Obsidian
    return {
      ...customCssVars,
      backgroundColor: '#000000',
      backgroundImage:
        'radial-gradient(at 15% 15%, #0d1424 0%, transparent 45%), radial-gradient(at 85% 85%, #070d18 0%, transparent 45%), radial-gradient(at 50% 50%, #03050a 0%, #000000 100%)',
    };
  };

  return (
    <div
      style={getBackgroundStyle()}
      data-text-tone={effectiveTextTone}
      className={`min-h-screen w-full relative overflow-x-hidden transition-all duration-400 flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 ${
        effectiveTextTone === 'dark' ? 'text-slate-900' : 'text-slate-100'
      }`}
    >
      {/* Background Subtle Ambient Mesh (Active for Liquid Glass theme - Harmonic deep cosmic undertones) */}
      {settings.theme === 'liquid-glass' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="liquid-orb-1 absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-950/20 blur-3xl" />
          <div className="liquid-orb-2 absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-slate-900/30 blur-3xl" />
          <div className="liquid-orb-3 absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-blue-950/20 blur-3xl" />
        </div>
      )}

      {/* Main Content Container */}
      <div className="w-full max-w-6xl relative z-10 flex flex-col items-center">
        {/* Step 1: Header Bar with Live Clock, Persian Date, Greeting & Action Buttons */}
        <Header
          theme={settings.theme}
          textTone={effectiveTextTone}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          totalBookmarks={bookmarks.filter((b) => !b.isFolder).length}
          userProfile={userProfile}
        />

        {/* Step 2: Folder Breadcrumb Navigation */}
        <AnimatePresence>
          {currentFolderId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <Breadcrumb
                currentFolderName={currentFolder?.title}
                onBack={() => setCurrentFolderId(null)}
                theme={settings.theme}
                textTone={effectiveTextTone}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Multi-Search Engine Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
          className="w-full"
        >
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            theme={settings.theme}
            textTone={effectiveTextTone}
            selectedEngineId={settings.searchEngine}
            onSelectEngine={(engineId: SearchEngineId) =>
              setSettings((prev) => ({ ...prev, searchEngine: engineId }))
            }
          />
        </motion.div>

        {/* Step 4: Staggered Fade-Up Bookmarks Grid with dynamic sizing */}
        <BookmarkGrid
          items={filteredBookmarks}
          theme={settings.theme}
          textTone={effectiveTextTone}
          iconSize={settings.iconSize || 56}
          cardPadding={settings.cardPadding || 18}
          cardScale={settings.cardScale || 100}
          onItemClick={handleItemClick}
          onEditIcon={(item, e) => {
            e.stopPropagation();
            setEditingItem(item);
          }}
          onDelete={handleDeleteBookmark}
          allBookmarks={bookmarks}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSyncBrowserBookmarks={syncFromBrowser}
        />
      </div>

      {/* Add Bookmark / Folder Modal */}
      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBookmark}
        currentFolderId={currentFolderId}
        theme={settings.theme}
      />

      {/* Edit Icon & Bookmark Info Modal */}
      <EditIconModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveEditedItem}
        theme={settings.theme}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        detectedBgTone={detectedBgTone}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        bookmarks={bookmarks}
        onImportBookmarks={(imported) => setBookmarks(imported)}
        onResetBookmarks={handleResetBookmarks}
        onSyncBrowserBookmarks={syncFromBrowser}
        userProfile={userProfile}
        onUpdateUserProfile={(updated) =>
          setUserProfile((prev) => ({ ...prev, ...updated }))
        }
      />
    </div>
  );
}
