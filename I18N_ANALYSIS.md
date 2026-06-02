# Disha Project - i18n (Internationalization) Analysis

## Executive Summary

✅ **i18next is already implemented** with support for 6 languages (English, Hindi, Marathi, Telugu, Kannada, Tamil). However, **many UI strings remain hardcoded** and need to be moved to the translation file. This document provides a complete audit of the implementation and identifies all hardcoded strings.

---

## 1. Current i18n Implementation

### ✅ What's Already Done

**Configuration**: `client/src/lib/i18n.ts`
- i18next with react-i18next integration
- i18next-browser-languagedetector for automatic language detection
- **6 supported languages**: English, Hindi, Marathi, Telugu, Kannada, Tamil

**Language Metadata**: `client/src/lib/i18n-languages.ts`
```typescript
export const supportedLanguageLabels = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ta: 'தமிழ்',
}
```

**Existing Translation Keys** (22 keys):
- `app_name` - "Disha" (translates to दिशा, etc.)
- `welcome` - "Welcome back, Teacher"
- `dashboard`, `record`, `reports`, `portfolio`
- `growth_score`, `inclusion_score`
- `recent_sessions`, `start_recording`, `stop_recording`
- `processing_ai`, `coaching_tips`
- `participation`, `teacher_talk`, `student_talk`, `silence`, `wait_time`
- `login_title`, `login_subtitle`, `otp_login`
- `offline_mode`, `sync_pending`

**Language Storage**: Via `useAppState()` → persisted in preferences
- Uses localStorage for language preference
- `cycleLanguage()` function cycles through all 6 languages

---

## 2. Language Switching Implementation

### How It Works Currently

**Desktop UI** (`Layout.tsx`):
- Language button in left sidebar footer
- Globe icon + current language label
- Cycling behavior on click

**Mobile UI** (`Layout.tsx`):
- Language button in bottom navigation bar
- Simplified display (no full label on mobile)

**Landing Page** (`LandingPage.tsx`):
- Top-right "Language" button
- Same cycling behavior

**Code Location**: `useAppState()` hook
```typescript
cycleLanguage() {
  // Cycles: en → hi → mr → te → kn → ta → en
  const languageCodes = Object.keys(supportedLanguageLabels);
  const index = languageCodes.indexOf(i18n.language);
  const nextCode = languageCodes[(index + 1) % languageCodes.length];
  i18n.changeLanguage(nextCode);
}
```

**Persistence**: 
- Language preference saved to localStorage via `app-state.tsx`
- Auto-loads on page refresh
- Detector also attempts to auto-detect user's browser language

---

## 3. Complete Hardcoded Strings Audit

### 🔴 HIGH PRIORITY - Landing Page
**File**: `client/src/pages/LandingPage.tsx`

| String | Context | Frequency |
|--------|---------|-----------|
| "Classroom intelligence" | Featured tag above h1 | 1 |
| "AI-Powered Classroom Intelligence for Teachers" | Main headline | 1 |
| "Receive actionable teaching insights, classroom analytics, and personalized coaching after every lesson." | Subtitle | 1 |
| "Get Started" | CTA button | 1 |
| "AI Teaching Insights" | Feature title | 1 |
| "Understand classroom patterns, student engagement, and instructional strengths after every lesson." | Feature description | 1 |
| "Classroom Analytics" | Feature title | 1 |
| "Track attendance, participation, and speaking balance with clear visual reports." | Feature description | 1 |
| "Personalized Coaching" | Feature title | 1 |
| "Receive tailored recommendations to improve pacing, questioning, and feedback strategies." | Feature description | 1 |
| "Multilingual Support" | Feature title | 1 |
| "Built for diverse classrooms with support for multiple teaching languages and curriculums." | Feature description | 1 |

**Total**: 12 strings to translate

---

### 🔴 HIGH PRIORITY - Dashboard
**File**: `client/src/pages/Dashboard.tsx`

