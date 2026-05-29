import { useEffect, useRef, useState } from 'react';

type RecorderStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'error';

type UseAudioRecorderOptions = {
  onStopRecording?: (result: { blob: Blob; url: string }) => void;
};

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 16 }, () => 18));
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const levelsIntervalRef = useRef<number | null>(null);

  useEffect(() => () => cleanup(), []);

  const updateLevels = () => {
    const analyser = analyserRef.current;
    if (!analyser) {
      setLevels(Array.from({ length: 16 }, (_, index) => 12 + Math.abs(Math.sin(Date.now() / 450 + index)) * 40));
      return;
    }

    const values = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(values);
    const bucketSize = Math.max(1, Math.floor(values.length / 16));
    const nextLevels = Array.from({ length: 16 }, (_, index) => {
      const bucketStart = index * bucketSize;
      const bucket = values.slice(bucketStart, bucketStart + bucketSize);
      const amplitude = bucket.reduce((sum, value) => sum + Math.abs(value - 128), 0) / bucket.length;
      return 10 + amplitude * 0.7;
    });
    setLevels(nextLevels);
  };

  const start = async () => {
    try {
      setError(null);
      setAudioUrl(null);
      setDurationSeconds(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const RecorderCtor = window.MediaRecorder;
      const recorder = new RecorderCtor(stream, { mimeType: getPreferredMimeType() });
      const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextCtor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);

      streamRef.current = stream;
      recorderRef.current = recorder;
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('idle');
        options.onStopRecording?.({ blob, url });
        cleanupStreams();
      };

      recorder.start(250);
      setStatus('recording');
      intervalRef.current = window.setInterval(() => {
        setDurationSeconds((current: number) => current + 1);
      }, 1000);
      levelsIntervalRef.current = window.setInterval(() => {
        updateLevels();
      }, 200);
      updateLevels();
    } catch (recordingError) {
      setError(recordingError instanceof Error ? recordingError.message : 'Could not start recording');
      setStatus('error');
      cleanupStreams();
      throw recordingError;
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording' || recorderRef.current?.state === 'paused') {
      setStatus('processing');
      recorderRef.current.stop();
      clearIntervalTimer();
    }
  };

  const pause = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      clearIntervalTimer();
      setStatus('paused');
    }
  };

  const resume = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      intervalRef.current = window.setInterval(() => {
        setDurationSeconds((current: number) => current + 1);
      }, 1000);
      levelsIntervalRef.current = window.setInterval(() => {
        updateLevels();
      }, 200);
      setStatus('recording');
    }
  };

  const reset = () => {
    setDurationSeconds(0);
    setLevels(Array.from({ length: 16 }, () => 18));
    setAudioUrl(null);
    setError(null);
  };

  const clearIntervalTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (levelsIntervalRef.current) {
      window.clearInterval(levelsIntervalRef.current);
      levelsIntervalRef.current = null;
    }
  };

  const cleanupStreams = () => {
    clearIntervalTimer();
    streamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    analyserRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  const cleanup = () => {
    cleanupStreams();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  return {
    status,
    durationSeconds,
    levels,
    audioUrl,
    error,
    start,
    stop,
    pause,
    resume,
    reset,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    isProcessing: status === 'processing',
    isSupported: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined',
  };
}

function getPreferredMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? 'audio/webm';
}
