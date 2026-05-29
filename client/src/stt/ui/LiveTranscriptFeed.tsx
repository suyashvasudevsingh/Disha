import { AnimatePresence, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type TranscriptLine } from '@/lib/session-engine';
import { detectLanguageSimple } from '@/stt/utils/normalize';
import { AlertCircle, Mic, Pause, Play, Signal, Sparkles, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

type SyncState = 'idle' | 'offline' | 'syncing' | 'error';

type LiveTranscriptFeedProps = {
  lines: TranscriptLine[];
  interimText: string;
  confidence: number;
  isListening: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  offlineState: boolean;
  syncStatus: SyncState;
  levels: number[];
  speechSupported: boolean;
  fallbackMode: boolean;
  speechError?: string | null;
  onFallbackDemo?: () => void;
};

export function LiveTranscriptFeed({
  lines,
  interimText,
  confidence,
  isListening,
  isPaused,
  isProcessing,
  offlineState,
  syncStatus,
  levels,
  speechSupported,
  fallbackMode,
  speechError,
  onFallbackDemo,
}: LiveTranscriptFeedProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const latestLanguage = useMemo(() => {
    const latest = (lines && Array.isArray(lines)) ? [...lines].slice(-1)[0] : undefined;
    return latest ? detectLanguageSimple(latest.text) : 'en';
  }, [lines]);

  useEffect(() => {
    if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [lines.length, interimText]);

  const statusPill = isProcessing
    ? { label: 'Processing...', tone: 'bg-blue-50 text-blue-700 border-blue-200' }
    : isPaused
      ? { label: 'Paused', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
      : isListening
        ? { label: 'Listening...', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        : { label: 'Ready', tone: 'bg-surface text-ink/60 border-primary-light' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`rounded-full border px-3 py-1 text-[10px] font-semibold ${statusPill.tone}`}>
          {statusPill.label}
        </Badge>
        {offlineState ? (
          <Badge className="rounded-full bg-slate-100 text-slate-700 border-none px-3 py-1 text-[10px] font-semibold">
            <WifiOff size={12} className="mr-1" /> Offline
          </Badge>
        ) : (
          <Badge className="rounded-full bg-primary-light text-primary border-none px-3 py-1 text-[10px] font-semibold">
            Sync {syncStatus === 'syncing' ? 'syncing' : syncStatus === 'error' ? 'error' : 'ready'}
          </Badge>
        )}
        <Badge className="rounded-full bg-white text-ink/65 border border-primary-light px-3 py-1 text-[10px] font-semibold">
          Confidence {Math.round(confidence * 100)}%
        </Badge>
        <Badge className="rounded-full bg-white text-ink/65 border border-primary-light px-3 py-1 text-[10px] font-semibold">
          {speechSupported ? 'Live browser STT' : 'Fallback mode'}
        </Badge>
        {fallbackMode ? (
          <Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-[10px] font-semibold">
            Prototype fallback active
          </Badge>
        ) : null}
      </div>

      <div className="rounded-3xl border border-primary-light bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink/65">
            <Mic size={16} className={isListening ? 'text-primary' : 'text-ink/35'} />
            {isListening ? 'Recording live audio' : 'Waiting for microphone input'}
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/35">{latestLanguage === 'hi' ? 'Hindi mixed transcript' : 'Live transcript stream'}</div>
        </div>
        <div className="mt-4 flex items-end gap-1.5 h-10" aria-hidden="true">
          {levels.slice(0, 16).map((level, index) => (
            <motion.span
              key={`${index}-${level}`}
              animate={{ height: `${Math.max(16, Math.min(40, level))}px`, opacity: isListening ? [0.55, 1, 0.7] : 0.35 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`w-1.5 rounded-full ${isListening ? 'bg-primary' : 'bg-primary-light'}`}
            />
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="max-h-112 space-y-3 overflow-y-auto rounded-3xl border border-primary-light bg-surface/40 p-4 sm:p-5"
      >
        {(!lines || lines.length === 0) && !interimText ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-primary-light bg-white/70 px-5 text-center">
            <Sparkles className="mb-3 text-primary" />
            <h3 className="font-display text-xl font-semibold text-ink">
              {isListening ? 'Transcription initializing...' : 'Live transcript will appear here'}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/55">
              {isListening
                ? 'Listening to microphone... As you conduct your lesson, text fragments will automatically appear here.'
                : speechSupported
                  ? 'Tap record and speak. Final transcript chunks will land here with partial text shown live.'
                  : 'Your browser does not support live speech recognition. A fallback transcript will be used when recording ends.'}
            </p>
            {onFallbackDemo ? (
              <Button variant="outline" className="mt-4 rounded-2xl border-primary-light" onClick={onFallbackDemo}>
                Use fallback transcript mode
              </Button>
            ) : null}
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {(lines || []).map((line, index) => {
            const isQuestion = isQuestionLine(line.text);
            const isHi = detectLanguageSimple(line.text) === 'hi';
            const isRecent = index === (lines ? lines.length : 0) - 1;
            return (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className={`rounded-3xl border bg-white px-4 py-3 shadow-sm ${isQuestion ? 'border-amber-200 bg-amber-50/60' : 'border-primary-light'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]">
                    <span className={`${line.speaker === 'teacher' ? 'text-primary' : 'text-accent'}`}>
                      {line.speaker === 'teacher' ? 'Teacher' : 'Student'}
                    </span>
                    <span className="text-ink/30">•</span>
                    <span className="text-ink/40">{formatTimestamp(line.timestamp)}</span>
                    {isHi ? <Badge className="rounded-full bg-primary-light text-primary border-none px-2 py-0.5 text-[10px]">HI</Badge> : null}
                    {isQuestion ? <Badge className="rounded-full bg-amber-100 text-amber-800 border-none px-2 py-0.5 text-[10px]">Question</Badge> : null}
                  </div>
                  {isRecent ? <Badge className="rounded-full bg-surface text-ink/45 border-none text-[10px]">Latest</Badge> : null}
                </div>
                <p className={`mt-2 text-[1.02rem] leading-relaxed sm:text-[1.08rem] ${isQuestion ? 'font-medium text-ink' : 'text-ink/80'}`}>
                  {line.text}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {interimText ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-3xl border border-dashed border-primary bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live partial
              </div>
              <p className="mt-2 text-[1.02rem] italic leading-relaxed text-ink/70 sm:text-[1.08rem]">
                {interimText}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-ink/55">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm border border-primary-light">
          <Signal size={13} className={isListening ? 'text-primary' : 'text-ink/35'} />
          {isListening ? 'Mic active' : 'Mic idle'}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm border border-primary-light">
          <AlertCircle size={13} className={speechError ? 'text-rose-600' : 'text-ink/35'} />
          {speechError ? speechError : 'No errors'}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm border border-primary-light">
          {isPaused ? <Pause size={13} /> : <Play size={13} />}
          {isProcessing ? 'Processing transcript' : isPaused ? 'Paused for break' : 'Streaming live'}
        </div>
      </div>
    </div>
  );
}

function isQuestionLine(text: string) {
  const cleaned = text.trim().toLowerCase();
  return cleaned.includes('?') || ['why', 'what', 'how', 'can you', 'explain', 'क्या', 'क्यों', 'कैसे'].some((marker) => cleaned.includes(marker));
}

function formatTimestamp(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default LiveTranscriptFeed;
