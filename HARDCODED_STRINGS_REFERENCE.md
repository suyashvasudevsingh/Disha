# Hardcoded Strings Quick Reference

## Landing Page (LandingPage.tsx)

| Key Name | English Text | Type | Line | Priority |
|----------|--------------|------|------|----------|
| landing_classroom_intelligence | Classroom intelligence | Badge/Tag | ~42 | HIGH |
| landing_main_headline | AI-Powered Classroom Intelligence for Teachers | h1 | ~45 | HIGH |
| landing_subtitle | Receive actionable teaching insights, classroom analytics, and personalized coaching after every lesson. | Subtitle | ~48 | HIGH |
| landing_get_started | Get Started | Button | ~55 | HIGH |
| landing_feature_1_title | AI Teaching Insights | Feature Title | ~16 | HIGH |
| landing_feature_1_desc | Understand classroom patterns, student engagement, and instructional strengths after every lesson. | Feature Desc | ~17 | HIGH |
| landing_feature_2_title | Classroom Analytics | Feature Title | ~19 | HIGH |
| landing_feature_2_desc | Track attendance, participation, and speaking balance with clear visual reports. | Feature Desc | ~20 | HIGH |
| landing_feature_3_title | Personalized Coaching | Feature Title | ~22 | HIGH |
| landing_feature_3_desc | Receive tailored recommendations to improve pacing, questioning, and feedback strategies. | Feature Desc | ~23 | HIGH |
| landing_feature_4_title | Multilingual Support | Feature Title | ~25 | HIGH |
| landing_feature_4_desc | Built for diverse classrooms with support for multiple teaching languages and curriculums. | Feature Desc | ~26 | HIGH |

**Total LandingPage**: 12 strings | Estimated chars: 1,200

---

## Dashboard (Dashboard.tsx)

| Key Name | English Text | Type | Line | Priority |
|----------|--------------|------|------|----------|
| dashboard_title | Dashboard | h1 Title | ~77 | HIGH |
| dashboard_subtitle | Track session outcomes, participation balance, and coaching insights with transparent prototype-safe indicators. | Subtitle | ~78 | HIGH |
| dashboard_range_week | Week | Button | ~82 | HIGH |
| dashboard_range_month | Month | Button | ~88 | HIGH |
| dashboard_last_7_days | Last 7 days | Label | ~69 | HIGH |
| dashboard_this_month | This month | Label | ~69 | HIGH |
| dashboard_growth_card_title | Growth Score | Card Title | (uses t('growth_score')) | ✅ |
| dashboard_inclusion_card_badge | Inclusion rising | Badge | ~123 | HIGH |
| dashboard_inclusion_card_title | Inclusion Score | Card Title | (uses t('inclusion_score')) | ✅ |
| dashboard_participation_card_title | Participation | Card Title | ~168 | HIGH |
| dashboard_participation_note | Student voice-time increased from the previous session. | Text | ~170 | HIGH |
| dashboard_view_history | View History | Button | ~181 | HIGH |
| dashboard_no_sessions | No sessions yet. Start one recording to generate your first report. | Empty State | ~195 | HIGH |
| dashboard_start_recording_btn | Start recording | Button | ~196 | HIGH |
| dashboard_trend_heading | Trend updates | Section h2 | ~224 | HIGH |
| dashboard_offline_snapshot | Offline snapshot | Badge | ~228 | HIGH |
| dashboard_live_snapshot | Live snapshot | Badge | ~228 | HIGH |
| dashboard_coaching_heading | Coaching | Section h2 | ~243 | MEDIUM |
| dashboard_coaching_badge | AI-generated coaching suggestions | Badge | ~244 | MEDIUM |
| dashboard_coaching_placeholder | Your next coaching card will appear after the first analyzed session. | Placeholder | ~261 | MEDIUM |
| dashboard_play_coaching_note | Play coaching note | Button | ~268 | HIGH |
| dashboard_completed_sessions | {count} completed | Badge Dynamic | ~163 | HIGH |

**Total Dashboard**: 20+ strings | Estimated chars: 1,800

