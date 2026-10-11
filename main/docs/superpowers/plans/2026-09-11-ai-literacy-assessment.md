# AI 素养场景化测评 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可连续完成四个真实任务、记录行为、生成证据与动态分数，并提供五页个性化反馈的 AI 素养测评 Demo。

**Architecture:** 使用 Next.js App Router 组织页面，以 Zustand 维护并持久化版本化 AssessmentSession。场景 UI、Mock AI、行为记录、Evidence 提取、评分和反馈生成相互隔离，通过明确 TypeScript 接口协作。

**Tech Stack:** Next.js 16.3.4、React 19.3.0、TypeScript 7.0.2、Tailwind CSS 4.3.3、Zustand 5.0.15、lucide-react 1.44.0、Vitest 5、Testing Library、Playwright 1.63。

## Global Constraints

- Demo 无需 API Key、数据库或真实登录即可完整运行。
- 左上角只显示图形 Logo，不显示平台名称。
- 测评过程中不显示 AI 素养维度或“任务 1”等评价性标签。
- 四个场景必须包含 Mock AI 对话与不同形式的最终提交物。
- 评分必须遵循 `RawEvent → Evidence → DimensionScore`，不得在页面直接固定最终分数。
- Session 使用 localStorage 保存，刷新后恢复，并提供重新开始功能。
- 桌面优先，同时保证基本移动端响应式和键盘可访问性。
- 视觉以参考图为准：蓝白、浅蓝环境背景、深蓝标题、轻卡片、克制动效。
- 当前目录不是 Git 仓库；计划中的提交步骤仅在用户后续初始化 Git 后执行，不擅自运行 `git init`。

---

## File Map

```text
src/
  app/
    layout.tsx                     全局元数据、字体和 Provider
    globals.css                    设计令牌与基础样式
    page.tsx                       首页
    assessment/[step]/page.tsx     场景路由入口
    analyzing/page.tsx             分析过渡
    feedback/page.tsx              总反馈
    feedback/[page]/page.tsx       维度反馈
  components/
    ui/                            Logo、Card、Button、ProgressDots、表单控件
    landing/                       首页 Hero 与价值卡片
    assessment/                    ScenarioLayout、AIChat、MaterialCard
    assessment/submissions/        四个场景提交物
    feedback/                      FeedbackNav、RadarChart、ScoreCard 等
  features/
    assessment/
      types.ts                     领域类型
      scene-config.ts              场景静态配置
      session-store.ts             Zustand Session 状态机
      session-guards.ts            路由访问判断
    ai/
      ai-service.ts                AIService 接口
      mock-ai-service.ts           规则型 Mock AI
      mock-responses.ts            场景回答文案
    scoring/
      evidence-extractor.ts        RawEvent 到 Evidence
      scoring-service.ts           Evidence 到分数
      feedback-generator.ts        Evidence 到反馈模型
  providers/app-provider.tsx       客户端 hydration 边界
  test/setup.ts                    测试环境
tests/
  unit/                            领域逻辑测试
  components/                      组件交互测试
  e2e/assessment-flow.spec.ts      完整浏览器流程
```

---

### Task 1: 初始化工程与测试基线

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/test/setup.ts`
- Test: `tests/components/home-smoke.test.tsx`

**Interfaces:**
- Produces: 可运行的 Next.js App Router、Vitest 和 Playwright 基线。

- [ ] **Step 1: 写首页冒烟测试**

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

it('renders the assessment entry', () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { name: /你和 AI 的相处方式/ })).toBeVisible()
  expect(screen.getByRole('link', { name: /开始测评/ })).toHaveAttribute('href', '/assessment/1')
})
```

- [ ] **Step 2: 运行测试确认基线失败**

Run: `npm install && npm run test -- tests/components/home-smoke.test.tsx`

Expected: FAIL，原因是应用和测试配置尚不存在。

- [ ] **Step 3: 创建最小 Next.js 应用与脚本**

