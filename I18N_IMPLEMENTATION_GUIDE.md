# Current i18n.ts & Suggested Additions

## Current i18n.ts Structure

Below is the **current working i18n configuration** with all 22 existing keys for 6 languages.

---

## What to Add

### Phase 1: Core Translations (Add these first)

Suggested additions to replace most critical hardcoded strings:

```javascript
// UI Buttons & Labels
"week": "Week",
"month": "Month",
"last_7_days": "Last 7 days",
"this_month": "This month",
"get_started": "Get Started",
"view_history": "View History",
"start_recording_btn": "Start recording",
"export_portfolio": "Export Portfolio Data",
"sync_now": "Sync now",
"grant_access": "Grant Access",
"view_all": "View All",
"play_coaching_note": "Play coaching note",

// Page Titles & Headings
"dashboard": "Dashboard",  // Already exists but verify
"landing_main": "AI-Powered Classroom Intelligence for Teachers",
"pedagogy_impact": "Pedagogy Impact",
"badges_achievements": "Badges & Achievements",
"growth_timeline": "Growth Timeline",

// Subtitles & Descriptions
"dashboard_subtitle": "Track session outcomes, participation balance, and coaching insights with transparent prototype-safe indicators.",
"landing_subtitle": "Receive actionable teaching insights, classroom analytics, and personalized coaching after every lesson.",
"landing_feature_1": "Understand classroom patterns, student engagement, and instructional strengths after every lesson.",
"landing_feature_2": "Track attendance, participation, and speaking balance with clear visual reports.",
"landing_feature_3": "Receive tailored recommendations to improve pacing, questioning, and feedback strategies.",
"landing_feature_4": "Built for diverse classrooms with support for multiple teaching languages and curriculums.",

// Status Messages
"ready": "Ready",
"loading": "Loading",
"syncing": "Syncing",
"offline": "Offline",
"online": "Online",
"processing": "Processing",
"paused": "Paused",

// Feature Titles
"classroom_intelligence": "Classroom intelligence",
"ai_teaching_insights": "AI Teaching Insights",
"classroom_analytics": "Classroom Analytics",
"personalized_coaching": "Personalized Coaching",
"multilingual_support": "Multilingual Support",
```

### Phase 2: Error & Alert Messages

```javascript
// Microphone & Permission Errors
"mic_permission_denied_title": "Microphone permission denied",
"mic_permission_denied_desc": "Please allow microphone access in your browser settings to record your classroom lessons. You can still use the fallback demo mode below.",
"mic_unsupported_title": "Microphone access unsupported",
"mic_unsupported_desc": "Your browser doesn't support microphone recording. Please use a modern browser like Chrome, Safari, or Firefox. fallbacks will be used.",
"stt_unsupported_desc": "This browser doesn't support live speech recognition. The recording will save successfully, and a fallback transcript will be generated once recording ends.",

// Recording Status
"live_stt": "Live speech recognition",
"fallback_recording": "Recording with fallback transcript",
"ready_live": "Ready for live transcription",
"ready_fallback": "Ready for fallback transcript",

// Toast Messages
"toast_mic_granted": "Microphone permission granted!",
"toast_mic_denied": "Microphone permission denied. Please enable it in browser settings.",
"toast_mic_start_failed": "Could not start microphone. Falling back to demo transcript.",
"toast_stt_unavailable": "Live browser STT unavailable. Using deterministic transcript fallback when recording ends.",
"toast_recording_started": "Recording started",
"toast_session_pending": "Session saved. Transcription is pending.",
"toast_session_analyzed": "Session analyzed and saved",
"toast_analyzing": "AI Pedagogy Mentor is analyzing classroom transcript...",
"toast_coaching_complete": "AI Coaching analysis complete!",
"toast_coaching_failed": "AI Coaching analysis failed. Falling back to basic heuristics.",
"toast_report_copied": "Copied report summary",
"toast_share_failed": "Could not share report right now.",
"toast_goal_saved": "Goal saved for tomorrow",
"toast_goal_failed": "Could not save goal",
"toast_pd_exported": "PD plan exported",
"toast_bookmarks_coming": "Bookmarks are coming soon.",
```

