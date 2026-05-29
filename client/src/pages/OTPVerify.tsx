import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/state/auth';
import { clearStoredVerificationId, mapFirebaseError, sendFirebaseOtp, verifyFirebaseOtp } from '@/lib/firebase-phone';

export default function OTPVerifyPage() {
  const navigate = useNavigate();
  const pendingPhone = useAuthStore((state) => state.pendingPhone);
  const clearPendingPhone = useAuthStore((state) => state.clearPendingPhone);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const authStatus = useAuthStore((state) => state.status);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      navigate('/dashboard', { replace: true });
    }
  }, [authStatus, navigate]);

  useEffect(() => {
    if (!pendingPhone) {
      navigate('/', { replace: true });
    }
  }, [navigate, pendingPhone]);

  const maskedPhone = useMemo(() => {
    if (!pendingPhone) return '';
    return pendingPhone.length > 4 ? `${pendingPhone.slice(0, 4)}••••${pendingPhone.slice(-2)}` : pendingPhone;
  }, [pendingPhone]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setLocalError(null);
    setAuthError(null);

    try {
      await verifyFirebaseOtp(code.trim());
      clearPendingPhone();
      clearStoredVerificationId();
      toast.success('Phone verified. Welcome back.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = mapFirebaseError(error);
      setLocalError(message);
      setAuthError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingPhone) return;
    setResending(true);
    setLocalError(null);
    try {
      await sendFirebaseOtp(pendingPhone);
      toast.success('A new code was sent.');
    } catch (error) {
      const message = mapFirebaseError(error);
      setLocalError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-surface px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="rounded-[32px] border-primary-light bg-white p-6 shadow-xl">
          <div className="mb-5 space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-ink/35">Verify OTP</p>
            <h1 className="text-3xl font-display font-bold">Enter the code</h1>
            <p className="text-sm text-ink/60">We sent a verification code to {maskedPhone || 'your phone'}.</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-2xl border border-primary-light bg-surface px-4 py-3 text-lg tracking-[0.3em] outline-none focus:border-primary"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
            />

            {localError && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{localError}</div>
            )}

            <Button type="submit" disabled={loading || code.trim().length < 4} className="w-full rounded-2xl bg-primary py-6 text-white hover:bg-primary-dark">
              {loading ? 'Verifying…' : 'Verify OTP'}
            </Button>

            <Button type="button" variant="outline" disabled={resending} onClick={handleResend} className="w-full rounded-2xl border-primary-light">
              {resending ? 'Resending…' : 'Resend code'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                clearStoredVerificationId();
                clearPendingPhone();
                navigate('/', { replace: true });
              }}
              className="w-full rounded-2xl text-ink/60"
            >
              Use a different phone number
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
