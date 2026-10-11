# AI 素养场景化测评 Demo 设计规格

## 1. 产品目标

构建一个无需登录、数据库或真实大模型即可完整演示的 AI 素养表现性测评。用户连续完成四个真实任务，系统记录交互行为，将行为转换为证据与四维分数，并在五页反馈中引用用户刚刚发生的真实行为。

验收重点不是静态页面复刻，而是完整闭环：场景操作 → 行为事件 → 证据 → 分数 → 个性化反馈。

## 2. 技术方案

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Zustand 持久化 Session
- lucide-react 图标
- Vitest + Testing Library
- Playwright 浏览器流程测试
- 本地 Mock AI，不依赖 API Key

项目为全新空目录，采用模块化单体前端。业务接口保持可替换，但不提前建设后端。

## 3. 页面与路由

| 路径 | 页面 | 主要职责 |
| --- | --- | --- |
| `/` | 首页 | 产品说明、开始或继续测评、重新开始入口 |
| `/assessment/1` | 耳机购买判断 | 核验 AI 推荐、提交独立购买判断 |
| `/assessment/2` | 杭州周末行程 | 迭代计划、编辑最终行程与清单 |
| `/assessment/3` | AI 报告撰写 | 检查来源、编辑并提交最终报告 |
| `/assessment/4` | 实习投递决策 | 选择信息边界、评估并提交决定 |
| `/analyzing` | 分析过渡 | 依次展示四步分析状态并生成评分 |
| `/feedback` | 总反馈 | 总分、雷达图、四维卡片、画像与建议 |
| `/feedback/1..4` | 四维详情 | 行为反馈、能力条、建议和任务表现 |

场景提交后短暂显示“已保存”，直接进入下一场景。第四场景进入分析页，约 1.8 秒后自动进入总反馈。

## 4. 信息架构与组件

### 4.1 通用组件

- `Logo`：仅显示双圆图形，不显示平台名称。
- `ProgressDots`：四场景进度。
- `PageShell`：背景、最大宽度和安全边距。
- `Card`、`PrimaryButton`、`ChoiceGroup`、`CheckList`：统一视觉与交互状态。

### 4.2 场景组件

- `ScenarioLayout`：顶部导航、左右双栏、保存状态和退出行为。
- `MaterialCard`：场景材料、条件、用户需求与提示。
- `AIChat`：消息、输入、加载状态、发送与自动滚动。
- `FinalSubmission`：提交区外壳与校验。
- `HeadphoneSubmission`、`TripSubmission`、`ReportSubmission`、`InternshipSubmission`：四类独立提交物。

### 4.3 反馈组件

- `FeedbackNav`：五个 Tab、上一页、下一页和页码点。
- `ScoreCard`：总分或维度分数。
- `RadarChart`：使用原生 SVG 绘制四维雷达，不增加重型图表依赖。
- `EvidenceFeedback`：将 Evidence 转为真实行为描述。
- `SuggestionCard`、`CapabilityBars`：建议和能力表现。

页面容器只负责组合，场景配置、AI 规则、评分规则和反馈文案生成分别位于独立模块，避免超大组件和业务耦合。

## 5. 数据结构

```ts
type SceneId = 'headphones' | 'trip' | 'report' | 'internship'

type Dimension =
  | 'information_judgement'
  | 'ai_use'
  | 'ai_evaluation'
  | 'ai_responsibility'

interface RawEvent {
  id: string
  sceneId: SceneId
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

interface Evidence {
  id: string
  dimension: Dimension
  status: 'positive' | 'negative' | 'unknown'
  confidence: number
  sourceTask: SceneId
  description: string
  weight: number
}

interface SceneSession<TSubmission> {
  startedAt?: string
  completedAt?: string
  messages: ChatMessage[]
  actions: RawEvent[]
  finalSubmission?: TSubmission
  durationMs: number
}

interface AssessmentSession {
  version: 1
  id: string
  startedAt: string
  currentScene: number
  scenes: Record<SceneId, SceneSession<unknown>>
  evidence: Evidence[]
  scores?: Record<Dimension, number>
  completedAt?: string
}
```

Zustand Store 只暴露语义化动作：`startSession`、`recordEvent`、`appendMessage`、`updateDraft`、`submitScene`、`completeAssessment`、`resetSession`。通过版本化 persist 中间件写入 localStorage，并允许未来迁移数据结构。

## 6. 场景状态流

每个场景遵循统一状态：

`未开始 → 进行中 → AI 思考 → 可继续操作 → 提交校验 → 已保存 → 下一场景`

- 首次进入时记录 `scene_started`。
- 用户消息按顺序记录 `prompt_sent`，同时记录意图标签。
- 勾选、输入、评分、敏感信息选择和最终决定均记录原始事件。
- 提交时保存结构化结果和停留时间，并由该场景评分规则产生 Evidence。
- 已完成场景可恢复查看，但不会重复累计 Evidence。

## 7. Mock AI

定义可替换接口：

```ts
interface AIService {
  sendMessage(
    sceneId: SceneId,
    history: ChatMessage[],
    message: string
  ): Promise<AIResponse>
}
```

