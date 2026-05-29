import { motion } from 'motion/react';
import { CloudOff, Cloud, RotateCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/state/app-state';

export function SyncStatusBar() {
  const { syncStatus, queueCount, isSyncing, syncOfflineQueue, demoMode, consentGiven } = useAppState();
  const offline = syncStatus === 'offline' || queueCount > 0;
  const statusText = syncStatus === 'syncing' || isSyncing
    ? 'Syncing'
    : offline
      ? `${queueCount} pending`
      : 'Online';

  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-3 z-40 mx-auto mb-4 w-[calc(100%-1rem)] max-w-6xl rounded-2xl border border-primary-light bg-white/90 px-4 py-3 shadow-lg shadow-ink/5 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink/70">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1">
            {offline ? <WifiOff size={15} className="text-accent" /> : <Wifi size={15} className="text-primary" />}
            {statusText}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-light/50 px-3 py-1 text-primary">
            {isSyncing ? <RotateCw size={15} className="animate-spin" /> : <Cloud size={15} />}
            {queueCount} queued
          </span>
          {demoMode && (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-amber-700">
              <ShieldCheck size={15} /> Demo mode
            </span>
          )}
          {consentGiven && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
              <ShieldCheck size={15} /> Consent saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-primary-light"
            onClick={() => void syncOfflineQueue()}
            disabled={isSyncing || queueCount === 0}
          >
            <CloudOff size={15} className="mr-2" /> Sync now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
