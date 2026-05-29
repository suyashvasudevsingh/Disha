import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppState } from '@/state/app-state';
import { useTranslation } from 'react-i18next';

const consentCopy: Record<string, { title: string; body: string; action: string; footer: string }> = {
  en: {
    title: 'Your recording stays private',
    body: 'This recording stays on your phone. No one else can see it — not your principal, not the government. Only you.',
    action: 'I understand and agree',
    footer: 'You can change this anytime from settings.',
  },
  hi: {
    title: 'आपकी रिकॉर्डिंग निजी रहती है',
    body: 'यह रिकॉर्डिंग सिर्फ आपके फोन पर रहती है। इसे कोई और नहीं देख सकता — न प्रिंसिपल, न सरकार। केवल आप।',
    action: 'मैं समझता/समझती हूँ और सहमत हूँ',
    footer: 'आप इसे कभी भी सेटिंग्स से बदल सकते हैं।',
  },
  mr: {
    title: 'तुमची रेकॉर्डिंग खाजगी राहते',
    body: 'ही रेकॉर्डिंग फक्त तुमच्या फोनवर राहते. ती कोणीही पाहू शकत नाही — मुख्याध्यापकही नाही, सरकारही नाही. फक्त तुम्ही.',
    action: 'मी समजतो/समजते आणि सहमत आहे',
    footer: 'तुम्ही हे कधीही सेटिंग्जमधून बदलू शकता.',
  },
  te: {
    title: 'మీ రికార్డింగ్ గోప్యంగా ఉంటుంది',
    body: 'ఈ రికార్డింగ్ మీ ఫోన్‌లోనే ఉంటుంది. ఇంకెవరూ చూడలేరు — ప్రిన్సిపల్ కాదు, ప్రభుత్వం కాదు. మీరు మాత్రమే.',
    action: 'నేను అర్థం చేసుకున్నాను, అంగీకరిస్తున్నాను',
    footer: 'మీరు దీన్ని ఎప్పుడైనా సెట్టింగ్స్‌లో మార్చుకోవచ్చు.',
  },
  kn: {
    title: 'ನಿಮ್ಮ ರೆಕಾರ್ಡಿಂಗ್ ಖಾಸಗಿಯೇ ಇರುತ್ತದೆ',
    body: 'ಈ ರೆಕಾರ್ಡಿಂಗ್ ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ. ಬೇರೆ ಯಾರೂ ನೋಡಲು ಸಾಧ್ಯವಿಲ್ಲ — ಪ್ರಿನ್ಸಿಪಾಲ್ ಕೂಡ ಅಲ್ಲ, ಸರ್ಕಾರವೂ ಅಲ್ಲ. ನೀವು ಮಾತ್ರ.',
    action: 'ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ ಮತ್ತು ಒಪ್ಪುತ್ತೇನೆ',
    footer: 'ಇದನ್ನು ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಬದಲಾಯಿಸಬಹುದು.',
  },
  ta: {
    title: 'உங்கள் பதிவு தனிப்பட்டதே',
    body: 'இந்த பதிவு உங்கள் போனிலேயே இருக்கும். மற்றவர்கள் யாரும் பார்க்க முடியாது — தலைமை ஆசிரியரும் இல்லை, அரசும் இல்லை. நீங்களே மட்டும்.',
    action: 'நான் புரிந்துகொண்டு ஒப்புக்கொள்கிறேன்',
    footer: 'இதைக் கட்டுப்பாடுகளில் எப்போது வேண்டுமானாலும் மாற்றலாம்.',
  },
};

export function ConsentModal() {
  const { preferences, consentGiven, setConsentGiven } = useAppState();
  const { i18n } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const copy = useMemo(() => consentCopy[preferences.language] ?? consentCopy.en, [preferences.language]);
  const shouldShow = !consentGiven;

  useEffect(() => {
    if (shouldShow) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-4 py-4 sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-xl"
      >
        <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-2xl shadow-ink/20">
          <div className="bg-linear-to-r from-primary via-primary/90 to-accent px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Consent first</div>
                <h2 className="text-2xl font-display font-bold">{copy.title}</h2>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            <p className="text-base leading-relaxed text-ink/75">{copy.body}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-primary-light/40 px-4 py-4 text-sm text-ink/70">
                <div className="mb-2 flex items-center gap-2 font-semibold text-primary"><Lock size={16} /> Private by default</div>
                All sessions save locally first, then sync only when you choose.
              </div>
              <div className="rounded-2xl bg-surface px-4 py-4 text-sm text-ink/70">
                <div className="mb-2 flex items-center gap-2 font-semibold text-primary"><Sparkles size={16} /> Teacher dignity</div>
                Coaching stays focused on growth, not surveillance.
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="h-12 rounded-2xl bg-primary px-5 text-white hover:bg-primary-dark"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await setConsentGiven(true);
                    await i18n.changeLanguage(preferences.language);
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? 'Saving…' : copy.action}
              </Button>
              <p className="text-xs text-ink/45">{copy.footer}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