---

## Record Page (RecordPage.tsx)

### Alerts & Permissions

| Key Name | English Text | Type | Line | Priority |
|----------|--------------|------|------|----------|
| record_mic_denied_title | Microphone permission denied | Alert Title | ~227 | HIGH |
| record_mic_denied_desc | Please allow microphone access in your browser settings to record your classroom lessons. You can still use the fallback demo mode below. | Alert Desc | ~229 | HIGH |
| record_mic_denied_btn | Grant Access | Button | ~233 | HIGH |
| record_mic_unsupported_title | Microphone access unsupported | Alert Title | ~238 | HIGH |
| record_mic_unsupported_desc | Your browser doesn't support microphone recording. Please use a modern browser like Chrome, Safari, or Firefox. fallbacks will be used. | Alert Desc | ~240 | HIGH |
| record_stt_unsupported_title | Live speech recognition unavailable | Info Box Title | ~245 | MEDIUM |
| record_stt_unsupported_desc | This browser doesn't support live speech recognition. The recording will save successfully, and a fallback transcript will be generated once recording ends. | Info Box Desc | ~247 | MEDIUM |

### Status Labels

| Key Name | English Text | Type | Line | Priority |
|----------|--------------|------|------|----------|
| record_status_live_stt | Live speech recognition | Status | ~215 | HIGH |
| record_status_fallback_recording | Recording with fallback transcript | Status | ~215 | HIGH |
| record_status_ready_live | Ready for live transcription | Status | ~217 | HIGH |
| record_status_ready_fallback | Ready for fallback transcript | Status | ~217 | HIGH |
| record_status_paused | Paused | Status | ~216 | MEDIUM |
| record_status_processing | Processing | Status | ~218 | MEDIUM |

### Toast Messages

| Key Name | English Text | Context | Priority |
|----------|--------------|---------|----------|
| toast_mic_granted | Microphone permission granted! | Success | HIGH |
| toast_mic_denied | Microphone permission denied. Please enable it in browser settings. | Error | HIGH |
| toast_mic_start_failed | Could not start microphone. Falling back to demo transcript. | Error | HIGH |
| toast_stt_unavailable | Live browser STT unavailable. Using deterministic transcript fallback when recording ends. | Warning | HIGH |
| toast_recording_started | Recording started | Success | HIGH |
| toast_session_pending | Session saved. Transcription is pending. | Success | HIGH |
| toast_session_analyzed | Session analyzed and saved | Success | HIGH |
| toast_fallback_used | Fallback transcript used: {reason} | Warning | MEDIUM |

**Total RecordPage**: 18+ strings | Estimated chars: 1,600

---

## Report Page (ReportPage.tsx)

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| toast_analyzing_coaching | AI Pedagogy Mentor is analyzing classroom transcript... | Toast Loading | HIGH |
| toast_coaching_complete | AI Coaching analysis complete! | Toast Success | HIGH |
| toast_coaching_failed | AI Coaching analysis failed. Falling back to basic heuristics. | Toast Error | HIGH |
| toast_report_copied | Copied report summary | Toast Success | MEDIUM |
| toast_report_share_failed | Could not share report right now. | Toast Error | MEDIUM |
| toast_goal_saved | Goal saved for tomorrow | Toast Success | MEDIUM |
| toast_goal_failed | Could not save goal | Toast Error | MEDIUM |

**Total ReportPage**: 7+ strings | Estimated chars: 800

---

## Portfolio Page (PortfolioPage.tsx)

### Hardcoded Data

| Key Name | English Text | Type | Priority | Notes |
|----------|--------------|------|----------|-------|
| portfolio_teacher_name | Anjali Kulkarni | h1 Name | HIGH | Should be dynamic! |
| portfolio_certified_badge | Certified Coach | Badge | MEDIUM | Dynamic once we have user auth |
| portfolio_avg_score_badge | Average Score {score} | Badge | MEDIUM | Template |
| portfolio_sessions_badge | {count} Sessions | Badge | MEDIUM | Template |
| portfolio_export_btn | Export Portfolio Data | Button | MEDIUM |
| portfolio_bookmarks_toast | Bookmarks are coming soon. | Toast | LOW |

