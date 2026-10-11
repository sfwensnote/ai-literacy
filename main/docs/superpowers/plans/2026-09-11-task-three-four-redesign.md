# Task Three and Four Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将任务三、四重写为与任务一、二一致的单页多状态测评流程，并保留现有持久化、评分与完整四任务闭环。

**Architecture:** `AssessmentClient` 继续作为场景分发器，新建独立的 `TaskThreeFlow` 与 `TaskFourFlow`。可测试的报告修改和双选限制放在领域纯函数中；UI 只负责状态呈现、RawEvent 记录和提交。现有 `AIChatDrawer`、Session Store 与 Submission Schema 保持兼容。

**Tech Stack:** Next.js 16、React 19、TypeScript、Zustand、Lucide、Vitest、Playwright。

## Global Constraints

- 只修改任务三、任务四及必要公共模块，不改变首页、任务一、任务二、分析页和反馈路由。
- AI 默认收起，不提供暗示正确行为的推荐问题。
- 页面始终只有一个当前报告或当前决策，不并排展示多个版本。
- 保留 `ai-literacy-assessment-v1` localStorage key 和现有 `ReportSubmission`、`InternshipSubmission` 字段。
- 使用现有蓝白视觉、四圆点进度、图形 Logo 和退出入口；不新增图片或品牌文字。
- 当前目录不是 Git 仓库，不运行 `git init`，提交步骤跳过。

---

### Task 1: Add task-three and task-four domain state

**Files:**
- Modify: `src/features/assessment/types.ts`
- Modify: `src/features/assessment/task-flow.ts`
- Test: `tests/unit/task-three-four-flow.test.ts`

**Interfaces:**
- Produces: `TaskThreeDraft`、`TaskFourDraft`、`ReportDocument`。
- Produces: `applyReportSuggestion(report, intent): ReportDocument`。
- Produces: `toggleLimitedSelection(items, key, limit): string[]`。

- [x] **Step 1: Write failing pure-function tests**

```ts
import { applyReportSuggestion, toggleLimitedSelection } from '../../src/features/assessment/task-flow'

it('replaces the illustrative reference without creating a second report', () => {
  const result = applyReportSuggestion({ title: '在线教育', body: 'Johnson 等（2021）证明高校应全面扩大在线课程。' }, 'real_references')
  expect(result.body).not.toContain('Johnson')
  expect(result.body).toContain('需补充可检索来源')
})

it('keeps no more than two decision priorities', () => {
  expect(toggleLimitedSelection(['方向匹配', '时间可控'], '成长空间', 2)).toEqual(['时间可控', '成长空间'])
})
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/unit/task-three-four-flow.test.ts`

Expected: FAIL because the exports and draft types do not exist.

- [x] **Step 3: Implement minimal types and pure functions**

```ts
export interface ReportDocument { title: string; body: string }
export type TaskThreePhase = 'initial' | 'editing' | 'ai_assist' | 'confirm'
export interface TaskThreeDraft {
  phase: TaskThreePhase
  report: ReportDocument
  selectedClaims: string[]
  trustAll: boolean
  pendingSuggestionIntent?: string
  keepItems: string[]
  modifyItems: string[]
}

export type TaskFourPhase = 'initial' | 'ai_assist' | 'decision' | 'confirm'
export interface TaskFourDraft {
  phase: TaskFourPhase
  sharedInfo: string[]
  ratings: { match: number; growth: number; pressure: number }
  priorities: string[]
  decision?: InternshipSubmission['decision']
  reason: string
}
```

`applyReportSuggestion` only mutates the supplied report value and `toggleLimitedSelection` removes an existing item or keeps the newest `limit` selections.

