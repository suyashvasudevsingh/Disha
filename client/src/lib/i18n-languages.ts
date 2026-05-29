export const supportedLanguageLabels = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ta: 'தமிழ்',
} as const;

export type SupportedLanguageCode = keyof typeof supportedLanguageLabels;
