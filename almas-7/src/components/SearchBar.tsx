import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeMode, SearchEngineId } from '../types';
import { SEARCH_ENGINES } from '../utils/constants';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  theme: ThemeMode;
  textTone?: 'light' | 'dark';
  selectedEngineId: SearchEngineId;
  onSelectEngine: (engineId: SearchEngineId) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  theme,
  textTone = 'light',
  selectedEngineId,
  onSelectEngine,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';
  const isDarkText = textTone === 'dark';

  const currentEngine =
    SEARCH_ENGINES.find((e) => e.id === selectedEngineId) || SEARCH_ENGINES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsEngineDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExecuteSearch = () => {
    if (!query.trim()) return;

    const trimmed = query.trim();
    // If it looks like an explicit URL with no spaces, navigate directly
    if (
      (trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        (trimmed.includes('.') && !trimmed.includes(' '))) &&
      !trimmed.includes('?')
    ) {
      const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise use selected search engine
    const searchUrl = `${currentEngine.queryUrl}${encodeURIComponent(trimmed)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteSearch();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 relative z-30">
      <div
        className={`relative flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-3xl transition-all duration-300 ${
          isLiquid
            ? `liquid-glass-card ${
                isFocused
                  ? 'ring-2 ring-indigo-500/50 border-indigo-400/40 shadow-2xl shadow-indigo-500/10'
                  : ''
              }`
            : isLight || isDarkText
            ? `light-card ${
                isFocused
                  ? 'ring-2 ring-indigo-500/40 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                  : ''
              }`
            : `dark-card ${
                isFocused
                  ? 'ring-2 ring-indigo-500/40 border-indigo-500/40 shadow-2xl shadow-indigo-500/10'
                  : ''
              }`
        }`}
      >
        {/* Search Engine Selector Trigger Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsEngineDropdownOpen(!isEngineDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${
              isLight || isDarkText
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 hover:border-indigo-300 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 hover:border-indigo-400/40 shadow-sm'
            }`}
            title="تغییر موتور جستجو"
          >
            <span className="text-base leading-none">{currentEngine.icon}</span>
            <span className="hidden sm:inline font-bold truncate max-w-[80px]">
              {currentEngine.name.split(' ')[0]}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
                isEngineDropdownOpen ? 'rotate-180 text-indigo-400' : ''
              }`}
            />
          </button>

          {/* Search Engine Dropdown Menu */}
          <AnimatePresence>
            {isEngineDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full right-0 mt-2 w-64 sm:w-72 p-2 rounded-2xl z-50 shadow-2xl overflow-hidden border ${
                  isLiquid
                    ? 'liquid-glass-panel border-white/20'
                    : isLight || isDarkText
                    ? 'bg-white border-slate-200 shadow-2xl text-slate-900'
                    : 'bg-slate-900 border-slate-700 shadow-2xl text-white'
                }`}
              >
                <div className="px-3 py-1.5 mb-1 text-[11px] font-bold opacity-70 flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>انتخاب موتور جستجو:</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {SEARCH_ENGINES.map((engine) => {
                    const isSelected = engine.id === selectedEngineId;
                    return (
                      <button
                        key={engine.id}
                        type="button"
                        onClick={() => {
                          onSelectEngine(engine.id);
                          setIsEngineDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-extrabold'
                            : isLight || isDarkText
                            ? 'hover:bg-slate-100 text-slate-700 hover:text-indigo-600'
                            : 'hover:bg-white/10 text-slate-300 hover:text-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{engine.icon}</span>
                          <div className="text-right">
                            <div className="font-bold">{engine.name}</div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Icon */}
        <Search
          className={`w-4 h-4 sm:w-5 sm:h-5 mx-2.5 transition-colors ${
            isFocused
              ? 'text-indigo-500'
              : isDarkText
              ? 'text-slate-600'
              : 'text-slate-400'
          }`}
        />

        {/* Search Input Box */}
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={currentEngine.placeholder}
          className={`w-full bg-transparent border-none outline-none text-xs sm:text-sm md:text-base font-medium placeholder:font-normal placeholder:opacity-60 transition-all ${
            isLight || isDarkText
              ? 'text-slate-900 placeholder:text-slate-500'
              : 'text-white placeholder:text-slate-400'
          }`}
        />

        {/* Clear query button */}
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className={`p-1.5 rounded-full mr-1 transition-all ${
              isLight || isDarkText
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="پاک کردن متن"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Action button to execute search */}
        <button
          type="button"
          onClick={handleExecuteSearch}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
          title="جستجو"
        >
          <span className="hidden sm:inline">جستجو</span>
          <span className="font-mono text-[11px] opacity-90">↵</span>
        </button>
      </div>
    </div>
  );
};
