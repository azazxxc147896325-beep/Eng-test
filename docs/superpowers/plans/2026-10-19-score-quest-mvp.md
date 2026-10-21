# Score Quest MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้าง PWA ฝึกสอบ TOEIC ที่มี Google Login, Full/Quick/Part Practice, ระบบสุ่มตาม blueprint, คะแนนประมาณการ, ประวัติพัฒนาการ และหน้า Admin สำหรับสร้าง Draft ด้วย Gemini แล้วตรวจอนุมัติก่อนเผยแพร่

**Architecture:** ใช้ React SPA แบบ mobile-first บน Vite โดย Supabase ดูแล Auth, Postgres, Storage, Row Level Security และ Edge Functions ฝั่งเว็บเรียก repository interfaces ที่แยกจาก UI เพื่อทดสอบ exam engine ได้โดยไม่พึ่ง network ระบบสร้างโจทย์และ TTS ทำงานเฉพาะฝั่ง server และเผยแพร่ได้หลัง human review เท่านั้น

**Tech Stack:** React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, i18next, Zod, Supabase, Deno Edge Functions, Gemini Developer API, vite-plugin-pwa, Vitest, Testing Library, Playwright, axe-core

**Original product spec:** `docs/superpowers/specs/2026-10-19-toeic-practice-webapp-design.md` — ยังไม่พบไฟล์นี้ใน repository ปัจจุบัน จึงต้องกู้คืนหรือสร้างใหม่ก่อนตรวจ requirement รอบสุดท้าย

**Admin MVP spec:** `docs/superpowers/specs/2026-10-20-admin-console-design.md` — อยู่ใน branch `feature/admin-mvp` และจะเข้า `main` หลัง merge

## Implementation Status Update — 2026-10-21

- Admin MVP พัฒนาและ commit แล้วใน branch `feature/admin-mvp` (`8cbc945`) แต่ยังไม่ได้ merge เข้า `main`
- เพิ่มหน้าภาพรวม, คลังข้อสอบ, คิวตรวจ, ตัวแก้ไข Draft, นำเข้าไฟล์ และจัดการสิทธิ์ผู้ใช้
- หน้า `/admin` ทุกหน้าบังคับ role `admin`; การเปลี่ยน role และการนำเข้าหลาย Draft ตรวจสิทธิ์ซ้ำใน Supabase RPC
- รองรับการนำเข้า `.xlsx`, `.csv`, `.json`, `.jsonl` สูงสุด 5 MB และ 200 ชุดต่อครั้ง โดย CSV/XLSX ใช้เทมเพลต Part 5
- รองรับภาษาไทย/อังกฤษและหน้าจอ 320px, iPad 768px และ desktop 1440px
- Verification ล่าสุด: Vitest 58/58, Playwright 10/10, TypeScript, production build และ `npm audit` ผ่าน
- ยังต้อง merge branch, push GitHub และรัน `npx supabase db push` เพื่อใช้ migration `0010_admin_console.sql` บน Supabase จริง
- งานหลัง Admin MVP: เพิ่มตัวแก้ไข choices/translations/media แบบเต็ม, ส่งกลับให้แก้ไขจากคิวตรวจ, TTS และคลังข้อสอบที่ผ่าน human review

## Global Constraints

- Project root คือ `/Users/a1/Eng-test/Eng-test`; เก็บ source และเอกสาร implementation ภายใน Git repository นี้
- Full Test ต้องมี 200 ข้อ: Listening 100 ข้อ/45 นาที ตาม Part 1–4 และ Reading 100 ข้อ/75 นาที ตาม Part 5–7
- Full/Quick Listening เล่นอัตโนมัติครั้งเดียว ห้าม pause, seek, replay และย้อนกลับ; Practice อนุญาตทั้งหมด
- ตัวโจทย์และตัวเลือกเป็นภาษาอังกฤษ; UI, เฉลย คำแปล และคำอธิบายรองรับ `th`/`en`
- เฉลย คำตอบที่ถูก และ transcript ต้องไม่ถูกส่งถึง browser ของ active attempt ก่อน submit
- Full Test และ Quick Test สุ่มภายใน Part ตาม blueprint เท่านั้น และรักษา question group ให้ครบ
- หน้า exam ต้องไม่เกิด document-level vertical scrolling; Part 7 เลื่อนเฉพาะกรอบเอกสารหรือใช้ tabs
- รองรับมือถือ, iPad แนวตั้ง/แนวนอน, desktop และติดตั้งเป็น PWA ได้
- Gemini, Google OAuth secret และ Supabase service-role key อยู่ server-side เท่านั้น
- AI สร้างได้เฉพาะ Draft; ผู้สร้างห้ามอนุมัติงานของตนเอง
- คะแนนทุกหน้าต้องใช้คำว่า “คะแนนประมาณการ” และระบุว่าไม่ใช่ผล TOEIC อย่างเป็นทางการ
- เนื้อหาต้องเป็นต้นฉบับใหม่ ห้ามคัดลอกข้อสอบหรือสื่อของ ETS

