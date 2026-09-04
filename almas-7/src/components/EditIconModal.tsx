import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Smile, Trash2, Check, RefreshCw } from 'lucide-react';
import { BookmarkItem, ThemeMode } from '../types';
import { EMOJI_PRESETS } from '../utils/constants';
import { compressImageFile } from '../utils/assetStorage';

interface EditIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BookmarkItem | null;
  onSave: (updatedItem: BookmarkItem) => void;
  theme: ThemeMode;
}

export const EditIconModal: React.FC<EditIconModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  theme,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconType, setIconType] = useState<'favicon' | 'emoji' | 'image'>('favicon');
  const [iconValue, setIconValue] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || '');
      setIconType(item.iconType || (item.isFolder ? 'emoji' : 'favicon'));
      setIconValue(item.iconValue || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 256, 256, 0.85);
        setIconType('image');
        setIconValue(compressed);
      } catch (err) {
        console.warn('Icon compression fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setIconType('image');
            setIconValue(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleResetToDefault = () => {
    setIconType(item.isFolder ? 'emoji' : 'favicon');
    setIconValue(item.isFolder ? '📁' : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...item,
      title: title.trim(),
      url: item.isFolder ? undefined : url.trim(),
      iconType,
      iconValue: iconType === 'favicon' ? undefined : iconValue,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-md p-6 rounded-3xl transition-all duration-300 ${
          isLiquid
            ? 'liquid-glass-panel text-white'
            : isLight
            ? 'bg-white border border-slate-200 text-slate-800 shadow-2xl'
            : 'bg-[#06080e] border border-white/10 text-white shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 dark:border-slate-800">
          <h3 className="text-base font-bold flex items-center gap-2">
            ✏️ ویرایش مشخصات و آیکون
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-bold mb-1.5 opacity-80">
              نام نمایش داده شده
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 rounded-2xl text-sm font-medium outline-none transition-all ${
                isLight
                  ? 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-slate-400'
                  : 'bg-white/10 border border-white/10 text-white focus:border-slate-300'
              }`}
            />
          </div>

          {/* URL input if not a folder */}
          {!item.isFolder && (
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                آدرس اینترنتی (URL)
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                dir="ltr"
                className={`w-full px-4 py-2 rounded-2xl text-sm font-medium outline-none transition-all ${
                  isLight
                    ? 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-slate-400'
                    : 'bg-white/10 border border-white/10 text-white focus:border-slate-300'
                }`}
              />
            </div>
          )}

          {/* Icon customization options */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold opacity-80">
              آیکون بوکمارک
            </label>

            {/* Icon Preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl overflow-hidden border border-white/10">
                {iconType === 'image' && iconValue ? (
                  <img src={iconValue} alt="Preview" className="w-full h-full object-cover" />
                ) : iconType === 'emoji' && iconValue ? (
                  <span>{iconValue}</span>
                ) : (
                  <span>{item.isFolder ? '📁' : '🌐'}</span>
                )}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold">پیش‌نمایش آیکون فعلی</p>
                <p className="opacity-60 text-[11px]">
                  {iconType === 'image'
                    ? 'عکس اختصاصی آپلود شده'
                    : iconType === 'emoji'
                    ? `ایموجی (${iconValue})`
                    : 'فاوآیکون خودکار'}
                </p>
              </div>
            </div>

            {/* Custom Emoji Selection */}
            <div>
              <label className="block text-[11px] font-medium mb-1 opacity-70">
                انتخاب ایموجی دلخواه:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 rounded-2xl bg-black/10 border border-white/10">
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => {
                      setIconType('emoji');
                      setIconValue(emoji);
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-transform ${
                      iconType === 'emoji' && iconValue === emoji
                        ? 'bg-white/25 ring-1 ring-white/40 scale-110'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-[11px] font-medium mb-1 opacity-70">
                یا آپلود تصویر اختصاصی:
              </label>
              <label
                className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-2xl cursor-pointer text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                    : 'bg-white/10 hover:bg-white/15 border border-white/20 text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-slate-300" />
                <span>انتخاب فایل عکس از سیستم</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to auto */}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازنشانی آیکون به حالت پیش‌فرض</span>
            </button>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              ذخیره تغییرات
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
