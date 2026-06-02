import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppState } from '@/state/app-state';
import { type TranscriptLine } from '@/lib/session-engine';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { CloudOff, Cpu, Info, Mic, MicOff, Pause, Play, Square, Waves } from 'lucide-react';
import LiveTranscriptFeed from '@/stt/ui/LiveTranscriptFeed';

const TranscriptionView = lazy(() => import('@/stt/ui/TranscriptionView'));

const sessionTemplate = {
  subject: 'Maths',
  className: 'Class 5A',
  schoolName: 'Govt. School No. 4',
};

export default function RecordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { preferences, startSession, finalizeSession, syncStatus, queueCount, updateSession } = useAppState();
  
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicPermission('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state as any);
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state as any);
          };
        })
        .catch(() => {
          setMicPermission('prompt');
        });
    }
  }, []);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      toast.success('Microphone permission granted!');
    } catch (err) {
      setMicPermission('denied');
      toast.error('Microphone permission denied. Please enable it in browser settings.');
    }
  };
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [processingSession, setProcessingSession] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const durationRef = useRef(0);
  const transcriptionSourcesRef = useRef<Set<'browser-fallback' | 'mock-transcript' | 'whisper-failed'>>(new Set());
  const fallbackReasonRef = useRef<string | undefined>(undefined);

  const speech = useSpeechRecognition({
    language: preferences.language,
    onLineRecognized: (newLine) => {
      console.log('[RecordPage] transcript received', newLine, { sessionId: sessionIdRef.current });
      setTranscript((current) => {
        const nextTranscript = [...current, newLine];
        transcriptRef.current = nextTranscript;
        if (sessionIdRef.current) {
          updateSession(sessionIdRef.current, { transcript: nextTranscript, durationSeconds: durationRef.current });
        }
        return nextTranscript;
      });
    },
  });

  const recorder = useAudioRecorder({
    onStopRecording: async ({ url, blob }) => {
      console.log('[RecordPage] recording stopped', { sessionId: sessionIdRef.current, blobSize: blob?.size });
      if (!sessionIdRef.current) {
        return;
      }

      setProcessingSession(true);
      
      // Deterministic fallback for empty or failed STT captures
      const finalTranscript = transcriptRef.current.length > 0
        ? transcriptRef.current
        : buildFallbackTranscript(preferences.language);
      console.log('[RecordPage] final transcript prepared', { sessionId: sessionIdRef.current, lineCount: finalTranscript.length, isFallback: transcriptRef.current.length === 0 });
      const isPending = !speech.isSupported || finalTranscript.length === 0;

      const finalized = await finalizeSession(
        sessionIdRef.current, 
        durationRef.current, 
        finalTranscript, 
        url,
        buildTranscriptionMeta(finalTranscript)
      );
      console.log('[RecordPage] finalizeSession completed', { sessionId: sessionIdRef.current, finalizedId: finalized?.id, status: finalized?.status });
      
      setProcessingSession(false);

      if (finalized) {
        if (isPending) {
          toast.success('Session saved. Transcription is pending.');
        } else {
          toast.success('Session analyzed and saved');
        }
        console.log('[RecordPage] session stored', { sessionId: finalized.id });
        console.log('[RecordPage] navigate triggered', `/report/${finalized.id}`, { sessionId: finalized.id });
        navigate(`/report/${finalized.id}`, { state: { session: finalized } });
      }
    },
  });

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    durationRef.current = recorder.durationSeconds;
  }, [recorder.durationSeconds]);

  const startRecording = async () => {
    if (micPermission === 'denied') {
      toast.error('Microphone permission is denied. Using a deterministic demo transcript.');
      await startFallbackSession('Microphone permission denied');
      return;
    }

    if (!recorder.isSupported) {
      toast.error('Microphone unavailable. Using a deterministic demo transcript.');
      await startFallbackSession('Microphone unavailable');
      return;
    }

    const session = startSession({
      ...sessionTemplate,
      language: preferences.language,
    });

    sessionIdRef.current = session.id;
    setSessionId(session.id);
    setTranscript([]);
    transcriptRef.current = [];
    durationRef.current = 0;
    transcriptionSourcesRef.current = new Set();
    fallbackReasonRef.current = undefined;
    
    recorder.reset();

    try {
      await recorder.start();
    } catch (error) {
      toast.error('Could not start microphone. Falling back to demo transcript.');
      await finalizeFallbackSession(session.id, 'Microphone start failed', session);
      return;
    }
    
    speech.reset();
    if (speech.isSupported) {
      speech.start();
    } else {
      transcriptionSourcesRef.current.add('browser-fallback');
      toast.warning('Live browser STT unavailable. Using deterministic transcript fallback when recording ends.');
    }
    
    toast.success('Recording started');
  };

  const stopRecording = () => {
    if (!sessionIdRef.current) {
      return;
    }

    speech.stop();
    recorder.stop();
  };

  const handlePause = () => {
    speech.pause();
    recorder.pause();
  };

  const handleResume = () => {
    speech.resume();
    recorder.resume();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const remaining = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remaining}`;
  };

  const offlineState = syncStatus === 'offline' || queueCount > 0;
  const fallbackMode = !speech.isSupported || Boolean(speech.error) || Boolean(recorder.error);
  const statusLabel = recorder.isRecording
    ? (speech.isSupported ? 'Live speech recognition' : 'Recording with fallback transcript')
    : recorder.isPaused
      ? 'Paused'
      : processingSession
        ? 'Processing'
        : (speech.isSupported ? 'Ready for live transcription' : 'Ready for fallback transcript');

  return (
    <div className="space-y-6 lg:space-y-8">
      {micPermission === 'denied' && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 p-2 rounded-2xl bg-rose-100 text-rose-700">
              <MicOff size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-rose-900">Microphone permission denied</h4>
              <p className="text-sm text-rose-700/80 mt-0.5">Please allow microphone access in your browser settings to record your classroom lessons. You can still use the fallback demo mode below.</p>
            </div>
          </div>
          <Button onClick={requestPermission} className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shrink-0">
            Grant Access
          </Button>
        </div>
      )}

      {micPermission === 'unsupported' && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 flex gap-3">
          <div className="mt-0.5 p-2 rounded-2xl bg-amber-100 text-amber-700">
            <CloudOff size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900">Microphone access unsupported</h4>
            <p className="text-sm text-amber-700/80 mt-0.5">Your browser doesn't support microphone recording. Please use a modern browser like Chrome, Safari, or Firefox. fallbacks will be used.</p>
          </div>
        </div>
      )}

      {!speech.isSupported && (
        <div className="rounded-3xl border border-primary-light bg-blue-50/40 p-5 flex gap-3">
          <div className="mt-0.5 p-2 rounded-2xl bg-primary-light/80 text-primary">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-ink">Live speech-to-text unavailable</h4>
            <p className="text-sm text-ink/60 mt-0.5">This browser doesn't support live speech recognition. The recording will save successfully, and a fallback transcript will be generated once recording ends.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={recorder.isRecording ? 'destructive' : 'secondary'} className="rounded-full px-3 py-1 uppercase tracking-[0.18em]">
              {statusLabel}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 border-primary-light text-ink/60">
              {sessionTemplate.subject} • {sessionTemplate.className}
            </Badge>
            {offlineState && (
              <Badge className="rounded-full bg-primary-light text-primary border-none px-3 py-1">
                <CloudOff size={14} className="mr-1" /> Offline queue active
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{t('start_recording')}</h1>
          <p className="text-sm md:text-base text-ink/60 max-w-2xl">Capture a lesson, preview transcript progress, and generate AI coaching with deterministic fallback if live services fail.</p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-ink/30">Timer</p>
          <div className="font-display text-5xl md:text-6xl font-bold tabular-nums">{formatTime(recorder.durationSeconds)}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="rounded-[32px] border-primary-light bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-primary-light/70 px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/30">Session control</p>
              <h2 className="text-xl font-display font-bold">{sessionTemplate.subject}</h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink/50">
                <Cpu size={15} /> {speech.isSupported ? 'Speech recognition ready' : 'Using fallback transcript'}
              </div>
              {!speech.isSupported && (
                <p className="text-[10px] text-amber-600">Browser doesn't support STT</p>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-5 sm:px-6 py-6 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div className="relative mx-auto lg:mx-0 w-60 h-60 sm:w-72 sm:h-72">
                <motion.div
                  animate={{ scale: recorder.isRecording ? [1, 1.12, 1] : 1, opacity: recorder.isRecording ? [0.25, 0.4, 0.25] : 0.15 }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className={`absolute inset-4 rounded-full blur-3xl ${recorder.isRecording ? 'bg-primary' : 'bg-ink/20'}`}
                />

                <button
                  type="button"
                  onClick={recorder.isRecording ? stopRecording : startRecording}
                  aria-label={recorder.isRecording ? 'Stop recording' : 'Start recording'}
                  className={`relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center gap-3 shadow-2xl transition-transform active:scale-95 ${recorder.isRecording ? 'bg-white text-primary' : 'bg-primary text-white hover:scale-[1.02]'}`}
                >
                  {recorder.isRecording ? <Square size={54} fill="currentColor" /> : <Mic size={54} strokeWidth={1.6} />}
                  <span className="text-xs font-bold uppercase tracking-[0.25em]">{recorder.isRecording ? 'Tap to stop' : 'Tap to record'}</span>
                  <span className="text-sm opacity-80">{formatTime(recorder.durationSeconds)}</span>
                </button>                <div className="absolute -inset-x-3 bottom-2 flex items-end justify-center gap-1 h-20">
                  {recorder.levels.map((level, index) => (
                    <motion.span
                      key={`${index}-${level}`}
                      animate={{ height: recorder.isRecording ? [level * 0.5, level * 1.2, level * 0.75] : level * 0.35, opacity: recorder.isRecording ? 1 : 0.45 }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.05 }}
                      className={`w-1.5 rounded-full ${recorder.isRecording ? 'bg-primary' : 'bg-primary-light'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-center lg:justify-end gap-3">
                <Button variant="outline" onClick={recorder.isPaused ? handleResume : handlePause} disabled={!recorder.isRecording && !recorder.isPaused} className="h-12 rounded-2xl border-primary-light px-5 gap-2">
                  {recorder.isPaused ? <Play size={18} /> : <Pause size={18} />}
                  {recorder.isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="outline" onClick={stopRecording} disabled={!recorder.isRecording && !recorder.isPaused} className="h-12 rounded-2xl border-primary-light px-5 gap-2 text-ink/70">
                  <MicOff size={18} /> End session
                </Button>
                <Button variant="outline" onClick={() => navigator.vibrate?.(18)} className="h-12 rounded-2xl border-primary-light px-5 gap-2 text-ink/60">
                  <Waves size={18} /> Tactile ping
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface/80 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/35">Audio</p>
                <p className="mt-1 font-semibold text-ink/70">{recorder.isSupported ? 'Microphone supported' : 'Browser fallback only'}</p>
              </div>
              <div className="rounded-2xl bg-surface/80 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/35">Sync</p>
                <p className="mt-1 font-semibold text-ink/70">{offlineState ? 'Offline queue pending' : 'Live sync available'}</p>
              </div>
              <div className="rounded-2xl bg-surface/80 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/35">Progress</p>
                <Progress value={Math.min(100, (recorder.durationSeconds / 1800) * 100)} className="mt-3 h-2 bg-primary-light" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 min-w-0">
          <Card className="rounded-[32px] border-primary-light bg-white shadow-sm overflow-hidden">
            <CardHeader className="px-5 sm:px-6 py-4 border-b border-primary-light/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/30">Transcript</p>
                <h3 className="text-lg font-display font-bold">Live preview</h3>
              </div>
            </CardHeader>
            <CardContent className="px-5 sm:px-6 py-5">
              <LiveTranscriptFeed
                lines={transcript}
                interimText={speech.interimText}
                confidence={speech.confidence}
                isListening={speech.isListening}
                isPaused={recorder.isPaused}
                isProcessing={processingSession}
                offlineState={offlineState}
                syncStatus={syncStatus}
                levels={recorder.levels}
                speechSupported={speech.isSupported}
                fallbackMode={fallbackMode}
                speechError={speech.error}
                onFallbackDemo={() => void startFallbackSession('Manual fallback requested')}
              />

              <details className="mt-5 rounded-3xl border border-primary-light bg-white p-4 shadow-sm">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink/75">
                  🔧 Advanced: Transcription diagnostics (diagnostic only - not used for classroom reports)
                </summary>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-ink/60">
                    This diagnostic panel allows testing of on-device transcription features. Classroom reports use the live transcript feed above instead. This is kept separate to ensure demo reliability.
                  </p>
                  {sessionId ? (
                    <Suspense fallback={<div className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink/60">Loading Whisper diagnostics...</div>}>
                      <TranscriptionView
                        sessionId={sessionId}
                        onEngineFallback={(reason) => {
                          transcriptionSourcesRef.current.add('whisper-failed');
                          fallbackReasonRef.current = reason;
                          if (sessionIdRef.current) {
                            updateSession(sessionIdRef.current, {
                              transcriptionMeta: {
                                fallbackUsed: true,
                                sources: Array.from(transcriptionSourcesRef.current),
                                reason,
                              },
                            });
                          }
                        }}
                      />
                    </Suspense>
                  ) : (
                    <div className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink/60">
                      Start a session to enable Whisper diagnostics.
                    </div>
                  )}
                </div>
              </details>

              {recorder.audioUrl && (
                <div className="mt-4 rounded-2xl bg-surface p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-ink/35">Playback preview</p>
                  <audio src={recorder.audioUrl} controls className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-primary-light bg-white shadow-sm overflow-hidden">
            <CardHeader className="px-5 sm:px-6 py-4 border-b border-primary-light/70 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/30">Session state</p>
                <h3 className="text-lg font-display font-bold">Offline-first controls</h3>
              </div>
              <CloudOff size={16} className="text-primary" />
            </CardHeader>
            <CardContent className="px-5 sm:px-6 py-5 space-y-4 text-sm text-ink/65">
              <p>{offlineState ? 'Recording is cached locally and will sync once connectivity returns.' : 'Recording will be uploaded immediately after analysis.'}</p>
              <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
                <span>Sync queue</span>
                <Badge className="rounded-full bg-primary-light text-primary border-none">{queueCount} items</Badge>
              </div>
              <div className="rounded-2xl border border-primary-light/80 px-4 py-3">
                <div className="flex items-center gap-2 text-ink/80 font-semibold"><Info size={16} /> Safety protocols</div>
                <p className="mt-2 text-xs leading-relaxed">Keep one thumb free for stopping the session, and use the pause control when moving between groups.</p>
              </div>
              {(recorder.error || speech.error) && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-600">
                  {recorder.error || speech.error}
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => void startFallbackSession('Manual fallback requested')}
                className="w-full rounded-2xl border-primary-light"
              >
                Use deterministic demo transcript
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  async function startFallbackSession(reason: string) {
    const session = startSession({
      ...sessionTemplate,
      language: preferences.language,
    });
    transcriptionSourcesRef.current.add('browser-fallback');
    transcriptionSourcesRef.current.add('mock-transcript');
    fallbackReasonRef.current = reason;
    sessionIdRef.current = session.id;
    setSessionId(session.id);
    await finalizeFallbackSession(session.id, reason, session);
  }

  async function finalizeFallbackSession(id: string, reason: string, sessionOverride?: ReturnType<typeof startSession>) {
    transcriptionSourcesRef.current.add('mock-transcript');
    fallbackReasonRef.current = reason;
    const fallbackTranscript = buildFallbackTranscript(preferences.language);
    setTranscript(fallbackTranscript);
    transcriptRef.current = fallbackTranscript;
    durationRef.current = 180;

    updateSession(id, {
      transcript: fallbackTranscript,
      durationSeconds: 180,
      transcriptionMeta: buildTranscriptionMeta(fallbackTranscript),
    });
    const finalized = await finalizeSession(
      id,
      180,
      fallbackTranscript,
      undefined,
      buildTranscriptionMeta(fallbackTranscript),
      sessionOverride
    );
    if (finalized) {
      toast.warning(`Fallback transcript used: ${reason}`);
      navigate(`/report/${finalized.id}`);
    }
  }

  function buildTranscriptionMeta(currentTranscript: TranscriptLine[]) {
    const sources = new Set(transcriptionSourcesRef.current);
    if (currentTranscript.some((line) => line.id.startsWith('fallback-'))) {
      sources.add('mock-transcript');
    }

    if (!speech.isSupported) {
      sources.add('browser-fallback');
    }

    return {
      fallbackUsed: sources.size > 0,
      sources: Array.from(sources),
      reason: fallbackReasonRef.current,
    };
  }

}

function buildFallbackTranscript(language: string): TranscriptLine[] {
  const lines = [
    'Good morning class, today we will solve word problems using multiplication.',
    'What information do we need first?',
    'We need number of groups and items in each group.',
    'Excellent. Why does repeated addition help here?',
    'Because multiplication is repeated addition.',
    'Great thinking. Take five seconds and write your strategy.',
  ];

  return lines.map((text, index) => ({
    id: `fallback-${index}`,
    speaker: index % 2 === 0 ? 'teacher' : 'student',
    text: language === 'hi' ? `हिंदी: ${text}` : text,
    timestamp: index * 30000,
  }));
}