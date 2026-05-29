import { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecordPage from '@/pages/RecordPage';
import ReportPage from '@/pages/ReportPage';
import { AppStateProvider, useAppState } from '@/state/app-state';
import { ConsentModal } from '@/components/ConsentModal';

let navigatedPath = '/record';
let reportIdFromNavigate = '';
let navigateHandler: ((path: string) => void) | null = null;

vi.mock('react-router-dom', () => ({
  useNavigate: () => (path: string) => {
    navigatedPath = path;
    const matched = path.match(/^\/report\/(.+)$/);
    reportIdFromNavigate = matched ? matched[1] : '';
    navigateHandler?.(path);
  },
  useParams: () => ({ id: reportIdFromNavigate }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: async () => {},
    },
  }),
}));

vi.mock('@/state/auth', () => ({
  useAuthStore: (selector: any) => selector({
    user: { uid: 'test-uid', phoneNumber: '+919999999999' },
    status: 'authenticated',
  }),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: () => ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: ({ children }: any) => <div>{children}</div>,
  Tooltip: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: ({ children }: any) => <div>{children}</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/hooks/use-audio-recorder', () => ({
  useAudioRecorder: () => ({
    isSupported: false,
    isRecording: false,
    isPaused: false,
    durationSeconds: 0,
    levels: [5, 6, 4, 3, 4],
    audioUrl: null,
    error: null,
    reset: () => {},
    start: vi.fn(),
    stop: () => {},
    pause: () => {},
    resume: () => {},
  }),
}));

vi.mock('@/hooks/use-speech-recognition', () => ({
  useSpeechRecognition: () => ({
    isSupported: false,
    isListening: false,
    confidence: 0,
    interimText: '',
    error: null,
    start: () => {},
    stop: () => {},
    pause: () => {},
    resume: () => {},
    reset: () => {},
  }),
}));

vi.mock('@/stt/ui/TranscriptionView', () => ({
  default: () => null,
}));

vi.mock('@/lib/idb', () => ({
  idbSet: async () => {},
  loadQueueItems: async () => [],
  removeQueueItem: async () => {},
  saveQueueItem: async () => {},
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => <div aria-valuenow={value} role="progressbar" {...props} />,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button type="button">{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

describe('Record fallback integration', () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
    navigatedPath = '/record';
    reportIdFromNavigate = '';
    navigateHandler = null;

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url.endsWith('/api/consent') && method === 'GET') {
        return new Response(JSON.stringify({ consentGiven: false, consentText: '', language: 'en' }), { status: 200 });
      }

      if (url.endsWith('/api/consent') && method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url.endsWith('/api/sessions') && method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      if (url.endsWith('/api/sessions') && method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (url.includes('/api/benchmarks/')) {
        return new Response(JSON.stringify({ benchmarks: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }));
  });

  it('handles mic denied with fallback transcript, generates report, and keeps consent flow intact', async () => {
    const user = userEvent.setup();

    function FlowHarness() {
      const [path, setPath] = useState('/record');

      useEffect(() => {
        navigateHandler = setPath;
        return () => {
          navigateHandler = null;
        };
      }, []);

      return (
        <>
          {path.startsWith('/report/') ? <ReportPage /> : <RecordPage />}
          <ConsentModal />
          <ConsentControl />
        </>
      );
    }

    function ConsentControl() {
      const { setConsentGiven } = useAppState();
      return (
        <button
          type="button"
          onClick={() => {
            void setConsentGiven(true);
          }}
        >
          accept-consent-test
        </button>
      );
    }

    render(
      <AppStateProvider>
        <FlowHarness />
      </AppStateProvider>
    );

    await user.click(screen.getByRole('button', { name: 'accept-consent-test' }));
    expect(screen.getByRole('button', { name: 'accept-consent-test' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start recording' }));

    await waitFor(() => {
      expect(navigatedPath.startsWith('/report/')).toBe(true);
      expect(reportIdFromNavigate.length).toBeGreaterThan(0);
    });

    expect(await screen.findByText('Class Analysis')).toBeInTheDocument();
    expect(screen.getByText('Final Score')).toBeInTheDocument();
    expect(screen.getByText('Demo/Fallback Transcript')).toBeInTheDocument();
    expect(screen.getByTitle('Using browser/demo transcription fallback for reliability during prototype mode.')).toBeInTheDocument();
    expect(screen.getAllByText(/Good morning class, today we will solve word problems using multiplication./).length).toBeGreaterThan(0);
  });
});
