import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Droplets,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Check,
  Bookmark,
  FileCode,
  ShieldCheck,
  Maximize2,
  Sliders,
  Type,
  SlidersHorizontal,
  RotateCcw,
  Package,
  Layers,
  UserCheck,
  Settings,
  Paintbrush,
  Image as ImageIcon
} from 'lucide-react';
import { DashboardSettings, BookmarkItem, CardRadius, GlassIntensity, TextContrastMode, UserProfile } from '../types';
import { DEFAULT_USER_PROFILE } from '../utils/constants';
import { compressImageFile } from '../utils/assetStorage';
import { downloadChromeExtensionZip } from '../utils/extensionZip';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { AccountTab } from './AccountTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  detectedBgTone?: 'light' | 'dark';
  onUpdateSettings: (newSettings: Partial<DashboardSettings>) => void;
  bookmarks: BookmarkItem[];
  onImportBookmarks: (imported: BookmarkItem[]) => void;
  onResetBookmarks: () => void;
  onSyncBrowserBookmarks: () => void;
  userProfile?: UserProfile;
  onUpdateUserProfile?: (updated: Partial<UserProfile>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  detectedBgTone = 'dark',
  onUpdateSettings,
  bookmarks,
  onImportBookmarks,
  onResetBookmarks,
  onSyncBrowserBookmarks,
  userProfile = DEFAULT_USER_PROFILE,
  onUpdateUserProfile,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'account' | 'theme' | 'wallpaper' | 'backup'>('account');

  if (!isOpen) return null;

  const isLight = settings.theme === 'light';
  const isLiquid = settings.theme === 'liquid-glass';

  // Current effective text contrast label
  const currentTextTone =
    settings.textContrast === 'light'
      ? 'سفید (روشن)'
      : settings.textContrast === 'dark'
      ? 'مشکی (تیره)'
      : detectedBgTone === 'light' || (settings.backgroundType === 'default' && settings.theme === 'light')
      ? 'مشکی (تشخیص خودکار)'
      : 'سفید (تشخیص خودکار)';

  // Handle local background image upload with safe compression
  const handleBgFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImageFile(file, 1920, 1080, 0.82);
        onUpdateSettings({
          backgroundType: 'custom-image',
          backgroundValue: compressedDataUrl,
        });
      } catch (err) {
        console.warn('Image compression fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onUpdateSettings({
              backgroundType: 'custom-image',
              backgroundValue: event.target.result as string,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onUpdateSettings({
        backgroundType: 'custom-url',
        backgroundValue: customUrl.trim(),
      });
      setCustomUrl('');
    }
  };

  const handleResetBackground = () => {
    onUpdateSettings({
      backgroundType: 'default',
      backgroundValue: '',
    });
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `i-dashboard-bookmarks-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Check if it's Netscape Bookmarks HTML file (Exported from Chrome/Firefox/Edge)
          if (content.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') || content.includes('<DT><A HREF=')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const links = doc.querySelectorAll('a');
            const importedItems: BookmarkItem[] = [];

            links.forEach((link, idx) => {
              const href = link.getAttribute('href');
              const title = link.textContent || 'بوکمارک مرورگر';
              if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                importedItems.push({
                  id: `imported-html-${Date.now()}-${idx}`,
                  title: title.trim(),
                  url: href,
                  parentId: 'folder-browser-bar',
                  createdAt: Date.now() - idx * 100,
                  iconType: 'favicon',
                  isBrowserSync: true,
                });
              }
            });

            if (importedItems.length > 0) {
              onImportBookmarks([...importedItems, ...bookmarks]);
              alert(`${importedItems.length} بوکمارک با موفقیت از فایل مرورگر بارگذاری شد!`);
              return;
            }
          }

          // Otherwise parse as JSON
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onImportBookmarks(parsed);
            alert('بوکمارک‌ها با موفقیت از فایل JSON وارد شدند!');
          }
        } catch {
          alert('فرمت فایل نامعتبر است.');
        }
      };
      reader.readAsText(file);
    }
  };

  const radiusOptions: { id: CardRadius; label: string; px: string; desc: string }[] = [
    { id: 'sm', label: 'کم (Sharp)', px: '8px', desc: 'گوشه‌های تیز و مدرن' },
    { id: 'md', label: 'استاندارد', px: '16px', desc: 'گردی ملایم و متعادل' },
    { id: 'lg', label: 'گرد نرم', px: '24px', desc: 'انحنای جذاب و ارگانیک' },
    { id: 'xl', label: 'فوق‌العاده گرد', px: '32px', desc: 'استایل فلوئید و کپسولی' },
  ];

  const glassOptions: { id: GlassIntensity; label: string; desc: string }[] = [
    { id: 'low', label: 'شفاف و ملایم (Light)', desc: 'ماتی اندک با وضوح بالای پس‌زمینه' },
    { id: 'medium', label: 'شیشه متعادل (Balanced)', desc: 'انکسار نوری و جلوه شیشه‌ای طبیعی' },
    { id: 'high', label: 'گلس عمیق (Deep Glass)', desc: 'بلور مات سنگین و کریستالی با کنتراست بالا' },
  ];

  const contrastOptions: { id: TextContrastMode; label: string; desc: string }[] = [
    {
      id: 'auto',
      label: 'هوشمند خودکار (توصیه شده)',
      desc: 'تشخیص خودکار تیرگی/روشنی پس‌زمینه برای بالاترین خوانایی متن',
    },
    {
      id: 'light',
      label: 'متن سفید (روشن)',
      desc: 'اجبار به رنگ متن سفید روشن با سایه نرم',
    },
    {
      id: 'dark',
      label: 'متن مشکی (تیره)',
      desc: 'اجبار به رنگ متن تیره و عمیق برای پس‌زمینه‌های روشن',
    },
  ];

  const getPreviewRadiusStyle = () => {
    switch (settings.cardRadius) {
      case 'sm': return '8px';
      case 'md': return '16px';
      case 'lg': return '24px';
      case 'xl': return '32px';
      default: return '24px';
    }
  };

  const currentIconSize = settings.iconSize || 56;
  const currentCardPadding = settings.cardPadding || 18;
  const currentCardScale = settings.cardScale || 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div
        className={`w-full max-w-2xl p-5 sm:p-6 rounded-3xl transition-all duration-300 max-h-[92vh] flex flex-col ${
          isLiquid
            ? 'liquid-glass-panel text-slate-100'
            : isLight
            ? 'bg-white border border-slate-200 text-slate-800 shadow-2xl'
            : 'bg-[#06080e] border border-white/10 text-slate-100 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-black">مرکز تنظیمات و حساب کاربری</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 🎨 ۱. هدر صفحه اصلی تنظیمات (Top Profile Section) */}
        <div className="shrink-0">
          <ProfileHeaderCard
            userProfile={userProfile}
            onUpdateProfile={(updated) => {
              if (onUpdateUserProfile) {
                onUpdateUserProfile(updated);
              }
            }}
            onQuickEdit={() => setActiveTab('account')}
            theme={settings.theme}
            isLight={isLight}
            isLiquid={isLiquid}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 mb-4 rounded-2xl bg-black/25 border border-white/10 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'account'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>حساب کاربری</span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'theme'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>ظاهر و کارت‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('wallpaper')}
            className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'wallpaper'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>تصویر پس‌زمینه</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>بوکمارک و افزونه</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 pl-1 custom-scrollbar">
          {activeTab === 'account' && (
            <AccountTab
              userProfile={userProfile}
              onUpdateProfile={(updated) => {
                if (onUpdateUserProfile) {
                  onUpdateUserProfile(updated);
                }
              }}
              theme={settings.theme}
              isLight={isLight}
              isLiquid={isLiquid}
              onResetAllData={() => {
                onResetBookmarks();
                if (onUpdateUserProfile) {
                  onUpdateUserProfile(DEFAULT_USER_PROFILE);
                }
              }}
            />
          )}

          {activeTab === 'theme' && (
            <div className="space-y-5">
              {/* Theme Mode Selector */}
              <div>
                <label className="block text-xs font-bold mb-3 opacity-90">
                  انتخاب تم داشبورد:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Dark Mode */}
                  <div
                    onClick={() => onUpdateSettings({ theme: 'dark' })}
                    className={`p-3.5 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center text-center relative ${
                      settings.theme === 'dark'
                        ? 'border-indigo-500 bg-indigo-950/40 shadow-lg ring-2 ring-indigo-500/20'
                        : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                    }`}
                  >
                    {settings.theme === 'dark' && (
                      <span className="absolute top-2 right-2 p-1 rounded-full bg-indigo-600 text-white shadow-sm">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <Moon className={`w-6 h-6 mb-1.5 ${settings.theme === 'dark' ? 'text-indigo-400' : 'text-slate-300'}`} />
                    <h4 className="text-xs font-bold text-white mb-0.5">تاریک (Dark)</h4>
                    <p className="text-[10px] text-slate-400">کارت‌های تیره گرافیت</p>
                  </div>

                  {/* Light Mode */}
                  <div
                    onClick={() => onUpdateSettings({ theme: 'light' })}
                    className={`p-3.5 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center text-center relative ${
                      settings.theme === 'light'
                        ? 'border-indigo-500 bg-white/95 shadow-lg text-slate-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-300/40 bg-white/10 hover:border-slate-300'
                    }`}
                  >
                    {settings.theme === 'light' && (
                      <span className="absolute top-2 right-2 p-1 rounded-full bg-indigo-600 text-white shadow-sm">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <Sun className={`w-6 h-6 mb-1.5 ${settings.theme === 'light' ? 'text-indigo-600' : 'text-slate-700'}`} />
                    <h4
                      className={`text-xs font-bold mb-0.5 ${
                        settings.theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      روشن (Light)
                    </h4>
                    <p
                      className={`text-[10px] ${
                        settings.theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      کارت‌های سفید خنثی
                    </p>
                  </div>

                  {/* Liquid Glass Option */}
                  <div
                    onClick={() => onUpdateSettings({ theme: 'liquid-glass' })}
                    className={`p-3.5 rounded-2xl cursor-pointer border-2 transition-all flex flex-col items-center text-center relative ${
                      settings.theme === 'liquid-glass'
                        ? 'border-indigo-400 bg-indigo-950/50 shadow-lg ring-2 ring-indigo-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {settings.theme === 'liquid-glass' && (
                      <span className="absolute top-2 right-2 p-1 rounded-full bg-indigo-600 text-white shadow-sm">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <Droplets className={`w-6 h-6 mb-1.5 ${settings.theme === 'liquid-glass' ? 'text-indigo-400' : 'text-slate-300'}`} />
                    <h4 className="text-xs font-bold text-slate-100 mb-0.5">لیکویید گلس</h4>
                    <p className="text-[10px] text-slate-400">
                      شیشه‌ای مات خنثی و مات
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Readability & Contrast Control */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5 opacity-90">
                    <Type className="w-4 h-4 text-indigo-400" />
                    <span>خوانایی و کنتراست رنگ نوشته‌ها (Text Contrast):</span>
                  </label>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-200 border border-indigo-500/30">
                    {currentTextTone}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {contrastOptions.map((opt) => {
                    const isSelected = (settings.textContrast || 'auto') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateSettings({ textContrast: opt.id })}
                        className={`p-3 rounded-2xl text-right transition-all border flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                            : 'border-white/10 bg-black/20 hover:bg-black/30 opacity-75 hover:opacity-100 text-slate-300'
                        }`}
                      >
                        <div>
                          <span className={`block text-xs font-bold mb-1 ${isSelected ? 'text-indigo-200' : ''}`}>{opt.label}</span>
                          <span className="block text-[10px] opacity-70 leading-relaxed">{opt.desc}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 text-left">
                            <span className="inline-block p-0.5 rounded-full bg-indigo-600 text-white">
                              <Check className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simplified & Unified Bookmark Sizing Controls */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold opacity-90">
                      اندازه و ابعاد کارت‌های بوکمارک (Bookmark Sizing):
                    </h4>
                  </div>
                  {(currentIconSize !== 56 || currentCardPadding !== 18) && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ iconSize: 56, cardPadding: 18, cardScale: 100 })
                      }
                      className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>پیش‌فرض</span>
                    </button>
                  )}
                </div>

                {/* 3 Quick Unified Sizing Presets */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ iconSize: 42, cardPadding: 12, cardScale: 95 })
                    }
                    className={`py-2 px-2.5 rounded-xl text-center border transition-all text-xs font-bold ${
                      currentIconSize <= 46 && currentCardPadding <= 14
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                        : 'border-white/10 bg-black/20 hover:bg-black/30 text-slate-300'
                    }`}
                  >
                    <span className="block mb-0.5">فشرده (کوچک)</span>
                    <span className="block text-[10px] opacity-60 font-mono font-normal">42px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ iconSize: 56, cardPadding: 18, cardScale: 100 })
                    }
                    className={`py-2 px-2.5 rounded-xl text-center border transition-all text-xs font-bold ${
                      currentIconSize >= 50 && currentIconSize <= 62 && currentCardPadding >= 16 && currentCardPadding <= 20
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                        : 'border-white/10 bg-black/20 hover:bg-black/30 text-slate-300'
                    }`}
                  >
                    <span className="block mb-0.5">استاندارد</span>
                    <span className="block text-[10px] opacity-60 font-mono font-normal">56px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ iconSize: 70, cardPadding: 24, cardScale: 105 })
                    }
                    className={`py-2 px-2.5 rounded-xl text-center border transition-all text-xs font-bold ${
                      currentIconSize >= 66 && currentCardPadding >= 22
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                        : 'border-white/10 bg-black/20 hover:bg-black/30 text-slate-300'
                    }`}
                  >
                    <span className="block mb-0.5">بزرگ (جادار)</span>
                    <span className="block text-[10px] opacity-60 font-mono font-normal">70px</span>
                  </button>
                </div>

                {/* Fine-Tuning Unified Sliders */}
                <div className="space-y-3.5 pt-2">
                  {/* Slider 1: Icon Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-80">اندازه آیکون‌ها:</span>
                      <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-white/10 text-slate-200">
                        {currentIconSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="32"
                      max="80"
                      step="2"
                      value={currentIconSize}
                      onChange={(e) => onUpdateSettings({ iconSize: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-black/40 rounded-lg"
                    />
                  </div>

                  {/* Slider 2: Card Padding */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-80">فضای دور کارت (Padding):</span>
                      <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-white/10 text-slate-200">
                        {currentCardPadding}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="32"
                      step="2"
                      value={currentCardPadding}
                      onChange={(e) => onUpdateSettings({ cardPadding: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-black/40 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Corner Roundness (Border Radius) Control */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5 opacity-90">
                    <Maximize2 className="w-4 h-4 text-indigo-400" />
                    <span>میزان گردی گوشه‌های کارت‌ها (Corner Radius):</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-600/30 text-indigo-200 border border-indigo-500/30">
                    {getPreviewRadiusStyle()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {radiusOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateSettings({ cardRadius: opt.id })}
                      className={`p-2.5 text-center transition-all border flex flex-col items-center justify-center relative ${
                        settings.cardRadius === opt.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                          : 'border-white/10 bg-black/20 hover:bg-black/30 opacity-75 hover:opacity-100 text-slate-300'
                      }`}
                      style={{ borderRadius: opt.px }}
                    >
                      <span className={`text-xs font-bold mb-0.5 ${settings.cardRadius === opt.id ? 'text-indigo-200' : ''}`}>{opt.label}</span>
                      <span className="text-[10px] opacity-70 font-mono" dir="ltr">{opt.px}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Effect Intensity Control */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <label className="text-xs font-bold flex items-center gap-1.5 opacity-90">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>شدت ماتی شیشه‌ای (حالت گلس):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {glassOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateSettings({ glassIntensity: opt.id })}
                      className={`p-3 rounded-2xl text-right transition-all border relative flex flex-col justify-between ${
                        (settings.glassIntensity || 'medium') === opt.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50'
                          : 'border-white/10 bg-black/20 hover:bg-black/30 opacity-75 hover:opacity-100 text-slate-300'
                      }`}
                    >
                      <div>
                        <span className={`block text-xs font-bold mb-1 ${(settings.glassIntensity || 'medium') === opt.id ? 'text-indigo-200' : ''}`}>{opt.label}</span>
                        <span className="block text-[10px] opacity-70 leading-relaxed">{opt.desc}</span>
                      </div>
                      {(settings.glassIntensity || 'medium') === opt.id && (
                        <div className="mt-2 text-left">
                          <span className="inline-block p-0.5 rounded-full bg-indigo-600 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wallpaper' && (
            <div className="space-y-4">
              {/* Reset to Default */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold">پس‌زمینه پیش‌فرض هوشمند</h4>
                    <p className="text-[11px] opacity-70">استفاده از پس‌زمینه هماهنگ با تم انتخابی</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetBackground}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      settings.backgroundType === 'default'
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {settings.backgroundType === 'default' ? '✓ فعال' : 'فعال‌سازی'}
                  </button>
                </div>
              </div>

              {/* Upload Local Image */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-2.5">
                <label className="block text-xs font-bold opacity-90">
                  آپلود عکس اختصاصی از سیستم:
                </label>
                <label
                  className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl cursor-pointer text-xs font-bold transition-all ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                      : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
                  }`}
                >
                  <Upload className="w-4 h-4 text-slate-300" />
                  <span>انتخاب فایل تصویر از دستگاه</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgFileUpload}
                    className="hidden"
                  />
                </label>
                {settings.backgroundType === 'custom-image' && (
                  <p className="text-[11px] text-slate-300 font-medium">✓ عکس اختصاصی با موفقیت اعمال شده است.</p>
                )}
              </div>

              {/* Custom URL */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-2.5">
                <label className="block text-xs font-bold opacity-90">
                  یا درج لینک مستقیم عکس اینترنتی:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    dir="ltr"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none transition-all ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-800 focus:border-slate-500'
                        : 'bg-black/40 border-white/10 text-white focus:border-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    اعمال لینک
                  </button>
                </div>
                {settings.backgroundType === 'custom-url' && (
                  <p className="text-[11px] text-slate-300 font-medium">✓ لینک تصویر آنلاین در حال نمایش است.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Chrome Extension Download & Direct Install Package */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white">پکیج آماده افزونه گوگل کروم (Extension Package)</h4>
                </div>
                <p className="text-[11px] text-slate-300 opacity-90 leading-relaxed">
                  نسخه نهایی داشبورد به صورت یک افزونه کامل مرورگر آماده است. پس از دانلود، فایل زیپ را استخراج نموده و در صفحه <code className="px-1.5 py-0.5 rounded bg-black/40 text-indigo-300 font-mono text-[10px]" dir="ltr">chrome://extensions</code> دکمه <b className="text-white">Load unpacked</b> را بزنید و پوشه را انتخاب کنید.
                </p>
                <button
                  type="button"
                  onClick={downloadChromeExtensionZip}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود پکیج افزونه کروم (فایل ZIP نهایی)</span>
                </button>
              </div>

              {/* Browser Sync */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-slate-300" />
                  <h4 className="text-xs font-bold">همگام‌سازی بوکمارک‌های مرورگر</h4>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  اگر داشبورد به عنوان افزونه در مرورگر اجرا شود، این دکمه بوکمارک‌های مرورگر شما را به صورت مستقیم و در یک پوشه مرتب بارگذاری می‌کند.
                </p>
                <button
                  type="button"
                  onClick={onSyncBrowserBookmarks}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600/50 shadow-md transition-all active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>دریافت مستقیم از مرورگر (Chrome Bookmarks API)</span>
                </button>
              </div>

              {/* Import from Browser HTML file */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-300" />
                  <h4 className="text-xs font-bold">وارد کردن فایل بوکمارک مرورگر (HTML)</h4>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  فایل خروجی HTML ذخیره شده از مرورگرهای کروم، فایرفاکس یا اج را انتخاب کنید:
                </p>
                <label
                  className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                      : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
                  }`}
                >
                  <Upload className="w-4 h-4 text-slate-300" />
                  <span>انتخاب فایل Bookmarks.html مرورگر</span>
                  <input
                    type="file"
                    accept=".html,.htm,.json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Backup JSON */}
              <div className="p-4 rounded-2xl bg-black/20 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-300" />
                  <h4 className="text-xs font-bold">پشتیبان‌گیری و بازیابی فایل JSON</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود بکاپ JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={onResetBookmarks}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-700/80 hover:bg-rose-700 text-white transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ریست به پیش‌فرض</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-white/10 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            بستن و ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};