## Review Focus

- Reload/กลับเข้า attempt เดิมต้องได้ question snapshot และเวลาสิ้นสุดเดิม ไม่สุ่มใหม่ — ทดสอบใน Task 7
- Listening event ซ้ำจาก React re-render ต้องไม่ทำให้เสียงเล่นซ้ำหรือปลดล็อกการย้อน — ทดสอบใน Task 9
- ผู้ใช้ที่แก้ client clock หรือกลับมาออนไลน์หลัง deadline ต้องแก้คำตอบย้อนหลังไม่ได้ — ทดสอบใน Task 7 และ Task 15
- RLS ต้องกันทั้งผู้ใช้ข้ามบัญชีและ reviewer ที่พยายาม publish — ทดสอบใน Task 3 และ Task 12
- Mobile viewport เตี้ย, notch และคีย์บอร์ดเสมือนต้องไม่บังตัวเลือกหรือปุ่ม Next — ทดสอบใน Task 8 และ Task 16

---

## File Structure

```text
src/
  app/                 router, providers, guards
  auth/                Google login and session state
  i18n/                th/en resources and formatter
  shell/               game-like home/navigation/mode select
  exam/domain/         blueprints, selection, timing, scoring types
  exam/data/           Supabase repositories and DTO mapping
  exam/session/        attempt store, autosave, offline queue
  exam/ui/             fixed-viewport exam components
  results/             score, review, history and progress charts
  admin/               content workflow, import and generation UI
  shared/              design tokens, UI primitives and utilities
supabase/
  migrations/          schema, RLS and database functions
  functions/           Gemini/TTS/server-only operations
  tests/               pgTAP or SQL policy tests
tests/e2e/              Playwright journeys
scripts/                content validation/import utilities
public/                 PWA icons and static assets
```

### Task 1: Scaffold the tested PWA application

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`
- Create: `.env.example`, `.gitignore`, `README.md`
- Test: `src/app/App.test.tsx`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: Vite commands `dev`, `build`, `test`, `test:e2e`, `typecheck`; route `/`; environment names `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

- [ ] **Step 1: Write smoke tests**

```ts
expect(screen.getByRole('main')).toBeInTheDocument()
await expect(page.locator('main')).toBeVisible()
```

- [ ] **Step 2: Run tests and verify they fail because the app is not scaffolded**

