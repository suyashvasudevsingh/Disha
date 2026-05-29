import React, { cloneElement } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, Calendar, FileText, Download, 
  MapPin, Star, Shield, Clock, 
  ChevronRight, Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/state/app-state';

export default function PortfolioPage() {
  const { t } = useTranslation();
  const { sessions } = useAppState();
  const sessionCount = sessions.length;
  const latestSession = sessions[0];
  const averageScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, session) => sum + (session.report?.finalScore ?? 0), 0) / sessions.length)
    : 0;

  const exportPortfolio = () => {
    const blob = new Blob([JSON.stringify({ sessions, averageScore }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'disha-portfolio.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Identity Card */}
      <Card className="rounded-[40px] border-none bg-primary-dark text-white p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full -mr-32 -mt-32 opacity-20" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full -ml-32 -mb-32 opacity-10" />
         
         <div className="relative w-48 h-48 rounded-[40px] border-4 border-white/20 overflow-hidden shadow-2xl">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali" alt="Avatar" className="w-full h-full object-cover" />
         </div>

         <div className="relative space-y-6 text-center md:text-left">
           <div>
             <h1 className="text-4xl md:text-5xl font-display font-bold">Anjali Kulkarni</h1>
             <p className="text-white/60 font-medium flex items-center justify-center md:justify-start gap-2 mt-2">
              <MapPin size={18} /> Senior Teacher • Satara Cluster No. 4
             </p>
           </div>
           
           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">Certified Coach</Badge>
              <Badge className="bg-accent text-primary-dark border-none px-4 py-1.5 rounded-full">Average Score {averageScore}</Badge>
              <Badge className="bg-primary text-white border-none px-4 py-1.5 rounded-full">{sessionCount} Sessions</Badge>
           </div>

           <div className="flex items-center justify-center md:justify-start gap-4">
              <Button className="bg-white text-primary-dark hover:bg-surface rounded-2xl h-12 px-8 font-bold" onClick={exportPortfolio}>
                 Export PDF Portfolio
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-2xl h-12 w-12 p-0">
                 <Bookmark />
              </Button>
           </div>
         </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Statistics */}
        <Card className="rounded-3xl border-primary-light lg:col-span-1 p-6">
           <h2 className="text-2xl font-display font-bold mb-6">Pedagogy Impact</h2>
           <div className="space-y-6">
              <StatItem label="Questions Asked" value={String(sessionCount * 24)} progress={Math.min(100, 45 + sessionCount * 5)} color="bg-primary" />
              <StatItem label="Wait-Time Mastery" value={`${latestSession?.report?.waitTimeSeconds?.toFixed(1) ?? '4.5'}s Avg`} progress={Math.min(100, (latestSession?.report?.waitTimeSeconds ?? 4.5) * 10)} color="bg-accent" />
              <StatItem label="Inclusion Improvement" value={`+${Math.max(0, Math.round((latestSession?.report?.inclusionScore ?? 7.4) * 4))}%`} progress={Math.min(100, (latestSession?.report?.inclusionScore ?? 7.4) * 10)} color="bg-blue-400" />
              <StatItem label="Student Voice Ratio" value={`${latestSession?.report?.talkRatio.student ?? 42}%`} progress={latestSession?.report?.talkRatio.student ?? 60} color="bg-purple-400" />
           </div>
        </Card>

        {/* Certifications & Badges */}
        <Card className="rounded-3xl border-primary-light lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-display font-bold">Badges & Achievements</h2>
             <Button variant="ghost" className="text-primary font-bold">View All</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <BadgeBox icon={<Award className="text-accent" />} title="Inclusion Hero" date="May 2026" />
             <BadgeBox icon={<Star className="text-primary" />} title="Wait-Time Expert" date="Apr 2026" />
             <BadgeBox icon={<Shield className="text-blue-400" />} title="Safety Guide" date="Mar 2026" />
             <BadgeBox icon={<Clock className="text-orange-400" />} title="Consistent Growth" date="Feb 2026" />
             <BadgeBox icon={<FileText className="text-purple-400" />} title="100 Sessions" date="Jan 2026" />
             <div className="rounded-3xl border border-dashed border-primary-light flex flex-col items-center justify-center p-6 text-ink/20 aspect-square">
                <Star size={32} strokeWidth={1} />
                <span className="text-[10px] font-bold mt-2 text-center uppercase tracking-widest">Next: Master Mentor</span>
             </div>
          </div>
        </Card>
      </div>

      {/* Growth Timeline */}
      <div className="space-y-6">
         <h2 className="text-2xl font-display font-bold">Growth Timeline</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['May', 'Apr', 'Mar', 'Feb'].map((month, index) => {
          const score = latestSession?.report?.weeklyTrend?.[index]?.score ?? [84, 72, 68, 60][index];
          return <TimelineMonth key={month} month={month} score={score} status={score > 80 ? 'Rising' : score > 70 ? 'Stable' : 'Growing'} color={index === 0 ? 'bg-primary' : index === 1 ? 'bg-accent' : index === 2 ? 'bg-blue-400' : 'bg-ink'} />;
        })}
         </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, progress, color }: { label: string, value: string, progress: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-ink/40 uppercase">{label}</span>
        <span className="text-lg font-display font-bold">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}

function BadgeBox({ icon, title, date }: { icon: React.ReactNode, title: string, date: string }) {
  return (
    <div className="bg-surface rounded-3xl p-6 flex flex-col items-center text-center space-y-3 hover:bg-white border border-transparent hover:border-primary-light transition-all cursor-default">
       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          {cloneElement(icon as React.ReactElement, { size: 32 })}
       </div>
       <div>
         <h4 className="font-bold text-xs tracking-tight">{title}</h4>
         <p className="text-[10px] text-ink/40 font-bold uppercase mt-1">{date}</p>
       </div>
    </div>
  );
}

function TimelineMonth({ month, score, status, color }: { month: string, score: number, status: string, color: string }) {
  return (
    <Card className="rounded-3xl border-primary-light p-6 hover:shadow-lg transition-all cursor-pointer group">
       <div className="flex justify-between items-start mb-6">
          <span className="text-xl font-display font-bold">{month}</span>
          <div className={`w-2 h-2 rounded-full ${color}`} />
       </div>
       <div className="space-y-1">
          <p className="text-4xl font-display font-bold group-hover:text-primary transition-colors">{score}</p>
          <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{status}</p>
       </div>
    </Card>
  );
}
