import { useEffect } from 'react';
import { useAuthStore } from '@/state/auth';

export function AuthBootstrap() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  return null;
}