`package.json` 提供 `dev`、`build`、`lint`、`typecheck`、`test`、`test:e2e`；`src/app/page.tsx` 暂时只包含标题和进入链接。配置 `@/*` 指向 `src/*`，Vitest 使用 jsdom。

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>测一测，你和 AI 的相处方式</h1>
      <a href="/assessment/1">开始测评 →</a>
    </main>
  )
}
```

- [ ] **Step 4: 运行冒烟测试、类型检查和构建**

Run: `npm run test -- tests/components/home-smoke.test.tsx && npm run typecheck && npm run build`

Expected: 全部通过，Next.js 生成 production build。

- [ ] **Step 5: 提交（仅当仓库已初始化）**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs vitest.config.ts playwright.config.ts src tests
git commit -m "chore: scaffold assessment application"
```

---

### Task 2: 建立 Session、行为事件与持久化状态机

**Files:**
- Create: `src/features/assessment/types.ts`
- Create: `src/features/assessment/session-store.ts`
- Create: `src/features/assessment/session-guards.ts`
- Create: `src/providers/app-provider.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/unit/session-store.test.ts`

**Interfaces:**
- Produces: `createAssessmentSession(): AssessmentSession`
- Produces: `useAssessmentStore` actions: `startSession()`, `recordEvent(sceneId, type, payload)`, `appendMessage(sceneId, message)`, `updateDraft(sceneId, patch)`, `submitScene(sceneId, submission)`, `completeAssessment(scores)`, `resetSession()`。
- Produces: `getAllowedRoute(session): string`。

- [ ] **Step 1: 写状态机失败测试**

```ts
it('records ordered events and advances only after submission', () => {
  const store = createTestAssessmentStore()
  store.getState().startSession()
  store.getState().recordEvent('headphones', 'prompt_sent', { intent: 'source' })
  store.getState().submitScene('headphones', { decision: 'more_info' })

  const session = store.getState().session!
  expect(session.scenes.headphones.actions[0].type).toBe('prompt_sent')
  expect(session.currentScene).toBe(2)
  expect(session.scenes.headphones.finalSubmission).toEqual({ decision: 'more_info' })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/unit/session-store.test.ts`

Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 实现领域类型与 Store**

类型必须包含 `SceneId`、`Dimension`、`ChatMessage`、`RawEvent`、`Evidence`、四种 Submission、`SceneSession<T>` 和 `AssessmentSession`。事件 ID 使用 `crypto.randomUUID()`，持久化 key 为 `ai-literacy-assessment-v1`，SSR hydration 通过 `AppProvider` 控制。

```ts
export interface RawEvent {
  id: string
  sceneId: SceneId
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

export interface Evidence {
  id: string
  dimension: Dimension
  status: 'positive' | 'negative' | 'unknown'
  confidence: number
  sourceTask: SceneId
  description: string
  weight: number
}
```

- [ ] **Step 4: 测试事件顺序、重复提交保护、reset 和路由守卫**

Run: `npm run test -- tests/unit/session-store.test.ts`

Expected: PASS，重复提交不会重复推进场景或累计 Evidence。

- [ ] **Step 5: 提交（仅当仓库已初始化）**

```bash
git add src/features/assessment src/providers src/app/layout.tsx tests/unit/session-store.test.ts
git commit -m "feat: add persisted assessment session"
```

---

### Task 3: 实现 Mock AI 接口与场景意图识别

**Files:**
- Create: `src/features/ai/ai-service.ts`
- Create: `src/features/ai/mock-responses.ts`
- Create: `src/features/ai/mock-ai-service.ts`
- Test: `tests/unit/mock-ai-service.test.ts`

**Interfaces:**
- Consumes: `SceneId`, `ChatMessage` from `types.ts`。
- Produces: `AIResponse { content: string; intent: string; delayMs: number }`。
- Produces: `AIService.sendMessage(sceneId, history, message): Promise<AIResponse>`。
- Produces: `mockAIService` 单例。

- [ ] **Step 1: 写中英文意图识别失败测试**