Run: `npm test -- --run src/app/App.test.tsx && npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: FAIL because configuration/source files do not exist

- [ ] **Step 3: Scaffold Vite React TypeScript and install the declared runtime/test dependencies**

Keep `main.tsx` limited to mounting `App`; define all routes in `src/app/router.tsx`.

- [ ] **Step 4: Add environment validation and repository documentation**

`README.md` must explain local Node requirements, commands, Supabase prerequisites and that secrets never use the `VITE_` prefix.

- [ ] **Step 5: Run smoke, type and build checks**

Run: `npm test -- --run && npm run typecheck && npm run build && npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: all commands PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Score Quest PWA"
```

### Task 2: Add the bilingual design system and installable shell

**Files:**
- Create: `src/shared/styles/tokens.css`, `src/shared/styles/global.css`
- Create: `src/shared/ui/Button.tsx`, `Card.tsx`, `ProgressBar.tsx`, `LanguageSwitch.tsx`
- Create: `src/i18n/index.ts`, `src/i18n/locales/th.json`, `src/i18n/locales/en.json`
- Create: `src/shell/AppShell.tsx`, `src/shell/HomePage.tsx`, `src/shell/ModeSelectPage.tsx`
- Create: `public/icons/*`, `public/manifest.webmanifest`
- Modify: `vite.config.ts`, `src/app/router.tsx`
- Test: `src/i18n/index.test.ts`, `src/shell/HomePage.test.tsx`, `tests/e2e/pwa.spec.ts`

**Interfaces:**
- Produces: `setLanguage(locale: 'th' | 'en'): void`; routes `/home`, `/play`; reusable UI primitives; PWA manifest/service worker

- [ ] **Step 1: Write failing language, home and manifest tests**

```ts
expect(t('home.play', { lng: 'th' })).toBe('เล่น')
expect(t('home.play', { lng: 'en' })).toBe('Play')
expect(screen.getByRole('button', { name: /เล่น|Play/ })).toBeVisible()
```

- [ ] **Step 2: Run tests and verify missing i18n/shell modules fail**

Run: `npm test -- --run src/i18n/index.test.ts src/shell/HomePage.test.tsx`
Expected: FAIL with module-not-found

- [ ] **Step 3: Implement tokens, responsive AppShell and game-like Home/Mode Select**

Use a restrained blue/green palette, large Play CTA, bottom navigation on phones and sidebar/top navigation on larger screens.

- [ ] **Step 4: Implement i18next resources and locale persistence**

Persist only the locale key; fall back to English when a translation key is absent.

- [ ] **Step 5: Configure PWA metadata and offline app-shell caching**

Do not cache answer keys, review API responses or authenticated JSON.

- [ ] **Step 6: Verify unit, build and PWA browser tests**

Run: `npm test -- --run && npm run build && npm run test:e2e -- tests/e2e/pwa.spec.ts`
Expected: tests PASS and browser observes manifest + registered service worker

- [ ] **Step 7: Commit**

```bash
git add src public vite.config.ts
git commit -m "feat: add bilingual installable app shell"
```

### Task 3: Create Supabase schema, roles and RLS

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/0001_profiles_roles.sql`
- Create: `supabase/migrations/0002_question_bank.sql`
- Create: `supabase/migrations/0003_attempts_scores.sql`
- Create: `supabase/migrations/0004_rls.sql`
- Create: `supabase/tests/rls.test.sql`
- Create: `src/shared/supabase/client.ts`, `src/shared/supabase/database.types.ts`

**Interfaces:**
- Produces: tables from the spec; enums `app_role`, `content_status`, `attempt_status`, `exam_mode`; `createBrowserClient()`; generated `Database` type

- [ ] **Step 1: Write failing SQL policy tests**

Assert: user A cannot select/update user B profile/attempts; reviewer cannot publish/retire; creator cannot approve own question; admin can perform all declared operations.

- [ ] **Step 2: Start local Supabase and run tests to verify schema is absent**

Run: `npx supabase start && npx supabase test db`
Expected: FAIL because referenced relations/policies do not exist

- [ ] **Step 3: Implement normalized schema with immutable question versions and group/media relations**

Every published attempt item must reference `question_version_id`, not a mutable question row.

- [ ] **Step 4: Implement RLS, role helper functions and audit triggers**

Use server-side claims/table lookup; never trust a role passed by the browser.

- [ ] **Step 5: Generate TypeScript database types**

Run: `npx supabase gen types typescript --local > src/shared/supabase/database.types.ts`
Expected: generated types include all migrations

- [ ] **Step 6: Run SQL tests and reset twice for migration repeatability**

Run: `npx supabase db reset && npx supabase test db && npx supabase db reset`
Expected: PASS both resets and all RLS assertions

- [ ] **Step 7: Commit**

```bash
git add supabase src/shared/supabase
git commit -m "feat: add secure Supabase data model"
```

### Task 4: Implement Google authentication and route protection

**Files:**
- Create: `src/auth/AuthProvider.tsx`, `src/auth/LoginPage.tsx`, `src/auth/AuthCallbackPage.tsx`
- Create: `src/app/RequireUser.tsx`, `src/app/RequireRole.tsx`
- Modify: `src/app/router.tsx`, `src/shell/AppShell.tsx`
- Test: `src/auth/AuthProvider.test.tsx`, `src/app/RequireRole.test.tsx`
- Test: `tests/e2e/auth.spec.ts`

**Interfaces:**
- Produces: `useAuth(): { user; profile; roles; loading; signInWithGoogle; signOut }`; protected user/admin routes

- [ ] **Step 1: Write failing auth and guard tests**

```ts
expect(signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }))
expect(screen.getByText(/ไม่มีสิทธิ์|not authorized/i)).toBeVisible()
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- --run src/auth/AuthProvider.test.tsx src/app/RequireRole.test.tsx`
Expected: FAIL because providers/guards are missing

- [ ] **Step 3: Implement Google redirect login, callback recovery and profile bootstrap**

Use mobile-safe redirect flow and preserve intended route after login.

- [ ] **Step 4: Implement loading, unauthenticated and role guard states**

Do not render protected children before both session and role resolution finish.

- [ ] **Step 5: Verify unit and mocked E2E auth journeys**

Run: `npm test -- --run && npm run test:e2e -- tests/e2e/auth.spec.ts`
Expected: PASS login redirect, callback, sign-out and blocked admin access

- [ ] **Step 6: Commit**

```bash
git add src/auth src/app tests/e2e/auth.spec.ts
git commit -m "feat: add Google authentication and guards"
```

### Task 5: Define exam blueprints and question selection

**Files:**
- Create: `src/exam/domain/types.ts`, `blueprints.ts`, `selector.ts`, `random.ts`
- Create: `src/exam/data/QuestionRepository.ts`, `SupabaseQuestionRepository.ts`
- Create: `src/exam/domain/__fixtures__/questions.ts`
- Test: `src/exam/domain/blueprints.test.ts`, `selector.test.ts`

**Interfaces:**
- Produces: `FULL_BLUEPRINT`, `QUICK_BLUEPRINT`; `buildSelection(blueprint, candidates, history, seed): SelectedGroup[]`; `QuestionRepository.listEligible(filters)`
- [ ] **Step 1: Write failing blueprint and deterministic-selection tests**

```ts
expect(FULL_BLUEPRINT.totalQuestions).toBe(200)
expect(countByPart(selection)).toEqual({ 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 })
expect(ids(select(seed))).toEqual(ids(select(seed)))
expect(allGroupsRemainWhole(selection)).toBe(true)
```

- [ ] **Step 2: Run tests and verify domain modules are missing**

Run: `npm test -- --run src/exam/domain/blueprints.test.ts src/exam/domain/selector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement exact Full/Quick/Practice blueprint types and seeded random utility**

Do not encode DB access in domain files.

- [ ] **Step 4: Implement selector with Part isolation, group integrity, recent-history exclusion and safe choice shuffling**

Fail with a typed `InsufficientQuestionPoolError` listing deficient slots instead of silently changing the blueprint.

- [ ] **Step 5: Implement Supabase repository mapping and Zod validation**

Return prompt/media/choices only; never return solution/explanation fields for active-exam queries.

- [ ] **Step 6: Run unit tests including insufficient-pool and unsafe-shuffle cases**

Run: `npm test -- --run src/exam/domain`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/exam
git commit -m "feat: add blueprint-based question selection"
```

### Task 6: Add server-created attempt snapshots

**Files:**
- Create: `supabase/migrations/0005_attempt_rpc.sql`
- Create: `supabase/functions/create-attempt/index.ts`
- Create: `supabase/functions/_shared/auth.ts`, `_shared/cors.ts`
- Create: `src/exam/data/AttemptRepository.ts`, `SupabaseAttemptRepository.ts`
- Test: `supabase/tests/attempt_rpc.test.sql`, `src/exam/data/AttemptRepository.test.ts`

**Interfaces:**
- Produces: `AttemptRepository.create(input): Promise<AttemptSnapshot>`; `resume(attemptId)`; server fields `started_at`, `section_expires_at`, `seed`, immutable ordered `attempt_items`

- [ ] **Step 1: Write failing tests for atomic snapshot creation and replay safety**

Assert two calls with same idempotency key return the same attempt; reload returns identical item order; solutions are absent.

- [ ] **Step 2: Run SQL/repository tests and confirm failure**

Run: `npx supabase test db && npm test -- --run src/exam/data/AttemptRepository.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement transactional attempt RPC and authenticated Edge Function**

The server chooses candidates, stores ordered question versions/choice order and returns only active-exam payload.

- [ ] **Step 4: Implement repository adapter and typed errors**

Map `409` insufficient pool and existing in-progress attempt into explicit domain errors.

- [ ] **Step 5: Verify atomicity, RLS and idempotency**

Run: `npx supabase db reset && npx supabase test db && npm test -- --run src/exam/data/AttemptRepository.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase src/exam/data
git commit -m "feat: create immutable exam attempts"
```

### Task 7: Implement session timing, navigation and autosave

**Files:**
- Create: `src/exam/session/useAttemptStore.ts`, `clock.ts`, `offlineQueue.ts`
- Create: `src/exam/data/ResponseRepository.ts`, `SupabaseResponseRepository.ts`
- Test: `src/exam/session/useAttemptStore.test.ts`, `clock.test.ts`, `offlineQueue.test.ts`

**Interfaces:**
- Produces: `useAttemptStore`; `remainingMs(serverNow, expiresAt)`; `queueResponse(response)`; `flushResponses()`
- [ ] **Step 1: Write failing reload, deadline, navigation and queue tests**

```ts
expect(resumed.seed).toBe(original.seed)
expect(remainingMs(serverNow, expiresAt)).toBeGreaterThanOrEqual(0)
expect(repository.save).not.toHaveBeenCalledWith(expect.objectContaining({ answeredAt: afterDeadline }))
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- --run src/exam/session`
Expected: FAIL

- [ ] **Step 3: Implement store state machine for answer, mark, next, previous and section transition**

Separate `currentItemIndex` from listening progression rules supplied by Task 9.

- [ ] **Step 4: Implement server-offset clock and deadline enforcement**

Use server timestamps from attempt responses; browser clock is display-only after offset calculation.

- [ ] **Step 5: Implement IndexedDB response queue with idempotent upserts**

Discard/flag mutations created after server deadline and preserve the last pre-deadline answer per item.

- [ ] **Step 6: Run tests with fake timers and reload scenarios**

Run: `npm test -- --run src/exam/session`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/exam/session src/exam/data
git commit -m "feat: add resilient timed exam sessions"
```

### Task 8: Build the fixed-viewport responsive exam UI

**Files:**
- Create: `src/exam/ui/ExamPage.tsx`, `ExamLayout.tsx`, `QuestionRenderer.tsx`
- Create: `src/exam/ui/ChoiceList.tsx`, `DocumentPanel.tsx`, `AnswerNavigator.tsx`, `ExamFooter.tsx`
- Create: `src/exam/ui/exam.css`
- Modify: `src/app/router.tsx`
- Test: `src/exam/ui/ExamPage.test.tsx`, `tests/e2e/exam-layout.spec.ts`

**Interfaces:**
- Consumes: `AttemptSnapshot`, `useAttemptStore`
- Produces: route `/attempt/:attemptId`; renderers for all Part 1–7 group/media variants

- [ ] **Step 1: Write failing interaction and viewport tests**

Assert selecting a choice autosaves; Next/Previous work where allowed; phone answer navigator is a dialog; `document.scrollingElement.scrollHeight === innerHeight` at required viewports.

- [ ] **Step 2: Run tests and confirm missing components fail**

Run: `npm test -- --run src/exam/ui/ExamPage.test.tsx && npm run test:e2e -- tests/e2e/exam-layout.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement semantic Part renderers and fixed layout**

Keep controls visible using CSS grid rows `auto minmax(0,1fr) auto`; long Part 7 content scrolls only inside `DocumentPanel`.

- [ ] **Step 4: Implement phone drawer, tablet layout and desktop sidebar**

Use 44px minimum touch targets, safe-area insets and focus return when dialogs close.

- [ ] **Step 5: Verify at phone, short phone, iPad portrait/landscape and desktop sizes**

Run: `npm test -- --run src/exam/ui && npm run test:e2e -- tests/e2e/exam-layout.spec.ts`
Expected: PASS with no document-level vertical scroll

- [ ] **Step 6: Commit**

```bash
git add src/exam/ui src/app/router.tsx tests/e2e/exam-layout.spec.ts
git commit -m "feat: build responsive exam workspace"
```

### Task 9: Enforce Listening playback rules

**Files:**
- Create: `src/exam/session/listeningMachine.ts`
- Create: `src/exam/ui/ListeningPlayer.tsx`, `AudioPreloader.tsx`
- Test: `src/exam/session/listeningMachine.test.ts`, `src/exam/ui/ListeningPlayer.test.tsx`
- Test: `tests/e2e/listening.spec.ts`

**Interfaces:**
- Produces: `transitionListening(state, event): ListeningState`; `ListeningPlayer` events `ready`, `ended`, `error`

- [ ] **Step 1: Write failing state-machine tests**

Assert Full/Quick autoplay once, ignore pause/seek/replay/back events, unlock next at the correct cue, never replay after re-render; Practice permits controls.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- --run src/exam/session/listeningMachine.test.ts src/exam/ui/ListeningPlayer.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement pure Listening state machine**

Model media loading/error explicitly; never derive playback completion from UI index alone.

- [ ] **Step 4: Implement accessible player and preload strategy**

Full/Quick hide native controls; Practice shows allowed controls; preload only the current and next approved asset.

- [ ] **Step 5: Verify duplicate events, reload and failed-audio behavior**

Run: `npm test -- --run src/exam/session/listeningMachine.test.ts src/exam/ui/ListeningPlayer.test.tsx && npm run test:e2e -- tests/e2e/listening.spec.ts`
Expected: PASS; unrecoverable media failure pauses the attempt and records a support event instead of skipping content

- [ ] **Step 6: Commit**

```bash
git add src/exam/session/listeningMachine.ts src/exam/ui/ListeningPlayer.tsx src/exam/ui/AudioPreloader.tsx tests/e2e/listening.spec.ts
git commit -m "feat: enforce realistic listening playback"
```

### Task 10: Submit attempts and calculate estimated scores

**Files:**
- Create: `supabase/migrations/0006_scoring.sql`
- Create: `supabase/functions/submit-attempt/index.ts`
- Create: `src/exam/domain/scoring.ts`, `src/exam/domain/scoreTables.ts`
- Create: `src/results/ResultsPage.tsx`, `ScoreSummary.tsx`, `PartBreakdown.tsx`
- Test: `src/exam/domain/scoring.test.ts`, `supabase/tests/scoring.test.sql`, `src/results/ResultsPage.test.tsx`

**Interfaces:**
- Produces: `scoreAttempt(input, scoringVersion): ScoreResult`; authenticated submit endpoint returning solution-enabled result payload only after finalization

- [ ] **Step 1: Write failing boundary and disclosure tests**

```ts
expect(score.section.listening).toBeGreaterThanOrEqual(5)
expect(score.section.listening).toBeLessThanOrEqual(495)
expect(score.total).toBeGreaterThanOrEqual(10)
expect(screen.getByText(/คะแนนประมาณการ|estimated score/i)).toBeVisible()
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- --run src/exam/domain/scoring.test.ts src/results/ResultsPage.test.tsx && npx supabase test db`
Expected: FAIL

- [ ] **Step 3: Implement versioned lookup tables and per-Part/skill aggregation**

Use separate Listening/Reading tables; never describe them as ETS conversion tables.

- [ ] **Step 4: Implement atomic server submission and immutable score result**

Submission auto-fills unanswered items as incorrect, closes the current section, prevents resubmission mutations and exposes solutions only afterward.

- [ ] **Step 5: Implement bilingual result summary and weakness recommendations**

Quick Test returns a range/confidence label; Practice returns accuracy/skill trend without pretending to be a Full Test score.

- [ ] **Step 6: Verify scoring, double-submit and unauthorized-result tests**

Run: `npm test -- --run src/exam/domain/scoring.test.ts src/results/ResultsPage.test.tsx && npx supabase test db`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add supabase src/exam/domain src/results
git commit -m "feat: add estimated scoring and results"
```

### Task 11: Add post-submit review and progress history

**Files:**
- Create: `src/results/ReviewPage.tsx`, `ReviewQuestion.tsx`, `HistoryPage.tsx`, `ProgressChart.tsx`
- Create: `src/results/resultsRepository.ts`
- Modify: `src/app/router.tsx`, `src/i18n/locales/*.json`
- Test: `src/results/ReviewPage.test.tsx`, `HistoryPage.test.tsx`, `tests/e2e/results.spec.ts`

**Interfaces:**
- Produces: routes `/results/:attemptId`, `/results/:attemptId/review`, `/history`; repository methods `getResult`, `getReview`, `listHistory`

- [ ] **Step 1: Write failing authorization, translation and trend tests**

Assert review endpoint is unavailable before submit; Thai shows translated explanation while preserving English prompt; Full Test trend excludes `timing_unverified` and Practice scores.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- --run src/results`
Expected: FAIL

- [ ] **Step 3: Implement review DTO/repository and bilingual answer review**

Include transcript only in submitted Listening reviews.

- [ ] **Step 4: Implement history filters, previous-attempt comparison and accessible SVG chart**

Charts need a table/text equivalent for screen readers.

- [ ] **Step 5: Verify result/review/history E2E flow**

Run: `npm test -- --run src/results && npm run test:e2e -- tests/e2e/results.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/results src/app/router.tsx src/i18n tests/e2e/results.spec.ts
git commit -m "feat: add answer review and progress history"
```

### Task 12: Build Admin content workflow and import

**Files:**
- Create: `src/admin/AdminLayout.tsx`, `DashboardPage.tsx`, `QuestionEditorPage.tsx`, `ReviewQueuePage.tsx`, `ImportPage.tsx`
- Create: `src/admin/contentSchema.ts`, `contentRepository.ts`
- Create: `scripts/validate-content.ts`, `scripts/import-content.ts`
- Test: `src/admin/contentSchema.test.ts`, `QuestionEditorPage.test.tsx`, `scripts/validate-content.test.ts`
- Test: `tests/e2e/admin-workflow.spec.ts`

**Interfaces:**
- Produces: `ContentDraftSchema`; workflow actions `saveDraft`, `submitForReview`, `approve`, `publish`, `retire`; CLI `npm run content:validate -- file.jsonl`

- [x] **Step 1: Write failing schema, role and workflow-transition tests**

Assert exact choice counts, one correct answer, complete group structure, required translations/media and creator-cannot-approve rule.

- [x] **Step 2: Run tests and confirm failure**

Run: `npm test -- --run src/admin scripts/validate-content.test.ts`
Expected: FAIL

- [x] **Step 3: Implement per-Part Zod schemas and JSONL/CSV validation**

Validation output must include row/group id, field path and actionable message.

- [x] **Step 4: Implement editor, preview, review queue and audited status transitions**

Admin publishing calls server RPC; UI role hiding is not the authorization boundary.

- [x] **Step 5: Implement dashboard pool coverage by Part/status/full-test equivalents**

Coverage must use complete eligible groups, not raw question count alone.

- [ ] **Step 6: Verify admin workflow and RLS in browser tests**

สถานะ: unit/E2E/browser responsive ผ่านแล้ว แต่ยังไม่ได้รัน SQL policy tests ของ migration `0010_admin_console.sql` กับ Supabase remote

Run: `npm test -- --run src/admin scripts && npm run test:e2e -- tests/e2e/admin-workflow.spec.ts && npx supabase test db`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add src/admin scripts tests/e2e/admin-workflow.spec.ts supabase
git commit -m "feat: add reviewed content administration"
```

Implementation commit ปัจจุบัน: `8cbc945 feat: add functional admin console` บน branch `feature/admin-mvp`

### Task 13: Add Gemini draft generation through a provider adapter

**Files:**
- Create: `supabase/functions/generate-question/_providers/types.ts`, `gemini.ts`, `index.ts`
- Create: `supabase/functions/generate-question/prompts/*.ts`
- Create: `supabase/functions/_shared/rateLimit.ts`, `sanitize.ts`
- Create: `src/admin/GenerateQuestionsPanel.tsx`
- Test: `supabase/functions/generate-question/index.test.ts`, `src/admin/GenerateQuestionsPanel.test.tsx`

**Interfaces:**
- Produces: `AIQuestionProvider.generate(request): Promise<ContentDraft[]>`; Edge Function request `{ part, count, difficulty, skills, topic }`; secrets `GEMINI_API_KEY`, `GEMINI_MODEL`

- [ ] **Step 1: Write failing provider-contract and authorization tests**

Assert no browser secret, non-admin/reviewer gets 403, malformed JSON is rejected, generated records are always `draft`, output is sanitized.

- [ ] **Step 2: Run Deno and React tests to confirm failure**

Run: `deno test supabase/functions/generate-question && npm test -- --run src/admin/GenerateQuestionsPanel.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement provider-neutral request/result types and Gemini structured output adapter**

Model name comes from `GEMINI_MODEL`; prompts prohibit copied/proprietary questions and require original workplace scenarios.

- [ ] **Step 4: Implement authenticated Edge Function with quotas, retry and usage logs**

Never retry validation errors; cap count per request and total daily generation per role.

- [ ] **Step 5: Implement Admin generation panel with preview and explicit save-as-draft**

Do not persist provider output until the reviewer chooses Save Draft.

- [ ] **Step 6: Verify mocked provider, rate-limit and invalid-output cases**

Run: `deno test supabase/functions/generate-question && npm test -- --run src/admin/GenerateQuestionsPanel.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add supabase/functions src/admin/GenerateQuestionsPanel.tsx
git commit -m "feat: generate reviewed drafts with Gemini"
```

### Task 14: Add media and TTS approval pipeline

**Files:**
- Create: `supabase/functions/generate-audio/_providers/types.ts`, `geminiTts.ts`, `index.ts`
- Create: `src/admin/MediaReviewPanel.tsx`, `VoiceConfigEditor.tsx`
- Create: `src/exam/data/mediaRepository.ts`
- Test: `supabase/functions/generate-audio/index.test.ts`, `src/admin/MediaReviewPanel.test.tsx`

**Interfaces:**
- Produces: `TTSProvider.synthesize(script, speakers, options): Promise<AudioAsset>`; media states `draft`, `reviewed`, `approved`, `retired`

- [ ] **Step 1: Write failing multi-speaker, secret and publication-gate tests**

Assert audio is generated only from approved script version; published Listening content requires approved audio; media URLs are stored, not regenerated during exams.

- [ ] **Step 2: Run tests and confirm failure**

Run: `deno test supabase/functions/generate-audio && npm test -- --run src/admin/MediaReviewPanel.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement provider interface, Gemini TTS adapter and Storage upload**

Keep voice/accent/pace metadata separate from question text and make provider replaceable.

- [ ] **Step 4: Implement waveform/audio review UI and approval transition**

Require reviewer identity and timestamp; replacing script invalidates previous audio approval.

- [ ] **Step 5: Verify media lifecycle and signed/public URL policy**

Run: `deno test supabase/functions/generate-audio && npm test -- --run src/admin/MediaReviewPanel.test.tsx && npx supabase test db`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/generate-audio src/admin src/exam/data/mediaRepository.ts
git commit -m "feat: add reviewed listening audio pipeline"
```

### Task 15: Harden offline recovery, deletion and privacy behavior

**Files:**
- Create: `supabase/functions/delete-account/index.ts`
- Create: `supabase/migrations/0007_retention.sql`
- Create: `src/shell/ConnectivityBanner.tsx`, `src/exam/session/RecoveryDialog.tsx`
- Modify: `src/exam/session/offlineQueue.ts`, `src/shell/AppShell.tsx`
- Test: `supabase/tests/retention.test.sql`, `src/exam/session/RecoveryDialog.test.tsx`, `tests/e2e/offline.spec.ts`

**Interfaces:**
- Produces: delete-account endpoint; anonymized item statistics; `timing_unverified` resolution; visible connectivity/recovery states

- [ ] **Step 1: Write failing offline-expiry, sync-conflict and account-deletion tests**

Assert late answers are rejected, uncertain timing is flagged/excluded from main trend, profile/OAuth/answers are deleted, aggregate item stats remain anonymous, audit logs expire after one year.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npx supabase test db && npm run test:e2e -- tests/e2e/offline.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement connectivity/recovery UX and conflict resolution**

Never silently convert an expired Full Test into an untimed attempt.

- [ ] **Step 4: Implement server-only deletion and scheduled retention SQL**

Delete identities after reauthentication; detach anonymized aggregates from user/attempt identifiers.

- [ ] **Step 5: Verify browser and SQL privacy tests**

Run: `npx supabase db reset && npx supabase test db && npm run test:e2e -- tests/e2e/offline.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase src/shell src/exam/session tests/e2e/offline.spec.ts
git commit -m "feat: harden recovery and privacy controls"
```

### Task 16: Complete accessibility, cross-device and security verification

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`, `responsive.spec.ts`, `security.spec.ts`, `full-test.spec.ts`
- Create: `docs/operations/security-checklist.md`, `docs/operations/content-review.md`
- Modify: affected UI/components discovered by tests

**Interfaces:**
- Consumes: all previous user/admin flows
- Produces: verified release candidate and operator checklists

- [ ] **Step 1: Write end-to-end tests for the complete Full Test and Admin publish journeys**

Use accelerated fake media/time in E2E while preserving 45/75-minute values in production configuration.

- [ ] **Step 2: Add axe scans and responsive viewport matrix**

Required viewports: 360×640, 390×844, 768×1024, 1024×768, 1440×900; assert no serious/critical axe findings and no page-level exam overflow.

- [ ] **Step 3: Add security assertions**

Assert built JS contains no Gemini/service-role/Google client secret, active attempt APIs omit solution fields and unauthorized IDs return 404/403 without data.

- [ ] **Step 4: Run the complete release suite and fix only observed failures**

Run: `npm test -- --run && npm run typecheck && npm run build && npx supabase test db && npm run test:e2e`
Expected: all checks PASS

- [ ] **Step 5: Document content review, secret setup, rollback and incident steps**

Include Google OAuth redirect URLs, Supabase secrets, Gemini quota and how to retire a broken question/audio asset.

- [ ] **Step 6: Commit**

```bash
git add tests docs src supabase
git commit -m "test: verify Score Quest release candidate"
```

### Task 17: Populate and verify the 400-question internal-test bank

**Files:**
- Create: `content/launch/*.jsonl`, `content/launch/media-manifest.json`
- Create: `scripts/report-pool-coverage.ts`, `scripts/check-similarity.ts`
- Create: `docs/content/launch-review-log.md`
- Test: `scripts/report-pool-coverage.test.ts`, `scripts/check-similarity.test.ts`

**Interfaces:**
- Consumes: Admin/Gemini/TTS/import workflow from Tasks 12–14
- Produces: 400 approved scored questions, complete approved media, 2 valid Full Test equivalents and reviewer audit evidence

- [ ] **Step 1: Write failing corpus checks**

Assert published scored-question count is 400, every Part has twice the official Full Test requirement, all groups are complete, all Listening assets approved and similarity thresholds pass.

- [ ] **Step 2: Run checks against an empty bank and confirm failure**

Run: `npm run content:coverage -- content/launch && npm run content:similarity -- content/launch`
Expected: FAIL with deficits by Part/media/status

- [ ] **Step 3: Generate original Draft batches per Part through the Admin pipeline**

Generate small batches, vary workplace topics/skills/difficulty and store provider/model/prompt version provenance.

- [ ] **Step 4: Run automated schema, answer, duplication and media checks**

Reject invalid groups before human review; regenerate only the rejected batch.

- [ ] **Step 5: Complete two-person content and audio review**

Record reviewer, decision and corrections in DB/audit log; creators cannot approve their own content.

- [ ] **Step 6: Publish the verified bank and run two disjoint Full Test assemblies**

Run: `npm run content:coverage -- content/launch && npm run content:similarity -- content/launch && npm run content:assemble -- --forms 2 --disjoint`
Expected: PASS with exact Part counts/times and zero repeated question versions/groups across the two forms

- [ ] **Step 7: Run final release suite**

Run: `npm test -- --run && npm run typecheck && npm run build && npx supabase test db && npm run test:e2e`
Expected: all checks PASS

- [ ] **Step 8: Commit**

```bash
git add content scripts docs/content
git commit -m "content: add reviewed internal test bank"
```

## Self-Review Result

- Spec coverage: ทุก requirement เชื่อมกับ Task 1–17; จำนวน 2,000/5,000 ข้อเป็น post-MVP content operation ตาม spec จึงไม่เพิ่มเป็น implementation task
- Step scan: ทุกขั้นมี action เดียวและผลตรวจสอบได้; algorithms ที่กำหนดไว้มี signature/interface ชัดเจน
- Type consistency: `AttemptSnapshot`, `SelectedGroup`, `ScoreResult`, repositories และ provider interfaces มีเจ้าของไฟล์เดียวและถูก consume หลัง task ที่สร้าง
- Review Focus: reload, audio duplicate event, deadline/client clock, RLS role escalation และ short mobile viewport มี tests ระบุใน task เจ้าของแล้ว
- Proportion: แผนระบุ interfaces/tests/commands โดยไม่เขียน implementation body แทนผู้พัฒนา
