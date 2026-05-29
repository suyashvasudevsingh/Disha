import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Globe, Zap, Heart, CloudOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAppState } from '@/state/app-state';
import { supportedLanguageLabels } from '@/lib/i18n-languages';
import { useAuthStore } from '@/state/auth';
import { mapFirebaseError, sendFirebaseOtp } from '@/lib/firebase-phone';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const authStatus = useAuthStore((state) => state.status);
  const setPendingPhone = useAuthStore((state) => state.setPendingPhone);
  const { cycleLanguage } = useAppState();

  useEffect(() => {
    if (authStatus === 'authenticated') {
      navigate('/dashboard', { replace: true });
    }
  }, [authStatus, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await sendFirebaseOtp(phone);
      setPendingPhone(result.phoneNumber);
      toast.success('OTP sent to your phone.');
      navigate('/verify');
    } catch (error) {
      toast.error(mapFirebaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      {/* Nav */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Mic className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold text-primary-dark">Disha</span>
        </div>
          <Button 
            variant="outline" 
            onClick={() => { cycleLanguage(); void i18n.changeLanguage(nextLanguage(i18n.language)); }}
            className="rounded-full border-primary-light text-primary-dark"
          >
          <Globe className="w-4 h-4 mr-2" />
          {supportedLanguageLabels[nextLanguage(i18n.language) as keyof typeof supportedLanguageLabels] ?? 'Language'}
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light rounded-full text-primary-dark font-medium text-sm mb-6">
            <Zap size={16} className="text-accent" />
            Prototype v1
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
            {t('login_title')}
          </h1>
          <p className="text-xl text-ink/70 mb-10 leading-relaxed max-w-lg">
            {t('login_subtitle')}
          </p>

          <Card className="p-6 glass-card rounded-3xl max-w-md">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink/60 ml-1">{t('otp_login')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-medium">+91</span>
                  <Input 
                    type="tel" 
                    placeholder="Enter phone number" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-14 h-14 rounded-2xl border-primary-light focus:ring-primary focus:border-primary text-lg"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-dark text-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-70">
                {isLoading ? 'Sending OTP...' : 'Continue with OTP'}
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Visual Element */}
        <div className="relative hidden md:block">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full aspect-square rounded-full bg-linear-to-br from-primary/20 via-accent/10 to-transparent blur-3xl absolute -z-10"
          />
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard 
              icon={<Mic className="text-primary" />}
              title="Voice Intelligence"
              desc="Real-time pedagogical feedback using AI."
              delay={0.1}
            />
            <FeatureCard 
              icon={<CloudOff className="text-accent" />}
              title="Offline First"
              desc="Offline-first architecture with on-device Whisper integration in progress."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Heart className="text-red-400" />}
              title="Growth Centric"
              desc="A safe space for teachers to learn & grow."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Globe className="text-blue-400" />}
              title="Multilingual"
              desc="Support for core classroom languages in this prototype." 
              delay={0.4}
            />
          </div>
        </div>
      </main>

      {/* Trust Section */}
      <section className="bg-white py-16 md:py-24 border-t border-primary-light mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-display font-medium mb-8 text-center">Trust & transparency</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-3xl border-primary-light p-5">
              <h3 className="font-bold text-sm">Prototype v1</h3>
              <p className="mt-2 text-sm text-ink/65">Built for a reliable hackathon demo path with clear fallback behavior.</p>
            </Card>
            <Card className="rounded-3xl border-primary-light p-5">
              <h3 className="font-bold text-sm">Offline Whisper integration in progress</h3>
              <p className="mt-2 text-sm text-ink/65">On-device Whisper runtime is actively integrated; browser fallback keeps sessions dependable.</p>
            </Card>
            <Card className="rounded-3xl border-primary-light p-5">
              <h3 className="font-bold text-sm">AI-generated coaching suggestions</h3>
              <p className="mt-2 text-sm text-ink/65">Coaching suggestions are generated from transcript signals with safe fallback when AI is unavailable.</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-8 bg-white rounded-3xl shadow-lg border border-primary-light hover:shadow-xl transition-all"
    >
      <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-ink/60 leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}

function nextLanguage(current: string) {
  const languages = ['en', 'hi', 'mr', 'te', 'kn', 'ta'] as const;
  const index = languages.indexOf(current as typeof languages[number]);
  return languages[(index + 1) % languages.length];
}