### Section Titles

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| portfolio_pedagogy_impact | Pedagogy Impact | Section h2 | HIGH |
| portfolio_badges_achievements | Badges & Achievements | Section h2 | HIGH |
| portfolio_growth_timeline | Growth Timeline | Section h2 | HIGH |

### Stat Labels

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| portfolio_stat_questions | Questions Asked | Stat Label | HIGH |
| portfolio_stat_wait_time | Wait-Time Mastery | Stat Label | HIGH |
| portfolio_stat_inclusion | Inclusion Improvement | Stat Label | HIGH |
| portfolio_stat_student_voice | Student Voice Ratio | Stat Label | HIGH |

### Badges & Achievements

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| portfolio_badge_inclusion_hero | Inclusion Hero | Badge Title | MEDIUM |
| portfolio_badge_wait_time_expert | Wait-Time Expert | Badge Title | MEDIUM |
| portfolio_badge_safety_guide | Safety Guide | Badge Title | MEDIUM |
| portfolio_badge_consistent_growth | Consistent Growth | Badge Title | MEDIUM |
| portfolio_badge_100_sessions | 100 Sessions | Badge Title | MEDIUM |
| portfolio_badge_next_master | Next: Master Mentor | Placeholder | LOW |

### Timeline

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| month_may | May | Month | MEDIUM |
| month_april | Apr | Month | MEDIUM |
| month_march | Mar | Month | MEDIUM |
| month_february | Feb | Month | MEDIUM |
| portfolio_status_rising | Rising | Status | MEDIUM |
| portfolio_status_stable | Stable | Status | MEDIUM |
| portfolio_status_growing | Growing | Status | MEDIUM |
| portfolio_view_all_btn | View All | Button | MEDIUM |
| portfolio_all_badges_visible | All badges are already visible here. | Toast | LOW |

**Total PortfolioPage**: 25+ strings | Estimated chars: 1,400

---

## Admin Page (AdminPage.tsx)

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| admin_filter_excellent | excellent | Filter Option | MEDIUM |
| admin_filter_growing | growing | Filter Option | MEDIUM |
| admin_filter_at_risk | at-risk | Filter Option | MEDIUM |
| admin_table_school | School | Column Header | MEDIUM |
| admin_table_teacher | Teacher | Column Header | MEDIUM |
| admin_table_class | Class | Column Header | MEDIUM |
| admin_table_score | Score | Column Header | MEDIUM |
| admin_table_inclusion | Inclusion | Column Header | MEDIUM |
| admin_table_participation | Participation | Column Header | MEDIUM |
| admin_table_growth | Growth | Column Header | MEDIUM |
| admin_export_csv | Download CSV | Button | MEDIUM |
| toast_pd_plan_exported | PD plan exported | Toast Success | MEDIUM |

**Total AdminPage**: 12+ strings | Estimated chars: 600

---

## Layout.tsx (Components)

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| ui_high_contrast | High contrast | Button | MEDIUM |
| ui_offline | Offline | Status | MEDIUM |
| ui_sync_ready | Sync ready | Status | MEDIUM |

**Total Layout**: 3 strings

---

## SyncStatusBar.tsx (Components)

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| sync_status_syncing | Syncing | Status | MEDIUM |
| sync_status_pending | {count} pending | Status Dynamic | MEDIUM |
| sync_status_online | Online | Status | MEDIUM |
| sync_queued | queued | Label | MEDIUM |
| sync_demo_mode | Demo mode | Badge | MEDIUM |
| sync_consent_saved | Consent saved | Badge | MEDIUM |
| sync_now_btn | Sync now | Button | MEDIUM |

**Total SyncStatusBar**: 7 strings

---

## LiveTranscriptFeed.tsx (stt/ui/)

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| transcript_no_errors | No errors | Fallback Message | LOW |
| transcript_sync_syncing | syncing | Status | LOW |
| transcript_sync_error | error | Status | LOW |
| transcript_sync_ready | ready | Status | LOW |

