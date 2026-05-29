import { addDays, format, startOfWeek } from 'date-fns';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'te' | 'kn' | 'ta';
export type SessionStatus = 'draft' | 'recording' | 'queued' | 'syncing' | 'processing' | 'completed' | 'failed';

export type TranscriptLine = {
  id: string;
  speaker: 'teacher' | 'student' | 'system';
  text: string;
  timestamp: number;
};

export type CoachingTip = {
  id: string;
  title: string;
  detail: string;
  action: string;
  severity: 'positive' | 'attention' | 'critical';
  voiceNote: string;
};

export type BenchmarkCard = {
  label: string;
  value: string;
  percentile: number;
  tone: 'positive' | 'neutral' | 'encouraging';
  note: string;
};

export type SessionReport = {
  summary: string;
  finalScore: number;
  inclusionScore: number;
  waitTimeSeconds: number;
  aiConfidence: 'High' | 'Medium' | 'Low';
  talkRatio: {
    teacher: number;
    student: number;
    silence: number;
  };
  weeklyTrend: Array<{ day: string; score: number }>;
  participationTrend: Array<{ label: string; value: number }>;
  timeline: Array<{ time: string; type: string; text: string; score?: number }>;
  coachingTips: CoachingTip[];
  highlights: string[];
  aiCoaching?: any;
};

export type TeacherSession = {
  id: string;
  teacherName: string;
  subject: string;
  className: string;
  schoolName: string;
  createdAt: string;
  durationSeconds: number;
  language: SupportedLanguage;
  status: SessionStatus;
  offline: boolean;
  transcript: TranscriptLine[];
  report?: SessionReport;
  benchmarks?: BenchmarkCard[];
  audioUrl?: string;
  syncAttempts: number;
  pending?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function createWeeklyTrend(finalScore: number) {
  const values = [finalScore - 12, finalScore - 8, finalScore - 3, finalScore - 6, finalScore - 1, finalScore + 2, finalScore];
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ({
    day,
    score: clamp(Math.round(values[index]), 55, 98),
  }));
}

function createCoachingTips(session: Pick<TeacherSession, 'subject' | 'className' | 'teacherName' | 'language'>, score: number, inclusionScore: number): CoachingTip[] {
  const copy = tipCopy[session.language] ?? tipCopy.en;
  const tips: CoachingTip[] = [
    {
      id: `${session.subject}-wait-time`,
      title: copy.waitTitle,
      detail: copy.waitDetail,
      action: copy.waitAction,
      severity: 'positive',
      voiceNote: copy.waitVoice,
    },
    {
      id: `${session.subject}-participation`,
      title: copy.participationTitle,
      detail: copy.participationDetail,
      action: copy.participationAction,
      severity: 'attention',
      voiceNote: copy.participationVoice,
    },
  ];

  if (score > 86 || inclusionScore > 8.8) {
    tips.unshift({
      id: `${session.subject}-celebrate`,
      title: copy.celebrateTitle,
      detail: copy.celebrateDetail,
      action: copy.celebrateAction,
      severity: 'positive',
      voiceNote: copy.celebrateVoice,
    });
  }

  if (score < 72) {
    tips.push({
      id: `${session.subject}-scaffold`,
      title: copy.scaffoldTitle,
      detail: copy.scaffoldDetail,
      action: copy.scaffoldAction,
      severity: 'critical',
      voiceNote: copy.scaffoldVoice,
    });
  }

  return tips;
}