- [x] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/task-three-four-flow.test.ts`

Expected: PASS.

---

### Task 2: Extend structured Mock AI suggestions

**Files:**
- Modify: `src/features/ai/task-mock-ai-service.ts`
- Test: `tests/unit/task-mock-ai-service.test.ts`

**Interfaces:**
- Consumes: `TaskAIRequest.currentContext.report?: ReportDocument`。
- Produces: `TaskAIResponse.suggestedReport?: ReportDocument`。

- [x] **Step 1: Add a failing report-suggestion test**

```ts
it('returns a structured report suggestion for a source-check prompt', async () => {
  const response = await createTaskMockAIService({ delay: false }).sendMessage({
    taskId: 'report', messages: [], message: '这些引用是真实的吗？',
    currentContext: { report: { title: '在线教育', body: 'Johnson 等（2021）证明高校应全面扩大在线课程。' } },
  })
  expect(response.intent).toBe('real_references')
  expect(response.suggestedReport?.body).not.toContain('Johnson')
})
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/unit/task-mock-ai-service.test.ts`

Expected: FAIL because report context and suggestion are not supported.

- [x] **Step 3: Implement the report branch**

Import `applyReportSuggestion`, accept `report` in `currentContext`, and populate `suggestedReport` only for `taskId === 'report'`. Preserve the existing trip branch.

- [x] **Step 4: Verify GREEN**

Run: `npm test -- tests/unit/task-mock-ai-service.test.ts`

Expected: PASS for headphone, trip, and report responses.

---

### Task 3: Build the task-three report flow

**Files:**
- Create: `src/components/assessment/task-three-flow.tsx`
- Create: `src/components/assessment/report-document.tsx`
- Modify: `src/components/assessment/assessment-client.tsx`
- Modify: `src/app/assessment-tasks.css`
- Test: `tests/e2e/task-three-four.spec.ts`

**Interfaces:**
- Consumes: the same draft/message/event/submit adapter shape used by `TaskOneFlow` and `TaskTwoFlow`.
- Produces: `ReportSubmission` and `task3_*` RawEvents.

- [x] **Step 1: Write the failing task-three E2E path**

```ts
test('task three verifies and updates the only current report', async ({ page }) => {
  await reachTaskThree(page)
  await expect(page.getByRole('heading', { name: '当前报告' })).toHaveCount(1)
  await page.getByRole('button', { name: /Johnson 等/ }).click()
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('这些参考资料都是真实的吗？')
  await page.getByRole('button', { name: '发送' }).click()
  await page.getByRole('button', { name: '应用到报告' }).click()
  await expect(page.getByText(/需补充可检索来源/)).toBeVisible()
})
```

- [x] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/task-three-four.spec.ts`

Expected: FAIL because Task 3 still renders the legacy two-column flow.

- [x] **Step 3: Implement `ReportDocument` and `TaskThreeFlow`**

`ReportDocument` renders one report and supports clickable semantic claim spans in read mode or title/body fields in edit mode. `TaskThreeFlow` normalizes legacy drafts, records `task3_view`, opens `AIChatDrawer` only on request, records prompt/response events, exposes accept/reject actions for structured suggestions, and updates the same `report` object.

The final submission must be:

```ts
submit({
  title: draft.report.title,
  body: draft.report.body,
  keepItems: draft.keepItems,
  modifyItems: draft.modifyItems,
})
```

- [x] **Step 4: Dispatch report scene to the new flow and add focused styles**

Add a `config.id === 'report' && scene` branch before the legacy submission branch. Extend the existing focused-task responsive CSS rather than creating a second visual system.

- [x] **Step 5: Verify GREEN**

Run: `npm run test:e2e -- tests/e2e/task-three-four.spec.ts`

Expected: task-three source verification, suggestion application, direct editing, and draft refresh checks pass.

---

### Task 4: Build the task-four decision flow

**Files:**
- Create: `src/components/assessment/task-four-flow.tsx`
- Create: `src/components/assessment/internship-analysis.tsx`
- Modify: `src/components/assessment/assessment-client.tsx`
- Modify: `src/app/assessment-tasks.css`
- Test: `tests/e2e/task-three-four.spec.ts`

