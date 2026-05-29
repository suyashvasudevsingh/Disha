import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { buildReport, createDashboardTrend, createSeedSessions, getParticipationSummary, type AppPreferences, type SupportedLanguage, type TeacherSession } from '@/lib/session-engine';
import { fetchConsent, fetchDemoProfile, fetchDemoSessions, fetchSessions, loadPreferences, savePreferences, saveConsent, submitSession, regenerateSessionCoaching } from '@/lib/mock-api';
import { idbSet, loadQueueItems, removeQueueItem, saveQueueItem, type StoredQueueItem } from '@/lib/idb';

type AppStore = {
  sessions: TeacherSession[];
  activeSessionId: string | null;
  preferences: AppPreferences;
  isHydrating: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'offline' | 'syncing' | 'error';
  queueCount: number;
  consentGiven: boolean;
  demoMode: boolean;
  setLanguage: (language: SupportedLanguage) => void;
  cycleLanguage: () => void;
  toggleHighContrast: () => void;
  setDashboardRange: (range: AppPreferences['dashboardRange']) => void;
  setAdminFilter: (filter: AppPreferences['adminFilter']) => void;
  setConsentGiven: (consentGiven: boolean) => Promise<void>;
  enableDemoMode: () => Promise<void>;
  startSession: (meta: { subject: string; className: string; schoolName: string; language: SupportedLanguage; teacherName?: string; }) => TeacherSession;
  updateSession: (sessionId: string, patch: Partial<TeacherSession>) => void;
  finalizeSession: (
    sessionId: string,
    durationSeconds: number,
    transcript: TeacherSession['transcript'],
    audioUrl?: string,
    transcriptionMeta?: TeacherSession['transcriptionMeta'],
    sessionOverride?: TeacherSession
  ) => Promise<TeacherSession | null>;
  queueOfflineSession: (session: TeacherSession, audioBlob?: Blob | null) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  getSessionById: (sessionId: string) => TeacherSession | undefined;
  getDashboardTrend: () => ReturnType<typeof createDashboardTrend>;
  getParticipation: () => ReturnType<typeof getParticipationSummary>;
  regenerateCoaching: (sessionId: string, language: SupportedLanguage) => Promise<any>;
};

const defaultPreferences: AppPreferences = {
  language: 'en',
  highContrast: false,
  dashboardRange: 'week',
  adminFilter: 'all',
};

const supportedLanguages: SupportedLanguage[] = ['en', 'hi', 'mr', 'te', 'kn', 'ta'];

