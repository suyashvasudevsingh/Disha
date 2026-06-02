import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAppState } from '@/state/app-state';
import { supportedLanguageLabels } from '@/lib/i18n-languages';
import { BarChart3, Globe, UserCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { cycleLanguage } = useAppState();

  const features = [
    {
      icon: <Zap className="text-emerald-600" />,
      title: t('landing_feature_1_title'),
      desc: t('landing_feature_1_desc'),
    },
    {
      icon: <BarChart3 className="text-emerald-600" />,
      title: t('landing_feature_2_title'),
      desc: t('landing_feature_2_desc'),
    },
    {
      icon: <UserCheck className="text-emerald-600" />,
      title: t('landing_feature_3_title'),
      desc: t('landing_feature_3_desc'),
    },
    {
      icon: <Globe className="text-emerald-600" />,
      title: t('landing_feature_4_title'),
      desc: t('landing_feature_4_desc'),
    },
  ];

  const toggleLanguage = async () => {
    cycleLanguage();
    const languageCodes = Object.keys(supportedLanguageLabels) as Array<keyof typeof supportedLanguageLabels>;
    const index = languageCodes.indexOf(i18n.language as keyof typeof supportedLanguageLabels);
    const nextCode = languageCodes[(index + 1) % languageCodes.length] ?? 'en';
    await i18n.changeLanguage(nextCode);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-white overflow-hidden selection:bg-emerald-100">
      <nav className="h-20 flex shrink-0 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="text-xl md:text-2xl font-display font-bold text-slate-900">Disha</span>
        </div>

        <Button
          variant="outline"
          onClick={toggleLanguage}
          className="rounded-full border-emerald-200 text-slate-700 hover:border-emerald-300"
        >
          <Globe className="w-4 h-4 mr-2 text-emerald-600" />
          {supportedLanguageLabels[i18n.language as keyof typeof supportedLanguageLabels] ?? 'Language'}
        </Button>
      </nav>

      <main className="flex flex-1 min-h-0 overflow-hidden">
        <motion.div
          className="flex w-full flex-col justify-center px-6 py-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="mx-auto max-w-2xl w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-4">{t('classroom_intelligence')}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-950 leading-tight">
              {t('landing_main_headline')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              {t('landing_subtitle')}
            </p>

            <div className="mt-8">
              <Button
                type="button"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-base font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                onClick={() => navigate('/dashboard')}
              >
                {t('landing_get_started')}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hidden lg:flex w-1/2 items-center justify-center px-6 py-8"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="grid w-full max-w-xl grid-cols-2 gap-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="p-3 sm:p-4 rounded-[1.75rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