### Phase 3: Dashboard & Portfolio Content

```javascript
// Dashboard
"inclusion_rising": "Inclusion rising",
"completed_sessions": "{count} completed",
"participation": "Participation",
"student_voice_increased": "Student voice-time increased from the previous session.",
"no_sessions": "No sessions yet. Start one recording to generate your first report.",
"trend_updates": "Trend updates",
"offline_snapshot": "Offline snapshot",
"live_snapshot": "Live snapshot",
"coaching": "Coaching",
"ai_coaching_suggestions": "AI-generated coaching suggestions",
"next_coaching": "Your next coaching card will appear after the first analyzed session.",

// Portfolio Statistics
"questions_asked": "Questions Asked",
"wait_time_mastery": "Wait-Time Mastery",
"inclusion_improvement": "Inclusion Improvement",
"student_voice_ratio": "Student Voice Ratio",
"certified_coach": "Certified Coach",
"avg_score": "Average Score {score}",
"sessions_count": "{count} Sessions",

// Portfolio Badges
"badge_inclusion_hero": "Inclusion Hero",
"badge_wait_time_expert": "Wait-Time Expert",
"badge_safety_guide": "Safety Guide",
"badge_consistent_growth": "Consistent Growth",
"badge_100_sessions": "100 Sessions",
"badge_next": "Next: Master Mentor",

// Portfolio Status
"status_rising": "Rising",
"status_stable": "Stable",
"status_growing": "Growing",

// Months
"month_may": "May",
"month_apr": "Apr",
"month_mar": "Mar",
"month_feb": "Feb",
```

### Phase 4: Admin Page

```javascript
// Admin Filters
"filter_excellent": "Excellent",
"filter_growing": "Growing",
"filter_at_risk": "At-Risk",

// Table Headers
"table_school": "School",
"table_teacher": "Teacher",
"table_class": "Class",
"table_score": "Score",
"table_inclusion": "Inclusion",
"table_participation": "Participation",
"table_growth": "Growth",
"table_export": "Download CSV",
```

### Phase 5: Component Strings

```javascript
// Layout
"high_contrast": "High contrast",

// Sync Status
"sync_queued": "queued",
"sync_demo": "Demo mode",
"sync_consent": "Consent saved",
"sync_pending": "{count} pending",

// Transcription
"engine_ready": "Ready",
"engine_loading": "Loading",
"engine_fallback": "Fallback mode",
"whisper_loading": "Loading Whisper diagnostics...",
"whisper_error": "Transcription engine error",
"whisper_cache_error": "Model cache failed; live fallback still available.",
"transcript_no_errors": "No errors",
```

---

## Translation Template for Each Language

Use this template for each language (hi, mr, te, kn, ta):

```javascript
// Example for Hindi (hi)
hi: {
  translation: {
    // ... keep all existing keys ...
    
    // NEW KEYS - Phase 1
    "week": "सप्ताह",
    "month": "महीना",
    "last_7_days": "पिछले 7 दिन",
    "this_month": "इस महीने",
    "get_started": "शुरुआत करें",
    // ... etc
  }
}
```

**Recommendation**: Work with native speakers for each language to ensure:
- Cultural appropriateness
- Natural phrasing (not literal translations)
- Consistency with existing translations
- Proper grammar and tone

---

## Implementation Strategy

### Option A: All at Once (Comprehensive)
**Pros**: 
- Complete solution immediately
- Better consistency
- Single round of testing

**Cons**: 
- Takes 3-5 days with translators
- More coordination needed
- Higher risk if translators unavailable

### Option B: Phased Approach (Recommended)
**Week 1**: Phase 1 (Core 40 keys) + High-Priority Pages
- Translate core UI buttons and labels
- Update LandingPage, Dashboard, RecordPage
- Test and verify

**Week 2**: Phase 2-3 (Error messages + Portfolio/Admin)
- Complete error message translations
- Update remaining pages
- Full testing

