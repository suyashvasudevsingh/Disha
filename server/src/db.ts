import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(process.cwd(), 'disha.db');

let database: any = null;

export function getDb() {
  if (!database) {
    database = new Database(dbPath);
    database.pragma('journal_mode = WAL');
    initSchema(database);
  }

  return database;
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      role TEXT DEFAULT 'teacher',
      name TEXT,
      school_id TEXT,
      is_demo INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      transcript TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER,
      status TEXT DEFAULT 'pending',
      report_json TEXT,
      language TEXT DEFAULT 'en',
      offline INTEGER DEFAULT 0,
      benchmark_json TEXT,
      goal_json TEXT
    );

    CREATE TABLE IF NOT EXISTS consent_preferences (
      user_id TEXT PRIMARY KEY,
      consent_given INTEGER DEFAULT 0,
      consent_text TEXT,
      language TEXT DEFAULT 'en',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      attempts INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS demo_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      school_name TEXT NOT NULL,
      language TEXT NOT NULL,
      transcript_json TEXT NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coaching_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      label TEXT NOT NULL,
      metric TEXT NOT NULL,
      target_value REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS goal_progress (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      achieved_value REAL NOT NULL,
      achieved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS peer_analytics (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL,
      metric TEXT NOT NULL,
      cohort_size INTEGER NOT NULL,
      percentile REAL NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS language_cache (
      id TEXT PRIMARY KEY,
      cache_key TEXT NOT NULL UNIQUE,
      language TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Schema migrations for AI Coaching fields
  function tryAddColumn(dbConnection: any, table: string, column: string, type: string) {
    try {
      dbConnection.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    } catch (e) {
      // Column already exists, safe to ignore
    }
  }

  tryAddColumn(db, 'sessions', 'ai_summary', 'TEXT');
  tryAddColumn(db, 'sessions', 'ai_strengths', 'TEXT');
  tryAddColumn(db, 'sessions', 'ai_improvements', 'TEXT');
  tryAddColumn(db, 'sessions', 'ai_micro_goals', 'TEXT');
  tryAddColumn(db, 'sessions', 'ai_confidence', 'REAL');
  tryAddColumn(db, 'sessions', 'ai_language', 'TEXT');
  tryAddColumn(db, 'sessions', 'ai_timestamp', 'TEXT');

  const demoCount = db.prepare('SELECT COUNT(*) as count FROM demo_sessions').get() as { count: number };
  if (demoCount.count === 0) {
    seedDemoData(db);
  }
}

function seedDemoData(db: any) {
  const demoRows = [
    {
      id: 'demo-weak',
      title: 'Weak Teaching Session',
      teacher_name: 'Anjali Kulkarni',
      school_name: 'Govt. School No. 4',
      language: 'en',
      transcript_json: JSON.stringify([
        { id: 'd1', speaker: 'teacher', text: 'Read the answer again.', timestamp: 0 },
        { id: 'd2', speaker: 'student', text: 'I am not sure.', timestamp: 35000 },
      ]),
      report_json: JSON.stringify({ finalScore: 61, inclusionScore: 6.2, waitTimeSeconds: 3.5 }),
    },
    {
      id: 'demo-average',
      title: 'Average Classroom',
      teacher_name: 'Anjali Kulkarni',
      school_name: 'Vidya Mandir',
      language: 'hi',
      transcript_json: JSON.stringify([
        { id: 'd3', speaker: 'teacher', text: 'Let us think together.', timestamp: 0 },
        { id: 'd4', speaker: 'student', text: 'Maybe it is four.', timestamp: 34000 },
        { id: 'd5', speaker: 'teacher', text: 'Good. Can someone add more?', timestamp: 68000 },
      ]),
      report_json: JSON.stringify({ finalScore: 74, inclusionScore: 7.4, waitTimeSeconds: 5.8 }),
    },
    {
      id: 'demo-excellent',
      title: 'Excellent Inclusive Classroom',
      teacher_name: 'Anjali Kulkarni',
      school_name: 'Z.P. School',
      language: 'mr',
      transcript_json: JSON.stringify([
        { id: 'd6', speaker: 'teacher', text: 'Who would like to build on this idea?', timestamp: 0 },
        { id: 'd7', speaker: 'student', text: 'I can explain my thinking.', timestamp: 35000 },
        { id: 'd8', speaker: 'teacher', text: 'Wonderful. Let us hear another voice too.', timestamp: 70000 },
        { id: 'd9', speaker: 'student', text: 'I agree and I want to add one point.', timestamp: 105000 },
      ]),
      report_json: JSON.stringify({ finalScore: 91, inclusionScore: 9.1, waitTimeSeconds: 8.3 }),
    },
  ];

  const insertDemo = db.prepare(`
    INSERT INTO demo_sessions (id, title, teacher_name, school_name, language, transcript_json, report_json)
    VALUES (@id, @title, @teacher_name, @school_name, @language, @transcript_json, @report_json)
  `);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, phone, role, name, school_id, is_demo)
    VALUES ('demo-teacher', '0000000000', 'teacher', 'Teacher Anjali', 'demo-school', 1)
  `);

  const insertConsent = db.prepare(`
    INSERT OR IGNORE INTO consent_preferences (user_id, consent_given, consent_text, language)
    VALUES ('demo-teacher', 1, 'Recording stays on your phone.', 'en')
  `);

  const insertGoals = db.prepare(`
    INSERT OR IGNORE INTO coaching_goals (id, user_id, session_id, label, metric, target_value, status)
    VALUES
      ('goal-demo-1', 'demo-teacher', 'demo-excellent', 'Ask 5+ questions', 'teacher_questions', 5, 'completed'),
      ('goal-demo-2', 'demo-teacher', 'demo-average', 'Wait 10 seconds', 'wait_time', 10, 'active')
  `);

  const insertProgress = db.prepare(`
    INSERT OR IGNORE INTO goal_progress (id, goal_id, session_id, achieved_value, achieved)
    VALUES
      ('progress-demo-1', 'goal-demo-1', 'demo-excellent', 7, 1),
      ('progress-demo-2', 'goal-demo-2', 'demo-average', 6, 0)
  `);

  db.transaction(() => {
    insertUser.run();
    insertConsent.run();
    demoRows.forEach((row) => insertDemo.run(row));
    insertGoals.run();
    insertProgress.run();
  })();
}
