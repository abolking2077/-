import React from 'react';
import { ArrowRight, Folder, ChevronLeft } from 'lucide-react';
import { ThemeMode } from '../types';

interface BreadcrumbProps {
  currentFolderName?: string;
  onBack: () => void;
  theme: ThemeMode;
  textTone?: 'light' | 'dark';
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentFolderName,
  onBack,
  theme,
  textTone = 'light',
}) => {
  if (!currentFolderName) return null;

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';
  const isDarkText = textTone === 'dark';

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 flex items-center justify-between">
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${
          isLiquid
            ? 'liquid-glass-card'
            : isLight || isDarkText
            ? 'light-card'
            : 'dark-card'
        }`}
      >
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all active:scale-95 ${
            isLight || isDarkText
              ? 'bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300'
              : 'bg-white/10 hover:bg-indigo-600/20 text-white hover:text-indigo-200 border border-white/15 hover:border-indigo-500/40'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه اصلی</span>
        </button>

        <ChevronLeft className="w-4 h-4 opacity-40 text-indigo-400" />

        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-500" />
          <span className={`text-sm font-bold ${isDarkText ? 'text-slate-900' : 'text-white'}`}>
            {currentFolderName}
          </span>
        </div>
      </div>
    </div>
  );
};