```ts
it.each([
  ['headphones', '95% 的来源是什么？', 'satisfaction_source'],
  ['headphones', 'why is it ranked first?', 'ranking_source'],
  ['trip', '周六太赶，减少换乘', 'pace_transport'],
  ['report', '请给我真实参考文献', 'real_references'],
  ['internship', '最大的风险是什么', 'risk'],
])('recognizes %s intent', async (sceneId, text, intent) => {
  const result = await createMockAIService({ delay: false }).sendMessage(sceneId as SceneId, [], text)
  expect(result.intent).toBe(intent)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/unit/mock-ai-service.test.ts`

Expected: FAIL，Mock AI 尚未实现。

- [ ] **Step 3: 实现场景规则与回答**

按场景隔离规则表，先匹配特异意图，再匹配通用来源、比较、预算、时间、风险、隐私和修改意图。测试注入 `delay: false`，生产延迟随机为 500–900ms。

```ts
export interface AIService {
  sendMessage(sceneId: SceneId, history: ChatMessage[], message: string): Promise<AIResponse>
}
```

耳机必须承认 95% 与排名第一没有权威依据；报告必须承认示例引用不一定真实；行程返回更新后的可执行建议；实习只分析，不代替决定。

- [ ] **Step 4: 测试特异规则、通用回退和延迟边界**

Run: `npm run test -- tests/unit/mock-ai-service.test.ts`

Expected: PASS，所有场景和 fallback 均返回自然回答。

- [ ] **Step 5: 提交（仅当仓库已初始化）**

```bash
git add src/features/ai tests/unit/mock-ai-service.test.ts
git commit -m "feat: add rule based mock ai service"
```

---

### Task 4: 实现 Evidence、动态评分与反馈模型

**Files:**
- Create: `src/features/scoring/evidence-extractor.ts`
- Create: `src/features/scoring/scoring-service.ts`
- Create: `src/features/scoring/feedback-generator.ts`
- Test: `tests/unit/scoring-service.test.ts`
- Test: `tests/unit/feedback-generator.test.ts`

**Interfaces:**
- Consumes: 完成后的 `AssessmentSession`。
- Produces: `extractEvidence(session): Evidence[]`。
- Produces: `calculateScores(evidence): Record<Dimension, number>`。
- Produces: `generateFeedback(session, evidence, scores): FeedbackModel`。

- [ ] **Step 1: 写高核验与低核验路径的失败测试**

```ts
it('scores a verification path above unconditional adoption', () => {
  const careful = buildSession({ asksSource: true, checksRanking: true, checks95: true, adopts: false })
  const passive = buildSession({ asksSource: false, checksRanking: false, checks95: false, adopts: true })

  const carefulScore = calculateScores(extractEvidence(careful)).ai_evaluation
  const passiveScore = calculateScores(extractEvidence(passive)).ai_evaluation
  expect(carefulScore).toBeGreaterThan(passiveScore)
})
```

- [ ] **Step 2: 运行评分测试确认失败**

Run: `npm run test -- tests/unit/scoring-service.test.ts tests/unit/feedback-generator.test.ts`

Expected: FAIL，评分模块尚不存在。

- [ ] **Step 3: 实现分层评分规则**

规则只读取 RawEvent 与 Submission。每个维度使用基准分、正负 Evidence 权重、置信度和 0–100 clamp。耳机场景包括来源追问、95%、排名核验、无条件采纳；行程包括补充条件、迭代和手动修改；报告包括引用发现、真实来源和谨慎改写；实习包括敏感信息选择、风险追问和独立决策。

```ts
export function calculateScores(items: Evidence[]): DimensionScores {
  return DIMENSIONS.reduce((scores, dimension) => {
    const delta = items
      .filter((item) => item.dimension === dimension)
      .reduce((sum, item) => sum + item.weight * item.confidence, 0)
    scores[dimension] = Math.round(Math.min(100, Math.max(0, BASE[dimension] + delta)))
    return scores
  }, {} as DimensionScores)
}
```

- [ ] **Step 4: 生成基于真实行为的反馈**