export function buildReport(session: Pick<TeacherSession, 'subject' | 'className' | 'teacherName' | 'durationSeconds' | 'language' | 'transcript'>, baselineScore?: number): SessionReport {
  const transcript = session.transcript || [];
  const teacherLines = transcript.filter((line) => line.speaker === 'teacher').length;
  const studentLines = transcript.filter((line) => line.speaker === 'student').length;

  const teacherWords = transcript
    .filter((line) => line.speaker === 'teacher')
    .reduce((sum, line) => sum + line.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const studentWords = transcript
    .filter((line) => line.speaker === 'student')
    .reduce((sum, line) => sum + line.text.trim().split(/\s+/).filter(Boolean).length, 0);

  const questionTurns = transcript.filter((line) => line.speaker === 'teacher' && isQuestionPrompt(line.text)).length;
  let totalWaitTime = 0;
  let waitTimeCount = 0;
  for (let i = 0; i < transcript.length - 1; i++) {
    const current = transcript[i];
    const next = transcript[i + 1];
    if (current.speaker === 'teacher' && next.speaker === 'student' && isQuestionPrompt(current.text)) {
      const wait = (next.timestamp - current.timestamp) / 1000;
      if (wait >= 0.5 && wait <= 30) {
        totalWaitTime += wait;
        waitTimeCount++;
      }
    }
  }
  const waitTimeSeconds = waitTimeCount > 0 ? totalWaitTime / waitTimeCount : 2.5;

  const durationSeconds = Math.max(session.durationSeconds || 0, 30);
  let teacherSpeakSeconds = estimateSpeakingSeconds(teacherWords, teacherLines);
  let studentSpeakSeconds = estimateSpeakingSeconds(studentWords, studentLines);
  const totalSpeakSeconds = teacherSpeakSeconds + studentSpeakSeconds;
  const maxSpeaking = durationSeconds * 0.9;
  if (totalSpeakSeconds > maxSpeaking) {
    const scale = maxSpeaking / totalSpeakSeconds;
    teacherSpeakSeconds *= scale;
    studentSpeakSeconds *= scale;
  }

  const silenceSeconds = Math.max(5, durationSeconds - teacherSpeakSeconds - studentSpeakSeconds);
  const talkRatio = {
    teacher: Math.round((teacherSpeakSeconds / durationSeconds) * 100),
    student: Math.round((studentSpeakSeconds / durationSeconds) * 100),
    silence: clamp(Math.round((silenceSeconds / durationSeconds) * 100), 0, 100),
  };

  const studentTurnRatio = studentLines / Math.max(1, teacherLines + studentLines);
  const questionDensity = questionTurns / Math.max(1, teacherLines);
  const inclusionScore = transcript.length === 0
    ? 0
    : clamp(4.8 + studentTurnRatio * 2.8 + clamp(waitTimeSeconds, 0, 8) * 0.25 + questionDensity * 1.8, 4, 10);
  const derivedScore = transcript.length === 0
    ? 0
    : clamp(
      Math.round(55 + studentTurnRatio * 25 + questionDensity * 15 + clamp(waitTimeSeconds, 0, 10) * 0.8),
      45,
      98
    );
  const finalScore = baselineScore ?? derivedScore;

  const confidence = finalScore > 84 ? 'High' : finalScore > 72 ? 'Medium' : 'Low';
  const localized = getLocalizedReportCopy(session.language, { studentLines, waitTimeSeconds, finalScore });

  return {
    summary: transcript.length === 0 ? 'No voice detected during this session.' : localized.summary,
    finalScore,
    inclusionScore: Number(inclusionScore.toFixed(1)),
    waitTimeSeconds: Number(waitTimeSeconds.toFixed(1)),
    aiConfidence: confidence,
    talkRatio,
    weeklyTrend: createWeeklyTrend(finalScore),
    participationTrend: [
      { label: 'Teacher', value: talkRatio.teacher },
      { label: 'Student', value: talkRatio.student },
      { label: 'Silence', value: talkRatio.silence },
    ],
    timeline: transcript.map((line, index) => ({
      time: formatTime(line.timestamp),
      type: line.speaker === 'teacher' ? 'Teacher' : line.speaker === 'student' ? 'Student' : 'System',
      text: line.text,
      score: index === transcript.length - 1 ? finalScore : undefined,
    })),
    coachingTips: createCoachingTips(session as any, finalScore, inclusionScore),
    highlights: transcript.length === 0 ? ['No speech patterns captured to analyze.'] : localized.highlights,
  };
}

function isQuestionPrompt(text: string) {
  const cleaned = text.trim().toLowerCase();
  if (cleaned.includes('?')) {
    return true;
  }

  const markers = ['why', 'how', 'what', 'which', 'when', 'where', 'can you', 'could you', 'kaise', 'kyun', 'kya'];
  return markers.some((marker) => cleaned.includes(marker));
}

function estimateSpeakingSeconds(words: number, turns: number) {
  const wordsPerSecond = 2.6;
  return words / wordsPerSecond + turns * 0.8;
}

export function createDashboardTrend(sessions: TeacherSession[]) {
  return [...sessions]
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-5)
    .map((session, index) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index] ?? `D${index + 1}`,
      score: session.report?.finalScore ?? 60 + index * 5,
    }));
}

