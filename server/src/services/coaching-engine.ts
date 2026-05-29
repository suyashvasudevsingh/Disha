import { getDb } from '../db';
import { generateAICoaching, type AICoachingResult } from './ai.service';
import { buildGeminiCoachingPrompt } from './prompt-builder';
import { buildReport, type TeacherSession, type SessionReport, type CoachingTip } from './report.service';

const db = getDb();

export type ProcessedCoaching = {
  summary: string;
  strengths: string[];
  improvements: string[];
  micro_goals: string[];
  confidence: number;
  isFallback: boolean;
  language: string;
  timestamp: string;
};

/**
 * Orchestrating Dynamic LLM Coaching with fallbacks and caches
 */
export async function getOrGenerateCoaching(
  session: TeacherSession,
  targetLanguage: string
): Promise<ProcessedCoaching> {
  const sessionId = session.id;
  const cacheKey = `${sessionId}-${targetLanguage}`;

  // 1. Check language_cache table
  try {
    const cachedRow = db.prepare('SELECT payload_json FROM language_cache WHERE cache_key = ?').get(cacheKey) as { payload_json?: string } | undefined;
    if (cachedRow?.payload_json) {
      console.log(`[Coaching Engine] Cache hit for ${cacheKey}`);
      return JSON.parse(cachedRow.payload_json);
    }
  } catch (err) {
    console.error('[Coaching Engine] Cache check failed:', err);
  }

  // 2. Calculate underlying base report metrics
  const reportObj: SessionReport = buildReport(session);
  const metrics = {
    teacherRatio: reportObj.talkRatio.teacher,
    studentRatio: reportObj.talkRatio.student,
    silence: reportObj.talkRatio.silence,
    waitTimeSeconds: reportObj.waitTimeSeconds,
    inclusionScore: reportObj.inclusionScore,
    teacherLines: session.transcript.filter(l => l.speaker === 'teacher').length,
    studentLines: session.transcript.filter(l => l.speaker === 'student').length,
  };

  // 3. Build dynamic prompt
  const prompt = buildGeminiCoachingPrompt({
    subject: session.subject || 'Class Session',
    className: session.className || 'Class 5',
    durationSeconds: session.durationSeconds || 60,
    language: targetLanguage,
    transcript: session.transcript || [],
    metrics,
  });

  let aiResult: AICoachingResult;
  let isFallback = false;

  try {
    // 4. Invoke Gemini API
    aiResult = await generateAICoaching(prompt);
  } catch (error) {
    console.warn('[Coaching Engine] Gemini generation failed, triggering heuristic fallback:', error);
    isFallback = true;

    // 5. Fallback to existing deterministic coaching tips
    const tips: CoachingTip[] = reportObj.coachingTips || [];
    
    // Construct local localized summary fallback if available
    let fallbackSummary = `Class session showed stable progress with ${metrics.studentLines} student responses. Check the timeline detail below for complete pacing metrics.`;
    if (targetLanguage === 'hi') {
      fallbackSummary = `कक्षा सत्र में ${metrics.studentLines} छात्र प्रतिक्रियाओं के साथ स्थिर प्रगति देखी गई। अधिक जानकारी के लिए टाइमलाइन देखें।`;
    }

    aiResult = {
      summary: fallbackSummary,
      strengths: tips.filter(t => t.severity !== 'critical').map(t => `${t.title}: ${t.detail}`),
      improvements: tips.filter(t => t.severity === 'critical').map(t => `${t.title}: ${t.detail}`),
      micro_goals: tips.map(t => t.action).filter(Boolean) as string[],
      confidence: 0.50, // lower confidence for heuristic fallback
    };
  }

  const processed: ProcessedCoaching = {
    summary: aiResult.summary,
    strengths: aiResult.strengths,
    improvements: aiResult.improvements,
    micro_goals: aiResult.micro_goals,
    confidence: aiResult.confidence,
    isFallback,
    language: targetLanguage,
    timestamp: new Date().toISOString(),
  };

  // 6. Write back to language_cache
  try {
    db.prepare(`
      INSERT INTO language_cache (id, cache_key, language, payload_json, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cache_key) DO UPDATE SET
        language = excluded.language,
        payload_json = excluded.payload_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(crypto.randomUUID(), cacheKey, targetLanguage, JSON.stringify(processed));
  } catch (err) {
    console.error('[Coaching Engine] Cache write failed:', err);
  }

  // 7. Update main sessions database if this matches the session's primary language
  if (targetLanguage === session.language) {
    try {
      db.prepare(`
        UPDATE sessions SET
          ai_summary = ?,
          ai_strengths = ?,
          ai_improvements = ?,
          ai_micro_goals = ?,
          ai_confidence = ?,
          ai_language = ?,
          ai_timestamp = ?
        WHERE id = ?
      `).run(
        processed.summary,
        JSON.stringify(processed.strengths),
        JSON.stringify(processed.improvements),
        JSON.stringify(processed.micro_goals),
        processed.confidence,
        processed.language,
        processed.timestamp,
        sessionId
      );
    } catch (err) {
      console.error('[Coaching Engine] Sessions update failed:', err);
    }
  }

  return processed;
}