**Total LiveTranscriptFeed**: 4 strings

---

## TranscriptionView.tsx (stt/ui/)

| Key Name | English Text | Type | Priority |
|----------|--------------|------|----------|
| engine_status_ready | Ready | Status | MEDIUM |
| engine_status_loading | Loading | Status | MEDIUM |
| engine_status_fallback | Fallback mode | Status | MEDIUM |
| whisper_loading | Loading Whisper diagnostics... | Suspense | LOW |
| whisper_engine_error | Transcription engine error | Error | MEDIUM |
| whisper_cache_error | Model cache failed; live fallback still available. | Error | MEDIUM |

**Total TranscriptionView**: 6 strings

---

## ConsentModal.tsx ✅ COMPLETE

**Status**: Already fully translated for all 6 languages! No action needed.

```typescript
consentCopy: Record<string, { title; body; action; footer }> = {
  en: { title: '...', body: '...', action: '...', footer: '...' },
  hi: { ... },
  mr: { ... },
  te: { ... },
  kn: { ... },
  ta: { ... },
}
```

---

## Summary Statistics

| Category | Count | Est. Characters | Priority |
|----------|-------|-----------------|----------|
| Landing Page | 12 | 1,200 | 🔴 HIGH |
| Dashboard | 20+ | 1,800 | 🔴 HIGH |
| Record Page | 18+ | 1,600 | 🔴 HIGH |
| Report Page | 7+ | 800 | 🟡 MEDIUM |
| Portfolio Page | 25+ | 1,400 | 🟡 MEDIUM |
| Admin Page | 12+ | 600 | 🟡 MEDIUM |
| Layout | 3 | 200 | 🟡 MEDIUM |
| SyncStatusBar | 7 | 400 | 🟡 MEDIUM |
| LiveTranscriptFeed | 4 | 300 | 🟢 LOW |
| TranscriptionView | 6 | 500 | 🟢 LOW |
| **TOTAL** | **~114** | **~10,000** | |
| Already Translated | 22 | (in i18n.ts) | ✅ DONE |
| **Grand Total** | **~136** | **~10,000+** | |

---

## Translation Effort Estimate

### High Priority (50 strings)
- **Time per language**: 2-3 hours
- **Total for 6 languages**: 12-18 hours
- **Includes**: LandingPage, Dashboard, RecordPage

### Medium Priority (60+ strings)
- **Time per language**: 3-4 hours
- **Total for 6 languages**: 18-24 hours
- **Includes**: ReportPage, PortfolioPage, AdminPage, Components

### Low Priority (4+ strings)
- **Time per language**: 30 minutes
- **Total for 6 languages**: 3 hours
- **Includes**: Technical messages (STT/Whisper)

**Total Effort**: 33-45 hours with professional translators
**If using**: Google Translate + manual review: 15-20 hours
**Recommended**: 3-5 days with professional translators for quality

---

## Translation Checklist Template

Use this to track translation progress:

```markdown
### English (en) - BASELINE
- [ ] Landing Page (12 strings)
- [ ] Dashboard (20+ strings)
- [ ] Record Page (18+ strings)
- [ ] Report Page (7+ strings)
- [ ] Portfolio Page (25+ strings)
- [ ] Admin Page (12+ strings)
- [ ] Components (17+ strings)

### Hindi (hi)
- [ ] Landing Page
- [ ] Dashboard
- [ ] Record Page
- [ ] Report Page
- [ ] Portfolio Page
- [ ] Admin Page
- [ ] Components

### Marathi (mr)
- [ ] ...

### Telugu (te)
- [ ] ...

### Kannada (kn)
- [ ] ...

### Tamil (ta)
- [ ] ...
```

---

## Implementation Steps

1. **Create all key names** above in `client/src/lib/i18n.ts`
2. **Provide English values** as baseline
3. **Work with translators** for each language
4. **Update component code** to use `t(keyName)` instead of hardcoded strings
5. **Test each page** in all 6 languages
6. **Verify layout** doesn't break with longer translations
