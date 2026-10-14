---
name: 校园数字媒体社测评工作台
description: 蓝白、紧凑、全宽的情境测评界面
colors:
  primary: "#1768d2"
  canvas: "#edf4fc"
  surface: "#ffffff"
  text: "#203d63"
  secondary-text: "#486482"
  border: "#d8e4f3"
typography:
  headline:
    fontFamily: "Source Han Serif SC, Noto Serif CJK SC, SimSun, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "Source Han Serif SC, Noto Serif CJK SC, SimSun, serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "PingFang SC, Source Han Sans SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "8px"
  panel: "10px"
  shell: "12px"
spacing:
  compact: "8px"
  normal: "12px"
  section: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "42px"
---
# Design System: 校园数字媒体社测评工作台

## Overview

**Creative North Star: "安静而连续的社团工作台"**

在既有蓝白视觉中扩展情境任务。主要操作与角色消息并列，浏览器和提交物保持可见。首页继续使用原有布局与样式，本文件新增规范适用于任务、问卷、分析与反馈。

**Key Characteristics:**
- 全宽利用空间，不使用居中的窄任务卡。
- 内容决定密度，不用重复提示和空卡片占位。
- 角色消息推动任务，反馈报告解释已记录的行为。

## Colors

蓝色表示操作和当前步骤。白色用于工作面板，浅蓝用于背景与角色消息。正文 #203d63，次要说明 #486482，分隔线 #d8e4f3。

## Typography

主标题统一 26px，章节标题 18px；角色名 16px。标题与角色名使用 --font-title：思源宋体优先，系统宋体回退。正文、导航、按钮与输入使用 --font-body：苹方／思源黑体优先，微软雅黑回退，正文 15px。数学内容使用已加载的 KaTeX 官方 CSS 与字体，不用中文正文代替数学字体。

## Layout

外边距 12px，手机 8px；内容面板内边距 12–16px。桌面角色栏 260px，任务区使用剩余宽度。任务一的材料与仿真浏览器双栏排列，1250px 以下改为单栏；850px 以下角色流位于任务上方。任务主标题左对齐，浏览器文章与引用区域独立滚动，避免长信源把提交按钮推得过远。问卷按三个情意维度排列，850px 以下单列。

## Elevation & Depth

任务与报告以背景和细边框区分层级，面板无投影。保留首页既有淡阴影，不将首页风格扩散到操作区域。

## Shapes

控件圆角 8px，任务面板 10px，外围工作面板 12px。角色气泡保留角部方向，表示消息来源。

## Components

角色消息流有派活、追问、用户回复和交接确认；按钮清楚表达动作。仿真浏览器有标签、搜索、文章、作者和本站信息，引用摘录有校验、移除与空状态。问卷 radio 不默认选择。报告显示四维行为分、三档复杂度与自主性描述，以及独立的态度前后测。

## Do's and Don'ts

- Do 保留首页原有视觉与内容。
- Do 用统一的字体层级和紧凑间距覆盖测评页面。
- Do 保留可见焦点、真实标签、手机单栏和无横向溢出的布局。
- Don't 在任务中暴露分数或正确答案。
- Don't 将仿真数据、原创建议问卷或项目等级标为官方或已验证结果。
