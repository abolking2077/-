import React, { useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Crown,
  Edit3,
  Camera,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import { UserProfile, ThemeMode } from '../types';
import { compressImageFile } from '../utils/assetStorage';

interface ProfileHeaderCardProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onQuickEdit: () => void;
  theme: ThemeMode;
  isLight: boolean;
  isLiquid: boolean;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  userProfile,
  onUpdateProfile,
  onQuickEdit,
  theme,
  isLight,
  isLiquid,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.9);
        onUpdateProfile({ avatarUrl: compressed });
      } catch (err) {
        console.warn('Avatar compression error:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onUpdateProfile({ avatarUrl: event.target.result as string });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + ' ' + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2);
  };

  return (
    <div
      className={`w-full p-4 sm:p-5 rounded-2xl mb-4 transition-all duration-300 relative overflow-hidden border ${
        isLiquid
          ? 'bg-gradient-to-r from-indigo-950/60 via-slate-900/50 to-slate-950/70 border-indigo-500/25 shadow-lg shadow-indigo-950/30'
          : isLight
          ? 'bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-100 border-slate-200 shadow-md text-slate-800'
          : 'bg-gradient-to-r from-[#0d121f] via-[#090d16] to-[#06080e] border-white/10 shadow-xl text-slate-100'
      }`}
    >
      {/* Ambient background glow accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -ml-12 -mb-12" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        {/* Left/Right RTL: Avatar + Name + Contact Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
          {/* Avatar with edit overlay */}
          <div className="relative group shrink-0">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center font-black text-xl sm:text-2xl shadow-xl ring-2 transition-all ${
                isLight
                  ? 'ring-indigo-300 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white'
                  : 'ring-indigo-500/50 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 text-white'
              }`}
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="tracking-tight select-none">
                  {getInitials(userProfile.displayName || userProfile.username)}
                </span>
              )}
            </div>

            {/* Change Avatar Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="تغییر عکس پروفایل"
              className="absolute -bottom-1 -right-1 p-1.5 sm:p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 transition-transform active:scale-90 hover:scale-110 ring-2 ring-black/40"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* User Info Details */}
          <div className="flex flex-col items-center sm:items-start space-y-1">
            {/* Display Name & Plan Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3
                className={`text-base sm:text-lg font-black tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {userProfile.displayName || 'کاربر داشبورد'}
              </h3>

              {/* Verified Badge */}
              {userProfile.isVerified && (
                <span
                  title="حساب تایید شده"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تایید شده</span>
                </span>
              )}

              {/* Plan Badge */}
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm ${
                  userProfile.plan === 'pro'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>{userProfile.plan === 'pro' ? 'اشتراک PRO' : 'طرح رایگان'}</span>
              </span>
            </div>

            {/* Username */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono" dir="ltr">
              <span>@{userProfile.username || 'username'}</span>
            </div>

            {/* Contact Info Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs opacity-85">
              {userProfile.email && (
                <span className="flex items-center gap-1.5 text-slate-300" dir="ltr">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-[220px]">{userProfile.email}</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" title="ایمیل تایید شده" />
                </span>
              )}

              {userProfile.phone && (
                <span className="flex items-center gap-1.5 text-slate-300" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{userProfile.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Edit Button */}
        <div className="shrink-0 flex items-center sm:self-center">
          <button
            type="button"
            onClick={onQuickEdit}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isLight
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                : 'bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>مدیریت و ویرایش مشخصات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
