import type { SceneId } from './types'

export interface SceneConfig {
  id: SceneId
  step: number
  title: string
  intro: string
  aiTitle: string
  sections: Array<{ title: string; icon: 'product' | 'user' | 'document' | 'folder' | 'briefcase'; bullets: string[]; note?: string }>
}

export const sceneConfigs: Record<SceneId, SceneConfig> = {
  headphones: {
    id: 'headphones', step: 1, title: '朋友想买一款耳机，先问了 AI',
    intro: '看看 AI 给出的建议，判断哪些内容还需要进一步确认。',
    aiTitle: 'AI 的建议',
    sections: [
      { title: '朋友的需求', icon: 'user', bullets: ['预算约 900 元', '主要用于通勤和运动', '希望降噪较好、佩戴舒适'] },
    ],
  },
  trip: {
    id: 'trip', step: 2, title: '帮朋友把杭州周末行程改得更合适',
    intro: 'AI 已经根据需求生成了一份两日行程，看看你会怎么处理。',
    aiTitle: '当前行程',
    sections: [
      { title: '已有信息', icon: 'document', bullets: ['上海出发，周六上午去、周日晚返回', '西湖、灵隐寺、河坊街', '预算约 1200 元，同行 2 人', '尽量少换乘'] },
      { title: '我的偏好', icon: 'user', bullets: ['节奏悠闲，不想太赶', '优先地铁或打车，想拍照', '想吃当地美食', '住宿方便、性价比为主'] },
    ],
  },
  report: {
    id: 'report', step: 3, title: '用 AI 帮我写一份报告',
    intro: '完成一篇关于“在线教育对大学生学习的影响”的课程小报告。AI 可以协助，但最终仍需要你修改和决定。',
    aiTitle: 'AI 草稿',
    sections: [
      { title: '任务要求', icon: 'document', bullets: ['约 800 字', '包含不同观点', '给出参考资料或来源', '语言清晰正式'] },
      { title: '可用材料', icon: 'folder', bullets: ['课程课堂笔记', '两篇相关文章摘要', '讨论方向：效果、动机、公平与趋势'] },
    ],
  },
  internship: {
    id: 'internship', step: 4, title: '我该投这份实习吗？',
    intro: '你发现了一份感兴趣的实习岗位，但不确定是否适合自己，于是请 AI 帮你分析。',
    aiTitle: 'AI 的分析',
    sections: [
      { title: '岗位信息', icon: 'briefcase', bullets: ['云启科技 · 算法实习生', '3 个月，可远程', '教育科技与大模型相关项目', '要求 Python / 机器学习基础'] },
      { title: '我的情况', icon: 'user', bullets: ['目前研一，正在学习机器学习', '希望积累大模型项目经历', '本学期课程较多，时间有限', '未来想从事教育科技方向'] },
    ],
  },
}

export function getSceneConfig(step: number): SceneConfig | null {
  const ids: SceneId[] = ['headphones', 'trip', 'report', 'internship']
  return sceneConfigs[ids[step - 1]] ?? null
}
