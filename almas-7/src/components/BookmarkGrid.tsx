import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  ExternalLink,
  Edit2,
  Trash2,
  Globe,
  Plus,
  BookmarkPlus,
  Star
} from 'lucide-react';
import { BookmarkItem, ThemeMode } from '../types';
import { getDomain, getFaviconUrl, getSecondaryFaviconUrl } from '../utils/persianDate';

interface BookmarkGridProps {
  items: BookmarkItem[];
  theme: ThemeMode;
  textTone?: 'light' | 'dark';
  iconSize?: number;
  cardPadding?: number;
  cardScale?: number;
  onItemClick: (item: BookmarkItem) => void;
  onEditIcon: (item: BookmarkItem, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  allBookmarks: BookmarkItem[];
  onOpenAddModal?: () => void;
  onSyncBrowserBookmarks?: () => void;
}

export const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  items,
  theme,
  textTone = 'light',
  iconSize = 56,
  cardPadding = 18,
  cardScale = 100,
  onItemClick,
  onEditIcon,
  onDelete,
  allBookmarks,
  onOpenAddModal,
  onSyncBrowserBookmarks,
}) => {
  const [failedFavicons, setFailedFavicons] = useState<Record<string, number>>({});

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';
  const isDarkText = textTone === 'dark';

  // Derived sizes for icons inside the container
  const imgSize = Math.max(20, Math.round(iconSize * 0.62));
  const emojiFontSize = Math.max(16, Math.round(iconSize * 0.52));
  const folderIconSize = Math.max(18, Math.round(iconSize * 0.52));

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className={`w-full max-w-lg mx-auto p-8 sm:p-10 rounded-3xl text-center flex flex-col items-center justify-center my-8 transition-all duration-400 ${
          isLiquid
            ? 'liquid-glass-card'
            : isLight
            ? 'light-card'
            : 'dark-card'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
            isLight
              ? 'bg-slate-100 text-slate-700 border border-slate-200'
              : 'bg-white/5 text-slate-300 border border-white/10'
          }`}
        >
          <BookmarkPlus className="w-8 h-8 opacity-80" />
        </div>
        <h3 className={`text-base sm:text-lg font-black mb-2 ${isDarkText ? 'text-slate-900 font-extrabold' : 'text-white'}`}>
          هنوز هیچ بوکمارکی اضافه نکرده‌اید
        </h3>
        <p className={`text-xs sm:text-sm leading-relaxed max-w-sm mb-6 ${isDarkText ? 'text-slate-600' : 'text-slate-400'}`}>
          با کلیک روی دکمه زیر، سایت‌ها و لینک‌های مورد علاقه خود را اضافه کنید یا بوکمارک‌های مرورگر را همگام نمایید.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اولین بوکمارک</span>
            </button>
          )}

          {onSyncBrowserBookmarks && (
            <button
              type="button"
              onClick={onSyncBrowserBookmarks}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                isLight || isDarkText
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>خواندن بوکمارک‌های مرورگر</span>
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Count items inside folders
  const getChildCount = (folderId: string) => {
    return allBookmarks.filter((b) => b.parentId === folderId).length;
  };

  const handleFaviconError = (id: string) => {
    setFailedFavicons((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-16">
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
      >
        <AnimatePresence>
          {items.map((item, index) => {
            const domain = item.url ? getDomain(item.url) : '';
            const childCount = item.isFolder ? getChildCount(item.id) : 0;
            const failCount = failedFavicons[item.id] || 0;

            // Card background styling based on theme
            const cardThemeClasses = isLiquid
              ? 'liquid-glass-card'
              : isLight
              ? 'light-card'
              : 'dark-card';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -15 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.03, 0.4),
                  ease: [0.25, 1, 0.5, 1],
                }}
                whileHover={{
                  y: -6,
                  transition: { duration: 0.18, ease: 'easeOut' },
                }}
                whileTap={{
                  scale: 0.96,
                  transition: { duration: 0.1 },
                }}
                onClick={() => onItemClick(item)}
                className={`group relative flex flex-col items-center text-center cursor-pointer select-none overflow-hidden ${cardThemeClasses}`}
                style={{
                  borderRadius: 'var(--card-radius)',
                  padding: `${cardPadding}px`,
                  transform: cardScale !== 100 ? `scale(${cardScale / 100})` : undefined,
                }}
              >
                {/* Moving Light Sweep (Glow Effect on Hover) */}
                <div className="card-glow-sweep absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none opacity-0" />

                {/* Liquid Glass Highlight Sheen */}
                {isLiquid && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] via-transparent to-white/[0.12] pointer-events-none rounded-2xl" />
                )}

                {/* Floating Quick Action Buttons */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                  <button
                    onClick={(e) => onEditIcon(item, e)}
                    className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-90 shadow-md"
                    title="ویرایش آیکون و مشخصات"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => onDelete(item.id, e)}
                    className="p-1.5 rounded-full bg-slate-700 hover:bg-rose-600 text-white transition-all active:scale-90 shadow-sm"
                    title="حذف"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Top Corner Open In New Tab Link for websites */}
                {!item.isFolder && item.url && (
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                        isLight || isDarkText
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title="باز کردن مستقیم در تب جدید"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Card Icon Wrapper with Custom Resizable Dimensions */}
                <div className="relative mb-3 mt-1 flex items-center justify-center">
                  <div
                    style={{
                      width: `${iconSize}px`,
                      height: `${iconSize}px`,
                    }}
                    className={`rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-md ${
                      item.isFolder
                        ? isLiquid
                          ? 'bg-white/15 border border-white/20 shadow-md'
                          : isLight || isDarkText
                          ? 'bg-slate-100 border border-slate-200'
                          : 'bg-slate-800 border border-slate-700'
                        : isLiquid
                        ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-md'
                        : isLight || isDarkText
                        ? 'bg-slate-50 border border-slate-200 shadow-sm'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    {/* Render Icon (Custom Image, Custom Emoji, Folder, or Smart HD Favicon Fallback) */}
                    {item.iconType === 'image' && item.iconValue ? (
                      <img
                        src={item.iconValue}
                        alt={item.title}
                        style={{
                          width: `${imgSize}px`,
                          height: `${imgSize}px`,
                        }}
                        className="rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => handleFaviconError(item.id)}
                      />
                    ) : item.iconType === 'emoji' && item.iconValue ? (
                      <span
                        style={{ fontSize: `${emojiFontSize}px` }}
                        className="leading-none select-none"
                      >
                        {item.iconValue}
                      </span>
                    ) : item.isFolder ? (
                      <Folder
                        style={{
                          width: `${folderIconSize}px`,
                          height: `${folderIconSize}px`,
                        }}
                        className={isLight || isDarkText ? 'text-slate-700' : 'text-slate-200'}
                      />
                    ) : item.url ? (
                      failCount === 0 ? (
                        /* Layer 1: Google Favicon API 128px */
                        <img
                          src={getFaviconUrl(item.url)}
                          alt={item.title}
                          style={{
                            width: `${imgSize}px`,
                            height: `${imgSize}px`,
                          }}
                          className="rounded-lg object-contain transition-transform"
                          referrerPolicy="no-referrer"
                          onError={() => handleFaviconError(item.id)}
                        />
                      ) : failCount === 1 ? (
                        /* Layer 2: Unavatar / DuckDuckGo High-Res */
                        <img
                          src={getSecondaryFaviconUrl(item.url)}
                          alt={item.title}
                          style={{
                            width: `${imgSize}px`,
                            height: `${imgSize}px`,
                          }}
                          className="rounded-lg object-contain"
                          referrerPolicy="no-referrer"
                          onError={() => handleFaviconError(item.id)}
                        />
                      ) : (
                        /* Layer 3: Clean Stylized Initial / Globe Fallback */
                        <div
                          style={{
                            width: `${imgSize}px`,
                            height: `${imgSize}px`,
                            fontSize: `${Math.round(imgSize * 0.45)}px`,
                          }}
                          className="rounded-lg flex items-center justify-center font-bold bg-slate-700 text-white shadow-inner"
                        >
                          {domain ? domain.charAt(0).toUpperCase() : <Globe className="w-4 h-4" />}
                        </div>
                      )
                    ) : (
                      <Globe
                        style={{
                          width: `${folderIconSize}px`,
                          height: `${folderIconSize}px`,
                        }}
                        className="text-slate-400"
                      />
                    )}
                  </div>

                  {/* Folder Item Count Badge */}
                  {item.isFolder && (
                    <span
                      className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full border shadow-sm ${
                        isLight || isDarkText
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-indigo-950 text-indigo-300 border-indigo-700/80'
                      }`}
                    >
                      {childCount}
                    </span>
                  )}

                  {/* Browser Bookmarks Bar Badge */}
                  {item.isBrowserSync && (
                    <span
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-slate-800 text-slate-100 border border-white/20 shadow-md"
                      title="نوار بوکمارک مرورگر"
                    >
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>

                {/* Card Title with Readability Text Adaptation */}
                <h4
                  className={`w-full text-xs md:text-sm font-bold truncate px-1 transition-colors ${
                    isDarkText
                      ? 'text-slate-900 group-hover:text-black font-extrabold'
                      : 'text-slate-100 group-hover:text-white'
                  }`}
                  title={item.title}
                >
                  {item.title}
                </h4>

                {/* Card Domain or Folder Subtitle */}
                <span
                  className={`text-[11px] font-mono mt-0.5 truncate max-w-full opacity-80 ${
                    isDarkText ? 'text-slate-600' : 'text-slate-400'
                  }`}
                  dir="ltr"
                >
                  {item.isFolder ? 'پوشه بوکمارک' : domain || 'وب‌سایت'}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