| String | Context |
|--------|---------|
| "Dashboard" | Page title (h1) |
| "Track session outcomes, participation balance, and coaching insights with transparent prototype-safe indicators." | Page subtitle |
| "Week" | Range selector button |
| "Month" | Range selector button |
| "Last 7 days" | Range label (week) |
| "This month" | Range label (month) |
| "Inclusion rising" | Badge on inclusion score card |
| "{activeSessions} completed" | Badge text |
| "Participation" | Card title |
| "Student voice-time increased from the previous session." | Card description |
| "View History" | Button text |
| "No sessions yet. Start one recording to generate your first report." | Empty state message |
| "Start recording" | CTA button (empty state) |
| "Trend updates" | Section heading |
| "Offline snapshot" | Badge (when offline) |
| "Live snapshot" | Badge (when online) |
| "Coaching" | Section heading |
| "AI-generated coaching suggestions" | Badge under heading |
| "Your next coaching card will appear after the first analyzed session." | Placeholder text |
| "Play coaching note" | Button text |
| Participation breakdown labels: "Teacher Talk", "Student Talk", "Silence", "Wait Time" | Chart legend | (mostly translated via keys) |

**Total**: 20+ strings to translate

---

### 🔴 HIGH PRIORITY - Record Page
**File**: `client/src/pages/RecordPage.tsx`

| String | Context |
|--------|---------|
| "Microphone permission denied" | Alert title |
| "Please allow microphone access in your browser settings to record your classroom lessons. You can still use the fallback demo mode below." | Alert description |
| "Grant Access" | Button |
| "Microphone access unsupported" | Alert title |
| "Your browser doesn't support microphone recording. Please use a modern browser like Chrome, Safari, or Firefox. fallbacks will be used." | Alert description |
| "Live speech recognition" | Status when recording |
| "Recording with fallback transcript" | Status (fallback mode) |
| "Ready for live transcription" | Status (idle, speech ready) |
| "Ready for fallback transcript" | Status (idle, speech unavailable) |
| "Paused" | Status |
| "Processing" | Status |
| "This browser doesn't support live speech recognition. The recording will save successfully, and a fallback transcript will be generated once recording ends." | Information text |

**Toast Messages** (in `toast.success()`, `toast.error()`, `toast.warning()`):
| Message | Scenario |
|---------|----------|
| "Microphone permission granted!" | After permission request succeeds |
| "Microphone permission denied. Please enable it in browser settings." | After permission request fails |
| "Could not start microphone. Falling back to demo transcript." | Mic startup error |
| "Live browser STT unavailable. Using deterministic transcript fallback when recording ends." | Speech recognition unsupported |
| "Recording started" | When recording begins |
| "Session saved. Transcription is pending." | After recording ends (offline) |
| "Session analyzed and saved" | After analysis completes |
| "Fallback transcript used: {reason}" | When fallback used |

**Total**: 18+ strings to translate

---

### 🔴 HIGH PRIORITY - Report Page
**File**: `client/src/pages/ReportPage.tsx`

| String | Context |
|--------|---------|
| "AI Pedagogy Mentor is analyzing classroom transcript..." | Toast loading message |
| "AI Coaching analysis complete!" | Toast success message |
| "AI Coaching analysis failed. Falling back to basic heuristics." | Toast error message |
| "Copied report summary" | Toast success |
| "Could not share report right now." | Toast error |
| "Goal saved for tomorrow" | Toast success |
| "Could not save goal" | Toast error |
| Various coaching tips and goal labels | Dynamically rendered |
| Report section titles and descriptions | Various |

**Total**: 15+ strings to translate

---

### 🟡 MEDIUM PRIORITY - Portfolio Page
**File**: `client/src/pages/PortfolioPage.tsx`

