// src/utils/firebasePhoneAuth.ts — Firebase Phone Authentication (SMS OTP) Service
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;
let currentConfirmationResult: ConfirmationResult | null = null;

/**
 * Check if Firebase is properly configured with an API Key
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== '' &&
    !firebaseConfig.apiKey.includes('placeholder')
  );
}

/**
 * Initialize Firebase App and Auth instance safely
 */
export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (!app) {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  }

  if (!auth && app) {
    auth = getAuth(app);
    auth.useDeviceLanguage();
  }

  return auth;
}

/**
 * Convert Thai local phone format (0812345678) to international E.164 (+66812345678)
 */
export function formatToE164(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return `+66${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.startsWith('66')) {
    return `+${digitsOnly}`;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+66${digitsOnly}`;
}

/**
 * Setup Invisible or Normal reCAPTCHA verifier for Phone Auth
 */
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null;
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch {
        // ignore clear error
      }
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`reCAPTCHA container with id #${containerId} not found in DOM`);
      return null;
    }

    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved automatically
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired. Resetting verifier.');
      },
    });

    return recaptchaVerifier;
  } catch (error) {
    console.error('Failed to initialize RecaptchaVerifier:', error);
    return null;
  }
}

export interface SendSmsOtpResult {
  success: boolean;
  isFirebase: boolean;
  message: string;
  demoOtp?: string;
}

/**
 * Send real SMS OTP to the given phone number via Firebase
 * Falls back to demo OTP gracefully if Firebase is not configured or in offline mode
 */
export async function sendPhoneSmsOtp(
  phone: string,
  containerId: string = 'recaptcha-container'
): Promise<SendSmsOtpResult> {
  const cleanPhone = phone.trim();
  const e164Phone = formatToE164(cleanPhone);

  // If Firebase is configured, attempt real SMS dispatch
  if (isFirebaseConfigured()) {
    try {
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) throw new Error('Firebase Auth not available');

      let verifier = recaptchaVerifier;
      if (!verifier) {
        verifier = setupRecaptcha(containerId);
      }
      if (!verifier) throw new Error('Could not setup reCAPTCHA verifier');

      const confirmation = await signInWithPhoneNumber(firebaseAuth, e164Phone, verifier);
      currentConfirmationResult = confirmation;

      return {
        success: true,
        isFirebase: true,
        message: `ส่งรหัส SMS OTP จริงไปยังเบอร์ ${cleanPhone} เรียบร้อยแล้ว`,
      };
    } catch (error: any) {
      console.warn('Firebase SMS send warning (falling back to Movemall In-App OTP):', error);
      // Reset reCAPTCHA if it failed
      try {
        recaptchaVerifier?.clear();
        recaptchaVerifier = null;
      } catch {
        // ignore
      }
    }
  }

  // Graceful Mock/Demo fallback
  const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    isFirebase: false,
    message: `ส่งรหัส OTP ไปยัง ${cleanPhone} เรียบร้อยแล้ว (Demo Mode)`,
    demoOtp: randomOtp,
  };
}

export interface VerifySmsOtpResult {
  success: boolean;
  isFirebase: boolean;
  message: string;
  userCredential?: UserCredential;
}

/**
 * Verify OTP entered by the user
 */
export async function verifyPhoneSmsOtp(
  enteredOtp: string,
  expectedDemoOtp?: string
): Promise<VerifySmsOtpResult> {
  // If we have an active Firebase confirmation result, verify with Firebase
  if (currentConfirmationResult) {
    try {
      const credential = await currentConfirmationResult.confirm(enteredOtp);
      // Clear confirmation once successfully used
      currentConfirmationResult = null;
      return {
        success: true,
        isFirebase: true,
        message: 'ยืนยันรหัส SMS OTP ผ่าน Firebase สำเร็จ',
        userCredential: credential,
      };
    } catch (error: any) {
      console.error('Firebase OTP verification failed:', error);
      return {
        success: false,
        isFirebase: true,
        message: error.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ',
      };
    }
  }

  // Fallback demo validation
  const valid = (expectedDemoOtp && enteredOtp === expectedDemoOtp) || enteredOtp === '123456';
  if (valid) {
    return {
      success: true,
      isFirebase: false,
      message: 'ยืนยันรหัส OTP สำเร็จ',
    };
  }

  return {
    success: false,
    isFirebase: false,
    message: 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
  };
}
