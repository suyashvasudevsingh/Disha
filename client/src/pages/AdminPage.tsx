import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/state/app-state';
import { Building2, School, Users, GraduationCap, Download, Filter, Search, TrendingUp, Activity, ShieldCheck } from 'lucide-react';

export default function AdminPage() {
  const { sessions, preferences, setAdminFilter } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const searched = sessions.filter((session) => {
      const searchable = `${session.subject} ${session.className} ${session.schoolName} ${session.teacherName}`.toLowerCase();
      return searchable.includes(searchLower);
    });

    return searched.filter((session) => {
      const score = session.report?.finalScore ?? 0;
      switch (preferences.adminFilter) {
        case 'excellent':
          return score >= 80;
        case 'growing':
          return score >= 68 && score < 80;
        case 'at-risk':
          return score < 68;
        default:
          return true;
      }
    });
  }, [preferences.adminFilter, searchTerm, sessions]);

  const schoolRows = useMemo(() => {
    const map = new Map<string, { school: string; inclusion: number; participation: number; growth: number; sessions: number }>();
    filteredSessions.forEach((session) => {
      const existing = map.get(session.schoolName) ?? { school: session.schoolName, inclusion: 0, participation: 0, growth: 0, sessions: 0 };
      existing.inclusion += session.report?.inclusionScore ?? 0;
      existing.participation += session.report?.talkRatio.student ?? 0;
      existing.growth += session.report?.finalScore ?? 0;
      existing.sessions += 1;
      map.set(session.schoolName, existing);
    });

    return Array.from(map.values()).map((row) => ({
      ...row,
      inclusion: Number((row.inclusion / Math.max(1, row.sessions)).toFixed(1)),
      participation: Math.round(row.participation / Math.max(1, row.sessions)),
      growth: Math.round(row.growth / Math.max(1, row.sessions)),
    }));
  }, [filteredSessions]);

  const totalSchools = new Set(filteredSessions.map((session) => session.schoolName)).size;
  const activeTeachers = new Set(filteredSessions.map((session) => session.teacherName)).size;
  const sessionsToday = filteredSessions.filter((session) => new Date(session.createdAt).toDateString() === new Date().toDateString()).length;
  const avgInclusion = filteredSessions.length > 0
    ? (filteredSessions.reduce((sum, session) => sum + (session.report?.inclusionScore ?? 0), 0) / filteredSessions.length).toFixed(1)
    : '0.0';

  const growthTrend = schoolRows.slice(0, 6).map((row) => ({
    school: row.school.split(' ')[0],
    inclusion: row.inclusion,
    growth: row.growth,
  }));

  const exportCsv = () => {
    const header = ['school,teacher,class,score,inclusion,status'];
    const rows = filteredSessions.map((session) => [
      session.schoolName,
      session.teacherName,
      session.className,
      session.report?.finalScore ?? '',
      session.report?.inclusionScore ?? '',
      session.status,
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([header.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cluster-analytics.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const generatePdPlan = () => {
    const topNeedsSupport = schoolRows
      .slice()
      .sort((a, b) => a.growth - b.growth)
      .slice(0, 3);

    const lines = [
      '# Disha — Cluster PD Plan (Prototype Export)',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      `Schools in view: ${totalSchools}`,
      `Sessions in view: ${filteredSessions.length}`,
      '',
      '## Priority focus schools',
      ...topNeedsSupport.map((row, idx) => `${idx + 1}. ${row.school} — Growth ${row.growth}, Inclusion ${row.inclusion}, Participation ${row.participation}%`),
      '',
      '## Suggested 45-minute PD agenda',
      '- 10m: Warm-up: “Wait-time” micro-skill + exemplar video snippet',
      '- 15m: Practice: open-ended questioning stems (pair rehearsal)',
      '- 10m: Inclusion routine: equity sticks + cold-call opt-in',
      '- 10m: Commitment: 1 micro-goal per teacher for next class',
      '',
      '## Notes',
      '- This export is generated from prototype session analytics (not official evaluation).',
      '- Use the “Report” screens for transcript-specific evidence during coaching.',
      '',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cluster-pd-plan.md';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('PD plan exported');
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Cluster Analytics</h1>
          <p className="text-ink/60 font-medium tracking-tight">Satara Cluster No. 4 • {totalSchools} active schools in view</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full font-bold">
            <ShieldCheck size={14} className="mr-1" /> Ethical Data Policy Active
          </Badge>
          <Button variant="outline" className="rounded-2xl border-primary-light" onClick={exportCsv}>
            <Download size={18} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AdminStat icon={<School />} label="Total Schools" value={String(totalSchools)} color="bg-primary" />
        <AdminStat icon={<Users />} label="Active Teachers" value={String(activeTeachers)} color="bg-accent" />
        <AdminStat icon={<Activity />} label="Sessions Today" value={String(sessionsToday)} color="bg-blue-500" />
        <AdminStat icon={<TrendingUp />} label="Avg. Inclusion" value={avgInclusion} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="rounded-3xl border-primary-light overflow-hidden bg-white shadow-sm">
          <CardHeader className="border-b border-surface p-5 sm:p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="font-display font-bold text-lg">School-wise Pedagogy Metrics</CardTitle>
                <p className="text-sm text-ink/50">Live cluster view filtered by search and score buckets.</p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" size={16} />
                <Input placeholder="Search school or teacher..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-10 rounded-xl border-primary-light h-10" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'excellent', label: 'Excellent' },
                { key: 'growing', label: 'Growing' },
                { key: 'at-risk', label: 'At Risk' },
              ].map((option) => (
                <Button
                  key={option.key}
                  variant={preferences.adminFilter === option.key ? 'default' : 'ghost'}
                  className="rounded-2xl"
                  onClick={() => setAdminFilter(option.key as typeof preferences.adminFilter)}
                >
                  <Filter size={14} className="mr-2" /> {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface text-ink/40 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">School</th>
                    <th className="px-6 py-4">Inclusion</th>
                    <th className="px-6 py-4">Growth Score</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface">
                  {schoolRows.length > 0 ? schoolRows.map((row) => (
                    <tr key={row.school} className="hover:bg-primary-light/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-ink/80">{row.school}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{row.inclusion}</span>
                          <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, row.inclusion * 10)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-display font-bold text-primary">{row.growth}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${row.growth >= 80 ? 'bg-primary/10 text-primary' : row.growth >= 68 ? 'bg-accent/10 text-accent' : 'bg-red-50 text-red-600'} border-none`}>
                          {row.growth >= 80 ? 'Excellent' : row.growth >= 68 ? 'Growing' : 'Needs support'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="font-bold text-primary"
                          onClick={() => {
                            toast.message(`${row.school}: Growth ${row.growth}, Inclusion ${row.inclusion}, Participation ${row.participation}%`);
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-6 py-10 text-center text-ink/40" colSpan={5}>No schools match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-primary-light p-6 bg-white shadow-sm">
            <h3 className="font-display font-bold text-lg mb-4">Cluster Inclusion Trend</h3>
            <div className="h-55">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthTrend}>
                  <defs>
                    <linearGradient id="clusterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1FA97A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1FA97A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D8" />
                  <XAxis dataKey="school" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="inclusion" stroke="#1FA97A" fill="url(#clusterGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-3xl border-none bg-primary text-white p-6 shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <GraduationCap size={24} />
              <div>
                <h4 className="font-bold">Training Advice</h4>
                <p className="text-sm text-white/80 italic mt-1 leading-relaxed">{growthTrend[0] ? `Focus school ${growthTrend[0].school} on open-ended questioning and shared student talk.` : 'Run a student-led logic workshop for the lowest scoring schools.'}</p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full bg-white text-primary rounded-xl font-bold mt-2"
              onClick={generatePdPlan}
            >
              Generate PD Plan
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="rounded-3xl border-primary-light p-5 flex items-center gap-4 hover:shadow-md transition-shadow bg-white">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    </Card>
  );
}
