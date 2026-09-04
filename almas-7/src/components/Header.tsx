import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Droplets,
  Plus,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types';
import { getPersianDate } from '../utils/persianDate';

interface HeaderProps {
  theme: ThemeMode;
  textTone?: 'light' | 'dark';
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  totalBookmarks: number;
  userProfile?: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  textTone = 'light',
  onOpenAddModal,
  onOpenSettings,
  totalBookmarks,
  userProfile,
}) => {
  const [persianInfo, setPersianInfo] = useState(getPersianDate());

  useEffect(() => {
    const timer = setInterval(() => {
      setPersianInfo(getPersianDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLight = theme === 'light';
  const isLiquid = theme === 'liquid-glass';
  const isDarkText = textTone === 'dark';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="w-full mb-8"
    >
      {/* Top Bar with Navigation, Clock & Actions */}
      <div
        className={`w-full p-4 md:p-6 rounded-3xl transition-all duration-400 flex flex-col md:flex-row items-center justify-between gap-4 ${
          isLiquid
            ? 'liquid-glass-card'
            : isLight || isDarkText
            ? 'light-card'
            : 'dark-card'
        }`}
      >
        {/* Right side in RTL: Brand Logo + Greeting, Persian Date & Transparent English Clock */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          {/* Diamond Brand Logo */}
          <div className="flex items-center gap-2.5 pl-3.5 border-l border-white/10 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-blue-500/20 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 backdrop-blur-md shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-indigo-300 filter drop-shadow-[0_0_8px_rgba(129,140,248,0.7)]"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h12l4 6-10 13L2 9Z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className={`text-sm font-black tracking-tight ${isDarkText ? 'text-slate-900' : 'text-white'}`}>
                الماس داشبورد
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">I-Dashboard Pro</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`text-xl md:text-2xl font-black tracking-tight ${
                  isDarkText ? 'text-slate-900' : 'text-white'
                }`}
              >
                {persianInfo.greetingStr}
              </span>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  isLiquid
                    ? isDarkText
                      ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
                      : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                    : isLight || isDarkText
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60'
                }`}
              >
                {totalBookmarks} بوکمارک
              </span>
            </div>
            
            {/* Date & English Clock in the same seamless row without background */}
            <div
              className={`flex flex-wrap items-center gap-2.5 md:gap-3.5 text-xs md:text-sm mt-1.5 font-medium ${
                isDarkText ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-80" />
                <span>{persianInfo.dateStr}</span>
              </span>
              <span className="opacity-30">•</span>
              <span
                className={`flex items-center gap-1.5 font-mono font-bold tracking-wider text-sm md:text-base ${
                  isDarkText ? 'text-slate-900' : 'text-slate-100'
                }`}
                dir="ltr"
              >
                <Clock className="w-3.5 h-3.5 opacity-85" />
                <span>{persianInfo.englishTimeStr}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Left side in RTL: Action Buttons with Unified Accent Color */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Add Site Button with Accent Color */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن</span>
          </button>

          {/* User Profile Quick Button */}
          {userProfile && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl transition-all active:scale-95 border ${
                isLight || isDarkText
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 hover:border-indigo-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-indigo-400/50'
              }`}
              title={`حساب کاربری: ${userProfile.displayName || userProfile.username}`}
            >
              <div className="relative w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs bg-indigo-600 text-white shadow-sm shrink-0">
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(userProfile.displayName || userProfile.username || 'U').slice(0, 2)}</span>
                )}
                {userProfile.isVerified && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" />
                )}
              </div>
              <span className="text-xs font-bold hidden sm:inline-block max-w-[100px] truncate">
                {userProfile.displayName || `@${userProfile.username}`}
              </span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`p-2.5 rounded-2xl transition-all active:scale-95 ${
              isLight || isDarkText
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 hover:border-indigo-400'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15 hover:border-indigo-400/50 hover:text-indigo-300'
            }`}
            title="تنظیمات، حساب کاربری و تم"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};