| String | Context | Notes |
|--------|---------|-------|
| "Anjali Kulkarni" | Hardcoded teacher name | Should be dynamic |
| "Certified Coach" | Badge | Once you have user data |
| "Average Score {averageScore}" | Badge | Template string |
| "{sessionCount} Sessions" | Badge | Template string |
| "Export Portfolio Data" | Button | 1 |
| "Bookmarks are coming soon." | Toast message | 1 |
| "Pedagogy Impact" | Section title | 1 |
| "Questions Asked" | Stat label | 1 |
| "Wait-Time Mastery" | Stat label | 1 |
| "Inclusion Improvement" | Stat label | 1 |
| "Student Voice Ratio" | Stat label | 1 |
| "Badges & Achievements" | Section title | 1 |
| "View All" | Button | 1 |
| Badge titles (6): "Inclusion Hero", "Wait-Time Expert", "Safety Guide", "Consistent Growth", "100 Sessions" | Achievement names | Multiple |
| Dates (May, Apr, Mar, Feb) | Month names | 4 |
| "Rising", "Stable", "Growing" | Status labels | 3 |
| "All badges are already visible here." | Toast message | 1 |
| "Next: Master Mentor" | Placeholder | 1 |
| "Growth Timeline" | Section title | 1 |

**Total**: 20+ strings to translate

---

### 🟡 MEDIUM PRIORITY - Admin Page
**File**: `client/src/pages/AdminPage.tsx`

| String | Context |
|--------|---------|
| Page headings and section titles | Multiple |
| Filter options: "excellent", "growing", "at-risk" | Filter categories |
| Column headers | Table display |
| "PD plan exported" | Toast success |
| Analytics descriptions | Multiple |
| "Search schools or teachers" | Search placeholder |

**Total**: 15+ strings to translate

---

### 🟡 MEDIUM PRIORITY - Components

#### Layout.tsx
| String | Context |
|--------|---------|
| "High contrast" | Button in sidebar |

#### SyncStatusBar.tsx
| String | Context |
|--------|---------|
| "Syncing" | Status label |
| "{queueCount} pending" | Status when offline |
| "Online" | Status label |
| "queued" | Badge label |
| "Demo mode" | Badge |
| "Consent saved" | Badge |
| "Sync now" | Button |

#### LiveTranscriptFeed.tsx (stt/ui/)
| String | Context |
|--------|---------|
| "No errors" | Default error message |
| "syncing", "error", "ready" | Sync status states |

#### TranscriptionView.tsx (stt/ui/)
| String | Context |
|--------|---------|
| "Ready", "Loading", "Fallback mode" | Engine status |
| "Loading Whisper diagnostics..." | Suspense fallback |
| "Transcription engine error" | Error message |
| "Model cache failed; live fallback still available." | Error message |

---

### ✅ ALREADY TRANSLATED
**File**: `client/src/components/ConsentModal.tsx`

This file already has **complete translations for all 6 languages** in a `consentCopy` object:
```typescript
const consentCopy: Record<string, { title; body; action; footer }> = {
  en: { title: '...', body: '...', action: '...', footer: '...' },
  hi: { ... },
  mr: { ... },
  te: { ... },
  kn: { ... },
  ta: { ... },
}
```

**Status**: ✅ No action needed

---

## 4. Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| Already Translated Keys | 22 | ✅ Done |
| Landing Page Hardcoded | 12 | 🔴 High Priority |
| Dashboard Hardcoded | 20+ | 🔴 High Priority |
| Record Page Hardcoded | 18+ | 🔴 High Priority |
| Report Page Hardcoded | 15+ | 🔴 High Priority |
| Portfolio Page Hardcoded | 20+ | 🟡 Medium Priority |
| Admin Page Hardcoded | 15+ | 🟡 Medium Priority |
| Components Hardcoded | 20+ | 🟡 Medium Priority |
| **Total Hardcoded Strings** | **~135** | **NEEDS ACTION** |

---

## 5. Recommended Migration Path

