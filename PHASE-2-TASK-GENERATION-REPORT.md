# Phase 2 Task Generation Complete ✅

**Date**: 2025-11-14 | **Feature**: AI Chat (Streaming) | **Branch**: `001-ai-chat-stream`

---

## Summary

✅ **COMPLETED**: Task list generation for Phase 2 implementation (72 actionable tasks).

Generated file: `specs/001-ai-chat-stream/tasks.md` (375 lines)

All tasks follow strict speckit.tasks checklist format:
- ✅ Checkbox format: `- [ ]`
- ✅ Task ID: T001-T072 (sequential)
- ✅ Parallelizable marker: `[P]` for independent tasks
- ✅ Story label: `[US1]`, `[US2]`, `[US3]` for user story phases
- ✅ File paths: Absolute or repository-relative (e.g., `src/handlers/chat-stream.ts`, `public/src/components/ChatDisplay.tsx`)

---

## Task Distribution

**Total Tasks**: 72

| Phase | Category | Count | Duration | Dependencies |
|-------|----------|-------|----------|--------------|
| **Phase 1** | Setup | 8 | 2-4 hrs | Foundational |
| **Phase 2** | Foundational | 16 | 4-6 hrs | ← Phase 1 |
| **Phase 3** | User Story 1 (P1) MVP | 13 | 6-8 hrs | ← Phase 2 |
| **Phase 4** | User Story 2 (P2) | 9 | 4-6 hrs | ← Phase 2 (parallel with P3) |
| **Phase 5** | User Story 3 (P3) | 7 | 3-4 hrs | ← Phase 2 (parallel with P3/P4) |
| **Phase 6** | Polish & Cross-Cutting | 19 | 6-8 hrs | ← Phases 3/4/5 |
| | **TOTAL** | **72** | **25-36 hrs** | |

**Parallelizable Tasks**: 36 (50%)

---

## Execution Model

### Sequential Phases (Blocking Dependencies)
```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational - CRITICAL GATE)
    ↓
Phase 3 (US1 - P1 MVP) ─┐
Phase 4 (US2 - P2)      ├─ CAN RUN PARALLEL
Phase 5 (US3 - P3) ─────┘
    ↓
Phase 6 (Polish)
```

### Within-Phase Parallelization

**Phase 2 (All 16 tasks [P])**:
- Database setup (T009-T014): Create models, client wrapper
- API integration (T015-T017): Claude client, stream parser, session util
- Frontend (T018-T020): Hooks, API client, session storage
- Infrastructure (T021-T024): Logging, error handling, CI, build

**Phase 3 (13 tasks, 7 parallel [P])**:
- Models [P]: session, conversation (T025-T026)
- Handler implementation: streaming, latency tracking, persistence (T027-T030)
- React components [P]: ChatDisplay, ChatInputForm, ErrorDisplay (T031-T033)
- Integration: App wiring, rate limiting (T034-T035)
- Tests [P]: contract + integration (T036-T037)

**Phases 4 & 5** (9 + 7 tasks):
- Can run in parallel with Phase 3 (different files, no cross-dependencies)
- Phases 4/5 depend only on Phase 2 completion

**Phase 6 (19 tasks, 15 parallel [P])**:
- Performance, documentation, testing, security all independent

---

## Task Organization by User Story

### User Story 1: One-off Q&A (Priority: P1) - **MVP**
**Tasks**: T025-T037 (13 tasks) | **Duration**: 6-8 hours

**Goal**: Submit prompt → receive AI response as stream within 1s (95th percentile)

**Deliverables**:
- ✅ POST `/api/chat/stream` endpoint (SSE streaming)
- ✅ Session management (auto-create, validate header)
- ✅ Conversation auto-creation
- ✅ Claude API streaming integration
- ✅ React UI: ChatDisplay + ChatInputForm + ErrorDisplay
- ✅ Message persistence to D1
- ✅ Rate limiting (10 req/min per session)
- ✅ Contract + Integration tests
- ✅ Latency SLA validation (1s first chunk)

**Test Criteria**:
- First chunk within 1s ✅
- Stream completes successfully 99% ✅
- Error propagation (fail-fast) ✅
- UI displays streaming text ✅

### User Story 2: Multi-Turn Context (Priority: P2)
**Tasks**: T038-T046 (9 tasks) | **Duration**: 4-6 hours | **Can start after Phase 2**

**Goal**: Continue conversation; prior messages used as context for coherent follow-ups

**Deliverables**:
- ✅ Conversation loader (fetch prior messages)
- ✅ Message formatter for Claude context window
- ✅ Enhanced handler: load context before calling Claude
- ✅ React UI: ConversationList + MessageList + App.tsx integration
- ✅ Auto-title inference (generate from first message)
- ✅ Tests: multi-turn coherence, conversation retrieval

**Test Criteria**:
- 3+ messages in conversation ✅
- Each response uses prior context ✅
- Message history loaded correctly ✅
- Conversation titles auto-generated ✅

