import { type TranscriptLine } from './report.service';

type PromptInput = {
  subject: string;
  className: string;
  durationSeconds: number;
  language: string; // Target language
  transcript: TranscriptLine[];
  metrics: {
    teacherRatio: number;
    studentRatio: number;
    silence: number;
    waitTimeSeconds: number;
    inclusionScore: number;
    teacherLines: number;
    studentLines: number;
  };
};

const SYSTEM_PROMPT = `
You are a highly experienced, supportive, and emotionally intelligent instructional pedagogy coach. You specialize in mentoring government and public school teachers across regional India (especially Rural/Semi-Urban schools).

Your primary objective is to listen to the provided classroom transcript, review their metrics, and generate grounded, practical, and highly actionable coaching feedback.

CRITICAL DIRECTIVES:
1. NEVER offer generic AI corporate advice (e.g., "Implement group synergic thinking..."). Avoid corporate fluff.
2. Use extremely simple, respectful, supportive, and direct language that is easily understood by local school teachers. Keep the tone warm, respectful of teacher dignity, but highly constructive.
3. Reference ACTUAL events or quotes from the transcript in your feedback! Pinpoint exactly what happened (e.g., "When you asked 'Why do you think...?' you gave the students 4 seconds to think, which was great...").
4. Strengths should be specific transcript highlights showing positive student engagement or warm teaching.
5. Improvements must focus on actionable next-class alternatives (e.g., instead of saying "improve wait time", suggest: "Try asking a question, then silently counting to 4 before calling a student's name").
6. You MUST write all your suggestions, strengths, improvements, and goals ENTIRELY in the target language requested by the teacher.
7. Use simple regional language vocabulary suitable for local public school teachers. Do NOT use overly complex literary language.
8. Output structured JSON ONLY. Do not write any preamble, introduction, or conversational filler before or after the JSON structure.

Target Language Options:
- 'hi': Simple Hindi (ordinary conversational classroom Hindi, e.g. "आपने छात्रों से प्रश्न पूछे...")
- 'en': Simple English (conversational classroom English)
- 'mr': Simple Marathi
- 'te': Simple Telugu
- 'ta': Simple Tamil
- 'kn': Simple Kannada
`;

export function buildGeminiCoachingPrompt({
  subject,
  className,
  durationSeconds,
  language,
  transcript,
  metrics,
}: PromptInput): string {
  const formattedTranscript = transcript
    .map((line) => {
      const timeMin = Math.floor(line.timestamp / 60000);
      const timeSec = Math.floor((line.timestamp % 60000) / 1000)
        .toString()
        .padStart(2, '0');
      return `[${timeMin}:${timeSec}] ${line.speaker.toUpperCase()}: "${line.text}"`;
    })
    .join('\n');

  const durationMin = Math.floor(durationSeconds / 60);

  return `
${SYSTEM_PROMPT}

Target Language for Output: ${language}

CLASS DETAILS:
- Subject: ${subject}
- Class: ${className}
- Duration: ${durationMin} minutes

EXTRACTED PEDAGOGY METRICS:
- Teacher Speaking Share (Talk Ratio): ${metrics.teacherRatio}%
- Students Speaking Share (Talk Ratio): ${metrics.studentRatio}%
- Silence/Thinking time Share: ${metrics.silence}%
- Average Wait Time after a question: ${metrics.waitTimeSeconds.toFixed(1)} seconds
- Total Teacher turns: ${metrics.teacherLines}
- Total Student responses: ${metrics.studentLines}
- Overall Student Inclusion/Participation Score: ${metrics.inclusionScore.toFixed(1)}/10.0

CLASSROOM TRANSCRIPT:
=== START OF TRANSCRIPT ===
${formattedTranscript || '(No audio/speech detected during this lesson)'}
=== END OF TRANSCRIPT ===

Generate the JSON response matching this EXACT schema:
{
  "summary": "A concise 2-3 sentence overview of the session's overall tone and flow (written entirely in ${language}). Mention the subject and specific class.",
  "strengths": [
    "A specific positive strength observed in the transcript. Must quote or reference a specific moment from the class (written entirely in ${language}).",
    "Another specific classroom positive strength... (written entirely in ${language})."
  ],
  "improvements": [
    "A constructive improvement. Must pinpoint an actual transcript moment and suggest a practical alternative for next class (written entirely in ${language}).",
    "Another classroom improvement... (written entirely in ${language})."
  ],
  "micro_goals": [
    "1 highly actionable, concrete goal for their NEXT class. (e.g. Ask 3 open-ended questions using 'क्यों' or 'कैसे' instead of yes/no questions) (written entirely in ${language}).",
    "A 2nd concrete actionable goal... (written entirely in ${language})."
  ],
  "confidence": 0.88
}
`;
}
