import { buildReport, createSeedSessions, type AppPreferences, type BenchmarkCard, type TeacherSession } from './session-engine';

export async function fetchSessions(): Promise<TeacherSession[]> {
  try {
    console.log('[MockAPI] fetchSessions called');
    const response = await fetch('/api/sessions');
    if (!response.ok) {
      throw new Error('Failed to load sessions');
    }
    const sessions = await response.json();
    console.log('[MockAPI] fetchSessions received', { count: Array.isArray(sessions) ? sessions.length : 0 });
    return Array.isArray(sessions) && sessions.length > 0 ? sessions.map(normalizeSession) : createSeedSessions();
  } catch (error) {
    console.error('[MockAPI] fetchSessions failed', error);
    return createSeedSessions();
  }
}

export async function submitSession(session: TeacherSession): Promise<TeacherSession> {
  try {
    console.log('[MockAPI] submitSession called', { sessionId: session.id, offline: session.offline, reportExists: Boolean(session.report) });
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: session.id,
        transcript: JSON.stringify(session.transcript),
        duration: session.durationSeconds,
        report: session.report ?? buildReport(session),
        language: session.language,
        offline: session.offline,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save session');
    }
    console.log('[MockAPI] submitSession succeeded', { sessionId: session.id });

    return {
      ...session,
      status: 'processing',
      pending: false,
    };
  } catch (error) {
    console.error('[MockAPI] submitSession failed', error, { sessionId: session.id });
    return {
      ...session,
      status: 'queued',
      pending: true,
      offline: true,
      syncAttempts: session.syncAttempts + 1,
    };
  }
}

export async function fetchDemoProfile() {
  const response = await fetch('/api/demo/profile');
  if (!response.ok) {
    throw new Error('Failed to load demo profile');
  }
  return response.json();
}

export async function fetchDemoSessions(): Promise<TeacherSession[]> {
  const response = await fetch('/api/demo/sessions');
  if (!response.ok) {
    throw new Error('Failed to load demo sessions');
  }
  const sessions = await response.json();
  return Array.isArray(sessions) ? sessions.map(normalizeSession) : [];
}

export async function fetchConsent() {
  const response = await fetch('/api/consent');
  if (!response.ok) {
    throw new Error('Failed to load consent');
  }
  return response.json() as Promise<{ consentGiven: boolean; consentText: string; language: string }>;
}

export async function saveConsent(consentGiven: boolean, consentText: string, language: string) {
  await fetch('/api/consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ consentGiven, consentText, language, userId: 'teacher_001' }),
  });
}

export async function fetchSessionBenchmarks(sessionId: string): Promise<BenchmarkCard[]> {
  const response = await fetch(`/api/benchmarks/${sessionId}`);
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data.benchmarks) ? data.benchmarks : [];
}

export async function createCoachingGoal(input: { label: string; metric: 'teacher_questions' | 'wait_time' | 'student_participation' | 'teacher_talk' | 'quiet_students'; targetValue: number; sessionId?: string; }) {
  const response = await fetch('/api/goals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...input, userId: 'teacher_001' }),
  });

  if (!response.ok) {
    throw new Error('Failed to create goal');
  }

  return response.json() as Promise<{ goal: unknown }>;
}

export async function loadPreferences(): Promise<AppPreferences | null> {
  try {
    const value = localStorage.getItem('disha-preferences');
    return value ? JSON.parse(value) as AppPreferences : null;
  } catch {
    return null;
  }
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  localStorage.setItem('disha-preferences', JSON.stringify(preferences));
}

function normalizeSession(session: Record<string, unknown>): TeacherSession {
  return {
    id: String(session.id ?? crypto.randomUUID()),
    teacherName: String(session.teacherName ?? 'Anjali Kulkarni'),
    subject: String(session.subject ?? 'Class Session'),
    className: String(session.className ?? 'Class 5A'),
    schoolName: String(session.schoolName ?? 'Govt. School No. 4'),
    createdAt: String(session.createdAt ?? new Date().toISOString()),
    durationSeconds: Number(session.durationSeconds ?? 0),
    language: (session.language as TeacherSession['language']) ?? 'en',
    status: (session.status as TeacherSession['status']) ?? 'completed',
    offline: Boolean(session.offline ?? false),
    transcript: Array.isArray(session.transcript) ? (session.transcript as TeacherSession['transcript']) : [],
    report: session.report as TeacherSession['report'] | undefined,
    benchmarks: Array.isArray(session.benchmarks) ? (session.benchmarks as BenchmarkCard[]) : undefined,
    audioUrl: typeof session.audioUrl === 'string' ? session.audioUrl : undefined,
    syncAttempts: Number(session.syncAttempts ?? 0),
    pending: Boolean(session.pending ?? false),
    transcriptionMeta: session.transcriptionMeta && typeof session.transcriptionMeta === 'object'
      ? {
          fallbackUsed: Boolean((session.transcriptionMeta as any).fallbackUsed),
          sources: Array.isArray((session.transcriptionMeta as any).sources)
            ? ((session.transcriptionMeta as any).sources as Array<'browser-fallback' | 'mock-transcript' | 'whisper-failed'>)
            : [],
          reason: typeof (session.transcriptionMeta as any).reason === 'string'
            ? (session.transcriptionMeta as any).reason
            : undefined,
        }
      : undefined,
  };
}

export async function regenerateSessionCoaching(sessionId: string, language: string): Promise<any> {
  const response = await fetch(`/api/sessions/${sessionId}/regenerate-coaching`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language }),
  });

  if (!response.ok) {
    throw new Error('Failed to regenerate coaching suggestions');
  }

  const data = await response.json();
  return data.aiCoaching;
}
