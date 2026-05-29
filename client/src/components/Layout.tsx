import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Mic, User, Globe, WifiOff, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/state/app-state';
import { useAuthStore } from '@/state/auth';
import { supportedLanguageLabels } from '@/lib/i18n-languages';

export const Layout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { cycleLanguage, preferences, syncStatus, queueCount, toggleHighContrast } = useAppState();
  const signOutUser = useAuthStore((state) => state.signOutUser);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const toggleLanguage = () => {
    cycleLanguage();
    const currentIndex = Object.keys(supportedLanguageLabels).indexOf(i18n.language);
    const languageCodes = Object.keys(supportedLanguageLabels) as Array<keyof typeof supportedLanguageLabels>;
    const nextCode = languageCodes[(currentIndex + 1) % languageCodes.length] ?? 'en';
    void i18n.changeLanguage(nextCode);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/record', icon: Mic, label: t('record') },
    { path: '/portfolio', icon: User, label: t('portfolio') },
  ];

  return (
    <div className={`min-h-screen bg-surface flex flex-col md:flex-row pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 ${preferences.highContrast ? 'contrast-125' : ''}`}>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-primary-light p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Mic className="text-white w-5 h-5" />
          </div>
          <h1 className="text-2xl font-display font-bold text-primary-dark">Disha</h1>
        </div>

        <div className="mb-6 space-y-2 px-1">
          <Badge variant="outline" className="w-fit rounded-full border-primary-light text-[10px]">Prototype v1</Badge>
          <Badge variant="secondary" className="w-fit rounded-full text-[10px]">Offline Whisper integration in progress</Badge>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-ink/60 hover:bg-primary-light hover:text-primary'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-primary-light space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2 text-xs font-semibold text-ink/60">
            <span className="inline-flex items-center gap-2"><WifiOff size={14} /> {syncStatus === 'offline' ? 'Offline' : 'Sync ready'}</span>
            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">{queueCount} queued</Badge>
          </div>
          <Button
            variant="ghost"
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between gap-3 rounded-2xl text-ink/60"
            aria-label="Switch language"
          >
            <span className="flex items-center gap-3"><Globe size={20} /><span className="font-medium">{supportedLanguageLabels[i18n.language as keyof typeof supportedLanguageLabels] ?? 'Language'}</span></span>
            <Settings2 size={16} />
          </Button>
          <Button variant="outline" onClick={toggleHighContrast} className="w-full rounded-2xl border-primary-light text-ink/60">
            High contrast
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await signOutUser();
              navigate('/', { replace: true });
            }}
            className="w-full rounded-2xl text-ink/60"
          >
            Sign out{user?.phoneNumber ? ` · ${user.phoneNumber}` : ''}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-5 md:p-8 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary-light bg-white/90 backdrop-blur-xl px-3 pt-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-end justify-between gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `min-w-0 flex-1 rounded-2xl px-2 py-2 transition-all ${
                  isActive ? 'bg-primary text-white' : 'text-ink/50'
                }`
              }
              aria-label={item.label}
            >
              <div className="flex flex-col items-center gap-1 text-[10px] font-semibold">
                <item.icon size={22} />
                <span className="leading-none truncate">{item.label}</span>
              </div>
            </NavLink>
          ))}
          <button
            onClick={toggleLanguage}
            className="min-w-0 flex-1 rounded-2xl bg-primary-light/50 px-2 py-2 text-ink/50"
            aria-label="Switch language"
          >
            <div className="flex flex-col items-center gap-1 text-[10px] font-semibold">
              <Globe size={22} />
              <span className="leading-none truncate">{supportedLanguageLabels[i18n.language as keyof typeof supportedLanguageLabels] ?? 'Lang'}</span>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};
