import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export type AICoachingResult = {
  summary: string;
  strengths: string[];
  improvements: string[];
  micro_goals: string[];
  confidence: number;
  isFallback?: boolean;
};

// Sleep helper for exponential backoff retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Direct REST API request to Gemini 1.5 Flash
 */
async function callGeminiRaw(promptText: string, timeoutMs: number = 8000): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'No detail');
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('Empty response returned from Gemini candidates.');
    }

    return generatedText;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * AI Generation Service with exponential backoff retries and JSON sanitization
 */
export async function generateAICoaching(promptText: string): Promise<AICoachingResult> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('No API key configured.');
      }

      console.log(`[AI Service] Invoking Gemini API... (Attempt ${attempt + 1}/${maxRetries})`);
      const responseText = await callGeminiRaw(promptText);
      
      // Clean and sanitize the JSON string (Gemini sometimes includes markdown wrapper)
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      const parsed: AICoachingResult = JSON.parse(cleanedText);

      // Validate required fields
      if (
        typeof parsed.summary !== 'string' ||
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.improvements) ||
        !Array.isArray(parsed.micro_goals)
      ) {
        throw new Error('AI response is missing required JSON coaching properties.');
      }

      // Populate default confidence if missing
      parsed.confidence = parsed.confidence ?? 0.85;
      parsed.isFallback = false;

      return parsed;
    } catch (error: any) {
      attempt++;
      lastError = error;
      console.warn(`[AI Service] Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await sleep(backoffMs);
      }
    }
  }

  console.error('[AI Service] Gemini Generation failed. Triggering heuristic fallback.', lastError);
  throw lastError; // Let the caller deal with falling back
}