**Week 3**: Polish + Optimization
- Fix any layout issues
- Test on mobile
- Final QA

**Pros**: 
- Can start testing with Phase 1
- Easier to manage translators
- Can iterate and improve
- Users see progress

**Cons**: 
- Takes longer overall
- Multiple testing rounds
- Inconsistency risk if not careful

---

## Testing Checklist

After adding translations for each phase:

### Visual Testing
- [ ] All text displays correctly
- [ ] No overflow on buttons/labels
- [ ] Dialogs/modals properly sized
- [ ] Mobile layout not broken
- [ ] Toast messages visible

### Functional Testing
- [ ] Language switching works
- [ ] Preference persists on refresh
- [ ] Fallback to English works
- [ ] All pages load correctly

### Language-Specific Testing
- [ ] Telugu & Tamil display (complex scripts)
- [ ] Marathi & Kannada render properly
- [ ] No encoding issues
- [ ] Icons align with text properly

### Content Testing
- [ ] No hardcoded English remaining
- [ ] All keys have translations
- [ ] Dynamic values interpolate correctly
- [ ] Error messages are helpful

---

## Suggested Tool Integration

### Option 1: Translation Management Platform
Use a tool like:
- **i18next-http-backend**: Load translations from JSON files
- **Crowdin** or **Lokalise**: Manage translations collaboratively
- **POEditor**: Affordable collaborative translation tool

Benefits:
- Team collaboration
- Translation memory
- Consistency checking
- Version control

### Option 2: JSON Files (Current Setup)
Keep current approach but organize:
```
client/src/lib/
├── i18n.ts
├── translations/
│   ├── en.json
│   ├── hi.json
│   ├── mr.json
│   ├── te.json
│   ├── kn.json
│   └── ta.json
```

### Option 3: Hybrid (Recommended)
```typescript
// i18n.ts - keep for simple/core strings
// translations/*.json - keep for complex/long strings
// Use lazy loading for language-specific bundles
```

---

## Validation Script (Optional)

Create a script to validate all components use i18n:

```bash
#!/bin/bash
# Find remaining hardcoded strings (look for quotes around English text)
grep -r "className=\".*>English Text" client/src/pages/
grep -r "toast\." client/src/pages/ | grep -v t(
```

---

## Final Recommendations

1. **Start with Phase 1** (40 core keys) - Quick win, highest ROI
2. **Get native speaker review** - Don't rely only on Google Translate
3. **Test each phase** before moving to next
4. **Document key naming convention** for consistency
5. **Consider hiring** professional translators for quality (especially for Indian languages)
6. **Create glossary** of technical terms (e.g., "Growth Score", "Inclusion Score")
7. **Plan for future** - If adding more languages, this infrastructure works

---

## Cost Estimate

| Approach | Cost | Time | Quality |
|----------|------|------|---------|
| Google Translate + Manual Review | $200-500 | 1 week | Medium |
| Professional Translators (freelance) | $1,000-2,000 | 1-2 weeks | High |
| Translation Agency | $2,500-5,000 | 1-2 weeks | Very High |
| In-house team (if available) | Variable | 2-4 weeks | Depends |

**Recommended**: Professional freelance translators for Indian languages (Hindi, Marathi, Telugu, Kannada, Tamil) = ~$1,200-1,800 for quality

---

## Key Naming Convention

Suggested standard:
```
{page}_{feature}_{type}_{purpose}

Examples:
- dashboard_range_week
- record_mic_permission_denied_title
- portfolio_badge_inclusion_hero
- toast_session_analyzed
```

Benefits:
- Easy to search
- Self-documenting
- Groups related strings
- Helps with testing

---

## Summary

**Current State**: 
- ✅ 22 keys translated for 6 languages
- ❌ ~114+ strings still hardcoded
- ❌ Limited language coverage on main pages

**After Implementation**:
- ✅ 136+ total translation keys
- ✅ Full multilingual support across all pages
- ✅ Professional quality translations
- ✅ Easy maintenance for future additions

**Effort**: 3-5 days with translators
**ROI**: Enables expansion to 6+ language markets immediately