**Interfaces:**
- Consumes: the same draft/message/event/submit adapter shape as the other focused task flows.
- Produces: `InternshipSubmission` and `task4_*` RawEvents.

- [x] **Step 1: Add the failing task-four E2E path**

```ts
test('task four preserves the privacy boundary and final decision', async ({ page }) => {
  await reachTaskFour(page)
  await expect(page.getByLabel('真实姓名')).not.toBeChecked()
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('最大的风险是什么？')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText(/时间投入与项目期望不匹配/)).toBeVisible()
  await page.getByRole('radio', { name: /再了解一下/ }).check()
  await page.getByRole('button', { name: '提交我的判断' }).click()
  await expect(page).toHaveURL(/analyzing|feedback/)
})
```

- [x] **Step 2: Verify RED**

Run: `npm run test:e2e -- tests/e2e/task-three-four.spec.ts`

Expected: FAIL because Task 4 still renders the legacy form.

- [x] **Step 3: Implement `InternshipAnalysis` and `TaskFourFlow`**

Render compact job/user facts, optional shared-information choices, one analysis object, collapsed AI drawer, three dot ratings, a two-item priority selector, final radio choice, optional reason, and same-page confirmation. Every control updates the persisted draft and records the specified `task4_*` event.

Final submit remains compatible:

```ts
submit({
  sharedInfo: draft.sharedInfo,
  ratings: draft.ratings,
  priorities: draft.priorities,
  decision: draft.decision,
  reason: draft.reason,
})
```

- [x] **Step 4: Dispatch internship scene and complete responsive styles**

Add the internship branch in `AssessmentClient`. At widths below 1050px stack the drawer; below 650px stack ratings and choices while preserving focus order and labels.

- [x] **Step 5: Verify GREEN**

Run: `npm run test:e2e -- tests/e2e/task-three-four.spec.ts`

Expected: privacy default, risk prompt, two-priority limit, final confirmation, and refresh recovery pass.

---

### Task 5: Update evidence compatibility and run regression verification

**Files:**
- Modify: `src/features/scoring/evidence-extractor.ts`
- Modify: `tests/unit/scoring-service.test.ts`
- Modify: `tests/e2e/assessment-flow.spec.ts`

**Interfaces:**
- Consumes: new `task3_prompt_send` and `task4_prompt_send` events.
- Preserves: existing evidence keys, dimension scores, feedback routes and copy contracts.

- [x] **Step 1: Add failing evidence tests**

```ts
it('extracts report and internship intents from focused-flow events', () => {
  const session = buildCompletedSession()
  session.scenes.report.actions.push(event('report', 'task3_prompt_send', { intent: 'real_references' }))
  session.scenes.internship.actions.push(event('internship', 'task4_prompt_send', { intent: 'risk' }))
  const evidence = extractEvidence(session)
  expect(evidence.find((item) => item.key === 'report_sources')?.status).toBe('positive')
  expect(evidence.find((item) => item.key === 'internship_risk')?.status).toBe('positive')
})
```

- [x] **Step 2: Verify RED**

Run: `npm test -- tests/unit/scoring-service.test.ts`

Expected: FAIL because the new event names are not read.

- [x] **Step 3: Extend intent extraction**

Update the intent filter to also accept `task3_prompt_send` and `task4_prompt_send`; do not change scoring weights.

- [x] **Step 4: Verify focused and full regression suites**

Run:

```bash
npm test -- --no-file-parallelism
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: all unit tests and browser paths pass, TypeScript and ESLint exit 0, and Next.js production build succeeds.

- [x] **Step 5: Visual acceptance and preview**

Capture task-three source-check and task-four decision states at 1728×960. Confirm no horizontal overflow, clipped controls, console errors, hydration errors, or duplicate current objects. Leave `http://127.0.0.1:3000/assessment/3` open for preview.