export function getParticipationSummary(sessions: TeacherSession[]) {
  const latest = [...sessions].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (!latest?.report) {
    return [
      { name: 'Teacher', value: 45, color: '#1FA97A' },
      { name: 'Students', value: 40, color: '#F0A126' },
      { name: 'Silence', value: 15, color: '#DDEDEA' },
    ];
  }

  return [
    { name: 'Teacher', value: latest.report.talkRatio.teacher, color: '#1FA97A' },
    { name: 'Students', value: latest.report.talkRatio.student, color: '#F0A126' },
    { name: 'Silence', value: latest.report.talkRatio.silence, color: '#DDEDEA' },
  ];
}

export function createSessionFromSeed(seed: { id: string; title: string; subject: string; className: string; schoolName: string; durationSeconds: number; score: number; status: SessionStatus; offline: boolean; language: SupportedLanguage; }): TeacherSession {
  const transcript = buildTranscript(seed.title, seed.durationSeconds, seed.language);
  const report = buildReport({
    teacherName: 'Anjali Kulkarni',
    subject: seed.title,
    className: seed.className,
    durationSeconds: seed.durationSeconds,
    language: seed.language,
    transcript,
  }, seed.score);

  return {
    id: seed.id,
    teacherName: 'Anjali Kulkarni',
    subject: seed.title,
    className: seed.className,
    schoolName: seed.schoolName,
    createdAt: new Date(Date.now() - seed.durationSeconds * 60_000).toISOString(),
    durationSeconds: seed.durationSeconds,
    language: seed.language,
    status: seed.status,
    offline: seed.offline,
    transcript,
    report,
    syncAttempts: seed.offline ? 1 : 0,
  };
}

function buildTranscript(title: string, durationSeconds: number, language: SupportedLanguage): TranscriptLine[] {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const lines: TranscriptLine[] = [];
  for (let index = 0; index < Math.min(6, minutes + 2); index += 1) {
    const speaker = index % 3 === 0 ? 'teacher' : 'student';
    const baseText = speaker === 'teacher'
      ? teacherPrompts[index % teacherPrompts.length]
      : studentReplies[index % studentReplies.length];
    lines.push({
      id: `${title}-${index}`,
      speaker,
      text: language === 'hi' ? `हिंदी: ${baseText}` : baseText,
      timestamp: index * 35_000,
    });
  }
  return lines;
}

const teacherPrompts = [
  'Let us look at the pattern together.',
  'Why do you think that answer works?',
  'Take your time and explain your thinking.',
  'Can someone build on that idea?',
  'Great. Now show your working step by step.',
  'What happens if we change the value?',
];

const studentReplies = [
  'I think the answer is twenty-four.',
  'Because the shape has four sides.',
  'Can I try once more?',
  'The pattern increases by two.',
  'We can check using subtraction.',
];

function getLocalizedReportCopy(language: SupportedLanguage, context: { studentLines: number; waitTimeSeconds: number; finalScore: number; }) {
  const copy = localizedCopy[language] ?? localizedCopy.en;
  return {
    summary: copy.summary(context.studentLines),
    highlights: copy.highlights(context.waitTimeSeconds, context.finalScore),
  };
}

