import { useEffect, useRef, useState } from 'react';
import { type TranscriptLine, type SupportedLanguage } from '../lib/session-engine';

type UseSpeechRecognitionOptions = {
  language: SupportedLanguage;
  onLineRecognized?: (line: TranscriptLine) => void;
};

const LANG_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
};

// Simple list of question markers to identify teacher prompts
const TEACHER_QUESTION_WORDS = [
  'why', 'what', 'how', 'who', 'explain', 'tell', 'let\'s', 'let us', 'can you', 'do you',
  'क्यों', 'कैसे', 'क्या', 'कौन', 'बताओ', 'चलो', 'समझाओ', 'कैसे', 'किसने'
];

const MAX_TRANSCRIPT_LINES = 500;

export function useSpeechRecognition({ language, onLineRecognized }: UseSpeechRecognitionOptions) {
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(1.0);

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  const shouldAutoRestartRef = useRef(false);
  const accumulatedLinesRef = useRef<TranscriptLine[]>([]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = LANG_MAP[language] || 'en-IN';

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
        shouldAutoRestartRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Just a timeout, no need to show critical error
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      // Restart if we are supposed to be active
      if (shouldAutoRestartRef.current) {
        try {
          rec.start();
        } catch (e) {
          console.error('Failed to restart speech recognition:', e);
        }
      }
    };

    rec.onresult = (event: any) => {
      let currentInterim = '';
      let finalText = '';
      let currentConfidence = 1.0;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText = result[0].transcript.trim();
          currentConfidence = result[0].confidence;
        } else {
          currentInterim += result[0].transcript;
        }
      }

      setInterimText(currentInterim);
      if (currentConfidence > 0) {
        setConfidence(Number(currentConfidence.toFixed(2)));
      }

      if (finalText) {
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        
        // Smart Speaker Diarization Heuristic:
        // 1. Default to teacher
        // 2. If the phrase is short (< 6 words) and the last line was a teacher question, classify as student
        // 3. If it contains student reply signals, classify as student
        let speaker: 'teacher' | 'student' = 'teacher';
        const wordCount = finalText.split(/\s+/).length;
        const lowerText = finalText.toLowerCase();
        
        const lastLine = accumulatedLinesRef.current[accumulatedLinesRef.current.length - 1];
        const lastLineWasQuestion = lastLine && (
          lastLine.text.endsWith('?') || 
          TEACHER_QUESTION_WORDS.some(w => lastLine.text.toLowerCase().includes(w))
        );

        const isQuestion = TEACHER_QUESTION_WORDS.some(w => lowerText.includes(w)) || finalText.endsWith('?');

        if (!isQuestion && wordCount < 6 && lastLineWasQuestion) {
          speaker = 'student';
        } else if (wordCount < 4 && (lowerText.includes('yes') || lowerText.includes('no') || lowerText.includes('हाँ') || lowerText.includes('ना'))) {
          speaker = 'student';
        }

        // Add question mark if it sounds like a question and doesn't have one
        let formattedText = finalText;
        if (isQuestion && !finalText.endsWith('?')) {
          formattedText += '?';
        }

        const newLine: TranscriptLine = {
          id: `${Date.now()}-${accumulatedLinesRef.current.length}`,
          speaker,
          text: formattedText,
          timestamp: elapsed,
        };

        accumulatedLinesRef.current = [...accumulatedLinesRef.current, newLine].slice(-MAX_TRANSCRIPT_LINES);
        setTranscriptLines([...accumulatedLinesRef.current]);
        
        if (onLineRecognized) {
          onLineRecognized(newLine);
        }
      }
    };

    recognitionRef.current = rec;

    return () => {
      shouldAutoRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  const start = () => {
    if (!recognitionRef.current) return;
    shouldAutoRestartRef.current = true;
    startTimeRef.current = Date.now();
    try {
      recognitionRef.current.start();
      setError(null);
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      setError('Could not start live speech recognition.');
    }
  };

  const stop = () => {
    shouldAutoRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const pause = () => {
    shouldAutoRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const resume = () => {
    if (!recognitionRef.current) return;
    shouldAutoRestartRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Speech recognition resume failed:', e);
    }
  };

  const reset = () => {
    accumulatedLinesRef.current = [];
    setTranscriptLines([]);
    setInterimText('');
    startTimeRef.current = null;
    setConfidence(1.0);
    setError(null);
    setIsListening(false);
  };

  return {
    start,
    stop,
    pause,
    resume,
    reset,
    transcriptLines,
    interimText,
    isListening,
    confidence,
    error,
    isSupported: typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
  };
}
