import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { ArrowLeft, Brain, Share2, Download, Sparkles, TrendingUp, Users, CheckCircle2, AlertCircle, Clock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/state/app-state';
import { createCoachingGoal, fetchSessionBenchmarks } from '@/lib/mock-api';

export default function ReportPage() {
  const { id } = useParams();
  useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { getSessionById, isHydrating, preferences, regenerateCoaching } = useAppState();
  console.log('[ReportPage] mounted', { sessionId: id, navigationState: location.state });
  const sessionFromState = location.state && typeof location.state === 'object' && 'session' in location.state ? (location.state as any).session : undefined;
  const session = id ? getSessionById(id) ?? sessionFromState : undefined;
  if (sessionFromState && !getSessionById(id)) {
    console.log('[ReportPage] session found in navigation state', { sessionId: sessionFromState.id });
  }
  if (session) {
    console.log('[ReportPage] session found', { sessionId: session.id, fromState: session === sessionFromState });
  }
  const report = session?.report;
  console.log('[ReportPage] report loaded', { reportExists: Boolean(report), sessionId: id, sessionFound: Boolean(session) });
  const showFallbackBadge = Boolean(
    session?.transcriptionMeta?.fallbackUsed
      || session?.transcriptionMeta?.sources?.includes('browser-fallback')
      || session?.transcriptionMeta?.sources?.includes('mock-transcript')
      || session?.transcriptionMeta?.sources?.includes('whisper-failed')
  );
  const [benchmarks, setBenchmarks] = useState(session?.benchmarks ?? []);
  const [goalBusy, setGoalBusy] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedInclusion, setAnimatedInclusion] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRegenerate = async (lang: string) => {
    if (!session?.id) return;
    setIsAnalyzing(true);
    const toastId = toast.loading('AI Pedagogy Mentor is analyzing classroom transcript...');
    try {
      await regenerateCoaching(session.id, lang as any);
      toast.success('AI Coaching analysis complete!', { id: toastId });
    } catch (e: any) {
      toast.error('AI Coaching analysis failed. Falling back to basic heuristics.', { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (session?.id && report && report.aiCoaching && report.aiCoaching.language !== preferences.language && !isAnalyzing) {
      void handleRegenerate(preferences.language);
    }
  }, [preferences.language, session?.id]);

  useEffect(() => {
    if (!report) {
      return;
    }

    const scoreTarget = report.finalScore;
    const inclusionTarget = report.inclusionScore * 10;
    const scoreTimer = window.setInterval(() => {
      setAnimatedScore((current) => (current >= scoreTarget ? scoreTarget : current + 1));
    }, 25);
    const inclusionTimer = window.setInterval(() => {
      setAnimatedInclusion((current) => (current >= inclusionTarget ? inclusionTarget : current + 1));
    }, 25);

    return () => {
      window.clearInterval(scoreTimer);
      window.clearInterval(inclusionTimer);
    };
  }, [report]);

  useEffect(() => {
    if (!session?.id) {
      return;
    }

    if (session.benchmarks?.length) {
      setBenchmarks(session.benchmarks);
      return;
    }

    void fetchSessionBenchmarks(session.id).then(setBenchmarks).catch(() => setBenchmarks([]));
  }, [session?.id, session?.benchmarks]);

  const talkRatioData = useMemo(() => report?.participationTrend ?? [], [report]);
  const exportReport = () => {
    if (!session || !report) {
      return;
    }

    const blob = new Blob([JSON.stringify({ session, report }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${session.subject.replace(/\s+/g, '-').toLowerCase()}-report.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const shareReport = async () => {
    if (!session || !report) {
      return;
    }

    const shareText = `${session.subject} report: ${report.finalScore}/100 with inclusion score ${report.inclusionScore}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: session.subject, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied report summary');
      }
    } catch {
      toast.error('Could not share report right now.');
    }
  };

  const speakNote = (note: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(note);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const goalChips = [
    { label: 'Increase wait time', metric: 'wait_time' as const, targetValue: Math.min(8, (report?.waitTimeSeconds ?? 0) + 1) },
    { label: 'Lift student talk', metric: 'student_participation' as const, targetValue: Math.min(50, (report?.talkRatio.student ?? 0) + 6) },
    { label: 'Reduce teacher talk', metric: 'teacher_talk' as const, targetValue: Math.min(60, 100 - (report?.talkRatio.teacher ?? 0) + 5) },
  ];

  const handleCreateGoal = async (label: string, metric: 'teacher_questions' | 'wait_time' | 'student_participation' | 'teacher_talk' | 'quiet_students', targetValue: number) => {
    if (!session?.id) {
      return;
    }

    setGoalBusy(label);
    try {
      await createCoachingGoal({ label, metric, targetValue, sessionId: session.id });
      toast.success('Goal saved for tomorrow');
    } catch {
      toast.error('Could not save goal');
    } finally {
      setGoalBusy(null);
    }
  };

  if (isHydrating && !session) {
    return <LoadingState />;
  }

  if (!session || !report) {
    return (
      <div className="space-y-4 rounded-3xl border border-primary-light bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-display font-bold">Report not ready</h1>
        <p className="text-ink/60">This session is still syncing or the link is invalid.</p>
        <Button className="rounded-2xl" onClick={() => navigate('/dashboard')}>Return to dashboard</Button>
      </div>
    );
  }

  console.log('[ReportPage] report rendered', { sessionId: session.id, reportReady: Boolean(report), finalScore: report.finalScore });

  const scoreCards = [
    { title: 'Final Score', value: `${animatedScore}`, trend: `+${Math.max(1, animatedScore - 72)}`, icon: <TrendingUp className="text-primary" /> },
    { title: 'Inclusion', value: `${(animatedInclusion / 10).toFixed(1)}`, trend: '+0.2', icon: <Users className="text-accent" /> },
    { title: 'Wait Time', value: `${report.waitTimeSeconds.toFixed(1)}s`, trend: '-0.5s', icon: <Clock className="text-blue-400" /> },
    { title: 'AI Confidence', value: report.aiCoaching ? `${Math.round(report.aiCoaching.confidence * 100)}%` : report.aiConfidence, trend: '', icon: <Brain className="text-purple-400" /> },
  ];
  const aiMicroGoals = Array.isArray(report.aiCoaching?.micro_goals) ? report.aiCoaching.micro_goals : [];
  const aiStrengths = Array.isArray(report.aiCoaching?.strengths) ? report.aiCoaching.strengths : [];
  const aiImprovements = Array.isArray(report.aiCoaching?.improvements) ? report.aiCoaching.improvements : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Class Analysis</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-ink/60 font-medium">{session.subject} • {new Date(session.createdAt).toLocaleDateString()}</p>
              {showFallbackBadge ? (
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-amber-300 bg-amber-50 px-2 text-[10px] font-semibold text-amber-700"
                  title="Using browser/demo transcription fallback for reliability during prototype mode."
                >
                  Demo/Fallback Transcript
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 border-primary-light" onClick={shareReport}>
            <Share2 size={18} /> Share
          </Button>
          <Button className="rounded-2xl gap-2 bg-primary hover:bg-primary-dark" onClick={exportReport}>
            <Download size={18} /> Export JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map((card) => (
          <ScoreCard key={card.title} title={card.title} value={card.value} trend={card.trend} icon={card.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6 min-w-0">
          {benchmarks.length > 0 && (
            <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle>Peer Benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {benchmarks.map((benchmark) => (
                  <div key={benchmark.label} className="rounded-2xl bg-surface p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-ink/35">{benchmark.label}</div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="text-2xl font-display font-bold">{benchmark.value}</div>
                      <Badge className="rounded-full bg-white text-ink border-none">P{benchmark.percentile}</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink/55">{benchmark.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="highlights" className="w-full">
            <TabsList className="mb-5 w-full justify-start rounded-3xl border border-primary-light bg-white p-1">
              <TabsTrigger value="highlights" className="rounded-2xl px-4 py-3">Key Moments</TabsTrigger>
              <TabsTrigger value="transcript" className="rounded-2xl px-4 py-3">Transcript</TabsTrigger>
              <TabsTrigger value="visuals" className="rounded-2xl px-4 py-3">Deep Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="highlights" className="space-y-4">
              <div className="relative ml-4 space-y-6 border-l-2 border-primary-light pl-8">
                {report.timeline.map((item, index) => (
                  <motion.div
                    key={`${item.time}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className={`absolute -left-10.25 top-4 h-5 w-5 rounded-full border-4 border-surface shadow-sm ${item.type === 'Teacher' ? 'bg-primary' : item.type === 'Student' ? 'bg-accent' : 'bg-ink/30'}`} />
                    <div className="rounded-3xl border border-primary-light bg-white p-5 shadow-sm">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.22em] text-ink/30">{item.time} • {item.type}</span>
                        {item.score ? <Badge variant="secondary" className="rounded-full bg-primary-light text-primary border-none">Score: {item.score}</Badge> : null}
                      </div>
                      <p className="text-ink/80 leading-relaxed italic">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="rounded-3xl border border-primary-light bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {session.transcript.map((line) => (
                  <div key={line.id} className="rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed">
                    <span className={`mr-2 font-bold ${line.speaker === 'teacher' ? 'text-primary' : 'text-accent'}`}>{line.speaker}:</span>
                    {line.text}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="visuals" className="space-y-6">
              <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle>Talk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={talkRatioData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="label">
                        {talkRatioData.map((entry, index) => (
                          <Cell key={entry.label} fill={[ '#1FA97A', '#F0A126', '#DDEDEA' ][index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle>Weekly Growth Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.weeklyTrend}>
                      <defs>
                        <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1FA97A" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#1FA97A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D8" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#1FA97A" fill="url(#weeklyGradient)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle>Participation Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.participationTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D8" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[16, 16, 4, 4]} fill="#1FA97A" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 flex-wrap">
            <Brain className="text-primary animate-pulse" /> AI Coaching Suggestions
            <Badge variant="outline" className="rounded-full border-primary-light text-[10px]">AI-generated coaching suggestions</Badge>
          </h2>

          {isAnalyzing ? (
            <Card className="rounded-3xl border border-primary-light/60 bg-white p-8 shadow-sm flex flex-col justify-center items-center text-center min-h-90">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="mb-4"
              >
                <Brain size={48} className="text-purple-600 animate-pulse" />
              </motion.div>
              <h3 className="font-bold text-lg text-ink mb-1 animate-pulse">AI Pedagogy Mentor analyzing classroom...</h3>
              <p className="text-xs text-ink/65 max-w-70 leading-relaxed">
                Synthesizing actual voice transcripts, wait times, and dialogue metrics using Gemini 1.5 Flash.
              </p>
              
              <div className="flex gap-1.5 mt-6 h-6 items-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.0, delay: i * 0.15 }}
                    className="w-1 bg-purple-600 rounded-full h-full"
                  />
                ))}
              </div>
            </Card>
          ) : report.aiCoaching ? (
            <>
              {/* Dynamic Top AI Coaching Note Card */}
              <Card className="rounded-3xl border-none bg-linear-to-br from-purple-700 via-primary to-primary-dark text-white p-6 shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <Sparkles className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold mb-1 text-sm tracking-wide uppercase">Top coaching note</h3>
                    <p className="text-sm text-white/95 leading-relaxed font-medium">{report.aiCoaching.summary}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4 relative z-10">
                  {report.aiCoaching.isFallback ? (
                    <>
                      <Badge className="bg-amber-500/40 text-amber-100 border-none font-bold">⚠ Heuristic Coaching</Badge>
                      <Badge className="bg-amber-500/20 text-amber-200 border-none font-semibold">Fallback mode (AI unavailable)</Badge>
                    </>
                  ) : (
                    <>
                      <Badge className="bg-white/20 text-white border-none font-bold">✨ Gemini 1.5 Flash</Badge>
                      <Badge className="bg-emerald-500/30 text-emerald-200 border-none font-semibold">AI-generated analysis</Badge>
                    </>
                  )}
                  <Badge className="bg-white/10 text-white border-none text-[10px] uppercase font-bold">Language: {report.aiCoaching.language}</Badge>
                </div>

                <Button 
                  className="mt-6 w-full rounded-2xl bg-white text-primary hover:bg-surface border-none shadow-sm font-semibold" 
                  onClick={() => speakNote(report.aiCoaching.summary)}
                >
                  <PlayCircle size={18} className="mr-2" /> Play voice note
                </Button>
              </Card>

              {/* Dynamic Action Goals */}
              <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-ink/75">AI Recommended Micro-Goals</CardTitle>
                  <Badge variant="outline" className="border-primary-light text-ink/50 text-[10px]">Add to next class</Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {aiMicroGoals.length === 0 ? (
                    <p className="rounded-2xl bg-surface px-4 py-3 text-xs text-ink/60">No micro-goals returned. Use regenerate to retry AI suggestions.</p>
                  ) : aiMicroGoals.map((goal: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="rounded-2xl border-primary-light/80 text-left justify-start h-auto whitespace-normal py-3 px-4 text-xs leading-relaxed text-ink hover:bg-surface/30 hover:border-primary"
                      disabled={goalBusy === goal}
                      onClick={() => handleCreateGoal(goal, 'wait_time', 5.0)}
                    >
                      🎯 {goalBusy === goal ? 'Saving…' : goal}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Strengths and improvements */}
              <div className="space-y-4">
                {aiStrengths.length > 0 ? <h3 className="font-bold text-xs text-ink/40 uppercase tracking-wider pl-1">Strengths & Positives</h3> : null}
                {aiStrengths.map((str: string, idx: number) => (
                  <div
                    key={`strength-${idx}`}
                    className="w-full rounded-3xl border border-emerald-200 bg-emerald-50/20 p-5 text-left shadow-sm flex gap-3.5 transition-all hover:shadow-md"
                  >
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950 tracking-wider uppercase mb-1">Strong Practice</h4>
                      <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">{str}</p>
                    </div>
                  </div>
                ))}

                {aiImprovements.length > 0 ? <h3 className="font-bold text-xs text-ink/40 uppercase tracking-wider pl-1 mt-6">Next Class Improvements</h3> : null}
                {aiImprovements.map((imp: string, idx: number) => (
                  <div
                    key={`imp-${idx}`}
                    className="w-full rounded-3xl border border-amber-200 bg-amber-50/20 p-5 text-left shadow-sm flex gap-3.5 transition-all hover:shadow-md"
                  >
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-amber-950 tracking-wider uppercase mb-1">Opportunity</h4>
                      <p className="text-xs text-amber-900/80 leading-relaxed font-medium">{imp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="w-full h-12 rounded-2xl bg-white border border-primary-light text-primary font-bold shadow-sm hover:bg-surface/50" 
                  onClick={() => handleRegenerate(preferences.language)}
                  disabled={isAnalyzing}
                >
                  🔄 Regenerate AI suggestions
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Fallback Legacy card with prompt to run Gemini analysis */}
              <div className="rounded-3xl border border-dashed border-primary bg-surface/30 p-6 text-center space-y-3 shadow-inner">
                <Brain className="mx-auto text-primary animate-pulse" size={32} />
                <h3 className="font-bold text-sm text-ink">LLM Pedagogy Coaching Available</h3>
                <p className="text-xs text-ink/65 max-w-65 mx-auto leading-relaxed">
                  Generate highly-personalized, transcript-aware constructive recommendations using Gemini 1.5 Flash.
                </p>
                <Button className="rounded-2xl w-full" onClick={() => handleRegenerate(preferences.language)}>
                  ✨ Generate AI Coaching
                </Button>
              </div>

              <Card className="rounded-3xl border-none bg-primary text-white p-6 shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="flex items-start gap-4 mb-4">
                  <Sparkles />
                  <div>
                    <h3 className="font-bold mb-1">Top coaching note</h3>
                    <p className="text-sm text-white/80 italic leading-relaxed">{report.coachingTips[0]?.detail}</p>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-none">High Impact Tip</Badge>
                <Button className="mt-4 w-full rounded-2xl bg-white text-primary hover:bg-surface" onClick={() => speakNote(report.coachingTips[0]?.voiceNote ?? 'Keep using open-ended questions to expand student talk.') }>
                  <PlayCircle size={18} className="mr-2" /> Play voice note
                </Button>
              </Card>

              <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle>Quick goals</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {goalChips.map((goal) => (
                    <Button
                      key={goal.label}
                      variant="outline"
                      className="rounded-full border-primary-light"
                      disabled={goalBusy === goal.label}
                      onClick={() => handleCreateGoal(goal.label, goal.metric, goal.targetValue)}
                    >
                      {goalBusy === goal.label ? 'Saving…' : goal.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, value, trend, icon }: { title: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border-primary-light bg-white shadow-sm overflow-hidden">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-xs font-bold text-ink/40 uppercase tracking-wider">{title}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold">{value}</span>
            <span className="text-[10px] font-bold text-primary">{trend}</span>
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 rounded-3xl border border-primary-light bg-white p-6 shadow-sm">
      <div className="h-6 w-48 animate-pulse rounded-full bg-surface" />
      <div className="h-4 w-72 animate-pulse rounded-full bg-surface" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-3xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
