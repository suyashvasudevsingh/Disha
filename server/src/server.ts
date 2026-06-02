import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getDb } from './db';
import { buildReport } from './services/report.service';
import { buildBenchmarks } from './services/analytics.service';
import { createGoal, evaluateGoal, listGoalProgress, listGoals, type GoalMetric } from './services/goals.service';
import { getDemoTeacherProfile, listDemoSessions } from './services/demo.service';
import { getOrGenerateCoaching } from './services/coaching-engine';

dotenv.config();

const db = getDb();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

  app.get('/api/demo/profile', (_req, res) => {
    res.json(getDemoTeacherProfile());
  });

  app.get('/api/demo/sessions', (_req, res) => {
    res.json(listDemoSessions());
  });

  app.get('/api/consent', (_req, res) => {
    const row = db.prepare('SELECT * FROM consent_preferences WHERE user_id = ?').get('teacher_001') as Record<string, unknown> | undefined;
    res.json({
      consentGiven: Boolean(row?.consent_given),
      consentText: String(row?.consent_text ?? 'Recording stays on your phone.'),
      language: String(row?.language ?? 'en'),
    });
  });

  app.post('/api/consent', (req, res) => {
    const { consentGiven, consentText, language, userId = 'teacher_001' } = req.body ?? {};
    db.prepare(`
      INSERT INTO consent_preferences (user_id, consent_given, consent_text, language, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        consent_given = excluded.consent_given,
        consent_text = excluded.consent_text,
        language = excluded.language,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, consentGiven ? 1 : 0, consentText ?? 'Recording stays on your phone.', language ?? 'en');
    res.json({ ok: true });
  });

  // Sessions API
  app.get("/api/sessions", (req, res) => {
    const rows = db.prepare("SELECT * FROM sessions ORDER BY date DESC").all();
    const sessions = rows.map((row: any) => {
      const report = row.report_json ? JSON.parse(row.report_json) : undefined;
      // Inject DB AI coaching if available
      if (report && row.ai_summary) {
        report.aiCoaching = {
          summary: row.ai_summary,
          strengths: row.ai_strengths ? JSON.parse(row.ai_strengths) : [],
          improvements: row.ai_improvements ? JSON.parse(row.ai_improvements) : [],
          micro_goals: row.ai_micro_goals ? JSON.parse(row.ai_micro_goals) : [],
          confidence: row.ai_confidence,
          language: row.ai_language,
          timestamp: row.ai_timestamp,
          isFallback: row.ai_confidence === 0.50,
        };
      }
      return {
        ...row,
        report,
        benchmarks: row.benchmark_json ? JSON.parse(row.benchmark_json) : undefined,
        goals: row.goal_json ? JSON.parse(row.goal_json) : undefined,
      };
    });
    res.json(sessions);
  });

  app.post("/api/sessions", async (req, res) => {
    const { id, user_id = 'teacher_001', transcript, duration, report, language = 'en', offline = false } = req.body;
    console.log('[Server] /api/sessions received', { id, user_id, language, offline, hasReport: Boolean(report) });

    const now = new Date().toISOString();
    const sessionReport = report ?? null;
    const normalizedReport = sessionReport ?? null;
    const benchmarks = normalizedReport ? buildBenchmarks(normalizedReport) : null;
    db.prepare("INSERT OR REPLACE INTO sessions (id, user_id, transcript, duration, status, date, report_json, language, offline, benchmark_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, user_id, transcript, duration, normalizedReport ? 'completed' : 'processing', now, normalizedReport ? JSON.stringify(normalizedReport) : null, language, offline ? 1 : 0, benchmarks ? JSON.stringify(benchmarks) : null);

    console.log('[Server] report saved', { id, status: normalizedReport ? 'completed' : 'processing', benchmarkCount: benchmarks?.length ?? 0 });
    res.json({ status: normalizedReport ? 'completed' : 'processing', benchmarks });

    if (!normalizedReport) {
      analyzeSession(id, transcript, duration, user_id, language);
    }
  });

  app.post('/api/sync/queue', (req, res) => {
    const { items = [] } = req.body ?? {};
    const insert = db.prepare(`
      INSERT INTO sync_queue (id, session_id, payload_json, status, attempts, updated_at)
      VALUES (?, ?, ?, 'queued', 0, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        payload_json = excluded.payload_json,
        status = 'queued',
        updated_at = CURRENT_TIMESTAMP
    `);

    const processed: Array<{ id: string; sessionId: string }> = [];
    db.transaction(() => {
      for (const item of items) {
        const queueId = String(item.id ?? crypto.randomUUID());
        const sessionId = String(item.sessionId ?? item.payload?.id ?? queueId);
        insert.run(queueId, sessionId, JSON.stringify(item));
        processed.push({ id: queueId, sessionId });
      }
    })();

    res.json({ ok: true, processed });
  });

  app.get('/api/goals', (_req, res) => {
    res.json({ goals: listGoals('teacher_001'), progress: listGoalProgress('teacher_001') });
  });

  app.post('/api/goals', (req, res) => {
    const { label, metric, targetValue, sessionId, userId = 'teacher_001' } = req.body ?? {};
    const goal = createGoal({
      userId,
      sessionId,
      label,
      metric: metric as GoalMetric,
      targetValue: Number(targetValue),
    });
    res.json({ goal });
  });

  app.post('/api/goals/evaluate', (req, res) => {
    const { userId = 'teacher_001', sessionId, report, transcriptCount = 0 } = req.body ?? {};
    const progress = evaluateGoal({
      userId,
      sessionId,
      report,
      transcriptCount: Number(transcriptCount),
    });
    res.json({ progress });
  });

  app.get('/api/benchmarks/:sessionId', (req, res) => {
    const row = db.prepare('SELECT report_json FROM sessions WHERE id = ?').get(req.params.sessionId) as { report_json?: string } | undefined;
    if (!row?.report_json) {
      return res.status(404).json({ error: 'Not found' });
    }

    const report = JSON.parse(row.report_json);
    res.json({ benchmarks: buildBenchmarks(report) });
  });

  app.get("/api/sessions/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ error: 'Not found' });
    }
    const report = row.report_json ? JSON.parse(row.report_json) : undefined;
    if (report && row.ai_summary) {
      report.aiCoaching = {
        summary: row.ai_summary,
        strengths: row.ai_strengths ? JSON.parse(row.ai_strengths) : [],
        improvements: row.ai_improvements ? JSON.parse(row.ai_improvements) : [],
        micro_goals: row.ai_micro_goals ? JSON.parse(row.ai_micro_goals) : [],
        confidence: row.ai_confidence,
        language: row.ai_language,
        timestamp: row.ai_timestamp,
        isFallback: row.ai_confidence === 0.50,
      };
    }
    const session = { ...row, report };
    res.json(session);
  });

  app.post('/api/sessions/:id/regenerate-coaching', async (req, res) => {
    const { id } = req.params;
    const { language } = req.body ?? {};

    try {
      const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as any;
      if (!row) {
        return res.status(404).json({ error: 'Session not found' });
      }

      let lines: any[] = [];
      try {
        lines = JSON.parse(row.transcript);
      } catch (e) {
        lines = (typeof row.transcript === 'string' ? row.transcript.split(/\n+/).filter(Boolean) : []).map((text: string, index: number) => ({
          id: `${id}-${index}`,
          speaker: index % 3 === 0 ? 'teacher' : 'student',
          text,
          timestamp: index * 35000,
        }));
      }

      const sessionLike = {
        id,
        subject: 'Class Session',
        className: 'Class 5A',
        teacherName: 'Teacher',
        durationSeconds: row.duration || 60,
        language: row.language,
        transcript: lines,
      } as any;

      const aiCoaching = await getOrGenerateCoaching(sessionLike, language ?? row.language);
      
      // Update report_json in session with the new AI coaching object
      const report = row.report_json ? JSON.parse(row.report_json) : buildReport(sessionLike);
      report.aiCoaching = aiCoaching;
      
      db.prepare("UPDATE sessions SET report_json = ? WHERE id = ?").run(JSON.stringify(report), id);

      res.json({ ok: true, aiCoaching });
    } catch (error: any) {
      console.error('[Regenerate Coaching Route] Failed:', error);
      res.status(500).json({ error: error.message || 'Generation failed' });
    }
  });

  app.get('/api/sync/queue', (_req, res) => {
    const rows = db.prepare('SELECT * FROM sync_queue ORDER BY created_at DESC').all();
    res.json({ items: rows });
  });

  app.get('/api/language-cache/:cacheKey', (req, res) => {
    const row = db.prepare('SELECT * FROM language_cache WHERE cache_key = ?').get(req.params.cacheKey) as { payload_json?: string } | undefined;
    res.json({ payload: row?.payload_json ? JSON.parse(row.payload_json) : null });
  });

  app.post('/api/language-cache', (req, res) => {
    const { cacheKey, language, payload } = req.body ?? {};
    db.prepare(`
      INSERT INTO language_cache (id, cache_key, language, payload_json, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(cache_key) DO UPDATE SET
        language = excluded.language,
        payload_json = excluded.payload_json,
        updated_at = CURRENT_TIMESTAMP
    `).run(crypto.randomUUID(), cacheKey, language ?? 'en', JSON.stringify(payload ?? {}));
    res.json({ ok: true });
  });

  async function analyzeSession(sessionId: string, transcript: string, durationSeconds?: number, userId = 'teacher_001', language: string = 'en') {
    console.log('[Server] analyzeSession started', { sessionId, durationSeconds, userId, language });
    try {
      let lines: any[] = [];
      try {
        lines = JSON.parse(transcript);
      } catch (e) {
        lines = (typeof transcript === 'string' ? transcript.split(/\n+/).filter(Boolean) : []).map((text: string, index: number) => ({
          id: `${sessionId}-${index}`,
          speaker: index % 3 === 0 ? 'teacher' : 'student',
          text,
          timestamp: index * 35000,
        }));
      }

      const sessionLike = {
        id: sessionId,
        subject: 'Class Session',
        className: 'Class 5A',
        teacherName: 'Teacher',
        durationSeconds: durationSeconds ?? (lines.length * 30),
        language: language as any,
        transcript: lines,
      } as any;

      const reportObj = buildReport(sessionLike);
      console.log('[Server] analytics generated in analyzeSession', { sessionId, transcriptLines: lines.length, finalScore: reportObj.finalScore });
      
      // Dynamic Gemini coaching analysis with retry and cached language fallbacks
      const aiCoaching = await getOrGenerateCoaching(sessionLike, language);
      console.log('[Server] coaching generated', { sessionId, isFallback: aiCoaching.isFallback, confidence: aiCoaching.confidence });
      reportObj.aiCoaching = aiCoaching;

      const reportJson = JSON.stringify(reportObj);
      const benchmarks = buildBenchmarks(reportObj);
      const goalProgress = evaluateGoal({
        userId,
        sessionId,
        report: reportObj,
        transcriptCount: lines.length,
      });

      db.prepare("UPDATE sessions SET report_json = ?, status = 'completed', benchmark_json = ?, goal_json = ? WHERE id = ?").run(reportJson, JSON.stringify(benchmarks), JSON.stringify(goalProgress), sessionId);
      console.log('[Server] analysis completed and report saved', { sessionId, finalScore: reportObj.finalScore });
    } catch (error) {
      console.error("Analysis failed:", error);
      db.prepare("UPDATE sessions SET status = 'failed' WHERE id = ?").run(sessionId);
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
