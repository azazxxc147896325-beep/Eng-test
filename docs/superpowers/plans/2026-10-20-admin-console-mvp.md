# Admin Console MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the approved Admin screens functional with Supabase.

**Architecture:** Small React pages call a typed admin repository. Supabase RLS/RPC enforces admin access and workflow rules. Import parsing is isolated and validated before save.

**Tech Stack:** React, TypeScript, Supabase, Vitest, Zod

**Spec:** `docs/superpowers/specs/2026-10-20-admin-console-design.md`

## Global Constraints

- Preserve existing user/exam flows.
- Require `admin` for every `/admin` route.
- Imported or AI content is Draft until reviewed.
- Keep Thai/English UI and responsive layout.

## Review Focus

- Non-admin access stays blocked.
- Empty/error loading states remain usable.
- Creator cannot approve own content.
- Invalid files never save partial content.
- Role changes cannot remove the current admin's own access.

### Task 1: Admin navigation and question bank

**Files:** router, layout, repository, dashboard/bank pages, tests, styles, translations.

- [x] Add failing route/repository/page tests.
- [x] Implement admin-only routing, coverage dashboard, searchable bank.
- [x] Run focused and full tests.

### Task 2: Review, editor, and user roles

**Files:** review/editor/users pages, repository, migration, types, tests.

- [x] Add failing workflow and role tests.
- [x] Implement data loading, transitions, prompt editing, secure role RPC.
- [x] Run focused and full tests.

### Task 3: File import and responsive polish

**Files:** import parser/page, package, tests, styles.

- [x] Add failing parser/upload tests.
- [x] Implement JSON, JSONL, CSV, XLSX validation and Draft saves.
- [x] Run tests, typecheck, build, and browser smoke test.