### User Story 3: Stream Cancellation (Priority: P3)
**Tasks**: T047-T053 (7 tasks) | **Duration**: 3-4 hours | **Can start after Phase 2**

**Goal**: Cancel in-progress streams; receive cancellation confirmation within 500ms

**Deliverables**:
- ✅ AbortController support in handler
- ✅ Client-side abort() method in API service
- ✅ Cancel button in ChatInputForm
- ✅ Cancellation error handling in UI
- ✅ useChat hook abort method
- ✅ Tests: stream cancellation, latency SLA (<500ms)

**Test Criteria**:
- Stream cancels immediately ✅
- Cancellation acknowledged <500ms ✅
- No further chunks after cancel ✅
- Subsequent requests work ✅

---

## MVP Scope

**Phase 1 + Phase 2 + Phase 3 = Complete MVP (Deployable)**

- **Effort**: ~12-14 hours
- **Tasks**: 8 + 16 + 13 = 37 tasks
- **Deliverable**: One-off Q&A chat with streaming, persistent storage, clean UI
- **Users can**: Ask questions, see answers stream in real-time, get coherent responses

**Phase 2 Release (Extended MVP)**:
- Add: Phase 4 (US2 multi-turn) + Phase 5 (US3 cancellation)
- Effort: +7-10 hours
- **Users can**: Have multi-turn conversations, cancel requests, resume conversations

**Phase 3 Release (Polish)**:
- Add: Phase 6 (performance, observability, testing, documentation)
- Effort: +6-8 hours
- **Users get**: Production-ready app with monitoring, security, comprehensive tests

---

## Key Features of Task List

### 1. Strict Checklist Format
Every task follows: `- [ ] [ID] [P?] [Story] Description with file path`

✅ **Examples**:
- `- [ ] T001 Initialize D1 database...` (Setup, no story)
- `- [ ] T015 [P] Create Anthropic Claude API client wrapper in src/services/anthropic.ts` (Foundational [P])
- `- [ ] T027 [US1] Implement POST /api/chat/stream handler in src/handlers/chat-stream.ts` (Story phase)
- `- [ ] T031 [US1] [P] Create ChatDisplay React component in public/src/components/ChatDisplay.tsx` (Story with parallel)

### 2. Clear Dependencies
- Setup → Foundational → (US1 || US2 || US3) → Polish
- Within phases: [P] tasks can run simultaneously
- Non-parallel tasks list dependencies (e.g., T014 depends on T012, T013)

### 3. File Paths
All paths are explicit and actionable:
- Backend: `src/handlers/`, `src/models/`, `src/services/`, `src/utils/`, `src/middleware/`
- Frontend: `public/src/components/`, `public/src/hooks/`, `public/src/services/`
- Tests: `tests/contract/`, `tests/integration/`, `tests/e2e/`
- Config: `wrangler.jsonc`, `tsconfig.json`, `package.json`

### 4. Success Criteria per Story
Each user story phase includes:
- **Goal**: What users can do
- **Acceptance Scenarios**: Explicit test conditions (Given/When/Then)
- **Independent Test**: How to verify story works on its own
- **Implementation Tasks**: Specific code tasks with dependencies
- **Checkpoint**: Verification that story is complete and deployable

### 5. Test-Driven Notes
- Contract tests (T036, T046, T052) verify API contracts match OpenAPI spec
- Integration tests (T037, T045, T052) verify full workflows
- E2E tests (T063) verify real browser + API
- TDD recommended: Write tests FIRST, ensure they fail, then implement

---

## Technology Stack Alignment

All tasks align with Phase 0-1 research decisions:

| Decision | Tasks Using It | Rationale |
|----------|----------------|-----------|
| **Claude API** | T027, T028, T039, T040 | Selected in research.md (latency, cost, simplicity) |
| **D1 Database** | T001, T010, T038, T030 | Selected in research.md (co-located, included cost) |
| **React 18+** | T006, T031-T034, T041-T043 | Selected in research.md (ecosystem, streaming integration) |
| **SSE (HTTP)** | T016, T019, T048 | Selected in research.md (native browser, simple, testable) |
| **Hono 4.10.5+** | T005, T027-T030 | Per plan.md technical context |
| **Wrangler 4.48+** | T005, T024, T070 | Per plan.md infrastructure |
| **Vitest** | T036, T037, T062 | Per plan.md testing framework |

---

## Parallel Execution Example

**Scenario**: 3-person team, Day 2 execution

**Team A** (6-8 hours):
- Execute Phase 3 tasks T025-T037
- Focus: Streaming chat endpoint + UI + tests
- Output: `/api/chat/stream` endpoint working, ChatDisplay showing streaming text, integration tests passing

**Team B** (4-6 hours):
- Execute Phase 4 tasks T038-T046 (after Phase 2)
- Focus: Conversation context, multi-turn support
- Output: Multi-turn conversations work, ConversationList populated, auto-titling functional

