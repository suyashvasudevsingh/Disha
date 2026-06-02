import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppState } from '@/state/app-state';
import { Clock, ChevronRight, Mic, Brain, TrendingUp, Users, Sparkles, WifiOff, ArrowUpRight, PlayCircle } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    sessions,
    preferences,
    setDashboardRange,
    getDashboardTrend,
    getParticipation,
    syncStatus,
    queueCount,
  } = useAppState();

  const sortedSessions = useMemo(
    () => [...sessions].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [sessions],
  );

  const trendData = useMemo(() => getDashboardTrend(), [getDashboardTrend, sessions]);
  const participation = useMemo(() => getParticipation(), [getParticipation, sessions]);
  const latest = sortedSessions[0];
  const latestReport = latest?.report;

  const averageScore = useMemo(() => {
    if (sessions.length === 0) {
      return 0;
    }

    const total = sessions.reduce((sum, session) => sum + (session.report?.finalScore ?? 0), 0);
    return Math.round(total / sessions.length);
  }, [sessions]);

  const inclusionScore = latestReport?.inclusionScore;
  const activeSessions = sessions.filter((session) => session.status === 'completed').length;
  const rangeLabel = preferences.dashboardRange === 'week' ? t('dashboard_last_7_days') : t('dashboard_this_month');

  const speakTip = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary-light text-primary border-none px-3 py-1">{t('welcome')}</Badge>
            {(syncStatus === 'offline' || queueCount > 0) && (
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <WifiOff size={14} className="mr-1" /> {queueCount} {t('queued')} {t('offline_mode')}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-ink">{t('dashboard_title')}</h1>
          <p className="text-ink/60 max-w-2xl">{t('dashboard_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-primary-light bg-white p-2 shadow-sm">
          <Button
            variant={preferences.dashboardRange === 'week' ? 'default' : 'ghost'}
            className="rounded-2xl px-4"
            onClick={() => setDashboardRange('week')}
          >
            {t('dashboard_range_week')}
          </Button>
          <Button
            variant={preferences.dashboardRange === 'month' ? 'default' : 'ghost'}
            className="rounded-2xl px-4"
            onClick={() => setDashboardRange('month')}
          >
            {t('dashboard_range_month')}
          </Button>
          <div className="px-3 py-2 text-xs font-semibold text-ink/50">{rangeLabel}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-none bg-primary text-white shadow-2xl shadow-primary/15 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 font-medium text-sm flex items-center gap-2 uppercase tracking-[0.22em]">
              <Sparkles size={16} /> {t('growth_score')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-6xl font-display font-bold">{latestReport?.finalScore ?? averageScore}</span>
              <Badge variant="secondary" className="bg-white/15 text-white border-none mb-2 rounded-full">Session-based</Badge>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="#ffffff" fill="url(#growthGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary-light bg-white shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
                <Users size={24} />
              </div>
              <Badge variant="outline" className="rounded-full border-primary/20 text-primary">{t('dashboard_inclusion_badge')}</Badge>
            </div>
            <div>
              <h3 className="text-ink/60 font-medium mb-1">{t('inclusion_score')}</h3>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-display font-bold">{typeof inclusionScore === 'number' ? inclusionScore.toFixed(1) : '--'}</span>
                <div className="flex-1 space-y-1">
                  <Progress value={Math.round((inclusionScore ?? 0) * 10)} className="h-2 bg-primary-light" />
                </div>
              </div>
            </div>
            <p className="text-sm text-ink/50">{latestReport?.summary ?? t('dashboard_coaching_placeholder')}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-primary-light bg-white shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-accent">
                <TrendingUp size={24} />
              </div>
              <Badge variant="secondary" className="rounded-full">{activeSessions} {t('dashboard_completed_sessions')}</Badge>
            </div>
            <div>
              <h3 className="text-ink/60 font-medium mb-1">{t('dashboard_participation')}</h3>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-display font-bold">{latestReport ? `${latestReport.talkRatio.student}%` : '--'}</span>
                <p className="text-xs text-ink/40">{t('dashboard_participation_note')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-ink/50">
              {participation.map((item) => (
                <div key={item.name} className="rounded-2xl bg-surface px-3 py-2">
                  <div className="mb-2 h-1.5 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                  <div className="font-semibold">{item.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-display font-bold">{t('recent_sessions')}</h2>
            <Button variant="ghost" className="text-primary font-bold" onClick={() => navigate('/portfolio')}>{t('dashboard_view_history')}</Button>
          </div>

          <div className="space-y-4">
            {sortedSessions.slice(0, 4).map((session) => (
              <motion.button
                key={session.id}
                type="button"
                whileHover={{ x: 4 }}
                onClick={() => navigate(`/report/${session.id}`)}
                className="group w-full cursor-pointer rounded-[28px] border border-primary-light bg-white p-4 sm:p-5 shadow-sm text-left transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary group-hover:bg-primary-light transition-colors">
                      <Mic className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-lg">{session.subject}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-ink/40 font-medium">
                        <span className="inline-flex items-center gap-1"><Clock size={14} /> {formatDuration(session.durationSeconds)}</span>
                        <span>•</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <Badge variant="outline" className="rounded-full border-primary-light text-ink/50">{session.status}</Badge>
                        <Badge className="rounded-full border-none bg-primary-light text-primary">Private to you</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-ink/30 uppercase tracking-tighter">Score</p>
                      <p className="text-lg font-display font-bold text-primary">{session.report?.finalScore ?? '--'}</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
            {sortedSessions.length === 0 && (
              <Card className="rounded-[28px] border-primary-light bg-white p-5 shadow-sm">
                <p className="text-sm text-ink/65">{t('dashboard_no_sessions')}</p>
                <Button className="mt-3 rounded-2xl" onClick={() => navigate('/record')}>{t('dashboard_start_recording_btn')}</Button>
              </Card>
            )}
          </div>

          <Card className="rounded-[28px] border-primary-light bg-white shadow-sm overflow-hidden">
            <CardHeader className="flex items-center justify-between gap-3 border-b border-primary-light/70 px-5 py-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2"><ArrowUpRight size={18} className="text-primary" /> {t('dashboard_trend_heading')}</CardTitle>
              <Badge variant="secondary" className="rounded-full">{syncStatus === 'offline' ? t('dashboard_offline_snapshot') : t('dashboard_live_snapshot')}</Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-65 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D8" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[16, 16, 4, 4]} fill="#1FA97A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Brain className="text-primary" />
            <h2 className="text-2xl font-display font-bold leading-none">{t('coaching')}</h2>
            <Badge variant="outline" className="rounded-full border-primary-light text-[10px]">{t('coaching_suggestions')}</Badge>
          </div>

          <Card className="rounded-[28px] border-none bg-white p-6 shadow-xl shadow-ink/5 border border-primary-light relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-accent/10 p-2 rounded-xl">
                <Sparkles className="text-accent" size={20} />
              </div>
              <p className="font-medium text-sm text-ink/80 leading-relaxed italic">
                {latestReport?.coachingTips[0]?.detail ?? t('dashboard_coaching_placeholder_2')}
              </p>
            </div>
            <Button variant="outline" className="w-full rounded-2xl border-primary-light text-primary py-6 font-bold shadow-sm" onClick={() => speakTip(latestReport?.coachingTips[0]?.voiceNote ?? t('default_coaching_note')) }>
              <PlayCircle size={18} className="mr-2" /> {t('dashboard_play_coaching_note')}
            </Button>
          </Card>

          <div className="space-y-4">
            {latestReport?.coachingTips.slice(0, 3).map((tip) => (
              <button
                key={tip.id}
                type="button"
                onClick={() => speakTip(tip.voiceNote)}
                className="w-full rounded-2xl border border-primary-light bg-white p-5 text-left hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-primary" />
                  <h4 className="font-bold text-sm tracking-tight">{tip.title}</h4>
                </div>
                <p className="mt-2 text-xs text-ink/60 leading-relaxed">{tip.action}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

          <Card className="rounded-[28px] border-primary-light bg-white shadow-sm overflow-hidden xl:hidden">
        <CardContent className="p-5">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={participation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={5}>
                  {participation.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color || ['#1FA97A', '#F0A126', '#DDEDEA'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}