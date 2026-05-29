import { FirebaseError } from 'firebase/app';
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';

const VERIFICATION_ID_KEY = 'disha_firebase_verification_id';

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function normalizePhoneNumber(phone: string) {
  const trimmed = phone.trim().replace(/[\s()-]/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  return `+91${trimmed.replace(/^0+/, '')}`;
}

export function getStoredVerificationId() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(VERIFICATION_ID_KEY) || '';
}

export function clearStoredVerificationId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(VERIFICATION_ID_KEY);
}

function storeVerificationId(verificationId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(VERIFICATION_ID_KEY, verificationId);
}

function ensureRecaptchaVerifier(containerId = 'firebase-recaptcha') {
  if (typeof window === 'undefined') {
    throw new Error('Firebase phone auth is only available in the browser');
  }

  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
  });

  return recaptchaVerifier;
}

export async function sendFirebaseOtp(phone: string) {
  const phoneNumber = normalizePhoneNumber(phone);
  if (!phoneNumber) {
    throw new Error('Enter a valid phone number');
  }

  const verifier = ensureRecaptchaVerifier();
  const confirmation = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
  storeVerificationId(confirmation.verificationId);
  return { phoneNumber, confirmation };
}

export async function verifyFirebaseOtp(code: string) {
  const verificationId = getStoredVerificationId();
  if (!verificationId) {
    throw new Error('Verification session expired. Please request a new code.');
  }

  const credential = PhoneAuthProvider.credential(verificationId, code);
  const result = await signInWithCredential(firebaseAuth, credential);
  clearStoredVerificationId();
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

export function mapFirebaseError(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-phone-number':
        return 'Enter a valid phone number';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      case 'auth/captcha-check-failed':
        return 'reCAPTCHA verification failed. Please try again.';
      case 'auth/invalid-verification-code':
        return 'Invalid OTP. Please try again.';
      case 'auth/code-expired':
        return 'OTP expired. Please resend the code.';
      default:
        return error.message;
    }
  }

  return error instanceof Error ? error.message : 'Authentication failed';
}

export function resetRecaptchaVerifier() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

export type { ConfirmationResult };
