import React, { useEffect, useRef, useState } from 'react';
import OfflineRecorder from '../audio/offline-recorder';
import Worker from '../worker/stt.worker?worker';
import { saveTranscript } from '../models/indexeddb';
import { normalizeTranscript, detectLanguageSimple } from '../utils/normalize';
import { detectDeviceClass, recommendedModelForDevice, recommendedChunkParams } from '../utils/device';

type Segment = { id: string; startMs: number; endMs: number; text: string; interim?: boolean };

type ModelState = 'loading' | 'ready' | 'error';

export function TranscriptionView({
  sessionId,
  onEngineFallback,
}: {
  sessionId: string | null;
  onEngineFallback?: (reason: string) => void;
}) {
  const [interim, setInterim] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [deviceClass, setDeviceClass] = useState<string | null>(null);
  const [forceLowMemory, setForceLowMemory] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [cacheProgress, setCacheProgress] = useState<number>(0);
  const [modelState, setModelState] = useState<ModelState>('loading');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const recorderRef = useRef<OfflineRecorder | null>(null);
  const chunkStartRef = useRef<number>(0);

  useEffect(() => {
    const w = new Worker();
    workerRef.current = w;
    w.postMessage({ type: 'init' });

    const detected = detectDeviceClass();
    setDeviceClass(detected);
    const modelName = forceLowMemory ? 'tiny-mock' : recommendedModelForDevice(detected);
    setCurrentModel(modelName);
    setModelState('loading');
    setTranscriptionError(null);
    w.postMessage({ type: 'loadModel', modelName });

    w.onmessage = (ev: MessageEvent) => {
      const data = ev.data as any;
      if (data.type === 'ready') return;
      if (data.type === 'modelLoaded') {
        setModelState('ready');
        return;
      }
      if (data.type === 'error') {
        setModelState('error');
        const reason = String(data.message ?? 'Transcription engine error');
        setTranscriptionError(reason);
        onEngineFallback?.(reason);
        return;
      }
      if (data.type === 'partial') {
        setInterim(data.text);
        return;
      }
      if (data.type === 'result') {
        const id = `${Date.now()}-${data.chunkIndex}`;
        const text = normalizeTranscript(String(data.text));
        const seg: Segment = {
          id,
          startMs: chunkStartRef.current,
          endMs: chunkStartRef.current + 4000,
          text,
          interim: false,
        };
        chunkStartRef.current += 4000;
        setSegments((s: Segment[]) => {
          const next = [...s, seg];
          if (sessionId) saveTranscript(sessionId, seg).catch(() => {});
          return next;
        });
        setInterim(null);
      }
    };

    void import('../worker/model-loader').then(({ primeModel }) => primeModel(w, modelName));

    const onSwMessage = (ev: MessageEvent) => {
      const d = ev.data as any;
      if (!d || !d.type || d.name !== modelName) return;
      if (d.type === 'CACHE_PROGRESS') {
        setCacheProgress(Math.round((d.loaded / (d.total || d.loaded || 1)) * 100));
      }
      if (d.type === 'CACHE_COMPLETE') {
        setCacheProgress(100);
        workerRef.current?.postMessage({ type: 'loadModel', modelName });
      }
      if (d.type === 'CACHE_ERROR') {
        const reason = 'Model cache failed; live fallback still available.';
        setTranscriptionError(reason);
        onEngineFallback?.(reason);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
      w.terminate();
      workerRef.current = null;
    };
  }, [sessionId, forceLowMemory, onEngineFallback]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      recorderRef.current = null;
    };
  }, []);

  const start = async () => {
    if (recorderRef.current) return;
    setTranscriptionError(null);

    const detected = deviceClass || detectDeviceClass();
    const params = forceLowMemory ? recommendedChunkParams('low') : recommendedChunkParams(detected as any);

    const ChunkerModule = await import('../audio/chunker');
    const chunker = new ChunkerModule.Chunker(16000, params.chunkSeconds, params.overlapSeconds);

    const rec = new OfflineRecorder((pcm16) => {
      const chunks = chunker.push(pcm16);
      for (const c of chunks) {
        try {
          workerRef.current?.postMessage(
            { type: 'audio', pcm16: c.pcm, sampleRate: c.sampleRate, chunkIndex: Number(c.id.split('-').pop() ?? 0) },
            [c.pcm.buffer]
          );
        } catch {
          workerRef.current?.postMessage({ type: 'audio', pcm16: c.pcm, sampleRate: c.sampleRate, chunkIndex: Number(c.id.split('-').pop() ?? 0) });
        }
      }
    });

    recorderRef.current = rec;
    await rec.start();
    setIsRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs">
        <div className="text-ink/60">
          Device: <strong className="ml-1">{deviceClass ?? 'detecting...'}</strong>
        </div>
        <div className="text-ink/60">
          Model: <strong className="ml-1">{currentModel ?? 'pending'}</strong>
        </div>
        <div className="text-ink/60">
          Engine: <strong className="ml-1">{modelState === 'ready' ? 'Ready' : modelState === 'loading' ? 'Loading' : 'Fallback mode'}</strong>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={start} className="btn" disabled={isRecording}>Start STT capture</button>
        <button onClick={stop} className="btn" disabled={!isRecording}>Stop</button>
        <button
          onClick={() => setForceLowMemory((v: boolean) => !v)}
          className={`btn ${forceLowMemory ? 'bg-rose-200' : ''}`}
          title="Force low-memory mode"
        >
          {forceLowMemory ? 'Low-memory mode' : 'Auto mode'}
        </button>
        {currentModel && (
          <button
            onClick={async () => {
              const modelUrl = `/models/${currentModel}.bin`;
              if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CACHE_MODEL', url: modelUrl, name: currentModel });
              } else if (navigator.serviceWorker) {
                const reg = await navigator.serviceWorker.ready;
                reg.active?.postMessage({ type: 'CACHE_MODEL', url: modelUrl, name: currentModel });
              }
            }}
            className="btn"
          >
            Download model cache
          </button>
        )}
      </div>

      {cacheProgress > 0 && <div className="text-xs text-ink/60">Model cache progress: {cacheProgress}%</div>}
      {transcriptionError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {transcriptionError}
          <button
            className="ml-2 underline"
            onClick={() => {
              setTranscriptionError(null);
              if (currentModel) workerRef.current?.postMessage({ type: 'loadModel', modelName: currentModel });
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-2 space-y-1">
        {interim ? <div className="italic text-gray-500">{interim}</div> : null}
        {segments.map((s) => (
          <div key={s.id} className="text-sm py-1">
            <span className="text-xs text-ink/50 mr-2">[{Math.round(s.startMs / 1000)}s]</span>
            {detectLanguageSimple(s.text) === 'hi' ? <strong>HI</strong> : null} {s.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TranscriptionView;