const localizedCopy: Record<SupportedLanguage, {
  summary: (studentLines: number) => string;
  highlights: (waitTimeSeconds: number, finalScore: number) => string[];
}> = {
  en: {
    summary: (studentLines) => `Class session showed strong momentum with ${studentLines} student turns and calm teacher prompts.`,
    highlights: (waitTimeSeconds, finalScore) => [
      'Students spoke more than in the previous session.',
      `Wait time improved to ${waitTimeSeconds.toFixed(1)}s on your strongest prompt.`,
      finalScore >= 80 ? 'The class is moving toward a more inclusive rhythm.' : 'A few more pauses can unlock deeper student thinking.',
    ],
  },
  hi: {
    summary: (studentLines) => `कक्षा सत्र में ${studentLines} छात्र-प्रतिक्रियाओं के साथ अच्छा प्रवाह दिखा।`,
    highlights: (waitTimeSeconds, finalScore) => [
      'पिछले सत्र की तुलना में छात्र अधिक बोले।',
      `आपके सबसे अच्छे प्रश्न पर प्रतीक्षा समय ${waitTimeSeconds.toFixed(1)}s तक पहुँचा।`,
      finalScore >= 80 ? 'कक्षा अधिक समावेशी लय की ओर बढ़ रही है।' : 'थोड़ा और विराम छात्रों की सोच खोल सकता है।',
    ],
  },
  mr: {
    summary: (studentLines) => `वर्ग सत्रात ${studentLines} विद्यार्थी प्रतिसादांसह चांगली गती दिसली.`,
    highlights: (waitTimeSeconds, finalScore) => [
      'मागील सत्रापेक्षा विद्यार्थ्यांनी अधिक बोलले.',
      `तुमच्या उत्तम प्रश्नावर थांबण्याचा वेळ ${waitTimeSeconds.toFixed(1)}s झाला.`,
      finalScore >= 80 ? 'वर्ग अधिक समावेशक लयीकडे जात आहे.' : 'थोडे अधिक थांबणे विद्यार्थ्यांची विचारशक्ती उघडू शकते.',
    ],
  },
  te: {
    summary: (studentLines) => `తరగతి సెషన్‌లో ${studentLines} విద్యార్థి స్పందనలతో మంచి వేగం కనిపించింది.`,
    highlights: (waitTimeSeconds, finalScore) => [
      'మునుపటి సెషన్ కంటే విద్యార్థులు ఎక్కువగా మాట్లాడారు.',
      `మీ ఉత్తమ ప్రశ్నపై వేచిచూడే సమయం ${waitTimeSeconds.toFixed(1)}s కి చేరింది.`,
      finalScore >= 80 ? 'తరగతి మరింత సమావేశత వైపు కదులుతోంది.' : 'కొంచెం విరామం విద్యార్థుల ఆలోచనను తెరుస్తుంది.',
    ],
  },
  kn: {
    summary: (studentLines) => `ತರಗತಿ ಅಧಿವೇಶನದಲ್ಲಿ ${studentLines} ವಿದ್ಯಾರ್ಥಿ ಪ್ರತಿಕ್ರಿಯೆಗಳೊಂದಿಗೆ ಒಳ್ಳೆಯ ಗತಿ ಕಂಡುಬಂದಿದೆ.`,
    highlights: (waitTimeSeconds, finalScore) => [
      'ಹಿಂದಿನ ಅಧಿವೇಶನಕ್ಕಿಂತ ವಿದ್ಯಾರ್ಥಿಗಳು ಹೆಚ್ಚು ಮಾತನಾಡಿದರು.',
      `ನಿಮ್ಮ ಉತ್ತಮ ಪ್ರಶ್ನೆಯಲ್ಲಿ ಕಾಯುವ ಸಮಯ ${waitTimeSeconds.toFixed(1)}s ಆಗಿದೆ.`,
      finalScore >= 80 ? 'ತರಗತಿ ಇನ್ನಷ್ಟು ಸಮಾವೇಶಿತ ಲಯದತ್ತ ಸಾಗುತ್ತಿದೆ.' : 'ಸ್ವಲ್ಪ ಹೆಚ್ಚುವರಿ ವಿರಾಮಗಳು ವಿದ್ಯಾರ್ಥಿಗಳ ಚಿಂತನೆಯನ್ನು ತೆರೆಯಬಹುದು.',
    ],
  },
  ta: {
    summary: (studentLines) => `வகுப்பு அமர்வில் ${studentLines} மாணவர் பதில்களுடன் நல்ல வேகம் தெரிகிறது.`,
    highlights: (waitTimeSeconds, finalScore) => [
      'முந்தைய அமர்வைவிட மாணவர்கள் அதிகமாக பேசினர்.',
      `உங்கள் சிறந்த கேள்வியில் காத்திருக்கும் நேரம் ${waitTimeSeconds.toFixed(1)}s ஆக உயர்ந்தது.`,
      finalScore >= 80 ? 'வகுப்பு மேலும் உள்ளடக்கிய இயக்கத்துக்கு நகர்கிறது.' : 'சிறிது கூடுதல் இடைவெளி மாணவர் சிந்தனையைத் திறக்கும்.',
    ],
  },
};

