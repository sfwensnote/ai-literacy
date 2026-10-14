# 社团叙事与双轨证据改造

## 实现范围

首页保持原样。通过原来的开始入口进入 9 题前测，再按顺序完成四项社团任务，随后进入相同题目的后测、分析和五页报告。旧会话补做缺失问卷后继续，保留原任务草稿。

## 框架使用边界

- [OECD PISA 2029 MAIL](https://www.oecd.org/en/about/projects/pisa-2029-media-and-artificial-intelligence-literacy.html)：借鉴仿真环境与可操作工具采集证据的设计。官方页面说明 2026 年 1 月版本仍为初步草案。本项目不复制完整测试或宣称正式对齐其量尺。
- [澳大利亚 ADCF](https://www.dewr.gov.au/download/15113/australian-digital-capability-framework/32542/australian-digital-capability-framework/pdf)：借鉴任务复杂度与自主性表述熟练度；本项目保留原四维模型，采用自定三档。分数低于 65、65–79、80 及以上对应低／中／高，未进行心理测量标定。
- [UNESCO 学生 AI 能力框架](https://unesdoc.unesco.org/ark:/48223/pf0000391105)：人本、伦理、技术应用与系统设计，以及理解、应用、创造层次，作为后续扩展任务与能力覆盖的依据。本次不将四个场景等同于覆盖全部 12 个能力单元。

问卷为本项目原创的 9 题研究草案，不是 PISA 附录官方题目或已验证量表。AILit、Jisc 与其他框架可在后续量规研究中继续映射，本次先实现具体的交互与证据闭环。

## 证据链

行为链：RawEvent → Evidence → DimensionScore → 项目参考档位。

任务一事件包括 browser_search、browser_source_open、browser_tab_switch、browser_tab_close、browser_about_author、browser_about_site、browser_citation_add/remove。引用必须与仿真库的 sourceId、URL 和至少 8 字连续原文同时匹配。横向比较必须包含一个独立信源；同品牌的两页不算独立印证。重复点击和重复引用不会叠加计分。打开页面只是访问证据，不代表完整阅读或理解。

所有信源与 example 域名为虚构测评材料，品牌的 95% 满意来自 20 人活动回访，导购榜单存在佣金关系，独立观察只覆盖三款样本。设计保留模糊性与方法限制。

情意链：前测／后测逐题原始回答 → 反向处理 → 三域均值（1–5）。每域三题，第 3 题反向处理为 6−回答。开放思维与 AI 态度高表示更愿意探索或参与；误信易感性高表示更容易误信。缺失回答不计均值，变化不解释为训练效果，不混入行为分数。

## 连续性与动机

角色消息从真实操作触发，确定键去重，刷新不会重复派活。交接确认引用上一任务实际提交物。“我需要更多时间”保存回复，不限时、不扣分。报告支持反思保存与原始 JSON 导出。反思不影响评分。

## 文件入口

- src/features/assessment/questionnaire.ts：题库与均值
- src/features/assessment/browser-sources.ts：信源库、搜索与引用校验
- src/features/assessment/narrative.ts：任务叙事与触发规则
- src/features/scoring/evidence-extractor.ts：行为证据
- src/features/scoring/proficiency-levels.ts：等级描述
- src/app/assessment-enhancements.css：任务、问卷、报告的统一样式
