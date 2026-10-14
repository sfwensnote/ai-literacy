---
name: 校园数字媒体社测评工作台
description: 新版参考图驱动的社团聊天、查证浏览器、AI 对话与工作台
colors:
  primary: "#2479ff"
  canvas: "#f7fbff"
  surface: "#ffffff"
  text: "#10264f"
  secondary-text: "#617697"
  border: "#deebfa"
  browser-chrome: "#e8eef6"
  incoming-message: "#f2f5fa"
  outgoing-message: "#eaf4ff"
typography:
  headline:
    fontFamily: "Source Han Serif SC, Noto Serif CJK SC, SimSun, serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "Source Han Serif SC, Noto Serif CJK SC, SimSun, serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "PingFang SC, Source Han Sans SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  compact-body:
    fontFamily: "PingFang SC, Source Han Sans SC, Noto Sans CJK SC, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "10px"
  panel: "14px"
  message: "16px"
spacing:
  compact: "12px"
  section: "20px"
  panel: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "48px"
---
# Design System: 校园数字媒体社测评工作台

## Overview

**Creative North Star: "消息派活，工具独立，工作连续"**

视觉基准为 images 中的新版社团对话界面、新版查证浏览器和新版问问ai。沿用参考图的浅蓝背景、白色全宽面板、顶部切换、左右聊天气泡、附件入口和底部输入栏。新增工作台承载编辑与提交，四个任务共用同一框架。

首页内容与布局保留原样。用户后续要求的网页标签图标、独立工作台与浏览器窗口外壳优先于初始三张图的结构。

**Key Characteristics:**
- 社团聊天只处理沟通与附件跳转。
- 查证浏览器拥有独立网页标签、导航和地址栏。
- AI 对话拥有任务上下文与独立输入栏。
- 工作台处理材料阅读、编辑、最终判断和提交。

## Colors

主操作 #2479ff；正文 #10264f，说明 #617697。收到的消息 #f2f5fa，自己的消息 #eaf4ff。白色工作面板以 #deebfa 细边框分隔。浏览器外壳使用 #e8eef6，与白色网页内容明确区分。绿色 URL 仅表示网址，不表示该来源一定可信。

## Typography

主标题桌面 28px，手机 26px；章节标题 20px，角色名称 18px。标题与角色名采用思源宋体优先、系统宋体回退。任务正文桌面 18px、手机 16px；密集问卷与报告正文 15px。正文控件使用苹方／思源黑体，Windows 可回退微软雅黑。数学字体由官方 KaTeX CSS 提供。

## Layout

桌面页边距 14px，手机 8px。顶部导航 74px，手机 62px。工作面板填满剩余视口高度，内容滚动发生在聊天记录、浏览器页面或工作台内部，输入栏保持在底部。主标题和面板内容左对齐。

导航为和社团聊天、查证浏览器、问问 AI、工作台，全部带图标与文字。手机将图标置于文字上方。聊天消息不超过工作区宽度的 76%，手机使用除头像以外的可用宽度。行程、报告与判断表单只出现在工作台。

## Elevation & Depth

通过浅蓝背景、白色表面、轻边框和消息色区分层级，不为工具面板叠加投影。首页原有阴影保留。

## Shapes

工作面板 14px，消息 16px，主要控件 10px 圆角。角色头像为圆形标签。网页标签顶部圆角，地址栏使用圆角输入条，搜索结果保持白色资料卡的结构。

## Components

聊天附件保留图标、标题、摘要和右侧箭头，点击只切换到对应任务的工作台。社团与 AI 的消息记录互相独立。角色消息、输入草稿、任务编辑、浏览器标签、历史和引用均持久化。

仿真浏览器提供带站点图标和关闭按钮的标签、后退、前进、刷新、主页及可输入的地址栏。仅支持本任务的本地仿真资料；未收录地址显示明确说明。材料分类徽标不展示正确答案或评分。

## Do's and Don'ts

- Do 保留三张新版图中的导航、气泡、附件与输入栏关系。
- Do 保留文字标签，不用图标替代入口含义。
- Do 让聊天、网页、AI 与任务编辑保持独立。
- Don't 把任务表单和查证页面再次塞进聊天侧栏。
- Don't 重新引入旧任务页、抽屉或重复样式。
- Don't 把仿真信源、问卷草案或项目参考等级标为官方已验证结果。