**Team C** (3-4 hours):
- Execute Phase 5 tasks T047-T053 (after Phase 2)
- Focus: Stream cancellation, AbortController
- Output: Cancel button works, cancellation confirms <500ms, can retry after cancel

**Merge**: All 3 teams merge their PRs on Day 3, then collectively do Phase 6 polish

---

## Testing Strategy (Per Phase)

### Phase 1: No tests (setup only)

### Phase 2: Infrastructure tests (not listed as separate tasks, part of integration in Phase 3+)

### Phase 3 (US1): Contract + Integration
- **T036**: Contract test `POST /api/chat/stream` (request schema, response schema, SSE format)
- **T037**: Integration test one-off Q&A (send prompt, collect chunks, verify persistence)
- **Assert**: First chunk <1s, final chunk received, message saved to D1

### Phase 4 (US2): Contract + Integration  
- **T045**: Integration test multi-turn (send 3 messages, verify context used)
- **T046**: Contract test `GET /api/conversations` (schema, ordering)
- **Assert**: Conversation list loads, MessageList shows history, context preserved

### Phase 5 (US3): Integration + Latency
- **T052**: Integration test cancellation (abort stream, verify no further chunks)
- **T053**: Latency test cancellation (abort signal to termination <500ms)
- **Assert**: Cancellation confirmed, no chunks leak, subsequent requests work

### Phase 6: Full E2E + Performance
- **T063**: Playwright E2E test (browser-based full journey)
- **T054**: Latency instrumentation (measure first-chunk, total-time, tokens/sec)
- **T056**: Bundle size validation (<50KB minified)

---

## Deliverable Files After Completion

### After Phase 1 (Setup)
```
src/                  ✅ Directory structure created
public/src/           ✅ Frontend directory structure created  
tests/                ✅ Test directory structure created
wrangler.jsonc        ✅ D1 binding configured
tsconfig.json         ✅ React JSX support configured
package.json          ✅ Dependencies installed
```

### After Phase 2 (Foundational)
```
src/index.ts          ✅ Hono app with middleware
src/handlers/
src/models/           ✅ All 4 model types
src/services/         ✅ db.ts, anthropic.ts
src/utils/            ✅ stream, session, prompt, errors, validation
src/middleware/       ✅ logger, rate-limiter
```

### After Phase 3 (US1 - MVP)
```
public/src/components/ChatDisplay.tsx, ChatInputForm.tsx, ErrorDisplay.tsx ✅
public/src/hooks/useChat.ts ✅
public/src/services/api.ts ✅
tests/contract/chat-stream.test.ts ✅
tests/integration/streaming.test.ts ✅
```

### After Phase 4 (US2)
```
public/src/components/ConversationList.tsx, MessageList.tsx ✅
public/src/App.tsx ✅ (wired with conversation management)
tests/integration/multi-turn.test.ts ✅
```

### After Phase 5 (US3)
```
public/src/components/ChatInputForm.tsx ✅ (cancel button added)
tests/integration/cancellation.test.ts ✅
```

### After Phase 6 (Polish)
```
.github/workflows/test.yml ✅
docs/DEPLOY.md ✅
docs/DB_BACKUP.md ✅
.env.example ✅
README.md ✅ (updated with feature links)
tests/fixtures/ ✅
tests/e2e/ ✅
```

---

## Validation Checklist (Ready-to-Use)

Teams can use this checklist after completing all phases:

```
PRE-DEPLOYMENT VALIDATION
✅ Phase 1 complete (setup)
✅ Phase 2 complete (foundation)
✅ Phase 3 complete (US1 MVP) or Phase 3-5 complete (full feature)
✅ Phase 6 complete (polish)
✅ pnpm run build succeeds, bundle <50KB
✅ pnpm run dev starts, no errors
✅ pnpm test passes all tests
✅ pnpm run cf-typegen: no type errors
✅ Manual test: prompt → stream arrives <1s
✅ Manual test: error handling works (fail-fast)
✅ Manual test: multi-turn context (Phase 4 only)
✅ Manual test: cancellation (Phase 5 only)
✅ ANTHROPIC_API_KEY set in production (wrangler secret)
✅ README + quickstart updated
✅ GitHub Actions CI verified (cf-typegen-check, tests)
```

---

## Summary Statistics

**Generated**: 2025-11-14 at 10:45 UTC
**Input Documents**: spec.md, plan.md, research.md, data-model.md, contracts/
**Output**: tasks.md (375 lines, 72 tasks)
**Execution Time Estimate**: 25-36 hours (sequential phases), 12-14 hours (MVP only)
**Team Capacity**: 1 developer = 3-4 days, 3 developers = 1-2 days (with parallelization)
**Status**: ✅ Ready for implementation

All tasks are independently executable and designed for an LLM or human developer to complete with the design documents as reference.
