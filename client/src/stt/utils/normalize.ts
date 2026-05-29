export function normalizeTranscript(text: string) {
  // Basic normalization: trim, collapse spaces, fix spacing around punctuation.
  let out = text.trim();
  out = out.replace(/\s+/g, ' ');
  out = out.replace(/\s+([.,!?;:])/g, '$1');
  // Capitalize sentence starts
  out = out.replace(/(^|[.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  return out;
}

export function detectLanguageSimple(text: string) {
  // Very naive: check for Devanagari characters to infer Hindi
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}
