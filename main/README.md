# AI 素养场景化测评

校园数字媒体社的一日任务：采购核查、采风筹备、报告编辑与实习判断。

## 本地运行

```powershell
cd C:\ai-literacy\main
npm ci
npm run dev
```

打开 http://127.0.0.1:3000。首页保留原样，开始后依次进行前测、四项任务、后测与报告。

## 结构

- src/components/assessment/scene-desktop.tsx：四栏工作台框架
- src/components/assessment/narrative-thread.tsx：社团聊天与附件跳转
- src/components/assessment/simulated-browser.tsx：浏览器窗口、网页与引用
- src/components/assessment/workspace-ai.tsx：独立 AI 对话
- src/components/assessment/documents/：四种任务编辑器
- src/features/assessment/：任务配置、持久化、仿真信源与浏览历史
- src/features/scoring/：行为证据、规则分数和等级描述
- src/app/workspace-desktop.css：当前参考图驱动的任务样式
- src/app/assessment-support.css：问卷与报告样式

已移除旧任务页、旧侧栏和 AI 抽屉、旧提交组件、重复任务样式和过时锁文件备份；行程编辑器、报告编辑器、评分逻辑及有效测试保留。

## 验证

```powershell
npm run typecheck
npm run lint
npm test
npm run test:e2e -- --workers=1
npm run build
```

AI 与浏览器均为本地仿真，不依赖 API Key。问卷采用研究用草案，参考等级尚未标定。原始测评记录可从报告下载。