const AppContext = createContext<AppStore | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<TeacherSession[]>(createSeedSessions());
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'offline' | 'syncing' | 'error'>('idle');
  const [queueCount, setQueueCount] = useState(0);
  const [consentGiven, setConsentGivenState] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [remoteSessions, queueItems, storedPreferences, consent] = await Promise.all([
          fetchSessions(),
          loadQueueItems(),
          loadPreferences(),
          fetchConsent().catch(() => null),
        ]);

        if (!mounted) {
          return;
        }

        setSessions(mergeSessions(remoteSessions, queueItems));
        setQueueCount(queueItems.length);
        if (storedPreferences) {
          setPreferences(storedPreferences);
        }
        if (consent) {
          setConsentGivenState(consent.consentGiven);
        }
      } catch {
        if (mounted) {
          setSessions(createSeedSessions());
          setSyncStatus('offline');
        }
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.contrast = preferences.highContrast ? 'high' : 'normal';
    document.documentElement.lang = preferences.language;
    void i18n.changeLanguage(preferences.language);
    void savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (consentGiven) {
      localStorage.setItem('disha-consent', 'true');
    }
  }, [consentGiven]);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      void syncOfflineQueue();
    };

    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const persist = async () => {
      await Promise.all(sessions.map((session) => idbSet('sessions', session)));
    };

    void persist();
  }, [sessions]);

  const store = useMemo<AppStore>(() => ({
    sessions,
    activeSessionId,
    preferences,
    isHydrating,
    isSyncing,
    syncStatus,
    queueCount,
    consentGiven,
    demoMode,
    setLanguage: (language) => setPreferences((current) => ({ ...current, language })),
    cycleLanguage: () => setPreferences((current) => ({ ...current, language: nextLanguage(current.language) })),
    toggleHighContrast: () => setPreferences((current) => ({ ...current, highContrast: !current.highContrast })),
    setDashboardRange: (range) => setPreferences((current) => ({ ...current, dashboardRange: range })),
    setAdminFilter: (filter) => setPreferences((current) => ({ ...current, adminFilter: filter })),
    setConsentGiven: async (consent) => {
      setConsentGivenState(consent);
      localStorage.setItem('disha-consent', consent ? 'true' : 'false');
      await saveConsent(consent, 'This recording stays on your phone. Only you can see it.', preferences.language);
    },
    enableDemoMode: async () => {
      const [profile, demoSessions] = await Promise.all([fetchDemoProfile(), fetchDemoSessions()]);
      setDemoMode(true);
      if (profile?.language && supportedLanguages.includes(profile.language)) {
        setPreferences((current) => ({ ...current, language: profile.language }));
      }
      setSessions(demoSessions.length > 0 ? demoSessions : createSeedSessions());
      setActiveSessionId(null);
    },
    startSession: (meta) => {
      const session: TeacherSession = {
        id: crypto.randomUUID(),
        teacherName: meta.teacherName ?? 'Anjali Kulkarni',
        subject: meta.subject,
        className: meta.className,
        schoolName: meta.schoolName,
        createdAt: new Date().toISOString(),
        durationSeconds: 0,
        language: meta.language,
        status: 'recording',
        offline: !navigator.onLine,
        transcript: [],
        syncAttempts: 0,
      };
      setActiveSessionId(session.id);
      setSessions((current) => [session, ...current]);
      return session;
    },
    updateSession: (sessionId, patch) => {
      setSessions((current) => current.map((session) => session.id === sessionId ? { ...session, ...patch } : session));
    },
    finalizeSession: async (sessionId, durationSeconds, transcript, audioUrl, transcriptionMeta, sessionOverride) => {
      const currentSession = sessions.find((session) => session.id === sessionId) ?? sessionOverride;
      if (!currentSession) {
        return null;
      }

      const report = buildReport({ ...currentSession, durationSeconds, transcript });
      const finalized: TeacherSession = {
        ...currentSession,
        durationSeconds,
        transcript,
        audioUrl,
        report,
        status: navigator.onLine ? 'processing' : 'queued',
        offline: !navigator.onLine,
        pending: !navigator.onLine,
        transcriptionMeta,
      };

      setSessions((current) => current.map((session) => session.id === sessionId ? finalized : session));
      setActiveSessionId(sessionId);

      if (!navigator.onLine) {
        await queueOfflineSession(finalized, null);
        toast.message('Recording saved offline. It will sync when you are back online.');
      } else {
        void submitSession(finalized);
      }

      return finalized;
    },
    queueOfflineSession: async (session, audioBlob) => {
      const queueItem: StoredQueueItem = {
        id: session.id,
        sessionId: session.id,
        createdAt: new Date().toISOString(),
        payload: session,
        audioBlob,
      };
      await saveQueueItem(queueItem);
      setQueueCount((count) => count + 1);
      setSyncStatus('offline');
      toast.message('Queued for offline sync');
    },
    syncOfflineQueue: async () => {
      if (isSyncing) {
        return;
      }

      setIsSyncing(true);
      setSyncStatus('syncing');
      try {
        const queueItems = await loadQueueItems();
        for (const item of queueItems) {
          const session = item.payload as TeacherSession;
          const saved = await submitSession(session);
          setSessions((current) => current.map((existing) => existing.id === saved.id ? { ...existing, status: 'processing', pending: false, offline: false } : existing));
          await removeQueueItem(item.id);
        }
        setQueueCount(0);
        setSyncStatus('idle');
        toast.success('Offline queue synced');
      } catch {
        setSyncStatus('error');
      } finally {
        setIsSyncing(false);
      }
    },
    getSessionById: (sessionId) => sessions.find((session) => session.id === sessionId),
    getDashboardTrend: () => createDashboardTrend(sessions),
    getParticipation: () => getParticipationSummary(sessions),
    regenerateCoaching: async (sessionId: string, language: SupportedLanguage) => {
      try {
        const aiCoaching = await regenerateSessionCoaching(sessionId, language);
        setSessions((current) =>
          current.map((session) => {
            if (session.id === sessionId) {
              const updatedReport = session.report ? { ...session.report, aiCoaching } : undefined;
              return { ...session, report: updatedReport };
            }
            return session;
          })
        );
        return aiCoaching;
      } catch (err: any) {
        console.error('[regenerateCoaching state failed]:', err);
        throw err;
      }
    },
  }), [activeSessionId, consentGiven, demoMode, isHydrating, isSyncing, preferences, queueCount, sessions, syncStatus]);

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

function mergeSessions(remoteSessions: TeacherSession[], queueItems: StoredQueueItem[]) {
  const localQueue = queueItems.map((item) => item.payload as TeacherSession);
  const combined = [...remoteSessions, ...localQueue];
  return combined.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function nextLanguage(language: SupportedLanguage): SupportedLanguage {
  const index = supportedLanguages.indexOf(language);
  return supportedLanguages[(index + 1) % supportedLanguages.length];
}
