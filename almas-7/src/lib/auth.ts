/**
 * Firebase Authentication Service for Almas 7 Dashboard & Chrome Extension
 * Provides full lifecycle auth: registration, verification, sign-in, password reset,
 * profile update, account deletion, and session observation.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  deleteUser,
  reload,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  NextOrObserver
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export type { FirebaseUser };

/**
 * Friendly Persian localization for Firebase Auth error codes
 */
export function translateFirebaseError(error: any): string {
  const code = error?.code || '';
  const msg = error?.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'فرمت آدرس ایمیل وارد شده نامعتبر است.';
    case 'auth/user-disabled':
      return 'حساب کاربری شما توسط مدیریت مسدود یا غیرفعال شده است.';
    case 'auth/user-not-found':
      return 'کاربری با این مشخصات یا آدرس ایمیل یافت نشد.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'آدرس ایمیل یا رمز عبور وارد شده نادرست است.';
    case 'auth/email-already-in-use':
      return 'این آدرس ایمیل قبلاً در سامانه ثبت‌نام شده است. لطفاً وارد شوید یا بازیابی رمز را بزنید.';
    case 'auth/weak-password':
      return 'رمز عبور بسیار ضعیف است. حداقل ۶ کاراکتر شامل حروف و اعداد انتخاب کنید.';
    case 'auth/too-many-requests':
      return 'تعداد درخواست‌های ناموفق بیش از حد مجاز است. لطفاً چند دقیقه بعد مجدداً تلاش کنید.';
    case 'auth/network-request-failed':
      return 'خطا در ارتباط با سرور Firebase. لطفاً اتصال اینترنت خود را بررسی کنید.';
    case 'auth/requires-recent-login':
      return 'برای اعمال این تغییر حساس امنیتی، لازم است مجدداً وارد حساب خود شوید.';
    case 'auth/popup-closed-by-user':
      return 'پنجره ورود توسط کاربر بسته شد.';
    case 'auth/cancelled-popup-request':
      return 'درخواست ورود قبلی لغو شد.';
    case 'auth/operation-not-allowed':
      return 'روش احراز هویت انتخاب شده در پنل Firebase Console فعال نشده است.';
    default:
      if (msg.includes('network') || msg.includes('offline')) {
        return 'خطای شبکه در ارتباط با سرورهای Firebase.';
      }
      return msg || 'خطای ناشناخته در سرویس احراز هویت رخ داد.';
  }
}

/**
 * Register a new user with Email and Password.
 * Automatically updates displayName (if provided) and sends verification email.
 */
export async function registerWithEmail(email: string, password: string, fullName?: string) {
  if (!isFirebaseConfigured) {
    throw new Error('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env وارد فرمایید.');
  }

  const cleanEmail = email.trim();
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // Update displayName if provided
  if (fullName && fullName.trim()) {
    try {
      await updateProfile(user, {
        displayName: fullName.trim(),
      });
    } catch (profileErr) {
      console.warn('[Firebase Auth] Failed to set initial profile name:', profileErr);
    }
  }

  // Send verification email to user
  let verificationSent = false;
  try {
    await sendEmailVerification(user);
    verificationSent = true;
  } catch (verifErr) {
    console.warn('[Firebase Auth] Failed to send initial verification email:', verifErr);
  }

  return {
    user,
    verificationSent,
  };
}

/**
 * Sign in an existing user with Email and Password
 */
export async function loginWithEmail(email: string, password: string) {
  if (!isFirebaseConfigured) {
    throw new Error('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env وارد فرمایید.');
  }

  const cleanEmail = email.trim();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return userCredential.user;
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  if (!isFirebaseConfigured) {
    throw new Error('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env وارد فرمایید.');
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  if (!isFirebaseConfigured) {
    throw new Error('پروژه Firebase هنوز تنظیم نشده است. لطفاً متغیرهای VITE_FIREBASE_* را در فایل .env وارد فرمایید.');
  }

  const cleanEmail = email.trim();
  await sendPasswordResetEmail(auth, cleanEmail);
}

/**
 * Resend email verification link to current user
 */
export async function resendVerificationEmail(user?: FirebaseUser | null) {
  const targetUser = user || auth.currentUser;
  if (!targetUser) {
    throw new Error('هیچ کاربر فعالی برای ارسال لینک تایید یافت نشد.');
  }

  await sendEmailVerification(targetUser);
}

/**
 * Refresh user state to verify if email was confirmed (reloads token from Firebase)
 */
export async function refreshUserVerification(user?: FirebaseUser | null): Promise<boolean> {
  const targetUser = user || auth.currentUser;
  if (!targetUser) return false;

  await reload(targetUser);
  return Boolean(targetUser.emailVerified);
}

/**
 * Update user profile info (displayName, photoURL)
 */
export async function updateUserProfile(data: { displayName?: string; photoURL?: string }) {
  const targetUser = auth.currentUser;
  if (!targetUser) {
    throw new Error('کاربر وارد نشده است.');
  }

  await updateProfile(targetUser, {
    displayName: data.displayName !== undefined ? data.displayName : targetUser.displayName,
    photoURL: data.photoURL !== undefined ? data.photoURL : targetUser.photoURL,
  });

  return targetUser;
}

/**
 * Update user password with mandatory current password verification
 */
export async function updateUserPassword(currentPassword: string, newPassword: string) {
  const targetUser = auth.currentUser;
  if (!targetUser) {
    throw new Error('کاربر وارد نشده است.');
  }

  if (!currentPassword || !currentPassword.trim()) {
    throw new Error('وارد کردن رمز عبور فعلی الزامی است.');
  }

  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
  }

  if (!targetUser.email) {
    throw new Error('آدرس ایمیل کاربر برای تأیید رمز در دسترس نیست.');
  }

  // Re-authenticate user with current password to guarantee ownership & recent login
  const credential = EmailAuthProvider.credential(targetUser.email, currentPassword.trim());
  try {
    await reauthenticateWithCredential(targetUser, credential);
  } catch (reauthErr: any) {
    const code = reauthErr?.code || '';
    if (
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials'
    ) {
      throw new Error('رمز عبور فعلی وارد شده نادرست است.');
    }
    throw reauthErr;
  }

  // Update password in Firebase Auth
  await updatePassword(targetUser, newPassword.trim());
}

/**
 * Permanently delete current user account
 */
export async function deleteUserAccount(password?: string) {
  const targetUser = auth.currentUser;
  if (!targetUser) {
    // If no Firebase user is logged in, treat as local-only deletion
    return;
  }

  // If password was provided and email exists, re-authenticate to prevent 'requires-recent-login'
  if (password && password.trim() && targetUser.email) {
    try {
      const credential = EmailAuthProvider.credential(targetUser.email, password.trim());
      await reauthenticateWithCredential(targetUser, credential);
    } catch (reauthErr: any) {
      const code = reauthErr?.code || '';
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        throw new Error('رمز عبور وارد شده جهت تأیید هویت نادرست است.');
      }
      throw reauthErr;
    }
  }

  try {
    await deleteUser(targetUser);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      throw new Error('برای حذف کامل حساب به دلایل امنیتی، لطفاً رمز عبور خود را جهت تأیید مجدد وارد نمایید.');
    }
    throw err;
  }
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuthState(callback: NextOrObserver<FirebaseUser | null>) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current authenticated Firebase user synchronously
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
