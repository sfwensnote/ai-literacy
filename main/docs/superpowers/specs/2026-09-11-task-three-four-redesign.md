# 任务三、任务四重写设计

## 目标与边界

只重写 `/assessment/3` 与 `/assessment/4`，沿用任务一、二已经建立的单页多状态交互。保留首页、任务一、任务二、分析页、反馈页、路由、localStorage key、最终提交结构和现有评分维度。Mock AI 不联网，不替用户做最终判断。

## 设计方向

- 模式：Redesign · Preserve。
- 视觉语言：安静、可信、轻量的蓝白任务界面。
- 参数：视觉变化 2/10，动效 2/10，信息密度 6/10，素材依赖 1/10，品牌一致性 10/10。
- 复用 `AssessmentTaskShell`、`RequirementStrip` 与 `AIChatDrawer`；不新增图片、品牌文字、Dashboard 或测评维度提示。
- 一个页面始终只有一个主要成果对象：任务三是当前报告，任务四是当前决策。

## 任务三：报告核验与修改

### 状态流

`查看 AI 初稿 → 标记待核验内容 → 可选询问 AI → 应用或拒绝修改 → 编辑最终稿 → 确认提交`

### 初始状态

- 顶部紧凑展示字数、观点、来源和语言要求。
- 页面只展示一份 AI 初稿，不并排制造“AI 版/用户版”。
- 报告中的示例引用、缺少来源的观点和过强结论是可点击语义片段；用户可以多选，但界面不提示正确答案。
- “我认为这份初稿可以直接使用”作为轻量替代选项。
- AI 抽屉默认收起，用户自由输入问题，不提供推荐问题按钮。

### AI 与修改状态

- 询问来源时，Mock AI 明确说明示例引用不一定真实，并给出替换原则；不虚构真实文献。
- 针对来源、结论或多角度意图返回一项结构化修改建议。
- 用户可“先不采用”或“应用到报告”；应用后直接更新当前报告并短暂高亮变化，不创建第二份报告。
- 用户可随时进入编辑状态，修改标题和正文。

### 最终状态

- 保留“我保留的内容”和“我准备修改的地方”两个紧凑选择组。
- 正文少于 80 字或标题为空时禁用提交。
- 提交仍生成现有 `ReportSubmission`，并附带兼容的新行为事件。

### 事件

`task3_view`、`task3_claim_select`、`task3_claim_unselect`、`task3_trust_all`、`task3_ai_open`、`task3_prompt_send`、`task3_ai_response`、`task3_suggestion_accept`、`task3_suggestion_reject`、`task3_report_edit`、`task3_submit`。

## 任务四：信息边界与独立决策

### 状态流

`选择提供的信息 → 查看 AI 分析 → 可选询问 AI → 形成个人判断 → 确认提交`

### 信息与分析状态

- 紧凑展示岗位信息和个人情况，不使用图片。
- “提供给 AI 的信息”支持自由多选；默认仅选择专业方向、技能和可投入时间，不预先提示哪些选项敏感。
- 页面只展示一份 AI 分析，包含优势和需要确认的事项。
- AI 抽屉默认收起；用户可以自由询问风险、匹配、时间或隐私，AI 只提供分析。

### 最终判断状态

- 用户分别评价岗位匹配、成长收获、时间压力。
- 最多选择两个最看重因素，选中状态清晰。
- 最终选择为准备投递、再了解一下、暂不投递；理由可选。
- 提交前显示同页确认，不新增路由。

### 事件

`task4_view`、`task4_shared_info_change`、`task4_ai_open`、`task4_prompt_send`、`task4_ai_response`、`task4_rating_change`、`task4_priority_change`、`task4_decision_change`、`task4_submit`。

## 组件与数据

- 新增 `TaskThreeFlow`、`TaskFourFlow`，由 `AssessmentClient` 按场景分发。
- 新增精简的报告展示/编辑组件和岗位分析组件；公共聊天继续使用 `AIChatDrawer`。
- 为任务三、四增加阶段化 Draft 类型，旧草稿通过 normalize 函数兼容。
- `taskMockAIService` 扩展报告结构化建议；实习回复继续使用现有意图识别。
- `EvidenceExtractor` 同时识别旧 `prompt_sent` 与新的 `task3_prompt_send`、`task4_prompt_send`。

## 验证

- 纯函数单元测试：报告建议应用、草稿规范化所需的数据转换、关注点最多两项。
- E2E：任务三来源追问并应用修改、任务三直接编辑、任务四默认隐私边界、任务四风险追问与最终提交、刷新恢复。
- 全量执行 Vitest、TypeScript、ESLint、Next production build 与现有 Playwright 流程。
- 在 1728×960 桌面视口检查任务三初始状态和任务四最终判断状态，无横向溢出、无控制台错误。

## 非目标

不接入真实文献检索、真实招聘平台、文件上传、富文本编辑器、自动事实核验、真实模型、额外评分页面或新的设计系统。