### Phase 1: Add Core Keys (Quick Win)
Add to `client/src/lib/i18n.ts`:
```typescript
// UI Labels & Buttons
"week": "Week",
"month": "Month",
"last_7_days": "Last 7 days",
"this_month": "This month",
"get_started": "Get Started",
"view_history": "View History",

// Status Messages
"ready": "Ready",
"loading": "Loading",
"syncing": "Syncing",
"offline": "Offline",
"processing": "Processing",

// Empty States
"no_sessions": "No sessions yet. Start one recording to generate your first report.",
"start_recording_btn": "Start recording",

// Error Messages
"microphone_permission_denied": "Microphone permission denied",
"microphone_permission_required": "Please allow microphone access in your browser settings...",
// ... etc
```

### Phase 2: Update LandingPage
- Replace hardcoded feature strings with i18n keys
- Create separate keys for features array

### Phase 3: Update Dashboard
- Replace all button labels with i18n
- Convert placeholder text
- Translate section headings

### Phase 4: Update RecordPage, ReportPage, PortfolioPage
- Convert status labels
- Translate toast messages
- Update error messages

### Phase 5: Consolidate Toast Messages
- Create a separate `toasts` namespace or create keys like:
  - `toast_microphone_granted`
  - `toast_microphone_denied`
  - `toast_session_saved`
  - etc.

---

## 6. File Organization Recommendations

Consider reorganizing `i18n.ts` to use namespaces for better maintainability:

```
client/src/lib/
├── i18n.ts (main config)
├── i18n-languages.ts (language labels)
└── translations/ (optional - future)
    ├── en.json
    ├── hi.json
    ├── mr.json
    ├── te.json
    ├── kn.json
    └── ta.json
```

This would allow:
- Separation by language
- Easier external translator collaboration
- Smaller bundle (could load language on demand)
- Better organization for 135+ keys

---

## 7. Testing Recommendations

After translation:
1. **Visual Regression**: Check all UI elements layout with longest translation (German/Spanish would be, but here watch for Telugu/Tamil)
2. **RTL Support**: If adding RTL languages later, test layout
3. **Fallback**: Verify missing translations fall back to English
4. **Mobile**: Test all translated strings on mobile views
5. **Toast Messages**: Verify all toasts display correctly
6. **Empty States**: Check empty state messages in all languages

---

## 8. Implementation Checklist

- [ ] Add 135+ new translation keys to i18n.ts
- [ ] Translate all keys for: hi, mr, te, kn, ta
- [ ] Update LandingPage.tsx
- [ ] Update Dashboard.tsx
- [ ] Update RecordPage.tsx
- [ ] Update ReportPage.tsx
- [ ] Update PortfolioPage.tsx
- [ ] Update AdminPage.tsx
- [ ] Update Layout.tsx
- [ ] Update SyncStatusBar.tsx
- [ ] Update LiveTranscriptFeed.tsx
- [ ] Update TranscriptionView.tsx
- [ ] Test all pages in all 6 languages
- [ ] Test mobile layouts
- [ ] Test empty states
- [ ] Test error messages

---

## 9. Code Examples

### Before (Hardcoded)
```tsx
<h1 className="text-3xl font-bold">Dashboard</h1>
<p className="text-ink/60">Track session outcomes, participation balance...</p>
<Button>Week</Button>
<Button>Month</Button>
```

### After (Using i18n)
```tsx
const { t } = useTranslation();

<h1 className="text-3xl font-bold">{t('dashboard')}</h1>
<p className="text-ink/60">{t('dashboard_subtitle')}</p>
<Button>{t('week')}</Button>
<Button>{t('month')}</Button>
```

---

## Conclusion

The Disha project has a **solid i18n foundation** with i18next already configured for 6 languages. The ConsentModal is already fully translated as a good example. However, **~135 UI strings are still hardcoded** and prevent full language switching. 

**Priority**: Translate high-impact pages first (LandingPage, Dashboard, RecordPage) which account for ~50+ strings and represent the core user experience.

**Effort**: 2-3 days with translators for 6 languages
