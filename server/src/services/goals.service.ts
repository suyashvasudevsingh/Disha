import { getDb } from '../db';

export type GoalMetric = 'teacher_questions' | 'wait_time' | 'student_participation' | 'teacher_talk' | 'quiet_students';

export type CoachingGoal = {
  id: string;
  userId: string;
  sessionId?: string | null;
  label: string;
  metric: GoalMetric;
  targetValue: number;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string | null;
};

export type GoalProgress = {
  id: string;
  goalId: string;
  sessionId: string;
  achievedValue: number;
  achieved: boolean;
  createdAt: string;
};

export function listGoals(userId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM coaching_goals WHERE user_id = ? ORDER BY created_at DESC').all(userId) as CoachingGoal[];
}

export function createGoal(input: { userId: string; sessionId?: string; label: string; metric: GoalMetric; targetValue: number; }) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO coaching_goals (id, user_id, session_id, label, metric, target_value, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(id, input.userId, input.sessionId ?? null, input.label, input.metric, input.targetValue);

  return getGoal(id);
}

export function evaluateGoal(input: { userId: string; sessionId: string; report: { finalScore: number; inclusionScore: number; waitTimeSeconds: number; talkRatio: { teacher: number; student: number; silence: number; }; }; transcriptCount: number; }) {
  const db = getDb();
  const activeGoals = listGoals(input.userId).filter((goal) => goal.status === 'active');
  const results: GoalProgress[] = [];

  for (const goal of activeGoals) {
    const achievedValue = calculateGoalValue(goal.metric, input);
    const achieved = achievedValue >= goal.targetValue;
    const progressId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO goal_progress (id, goal_id, session_id, achieved_value, achieved)
      VALUES (?, ?, ?, ?, ?)
    `).run(progressId, goal.id, input.sessionId, achievedValue, achieved ? 1 : 0);

    if (achieved) {
      db.prepare(`
        UPDATE coaching_goals SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(goal.id);
    }

    results.push({
      id: progressId,
      goalId: goal.id,
      sessionId: input.sessionId,
      achievedValue,
      achieved,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

export function getGoal(id: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM coaching_goals WHERE id = ?').get(id) as CoachingGoal | undefined;
}

export function listGoalProgress(userId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT gp.* FROM goal_progress gp
    JOIN coaching_goals cg ON cg.id = gp.goal_id
    WHERE cg.user_id = ?
    ORDER BY gp.created_at DESC
  `).all(userId) as GoalProgress[];
}

function calculateGoalValue(metric: GoalMetric, input: { report: { finalScore: number; inclusionScore: number; waitTimeSeconds: number; talkRatio: { teacher: number; student: number; silence: number; }; }; transcriptCount: number; }) {
  switch (metric) {
    case 'teacher_questions':
      return Math.max(1, Math.round(input.transcriptCount * 0.5));
    case 'wait_time':
      return input.report.waitTimeSeconds;
    case 'student_participation':
      return input.report.talkRatio.student;
    case 'teacher_talk':
      return 100 - input.report.talkRatio.teacher;
    case 'quiet_students':
      return input.report.talkRatio.silence;
    default:
      return 0;
  }
}