`MockAIService` 使用标准化文本、中文与英文关键词和优先级规则识别意图，例如来源、95%、排名、预算、节奏、换乘、引用、真实文献、风险、时间和隐私。返回值包含自然语言回复和识别到的 intent。无匹配时返回与当前场景相关的通用追问引导。响应延迟在 500–900ms，期间显示“正在思考…”。

Mock AI 只提供分析与建议；实习场景不得替用户作最终决定。

## 8. 行为、证据与评分

评分分三层：

1. `RawEvent`：忠实记录用户动作，不包含评价。
2. `EvidenceExtractor`：各场景规则把事件和提交物转换为 Evidence。
3. `ScoringService`：汇总 Evidence，归一化为 0–100。

四维主对应关系：

- 报告任务 → 信息理解与判断
- 杭州规划 → AI 使用与问题解决
- 耳机任务 → AI 评价与批判性分析
- 实习任务 → AI 责任与合理使用

少量跨维度 Evidence 允许存在，但反馈详情页以主对应场景为依据。基础分与行为加减分经过边界限制和轻微平滑，使正常完成时约为 82、76、70、85，同时不同操作产生真实变化。总分为四维算术平均。

Evidence 的 `description` 使用可直接转成反馈的事实表述，例如“你主动询问了 95% 用户满意度的数据来源”。建议内容由 Evidence 缺口映射，而不是从固定分数文案反推。

## 9. 反馈生成

反馈共五页，不合并为单页 Dashboard。

- 总反馈：总分、四维雷达、四张维度摘要、整体画像、三条总体建议。
- 维度详情：分数与场景、本页三条反馈、3–4 个能力条、三条建议、3–4 条真实任务表现。

反馈生成优先读取本次 Session 的 Evidence 和提交结果；当某项行为未发生时，使用明确的缺失性描述，例如“你核验了满意度数据，但没有继续追问排名依据”，避免虚构用户行为。

## 10. 视觉设计系统

### Design Read

- Artifact：可交互教育测评 Web App
- Audience：学生及研究参与者
- Mode：首页为轻量 Persuade，任务与反馈为 Operate
- Visual language：安静、可信、轻盈的蓝白研究产品
- Visual variance：4/10
- Motion intensity：2/10
- Information density：桌面 7/10，移动端 5/10
- Asset dependence：2/10
- Brand fidelity：9/10，以用户示意图为唯一视觉锚点

### Tokens

- 主色：高饱和蓝 `#1677ff`，深蓝文字 `#07153f`。
- 背景：白色到极浅蓝的柔和环境渐变，不使用玻璃拟态。
- 中性色：蓝灰正文、淡蓝描边、白色卡片。
- 字体：系统中文无衬线字体栈，标题 700–800，正文 400–500。
- 间距：8px 基准，常用 16/24/32/48。
- 圆角：控件 12–14px，卡片 18–24px，胶囊按钮 999px。
- 阴影：仅使用一层低透明度蓝灰阴影和细边框。
- 动效：180–240ms 状态过渡；分析页分步出现；尊重 `prefers-reduced-motion`。

桌面场景左右栏约 46/54。小屏改为单栏，材料位于聊天之前，提交物保持完整可编辑。所有控件提供键盘焦点、可见标签、合理点击面积和禁用状态。

首页不用大型机器人或人物插画，仅用 CSS/SVG 构造轻量抽象圆、轨迹线和界面轮廓。

## 11. 异常与边界处理

- localStorage 不可用时退化为内存状态，并显示非阻塞提示。
- 不允许跳过未完成场景直接进入反馈；路由守卫送回当前场景。
- AI 回复期间禁止重复发送，但允许继续编辑输入。
- 提交只校验完成流程所需的最小字段，错误就近展示。
- 刷新后恢复输入草稿、消息和当前场景。
- 重新开始采用二次确认，清除 Session 后返回首页。

## 12. 验证计划

- 单元测试：意图识别、Evidence 提取、分数变化、文本差异、Session 初始化与迁移。
- 组件测试：聊天发送、提交校验、四类最终提交物、反馈翻页。
- 浏览器测试：完整四场景流程、刷新恢复、重新开始、直接路由防护、桌面和手机视口。
- 行为差异测试：高核验/低核验路径必须产生不同 Evidence、分数与反馈。
- 工程验证：TypeScript、ESLint、Vitest、Next.js production build。

## 13. 未来替换路径

- 将 `MockAIService` 替换为实现同一接口的 `LLMAIService`。
- 将规则型 `EvidenceExtractor` 替换为 LLM 结构化证据抽取，保留 Evidence Schema。
- 将 `RuleScoringService` 替换为 IRT/MIRT 服务，反馈层仍消费统一 DimensionScore。
- 将 localStorage Repository 替换为远端 Session Repository，不改变页面组件。

## 14. 范围边界

不实现真实登录、数据库、真实 AI、IRT、复杂管理后台、支付、权限系统、逐字流式输出或炫技动画。示意图中的业务文案与本规格冲突时，以用户提供的完整业务要求为准。