反馈断言必须引用本次行为：追问 95%、未核验排名、调整行程、要求真实来源、拒绝提供敏感信息等。禁止使用不存在于 Session 的肯定性描述。

Run: `npm run test -- tests/unit/scoring-service.test.ts tests/unit/feedback-generator.test.ts`

Expected: PASS，两个行为路径产生不同分数与不同反馈。

- [ ] **Step 5: 提交（仅当仓库已初始化）**

```bash
git add src/features/scoring tests/unit/scoring-service.test.ts tests/unit/feedback-generator.test.ts
git commit -m "feat: derive evidence scores and feedback"
```

---

### Task 5: 建立视觉系统与首页 v0

**Files:**
- Create: `src/components/ui/logo.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/landing/hero-visual.tsx`
- Create: `src/components/landing/value-card.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Test: `tests/components/home-page.test.tsx`

**Interfaces:**
- Consumes: `useAssessmentStore.startSession()` 和现有 Session。
- Produces: 首页开始、继续、重新开始交互。
- Produces: 可复用设计令牌与基础组件。

- [ ] **Step 1: 写首页行为与可访问性失败测试**

```tsx
it('starts a new session and exposes the four value propositions', async () => {
  render(<HomePage />)
  expect(screen.getAllByRole('article')).toHaveLength(4)
  expect(screen.getByText('预计 15–20 分钟')).toBeVisible()
  expect(screen.getByRole('link', { name: /开始测评/ })).toHaveAttribute('href', '/assessment/1')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/components/home-page.test.tsx`

Expected: FAIL，首页完整结构尚不存在。

- [ ] **Step 3: 实现设计令牌和首页**

使用 CSS variables 定义 `--blue-600`、`--navy-950`、`--surface`、`--line`、`--radius-card`、`--shadow-card`。Hero 使用 CSS/SVG 抽象圆、轨迹线和界面轮廓，不使用大型机器人或人物。主文案、三条小信息和四张价值卡严格按需求。

- [ ] **Step 4: 验证首页测试与响应式结构**

Run: `npm run test -- tests/components/home-page.test.tsx && npm run typecheck`

Expected: PASS，无可访问性查询失败。

- [ ] **Step 5: 浏览器展示 v0 并获得方向确认**

Run: `npm run dev`

Expected: 首页在桌面与移动宽度呈现参考图的蓝白视觉系统；确认后复用到场景页。

- [ ] **Step 6: 提交（仅当仓库已初始化）**

```bash
git add src/app src/components/ui src/components/landing tests/components/home-page.test.tsx
git commit -m "feat: build assessment landing experience"
```

---

### Task 6: 实现场景骨架、聊天和耳机任务

**Files:**
- Create: `src/features/assessment/scene-config.ts`
- Create: `src/components/assessment/scenario-layout.tsx`
- Create: `src/components/assessment/material-card.tsx`
- Create: `src/components/assessment/ai-chat.tsx`
- Create: `src/components/assessment/submissions/headphone-submission.tsx`
- Create: `src/app/assessment/[step]/page.tsx`
- Test: `tests/components/headphone-scene.test.tsx`

**Interfaces:**
- Consumes: Session Store、`mockAIService`、场景静态配置。
- Produces: `ScenarioLayoutProps { step, title, intro, material, chat, submission }`。
- Produces: 通用 `AIChat`，发送时记录 `prompt_sent` 和 intent。

- [ ] **Step 1: 写耳机完整交互失败测试**

```tsx
it('records verification prompts and submits an independent decision', async () => {
  render(<AssessmentPage params={Promise.resolve({ step: '1' })} />)
  await user.type(screen.getByRole('textbox', { name: '向 AI 追问' }), '95% 的来源是什么？')
  await user.click(screen.getByRole('button', { name: '发送' }))
  expect(await screen.findByText(/无法提供.*正式调查报告/)).toBeVisible()
  await user.click(screen.getByLabelText('95% 用户满意'))
  await user.click(screen.getByLabelText('我还需要更多信息'))
  await user.click(screen.getByRole('button', { name: /提交并继续/ }))
  expect(testStore.getState().session?.currentScene).toBe(2)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/components/headphone-scene.test.tsx`

Expected: FAIL，场景组件尚不存在。

- [ ] **Step 3: 实现通用场景骨架与聊天**

顶部只含 Logo、四个进度点和退出。桌面 46/54 双栏，移动端单栏。聊天包含初始 AI 消息、用户消息、500–900ms 思考状态和发送按钮；不使用逐字 streaming。

- [ ] **Step 4: 实现耳机材料和提交物**

提交项包括四个待核验复选项、三选一决定、可选原因。改变勾选或决定时记录原始事件；提交后显示“已保存”并前往 `/assessment/2`。

- [ ] **Step 5: 运行组件测试**

Run: `npm run test -- tests/components/headphone-scene.test.tsx`

Expected: PASS，追问、记录、提交和推进均生效。

- [ ] **Step 6: 提交（仅当仓库已初始化）**

```bash
git add src/features/assessment/scene-config.ts src/components/assessment src/app/assessment tests/components/headphone-scene.test.tsx
git commit -m "feat: add scenario shell and headphone task"
```

---

### Task 7: 实现杭州行程与报告任务

**Files:**
- Create: `src/components/assessment/submissions/trip-submission.tsx`
- Create: `src/components/assessment/submissions/report-submission.tsx`
- Modify: `src/features/assessment/scene-config.ts`
- Modify: `src/app/assessment/[step]/page.tsx`
- Test: `tests/components/trip-scene.test.tsx`
- Test: `tests/components/report-scene.test.tsx`

**Interfaces:**
- Produces: `TripSubmission`，可编辑周六、周日、准备清单和调整说明。
- Produces: `ReportSubmission`，可编辑标题、正文、保留内容和修改项。

- [ ] **Step 1: 写两个场景失败测试**

```tsx
it('persists manual trip edits', async () => {
  renderScene(2)
  await user.clear(screen.getByLabelText('周六行程'))
  await user.type(screen.getByLabelText('周六行程'), '11:00 抵达后入住，下午慢游西湖')
  await user.click(screen.getByRole('button', { name: /提交我的安排/ }))
  expect(getTripSubmission().saturday).toContain('慢游西湖')
})

it('allows the user to correct report reliability issues', async () => {
  renderScene(3)
  await askAI('这些参考资料都是真实的吗？')
  expect(await screen.findByText(/示例性.*不一定对应真实存在/)).toBeVisible()
  await user.click(screen.getByLabelText('补充真实来源'))
  await user.click(screen.getByLabelText('把结论写得更谨慎'))
  await user.click(screen.getByRole('button', { name: /提交我的报告/ }))
  expect(getReportSubmission().modifyItems).toContain('cautious_conclusion')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/components/trip-scene.test.tsx tests/components/report-scene.test.tsx`

Expected: FAIL，两个提交物尚不存在。

- [ ] **Step 3: 实现杭州任务**

初版行程故意保留节奏、预算和换乘优化空间。用户可以聊天调整，最终安排采用结构化可编辑文本和清单；记录初始值与提交值，以便计算修改次数和文本差异。

- [ ] **Step 4: 实现报告任务**

初稿包含示例引用、缺少来源观点和过强结论。参考材料区域可展开。最终稿与复选项可编辑，提交时记录修改前后文本、引用追问和选择。

- [ ] **Step 5: 运行测试**

Run: `npm run test -- tests/components/trip-scene.test.tsx tests/components/report-scene.test.tsx`

Expected: PASS，两个场景的聊天与结构化提交均可用。

- [ ] **Step 6: 提交（仅当仓库已初始化）**

```bash
git add src/components/assessment/submissions src/features/assessment/scene-config.ts src/app/assessment tests/components/trip-scene.test.tsx tests/components/report-scene.test.tsx
git commit -m "feat: add trip and report assessment tasks"
```

---

### Task 8: 实现实习责任场景与分析过渡

**Files:**
- Create: `src/components/assessment/submissions/internship-submission.tsx`
- Modify: `src/features/assessment/scene-config.ts`
- Modify: `src/app/assessment/[step]/page.tsx`
- Create: `src/app/analyzing/page.tsx`
- Test: `tests/components/internship-scene.test.tsx`
- Test: `tests/components/analyzing-page.test.tsx`

**Interfaces:**
- Produces: 隐私信息选择、三项星点评价、两项重点、最终决定和理由。
- Consumes: `extractEvidence`、`calculateScores`。
- Produces: 完成后的 Session 分数与 `/feedback` 导航。

- [ ] **Step 1: 写敏感信息与完成流程失败测试**

```tsx
it('keeps sensitive fields unselected and records the final decision', async () => {
  renderScene(4)
  expect(screen.getByLabelText('真实姓名')).not.toBeChecked()
  expect(screen.getByLabelText('身份证号')).not.toBeChecked()
  await user.click(screen.getByLabelText('方向匹配'))
  await user.click(screen.getByLabelText('时间可控'))
  await user.click(screen.getByLabelText('再了解一下'))
  await user.type(screen.getByLabelText('我的理由'), '先确认项目内容和每周投入时间。')
  await user.click(screen.getByRole('button', { name: /提交我的判断/ }))
  expect(mockRouter.push).toHaveBeenCalledWith('/analyzing')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/components/internship-scene.test.tsx tests/components/analyzing-page.test.tsx`

Expected: FAIL，实习和分析页尚不存在。

- [ ] **Step 3: 实现实习提交区**

专业、技能、可投入时间为非敏感项；姓名、手机号、学号、身份证号默认不选且不作显性正确提示。AI 只返回风险、匹配和需要补充了解的信息。星点评价为可操作 radio group。

- [ ] **Step 4: 实现 1.8 秒分析过渡**

按 0、400、800、1200ms 展示四个完成项，约 1600ms 显示“分析完成”，随后计算 Evidence 与 scores、写入 Session 并导航到 `/feedback`。`prefers-reduced-motion` 下立即完成但保持内容顺序。

- [ ] **Step 5: 运行组件测试**

Run: `npm run test -- tests/components/internship-scene.test.tsx tests/components/analyzing-page.test.tsx`

Expected: PASS，完成四场景后评分只生成一次。

- [ ] **Step 6: 提交（仅当仓库已初始化）**

```bash
git add src/components/assessment/submissions/internship-submission.tsx src/features/assessment/scene-config.ts src/app/assessment src/app/analyzing tests/components
git commit -m "feat: add responsibility task and analysis transition"
```

---

### Task 9: 实现五页反馈系统

**Files:**
- Create: `src/components/feedback/feedback-nav.tsx`
- Create: `src/components/feedback/score-card.tsx`
- Create: `src/components/feedback/radar-chart.tsx`
- Create: `src/components/feedback/dimension-card.tsx`
- Create: `src/components/feedback/evidence-feedback.tsx`
- Create: `src/components/feedback/capability-bars.tsx`
- Create: `src/components/feedback/suggestion-card.tsx`
- Create: `src/app/feedback/page.tsx`
- Create: `src/app/feedback/[page]/page.tsx`
- Test: `tests/components/feedback-pages.test.tsx`

**Interfaces:**
- Consumes: `FeedbackModel`、Session scores 和 Evidence。
- Produces: 五个可点击 Tab、上一页/下一页、总览和四个详情页面。

- [ ] **Step 1: 写反馈翻页与真实性失败测试**

```tsx
it('shows behavior-grounded feedback and supports direct tab navigation', async () => {
  seedCompletedSession({ asked95: true, askedRanking: false })
  render(<DimensionFeedbackPage params={Promise.resolve({ page: '3' })} />)
  expect(screen.getByText(/主动询问了.*95%/)).toBeVisible()
  expect(screen.getByText(/没有继续核验.*排名/)).toBeVisible()
  await user.click(screen.getByRole('link', { name: 'AI 责任与合理使用' }))
  expect(mockRouterPath()).toBe('/feedback/4')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- tests/components/feedback-pages.test.tsx`

Expected: FAIL，反馈页面尚不存在。

- [ ] **Step 3: 实现总反馈**

总反馈只展示综合分、一句判断、SVG 雷达、四张维度卡、整体画像和三条总体建议。总分由四维平均计算。卡片链接跳到对应详情页。

- [ ] **Step 4: 实现四个统一详情页**

页面读取 route 到 dimension 的映射，渲染分数、对应场景、三条证据反馈、3–4 条能力、三条建议和 3–4 条真实行为。顶部五 Tab 与底部分页始终存在。

- [ ] **Step 5: 运行反馈测试**

Run: `npm run test -- tests/components/feedback-pages.test.tsx`

Expected: PASS，五页可达且文案与 seed 行为一致。

- [ ] **Step 6: 提交（仅当仓库已初始化）**

```bash
git add src/components/feedback src/app/feedback tests/components/feedback-pages.test.tsx
git commit -m "feat: add behavior grounded feedback pages"
```

---

### Task 10: 完整流程、恢复能力与视觉验收

**Files:**
- Create: `tests/e2e/assessment-flow.spec.ts`
- Create: `tests/e2e/session-recovery.spec.ts`
- Modify: `src/app/globals.css`
- Modify: UI files identified by browser review only when defects are observed。

**Interfaces:**
- Consumes: 全部页面和 Session。
- Produces: 可重复执行的端到端验收证据。

- [ ] **Step 1: 写完整用户流程 E2E**

```ts
test('completes four scenes and opens behavior based feedback', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /开始测评/ }).click()
  await completeHeadphones(page, { ask: '95% 的来源是什么？', decision: '我还需要更多信息' })
  await completeTrip(page, { adjustment: '周六下午放慢节奏，减少换乘' })
  await completeReport(page, { ask: '这些参考资料都是真实的吗？' })
  await completeInternship(page, { decision: '再了解一下' })
  await expect(page).toHaveURL(/feedback/)
  await expect(page.getByText(/95%.*来源/)).toBeVisible()
})
```

- [ ] **Step 2: 写刷新恢复与重新开始 E2E**

在场景二修改周六行程后刷新，断言文本仍存在；点击退出回首页后选择继续；点击重新开始并确认，断言 Session 被清空且按钮恢复“开始测评”。

- [ ] **Step 3: 运行 E2E 确认失败并补齐测试帮助函数**

Run: `npx playwright install chromium && npm run test:e2e`

Expected: 初次运行暴露流程、标签或路由问题；逐项修复后全部 PASS。

- [ ] **Step 4: 执行桌面与移动端浏览器验收**

检查 1440×900 与 390×844：文字溢出、双栏折叠、聊天滚动、固定按钮遮挡、焦点可见性、进度一致性、参考图视觉接近度。一次批量记录并修复所有明显问题，再做一次确认截图。

- [ ] **Step 5: 执行完整工程验证**

Run: `npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e`

Expected: 所有命令退出码为 0；构建无 TypeScript、ESLint 或 hydration 错误；E2E 覆盖四场景、刷新恢复、反馈翻页和不同评分路径。

- [ ] **Step 6: 提交（仅当仓库已初始化）**

```bash
git add src tests
git commit -m "test: verify complete assessment experience"
```

---

## Completion Evidence

交付时记录并报告：

- 实际技术栈与依赖版本。
- 页面路径和关键组件。
- Session 的 localStorage key、版本和恢复策略。
- Mock AI 的接口、意图识别和未来替换方式。
- RawEvent、Evidence、DimensionScore 的实际调用链。
- LLM Evidence Extractor 与 IRT/MIRT ScoringService 的替换边界。
- `lint`、`typecheck`、`test`、`build`、`test:e2e` 的实际结果。
- 桌面与移动端截图，以及修复的主要视觉问题。