const tipCopy: Record<SupportedLanguage, {
  waitTitle: string;
  waitDetail: string;
  waitAction: string;
  waitVoice: string;
  participationTitle: string;
  participationDetail: string;
  participationAction: string;
  participationVoice: string;
  celebrateTitle: string;
  celebrateDetail: string;
  celebrateAction: string;
  celebrateVoice: string;
  scaffoldTitle: string;
  scaffoldDetail: string;
  scaffoldAction: string;
  scaffoldVoice: string;
}> = {
  en: {
    waitTitle: 'Brilliant wait-time',
    waitDetail: 'You paused long enough for the class to process the question before answering.',
    waitAction: 'Keep a 5-second silent count after open-ended prompts.',
    waitVoice: 'Nice pacing. That wait increased student confidence.',
    participationTitle: 'Participation nudge',
    participationDetail: 'A few voices still dominate the room. Broaden the invite to quieter learners.',
    participationAction: 'Use random name cards or think-pair-share on the next concept.',
    participationVoice: 'Try widening the circle so more learners contribute.',
    celebrateTitle: 'Strong inclusion trend',
    celebrateDetail: 'The class showed healthy balance between teacher guidance and student response.',
    celebrateAction: 'Reinforce this pattern by repeating the same prompt style tomorrow.',
    celebrateVoice: 'Strong inclusive talk balance today.',
    scaffoldTitle: 'Add a scaffold',
    scaffoldDetail: 'Students may need a clearer model before responding independently.',
    scaffoldAction: 'Show one worked example, then ask students to complete the next step.',
    scaffoldVoice: 'Add one more scaffold before the next task.',
  },
  hi: {
    waitTitle: 'बेहतरीन प्रतीक्षा समय',
    waitDetail: 'उत्तर देने से पहले आपने कक्षा को प्रश्न समझने के लिए पर्याप्त समय दिया।',
    waitAction: 'खुले प्रश्नों के बाद 5 सेकंड की शांत गिनती रखें।',
    waitVoice: 'अच्छी गति। इस विराम ने छात्रों का आत्मविश्वास बढ़ाया।',
    participationTitle: 'भागीदारी बढ़ाएँ',
    participationDetail: 'कुछ आवाज़ें अभी भी हावी हैं। शांत छात्रों को भी अवसर दें।',
    participationAction: 'अगले विषय में नाम कार्ड या think-pair-share अपनाएँ।',
    participationVoice: 'और अधिक छात्रों को शामिल करने के लिए दायरा बढ़ाएँ।',
    celebrateTitle: 'मजबूत समावेशन',
    celebrateDetail: 'शिक्षक मार्गदर्शन और छात्र प्रतिक्रिया में अच्छा संतुलन दिखा।',
    celebrateAction: 'कल भी इसी तरह का प्रश्न पैटर्न दोहराएँ।',
    celebrateVoice: 'आज बातचीत का समावेशी संतुलन मजबूत था।',
    scaffoldTitle: 'एक सहारा जोड़ें',
    scaffoldDetail: 'स्वतंत्र उत्तर से पहले छात्रों को स्पष्ट उदाहरण की ज़रूरत हो सकती है।',
    scaffoldAction: 'एक solved example दिखाएँ, फिर अगला कदम छात्रों से करवाएँ।',
    scaffoldVoice: 'अगले काम से पहले एक और सहारा जोड़ें।',
  },
  mr: {
    waitTitle: 'उत्तम थांबण्याचा वेळ',
    waitDetail: 'उत्तर देण्यापूर्वी तुम्ही वर्गाला प्रश्न समजण्यासाठी वेळ दिला.',
    waitAction: 'उघड्या प्रश्नांनंतर 5 सेकंद शांतता ठेवा.',
    waitVoice: 'छान गती. या थांबण्यामुळे विद्यार्थ्यांचा आत्मविश्वास वाढला.',
    participationTitle: 'सहभाग वाढवा',
    participationDetail: 'काही आवाज अजूनही जास्त आहेत. शांत विद्यार्थ्यांना संधी द्या.',
    participationAction: 'पुढील संकल्पनेत name cards किंवा think-pair-share वापरा.',
    participationVoice: 'अधिक विद्यार्थ्यांना बोलावण्यासाठी वर्तुळ मोठे करा.',
    celebrateTitle: 'मजबूत समावेशन लय',
    celebrateDetail: 'शिक्षक मार्गदर्शन आणि विद्यार्थ्यांच्या प्रतिसादात चांगले संतुलन दिसले.',
    celebrateAction: 'उद्या देखील हा प्रश्न-शैलीचा नमुना वापरा.',
    celebrateVoice: 'आज समावेशक संवाद संतुलित होता.',
    scaffoldTitle: 'एक आधार द्या',
    scaffoldDetail: 'स्वतंत्र प्रतिसादापूर्वी विद्यार्थ्यांना स्पष्ट उदाहरणाची गरज असू शकते.',
    scaffoldAction: 'एक worked example दाखवा आणि पुढचा टप्पा विद्यार्थ्यांकडून घ्या.',
    scaffoldVoice: 'पुढील कामापूर्वी अजून एक आधार द्या.',
  },
  te: {
    waitTitle: 'అద్భుతమైన వేచిచూడే సమయం',
    waitDetail: 'సమాధానానికి ముందు మీరు తరగతి ప్రశ్నను ఆలోచించడానికి సమయం ఇచ్చారు.',
    waitAction: 'ఓపెన్-ఎండెడ్ ప్రశ్నల తర్వాత 5 సెకన్ల నిశ్శబ్ద గణన ఉంచండి.',
    waitVoice: 'మంచి వేగం. ఈ విరామం విద్యార్థుల విశ్వాసాన్ని పెంచింది.',
    participationTitle: 'భాగస్వామ్యం పెంచండి',
    participationDetail: 'కొన్ని స్వరాలు ఇంకా ఎక్కువగా ఉన్నాయి. నిశ్శబ్ద విద్యార్థులకు కూడా అవకాశం ఇవ్వండి.',
    participationAction: 'తదుపరి కాన్సెప్ట్‌లో name cards లేదా think-pair-share వాడండి.',
    participationVoice: 'మరింత మంది విద్యార్థులు పాల్గొనేలా వలయాన్ని విస్తరించండి.',
    celebrateTitle: 'బలమైన సమావేశ లయ',
    celebrateDetail: 'ఉపాధ్యాయ మార్గనిర్దేశనం మరియు విద్యార్థి స్పందన మధ్య మంచి సమతుల్యం కనిపించింది.',
    celebrateAction: 'రేపు కూడా ఇదే ప్రశ్న శైలిని కొనసాగించండి.',
    celebrateVoice: 'ఈ రోజు సమావేషమైన సంభాషణ బలంగా ఉంది.',
    scaffoldTitle: 'ఒక scaffold జోడించండి',
    scaffoldDetail: 'స్వతంత్ర సమాధానానికి ముందు విద్యార్థులకు స్పష్టమైన నమూనా అవసరం కావచ్చు.',
    scaffoldAction: 'ఒక worked example చూపించి తదుపరి దశను విద్యార్థుల చేత చేయించండి.',
    scaffoldVoice: 'తదుపరి పనికి ముందు ఇంకొక scaffold జోడించండి.',
  },
  kn: {
    waitTitle: 'ಅದ್ಭುತ ಕಾಯುವ ಸಮಯ',
    waitDetail: 'ಉತ್ತರಿಸುವ ಮೊದಲು ಪ್ರಶ್ನೆಯನ್ನು ಸಂಸ್ಕರಿಸಲು ನೀವು ತರಗತಿಗೆ ಸಮಯ ನೀಡಿದಿರಿ.',
    waitAction: 'ತೆರೆದ ಪ್ರಶ್ನೆಗಳ ನಂತರ 5 ಸೆಕೆಂಡ್ ಮೌನ ಎಣಿಕೆ ಇಡಿ.',
    waitVoice: 'ಚೆನ್ನಾದ ಗತಿ. ಆ ವಿರಾಮ ವಿದ್ಯಾರ್ಥಿಗಳ ಆತ್ಮವಿಶ್ವಾಸವನ್ನು ಹೆಚ್ಚಿಸಿದೆ.',
    participationTitle: 'ಪಾಲ್ಗೊಳ್ಳುವಿಕೆ ಹೆಚ್ಚಿಸಿ',
    participationDetail: 'ಕೆಲವು ಧ್ವನಿಗಳು ಇನ್ನೂ ಪ್ರಬಲವಾಗಿವೆ. ಮೌನ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಸೇರಿಸಿ.',
    participationAction: 'ಮುಂದಿನ ಕಲ್ಪನೆಯಲ್ಲಿ name cards ಅಥವಾ think-pair-share ಬಳಸಿ.',
    participationVoice: 'ಹೆಚ್ಚು ಕಲಿಯುವವರನ್ನು ಸೇರಿಸಲು ವಲಯವನ್ನು ವಿಸ್ತರಿಸಿ.',
    celebrateTitle: 'ಬಲವಾದ ಸಮಾವೇಶ ಲಯ',
    celebrateDetail: 'ಶಿಕ್ಷಕರ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿ ಪ್ರತಿಕ್ರಿಯೆಯ ನಡುವೆ ಆರೋಗ್ಯಕರ ಸಮತೋಲನ ಕಂಡುಬಂದಿದೆ.',
    celebrateAction: 'ನಾಳೆಯಲ್ಲೂ ಇದೇ prompt style ಅನ್ನು ಪುನರಾವರ್ತಿಸಿ.',
    celebrateVoice: 'ಇಂದಿನ ಸಂಭಾಷಣೆ ಸಮಾವೇಶಿತವಾಗಿದೆ.',
    scaffoldTitle: 'ಒಂದು scaffold ಸೇರಿಸಿ',
    scaffoldDetail: 'ಸ್ವತಂತ್ರ ಉತ್ತರಕ್ಕೆ ಮುನ್ನ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಸ್ಪಷ್ಟ ಮಾದರಿ ಅಗತ್ಯವಾಗಬಹುದು.',
    scaffoldAction: 'ಒಂದು worked example ತೋರಿಸಿ, ನಂತರ ಮುಂದಿನ ಹಂತವನ್ನು ವಿದ್ಯಾರ್ಥಿಗಳಿಂದ ಪೂರ್ಣಗೊಳಿಸಿ.',
    scaffoldVoice: 'ಮುಂದಿನ ಕಾರ್ಯಕ್ಕೆ ಮೊದಲು ಇನ್ನೊಂದು scaffold ಸೇರಿಸಿ.',
  },
  ta: {
    waitTitle: 'அருமையான காத்திருப்பு நேரம்',
    waitDetail: 'பதில் சொல்லுவதற்கு முன் கேள்வியை புரிந்துகொள்ள நீங்கள் நேரம் வழங்கினீர்கள்.',
    waitAction: 'திறந்த முடிவு கேள்விகளுக்குப் பின் 5 வினாடி மௌனம் வைத்துக்கொள்ளுங்கள்.',
    waitVoice: 'நல்ல வேகம். அந்த இடைவேளை மாணவர் நம்பிக்கையை உயர்த்தியது.',
    participationTitle: 'பங்கேற்பை அதிகரிக்கவும்',
    participationDetail: 'சில குரல்கள் இன்னும் ஆதிக்கம் செலுத்துகின்றன. மௌன மாணவர்களையும் அழைக்கவும்.',
    participationAction: 'அடுத்த கருத்தில் name cards அல்லது think-pair-share பயன்படுத்துங்கள்.',
    participationVoice: 'மேலும் மாணவர்கள் சேரக் கூடியவாறு வட்டத்தை விரிவாக்குங்கள்.',
    celebrateTitle: 'வலுவான உள்ளடக்கம்',
    celebrateDetail: 'ஆசிரியர் வழிகாட்டலும் மாணவர் பதிலும் நன்றாக சமநிலையுடன் இருந்தது.',
    celebrateAction: 'நாளையும் அதே prompt style-ஐ தொடருங்கள்.',
    celebrateVoice: 'இன்று உரையாடல் சமநிலையாக இருந்தது.',
    scaffoldTitle: 'ஒரு scaffold சேர்க்கவும்',
    scaffoldDetail: 'தனிப்பட்ட பதிலுக்கு முன் மாணவர்களுக்கு தெளிவான மாதிரி தேவைப்படலாம்.',
    scaffoldAction: 'ஒரு worked example காட்டி, அடுத்த படியை மாணவர்களிடம் செய்யவிடுங்கள்.',
    scaffoldVoice: 'அடுத்த பணிக்கு முன் இன்னொரு scaffold சேர்க்கவும்.',
  },
};
