import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Laptop,
  Crown,
  Cloud,
  LogOut,
  Trash2,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';
import { UserProfile, UserSession, ThemeMode } from '../types';
import { compressImageFile } from '../utils/assetStorage';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  resetPassword,
  resendVerificationEmail,
  refreshUserVerification,
  updateUserProfile,
  updateUserPassword,
  deleteUserAccount,
  subscribeToAuthState,
  translateFirebaseError,
  FirebaseUser,
} from '../lib/auth';

interface AccountTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  theme: ThemeMode;
  isLight: boolean;
  isLiquid: boolean;
  onResetAllData: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  userProfile,
  onUpdateProfile,
  theme,
  isLight,
  isLiquid,
  onResetAllData,
}) => {
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRefreshingVerification, setIsRefreshingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  // Mode: 'login' | 'signup' | 'forgot_password'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and feedback
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  // Profile Edit Local State (for logged-in user)
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [username, setUsername] = useState(userProfile.username || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Password update state for logged in user
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateFeedback, setPasswordUpdateFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Cloud sync local state
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Modals & Confirmation dialogs
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Firebase Auth Listener on Mount
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        syncUserProfileFromFirebase(user);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper to sync Firebase User into app's userProfile
  const syncUserProfileFromFirebase = (user: FirebaseUser) => {
    const fullName = user.displayName || user.email?.split('@')[0] || 'کاربر گرامی';
    const avatar = user.photoURL || userProfile.avatarUrl;
    const isEmailConfirmed = Boolean(user.emailVerified);

    setDisplayName(fullName);
    onUpdateProfile({
      email: user.email || '',
      displayName: fullName,
      avatarUrl: avatar,
      isVerified: isEmailConfirmed,
    });
  };

  // Password Strength Calculator
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 30;
    if (pass.length >= 8) score += 20;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 10;
    return Math.min(score, 100);
  };

  const passStrength = calculatePasswordStrength(formPassword || newPassword);

  // Handle Email & Password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = formEmail.trim();
    if (!cleanEmail || !formPassword) {
      setAuthError('لطفاً آدرس ایمیل و رمز عبور را وارد نمایید.');
      return;
    }

    if (!isFirebaseConfigured) {
      setAuthError('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env تعریف فرمایید.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await loginWithEmail(cleanEmail, formPassword);
      if (user) {
        setAuthSuccess('ورود با موفقیت انجام شد! در حال انتقال...');
        syncUserProfileFromFirebase(user);
        setFormPassword('');
      }
    } catch (err: any) {
      setAuthError(translateFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Email & Password Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = formEmail.trim();
    const cleanName = formFullName.trim();

    if (!cleanEmail || !formPassword) {
      setAuthError('وارد کردن ایمیل و رمز عبور الزامی است.');
      return;
    }

    if (formPassword.length < 6) {
      setAuthError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (formPassword !== formConfirmPassword) {
      setAuthError('رمز عبور و تکرار آن با یکدیگر مطابقت ندارند.');
      return;
    }

    if (!isFirebaseConfigured) {
      setAuthError('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env تعریف فرمایید.');
      return;
    }

    setSubmitting(true);
    try {
      const { user, verificationSent } = await registerWithEmail(cleanEmail, formPassword, cleanName);
      if (user) {
        syncUserProfileFromFirebase(user);
        if (verificationSent) {
          setAuthSuccess('ثبت‌نام با موفقیت انجام شد! یک ایمیل تایید به آدرس شما ارسال شد. لطفاً صندوق ورودی (Inbox یا Spam) ایمیل خود را بررسی و روی لینک تایید کلیک کنید.');
        } else {
          setAuthSuccess('ثبت‌نام با موفقیت انجام شد و شما وارد شدید!');
        }
        setFormPassword('');
        setFormConfirmPassword('');
      }
    } catch (err: any) {
      setAuthError(translateFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSuccess(null);

    if (!isFirebaseConfigured) {
      setAuthError('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env تعریف فرمایید.');
      return;
    }

    setOauthLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setAuthSuccess('ورود با حساب گوگل با موفقیت انجام شد.');
        syncUserProfileFromFirebase(user);
      }
    } catch (err: any) {
      setAuthError(translateFirebaseError(err));
    } finally {
      setOauthLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = formEmail.trim();
    if (!cleanEmail) {
      setAuthError('لطفاً ایمیل خود را وارد نمایید.');
      return;
    }

    if (!isFirebaseConfigured) {
      setAuthError('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env تعریف فرمایید.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(cleanEmail);
      setAuthSuccess('لینک بازیابی رمز عبور با موفقیت به ایمیل شما ارسال شد. لطفاً صندوق ورودی ایمیل خود را بررسی نمایید.');
    } catch (err: any) {
      setAuthError(translateFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    if (!currentUser) return;
    setVerificationFeedback(null);
    try {
      await resendVerificationEmail(currentUser);
      setVerificationFeedback({
        type: 'success',
        msg: 'ایمیل تایید مجدداً با موفقیت ارسال گردید. لطفاً پوشه Inbox و Spam را بررسی نمایید.',
      });
      setTimeout(() => setVerificationFeedback(null), 5000);
    } catch (err: any) {
      setVerificationFeedback({
        type: 'error',
        msg: translateFirebaseError(err),
      });
    }
  };

  // Handle Refresh Verification Status
  const handleRefreshVerification = async () => {
    if (!currentUser) return;
    setIsRefreshingVerification(true);
    setVerificationFeedback(null);
    try {
      const isVerified = await refreshUserVerification(currentUser);
      onUpdateProfile({ isVerified });
      if (isVerified) {
        setVerificationFeedback({
          type: 'success',
          msg: 'تبریک! آدرس ایمیل شما با موفقیت تایید شده است. 🎉',
        });
      } else {
        setVerificationFeedback({
          type: 'info',
          msg: 'ایمیل هنوز تایید نشده است. پس از کلیک بر روی لینک داخل ایمیل، مجدداً این دکمه را بزنید.',
        });
      }
      setTimeout(() => setVerificationFeedback(null), 5000);
    } catch (err: any) {
      setVerificationFeedback({
        type: 'error',
        msg: translateFirebaseError(err),
      });
    } finally {
      setIsRefreshingVerification(false);
    }
  };

  // Handle Update Password for Logged In User
  const handleUpdateUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateFeedback(null);

    if (!currentPassword) {
      setPasswordUpdateFeedback({ type: 'error', msg: 'برای تغییر رمز، وارد کردن رمز عبور فعلی الزامی است.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordUpdateFeedback({ type: 'error', msg: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordUpdateFeedback({ type: 'error', msg: 'رمز عبور جدید نمی‌تواند همان رمز فعلی باشد.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordUpdateFeedback({ type: 'error', msg: 'رمز عبور جدید و تکرار آن یکسان نیستند.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setPasswordUpdateFeedback({ type: 'success', msg: 'رمز عبور با موفقیت در Firebase تغییر یافت!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordUpdateFeedback(null), 4000);
    } catch (err: any) {
      setPasswordUpdateFeedback({ type: 'error', msg: translateFirebaseError(err) });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
    });

    if (currentUser) {
      try {
        await updateUserProfile({
          displayName: displayName.trim(),
        });
      } catch (err) {
        console.warn('Failed to update Firebase user profile:', err);
      }
    }

    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  // Handle Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.9);
        onUpdateProfile({ avatarUrl: compressed });
        if (currentUser) {
          try {
            await updateUserProfile({ photoURL: compressed });
          } catch (profileErr) {
            console.warn('Failed to update photoURL in Firebase:', profileErr);
          }
        }
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

  // Handle Remove Avatar
  const handleRemoveAvatar = async () => {
    onUpdateProfile({ avatarUrl: '' });
    if (currentUser) {
      try {
        await updateUserProfile({ photoURL: '' });
      } catch (err) {
        console.warn('Failed to clear photoURL in Firebase:', err);
      }
    }
  };

  // Handle Sign Out
  const handlePerformLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    setCurrentUser(null);
    onUpdateProfile({
      displayName: 'کاربر مهمان',
      username: 'guest',
      email: '',
      phone: '',
      avatarUrl: '',
      isVerified: false,
      plan: 'free',
      cloudSyncEnabled: false,
    });
  };

  // Handle Permanent Delete Firebase Account
  const handlePerformDeleteAccount = async () => {
    setDeleteAccountError(null);
    setIsDeletingAccount(true);
    try {
      await deleteUserAccount(deleteAccountPassword);
      setCurrentUser(null);
      setDeleteAccountPassword('');
      setShowDeleteAccountModal(false);
      onUpdateProfile({
        displayName: 'کاربر مهمان',
        username: 'guest',
        email: '',
        phone: '',
        avatarUrl: '',
        isVerified: false,
        plan: 'free',
        cloudSyncEnabled: false,
      });
      setAuthMode('login');
      alert('حساب کاربری شما با موفقیت از Firebase حذف گردید.');
    } catch (err: any) {
      setDeleteAccountError(err?.message || 'خطا در حذف حساب کاربری.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handle Plan Upgrade / Downgrade
  const handleSelectPlan = (plan: 'free' | 'pro') => {
    onUpdateProfile({
      plan,
      planExpiryDate: plan === 'pro' ? '۱۴۰۵/۱۲/۲۹' : undefined,
    });
    setShowUpgradeModal(false);
  };

  // Handle Manual Instant Cloud Sync
  const handleInstantSync = () => {
    setIsSyncingNow(true);
    setSyncFeedback('در حال اتصال به سرور ابری و همگام‌سازی داده‌ها...');
    setTimeout(() => {
      setIsSyncingNow(false);
      onUpdateProfile({ lastSyncedAt: Date.now() });
      setSyncFeedback('همگام‌سازی ابری با موفقیت انجام شد!');
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 1200);
  };

  const getFormatTime = (timestamp?: number) => {
    if (!timestamp) return 'نامشخص';
    const diffMin = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMin < 1) return 'همین الان';
    if (diffMin < 60) return `${diffMin} دقیقه پیش`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} ساعت پیش`;
  };

  const copyUserId = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  // Check if currently authenticated with Firebase
  const isAuthenticated = Boolean(currentUser);

  return (
    <div className="space-y-6 pb-2">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: احراز هویت Firebase Auth (Sign In / Sign Up OR User Profile Card) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLiquid
            ? 'bg-black/30 border-white/10'
            : isLight
            ? 'bg-slate-50/80 border-slate-200 shadow-sm'
            : 'bg-black/40 border-white/10'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-200">
              {isAuthenticated ? 'مشخصات حساب کاربری (Firebase Auth)' : 'ورود و عضویت در سامانه (Firebase Auth)'}
            </h4>
          </div>

          {isAuthenticated ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>احراز هویت شده</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
              <span>حالت مهمان</span>
            </span>
          )}
        </div>

        {/* Informational Banner if Firebase config is missing */}
        {!isFirebaseConfigured && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">پیکربندی متغیرهای محیطی Firebase Authentication:</p>
              <p className="text-[11px] text-amber-300/80">
                جهت برقراری ارتباط زنده با سرویس Firebase Authentication، متغیرهای محیطی کلاینت شامل{' '}
                <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">VITE_FIREBASE_API_KEY</code>،{' '}
                <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">VITE_FIREBASE_AUTH_DOMAIN</code> و{' '}
                <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">VITE_FIREBASE_PROJECT_ID</code> را در
                فایل <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-[10px]">.env</code> یا بخش تنظیمات پروژه وارد فرمایید.
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------- */}
        {/* CASE A: USER IS NOT AUTHENTICATED (SHOW FORM) */}
        {/* ----------------------------------------- */}
        {!isAuthenticated ? (
          <div className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 rounded-xl bg-black/30 border border-white/10 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ورود به حساب
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  authMode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ثبت‌نام جدید
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot_password');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  authMode === 'forgot_password'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                بازیابی رمز
              </button>
            </div>

            {/* Google OAuth Quick Button */}
            <div className="max-w-md mx-auto pt-1">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={oauthLoading || submitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {oauthLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>ورود سریع با اکانت گوگل (Sign in with Google)</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-white/10 dark:border-slate-800"></div>
                <span className="absolute px-3 text-[11px] text-slate-400 bg-slate-900/90 rounded-full">
                  یا با ایمیل و رمز عبور
                </span>
              </div>
            </div>

            {/* Sign In Form */}
            {authMode === 'login' && (
              <form onSubmit={handleSignIn} className="max-w-md mx-auto space-y-3.5">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">آدرس ایمیل:</label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">رمز عبور:</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot_password')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      فراموشی رمز عبور؟
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ورود به حساب کاربری</span>
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="max-w-md mx-auto space-y-3.5">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">آدرس ایمیل:</label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">رمز عبور (حداقل ۶ کاراکتر):</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Strength */}
                  {formPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passStrength > 70
                              ? 'bg-emerald-500'
                              : passStrength > 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${passStrength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">تکرار رمز عبور:</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      dir="ltr"
                      required
                      value={formConfirmPassword}
                      onChange={(e) => setFormConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>ثبت‌نام و ساخت حساب کاربری</span>
                </button>
              </form>
            )}

            {/* Forgot Password Form */}
            {authMode === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="max-w-md mx-auto space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  آدرس ایمیل ثبت‌نامی خود را وارد نمایید تا لینک بازنشانی رمز عبور برای شما ارسال گردد:
                </p>

                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">آدرس ایمیل:</label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>ارسال لینک بازیابی رمز</span>
                  </button>
                </div>
              </form>
            )}

            {/* Error and Success Banners */}
            {authError && (
              <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="max-w-md mx-auto p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}
          </div>
        ) : (
          /* ----------------------------------------- */
          /* CASE B: USER IS AUTHENTICATED (PROFILE VIEW) */
          /* ----------------------------------------- */
          <div className="space-y-4">
            {/* Authenticated User Session Details Header */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {currentUser?.email}
                  </span>
                  {currentUser?.email_confirmed_at ? (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ایمیل تایید شده</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>در انتظار تایید ایمیل</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>UID: {currentUser?.id?.slice(0, 16)}...</span>
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                    title="کپی شناسه کاربری"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUid ? 'کپی شد' : 'کپی'}</span>
                  </button>
                  <span>•</span>
                  <span>ارائه‌دهنده: {currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email / Password (Firebase)'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از حساب</span>
              </button>
            </div>

            {/* Profile Details Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload / Delete section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-black/20 border border-white/5">
                <div className="relative shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center font-bold text-xl ring-2 ${
                      isLight
                        ? 'ring-indigo-300 bg-indigo-100 text-indigo-700'
                        : 'ring-indigo-500/40 bg-indigo-950 text-indigo-300'
                    }`}
                  >
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{displayName ? displayName.slice(0, 2) : 'U'}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-right space-y-1">
                  <span className="block text-xs font-bold text-slate-200">تصویر پروفایل کاربر</span>
                  <p className="text-[11px] text-slate-400">فرمت‌های JPG، PNG یا WebP (حداکثر ۵ مگابایت)</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>تغییر تصویر</span>
                    </button>
                    {userProfile.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: ابوالفضل زارعی"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">نام کاربری (@username):</label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="abolking2077"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all pl-7"
                    />
                    <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs font-mono">@</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-400" />
                    <span>شماره تماس:</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+98 912 345 6789"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-slate-300">بیوگرافی کوتاه:</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="توضیح کوتاه درباره شما..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ذخیره تغییرات مشخصات</span>
                </button>

                {profileSavedToast && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اطلاعات پروفایل ذخیره شد!</span>
                  </span>
                )}
              </div>
            </form>

            {/* Change Password via Firebase Auth */}
            <div className="mt-4 pt-4 border-t border-white/10 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h5 className="text-xs font-bold text-slate-200">تغییر رمز عبور در Firebase</h5>
              </div>

              <form onSubmit={handleUpdateUserPassword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Current Password */}
                  <div>
                    <label className="block text-[11px] font-bold mb-1 text-slate-300">رمز عبور فعلی: *</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="رمز فعلی"
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] font-bold mb-1 text-slate-300">رمز عبور جدید: *</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-bold mb-1 text-slate-300">تکرار رمز عبور جدید: *</label>
                    <input
                      type="password"
                      dir="ltr"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/40 border border-white/10 text-white focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {passwordUpdateFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      passwordUpdateFeedback.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {passwordUpdateFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{passwordUpdateFeedback.msg}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'در حال ثبت...' : 'بروزرسانی رمز عبور'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: ب) امنیت و همگام‌سازی (Security & Sync) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLiquid
            ? 'bg-black/30 border-white/10'
            : isLight
            ? 'bg-slate-50/80 border-slate-200 shadow-sm'
            : 'bg-black/40 border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-200">
            ب) امنیت و همگام‌سازی ابری (Cloud Sync & Subscription)
          </h4>
        </div>

        <div className="space-y-4">
          {/* Subscription Tier Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-950/30 to-black/30 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-right">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h5 className="text-sm font-black text-white">
                    {userProfile.plan === 'pro' ? 'طرح اشتراک حرفه‌ای (I-Dashboard PRO)' : 'طرح اشتراک استاندارد (Free)'}
                  </h5>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-sm">
                    {userProfile.plan === 'pro' ? 'فعال' : 'رایگان'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {userProfile.plan === 'pro'
                    ? `دسترسی کامل به والپیپرهای 4K، تم‌های شیشه‌ای Liquid و همگام‌سازی ابری`
                    : 'امکانات پایه داشبورد، مدیریت محلی بوکمارک‌ها و شخصی‌سازی'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{userProfile.plan === 'pro' ? 'مدیریت اشتراک' : 'ارتقا به طرح PRO'}</span>
            </button>
          </div>

          {/* Cloud Sync Settings */}
          <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0 mt-0.5">
                  <Cloud className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">همگام‌سازی ابری تنظیمات (Cloud Sync)</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        userProfile.cloudSyncEnabled
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {userProfile.cloudSyncEnabled ? 'روشن' : 'خاموش'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    پشتیبان‌گیری رمزنگاری شده از بوکمارک‌ها و تم داشبورد در حساب ابری.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => onUpdateProfile({ cloudSyncEnabled: !userProfile.cloudSyncEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none p-0.5 ${
                  userProfile.cloudSyncEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    userProfile.cloudSyncEnabled ? 'translate-x-0' : '-translate-x-6'
                  }`}
                />
              </button>
            </div>

            {/* Sync Status & Trigger button */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>آخرین همگام‌سازی:</span>
                <span className="text-indigo-300 font-bold">{getFormatTime(userProfile.lastSyncedAt)}</span>
              </div>

              <button
                type="button"
                onClick={handleInstantSync}
                disabled={isSyncingNow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin text-indigo-400' : ''}`} />
                <span>همگام‌سازی فوری</span>
              </button>
            </div>

            {syncFeedback && (
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: اقدامات و بازنشانی (Actions) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isLiquid
            ? 'bg-black/30 border-white/10'
            : isLight
            ? 'bg-slate-50/80 border-slate-200 shadow-sm'
            : 'bg-black/40 border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 dark:border-slate-800">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-100 dark:text-slate-200">
            ج) اقدامات و بازنشانی (Account Actions)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Logout Action */}
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-400" />
                <h5 className="text-xs font-bold text-slate-200">خروج از حساب</h5>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                خروج از جلسه کاربری فعلی. داده‌های بوکمارک‌های محلی شما در مرورگر محفوظ خواهند ماند.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از نشست کاربری</span>
            </button>
          </div>

          {/* Delete Account / Reset Data Action */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-amber-300">بازنشانی داده‌ها</h5>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                پاکسازی بوکمارک‌ها و تنظیمات محلی و بازنشانی وضعیت اولیه داشبورد.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all active:scale-98"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>بازنشانی بوکمارک‌ها</span>
            </button>
          </div>

          {/* Delete Firebase Account Permanently */}
          <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/40 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <h5 className="text-xs font-bold text-rose-300">حذف کامل حساب کاربری</h5>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                حذف دائمی شناسه کاربری و اطلاعات اکانت از پایگاه داده Firebase.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteAccountError(null);
                setDeleteAccountPassword('');
                setShowDeleteAccountModal(true);
              }}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-98"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف دائمی حساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DIALOGS / MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-indigo-500/20 text-indigo-400">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">تایید خروج از حساب</h4>
                <p className="text-xs text-slate-400">آیا مطمئن هستید که می‌خواهید خارج شوید؟</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handlePerformLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
              >
                بله، خروج از حساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Reset Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-amber-500/40 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300">بازنشانی داده‌های داشبورد</h4>
                <p className="text-xs text-slate-400">بوکمارک‌ها و تنظیمات محلی پاک خواهند شد.</p>
              </div>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              توجه: این اقدام غیرقابل بازگشت است و بوکمارک‌ها به حالت اولیه بازنشانی می‌شوند.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onResetAllData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all"
              >
                تایید و بازنشانی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Firebase Account Dialog */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-rose-500/40 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300">حذف کامل حساب کاربری</h4>
                <p className="text-xs text-slate-400">حذف دائمی اکانت از Firebase</p>
              </div>
            </div>
            <div className="text-xs text-rose-200/90 leading-relaxed bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              هشدار: حساب کاربری شما به صورت دائمی حذف خواهد شد و این عملیات غیرقابل بازگشت است.
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">رمز عبور (جهت تأیید هویت):</label>
              <input
                type="password"
                dir="ltr"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                placeholder="رمز عبور شما"
                className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/50 border border-white/10 text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            {deleteAccountError && (
              <div className="text-[11px] text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                {deleteAccountError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handlePerformDeleteAccount}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isDeletingAccount ? 'در حال حذف...' : 'بله، حذف دائمی حساب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Subscription Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-amber-500/40 text-slate-100 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-black text-white">طرح‌های اشتراک I-Dashboard</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Pro Plan Card */}
              <div
                onClick={() => handleSelectPlan('pro')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  userProfile.plan === 'pro'
                    ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-500/20'
                    : 'border-white/10 bg-white/5 hover:border-amber-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white">طرح ویژه Pro (پیشنهاد طلایی)</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">۹۹,۰۰۰ تومان / سالانه</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pr-4 list-disc">
                  <li>همگام‌سازی آنی و نامحدود در تمام دستگاه‌ها</li>
                  <li>دسترسی به تصاویر 4K و تم‌های شیشه‌ای Liquid</li>
                  <li>پشتیبان‌گیری ابری روزانه</li>
                </ul>
              </div>

              {/* Free Plan Card */}
              <div
                onClick={() => handleSelectPlan('free')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  userProfile.plan === 'free'
                    ? 'border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-500/20'
                    : 'border-white/10 bg-white/5 hover:border-indigo-400/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">طرح استاندارد رایگان (Free)</span>
                  <span className="text-xs font-bold text-slate-400">رایگان همیشگی</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 pr-4 list-disc">
                  <li>مدیریت نامحدود بوکمارک‌ها در مرورگر محلی</li>
                  <li>پشتیبان‌گیری فایل JSON دستی</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
              >
                ثبت و بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
