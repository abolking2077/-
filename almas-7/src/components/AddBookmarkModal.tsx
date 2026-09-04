import React, { useState } from 'react';
import { X, Globe, Folder, Sparkles } from 'lucide-react';
import { BookmarkItem, ThemeMode } from '../types';
import { EMOJI_PRESETS } from '../utils/constants';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<BookmarkItem, 'id' | 'createdAt'>) => void;
  currentFolderId: string | null;
  theme: ThemeMode;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  currentFolderId,
  theme,
}) => {
  const [isFolder, setIsFolder] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!isFolder && !url.trim()) return;

    let formattedUrl = url.trim();
    if (!isFolder && formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    onAdd({
      title: title.trim(),
      url: isFolder ? undefined : formattedUrl,
      isFolder,
      parentId: currentFolderId,
      iconType: selectedEmoji ? 'emoji' : isFolder ? 'emoji' : 'favicon',
      iconValue: selectedEmoji || (isFolder ? '📁' : undefined),
    });

    setTitle('');
    setUrl('');
    setSelectedEmoji('');
    setIsFolder(false);
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
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-300" />
            <h3 className="text-base font-bold">
              {isFolder ? 'افزودن پوشه جدید' : 'افزودن بوکمارک سایت'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle: Site vs Folder */}
        <div className="flex gap-2 p-1 mb-4 rounded-2xl bg-black/20 border border-white/10">
          <button
            type="button"
            onClick={() => setIsFolder(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              !isFolder
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>وب‌سایت / لینک</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFolder(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              isFolder
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>پوشه دسته‌بندی</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 opacity-80">
              {isFolder ? 'نام پوشه' : 'نام سایت'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFolder ? 'مثلاً: ابزارهای طراحی' : 'مثلاً: دیجی‌کالا یا یوتیوب'}
              className={`w-full px-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-all ${
                isLight
                  ? 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  : 'bg-white/10 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
              }`}
            />
          </div>

          {!isFolder && (
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                آدرس اینترنتی (URL)
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                dir="ltr"
                className={`w-full px-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-all ${
                  isLight
                    ? 'bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    : 'bg-white/10 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'
                }`}
              />
            </div>
          )}

          {/* Optional Emoji Picker */}
          <div>
            <label className="block text-xs font-bold mb-1.5 opacity-80">
              آیکون ایموجی اختیاری
            </label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 rounded-2xl bg-black/10 border border-white/10">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform active:scale-90 ${
                    selectedEmoji === emoji
                      ? 'bg-indigo-600/40 ring-2 ring-indigo-400 scale-110'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              ذخیره در داشبورد
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
