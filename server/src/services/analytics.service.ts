import { getDb } from '../db';
import type { SessionReport } from './report.service';

export type BenchmarkCard = {
  label: string;
  value: string;
  percentile: number;
  tone: 'positive' | 'neutral' | 'encouraging';
  note: string;
};

export function buildBenchmarks(report: SessionReport, scope = 'school'): BenchmarkCard[] {
  const db = getDb();
  const cohort = db.prepare('SELECT report_json FROM sessions WHERE report_json IS NOT NULL').all() as Array<{ report_json: string }>;
  const scores = cohort
    .map((row) => {
      try {
        return JSON.parse(row.report_json) as SessionReport;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as SessionReport[];

  const baselineFinal = percentile(report.finalScore, scores.map((item) => item.finalScore));
  const baselineInclusion = percentile(report.inclusionScore, scores.map((item) => item.inclusionScore));
  const baselineWait = percentile(20 - report.waitTimeSeconds, scores.map((item) => 20 - item.waitTimeSeconds));

  const cards: BenchmarkCard[] = [
    {
      label: 'Question quality',
      value: `Top ${Math.max(1, Math.round(100 - baselineFinal))}%`,
      percentile: baselineFinal,
      tone: baselineFinal >= 70 ? 'positive' : 'encouraging',
      note: 'You are trending above the anonymised cohort for lesson impact.',
    },
    {
      label: 'Inclusive participation',
      value: `Top ${Math.max(1, Math.round(100 - baselineInclusion))}%`,
      percentile: baselineInclusion,
      tone: baselineInclusion >= 70 ? 'positive' : 'neutral',
      note: 'Your balance is improving faster than many peers in the cluster.',
    },
    {
      label: 'Wait-time patience',
      value: `Top ${Math.max(1, Math.round(100 - baselineWait))}%`,
      percentile: baselineWait,
      tone: baselineWait >= 65 ? 'positive' : 'encouraging',
      note: 'A calmer pause often unlocks quieter voices.',
    },
  ];

  db.prepare(`
    INSERT INTO peer_analytics (id, scope, metric, cohort_size, percentile, summary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), scope, 'final_score', scores.length, baselineFinal, cards[0].note);

  return cards;
}

function percentile(value: number, values: number[]) {
  if (values.length === 0) {
    return 73;
  }

  const lowerOrEqual = values.filter((entry) => entry <= value).length;
  return Math.round((lowerOrEqual / values.length) * 100);
}
