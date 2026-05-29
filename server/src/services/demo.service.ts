import { getDb } from '../db';
import { buildReport, type SupportedLanguage, type TranscriptLine } from './report.service';

export type DemoSession = {
  id: string;
  title: string;
  teacherName: string;
  schoolName: string;
  language: SupportedLanguage;
  transcript: TranscriptLine[];
  report: ReturnType<typeof buildReport>;
};

export function listDemoSessions(): DemoSession[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM demo_sessions ORDER BY created_at ASC').all() as Array<Record<string, string>>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    teacherName: row.teacher_name,
    schoolName: row.school_name,
    language: row.language as SupportedLanguage,
    transcript: JSON.parse(row.transcript_json) as TranscriptLine[],
    report: JSON.parse(row.report_json),
  }));
}

export function getDemoTeacherProfile() {
  return {
    id: 'demo-teacher',
    name: 'Teacher Anjali',
    phone: '0000000000',
    role: 'teacher',
    isDemo: true,
  };
}
