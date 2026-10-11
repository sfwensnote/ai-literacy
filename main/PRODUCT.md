# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js、React、TypeScript、Tailwind CSS、Zustand；本地 Mock AI，无数据库和 API Key。

## Users

主要用户是参与 AI 素养研究测评的学生。他们在电脑或手机上完成四个贴近日常学习、生活和职业选择的任务，并了解自己的 AI 使用方式。

## Product Purpose

通过可实际操作的情境任务记录 AI 使用行为，将行为转化为证据、四维分数和具体反馈。成功意味着用户能连续完成全流程，并看到明确引用其真实操作的个性化反馈。

## Positioning

产品不以知识问答自报能力，而是观察用户如何追问、核验、修改、保护信息并做出最终判断，从真实过程生成可解释反馈。

## Operating Context

用户依次完成耳机购买判断、杭州周末规划、AI 报告撰写和实习投递决策；每个场景包含材料、规则型 AI 对话和不同形式的最终提交物。

## Capabilities and Constraints

- 无需真实登录、后端、数据库、支付或权限系统。
- Mock AI 支持中英文关键词和自然回退，未来可替换为真实 LLM。
- 评分链固定为 RawEvent → Evidence → DimensionScore，未来可替换为 LLM 证据抽取与 IRT/MIRT。
- Session 使用 localStorage 持久化，支持刷新恢复和重新开始。
- 反馈包含总览与四个维度详情，共五页。
- 测评时不向用户显示能力维度和隐藏评分规则。

## Brand Commitments

- 左上角永远只显示双圆图形 Logo，不显示平台名称。
- 视觉遵循用户提供的参考图：蓝白、浅蓝背景、深蓝标题、圆角白卡片、淡阴影和高饱和蓝主按钮。
- 首页可稍有设计感，但不使用大型机器人或人物插画；任务页保持安静、聚焦。
- 不使用复杂动画、满屏图标或厚重后台系统风格。

## Evidence on Hand

- `images/首页.png`
- `images/任务一.png` 至 `images/任务四.png`
- `images/任务一测评.png` 至 `images/任务四测评.png`
- 用户提供的完整场景、评分和反馈需求。
- 不存在真实用户评价、商业数据或真实产品研究依据，界面不得自行虚构为真实证据。

## Product Principles

- 任务简单、行为丰富、数据可计算。
- 先记录事实，再生成证据，最后计算分数。
- 每个场景都以用户可编辑的最终提交物结束。
- 反馈引用真实行为，不用泛化模板替代事实。
- 保持流程连续、界面克制、状态可恢复。

## Accessibility & Inclusion

支持桌面与手机，关键操作具备可见标签、键盘焦点、合理点击面积和减少动态效果偏好。
