import type { SourceCitation, SceneId } from './types'

export interface BrowserSource {
  id: string
  url: string
  title: string
  site: string
  author: string
  summary: string
  content: string[]
  aboutAuthor: string
  aboutSite: string
  independent: boolean
  sceneId?: SceneId
  date?: string
  category?: string
}
export const browserSources: BrowserSource[] = [
  {
    id: 'brand',
    url: 'https://yunsheng.example/products/s9',
    title: '云声 S9：降噪与续航规格',
    site: '云声官方商城',
    author: '云声产品团队',
    independent: false,
    summary: '售价 899 元，标称续航 30 小时，提供降噪功能。',
    content: [
      '云声 S9 建议零售价 899 元，支持主动降噪。',
      '标称续航约 30 小时，测试条件为关闭降噪、音量 50%；实际续航受音量和环境影响。',
      '宣传页称“同价位表现出色”，未提供横向排名测试数据。',
    ],
    aboutAuthor: '云声产品团队负责产品宣传与销售，没有独立测评资质说明。',
    aboutSite: '本站由云声品牌运营，内容用于推广自有产品；产品参数不等同于独立评价。',
  },
  {
    id: 'ranking',
    url: 'https://bestbuy-audio.example/rankings/900',
    title: '900 元耳机榜单：云声 S9 排名第一？',
    site: '好物音频榜',
    author: '好物推荐编辑部',
    independent: false,
    summary: '榜单推荐云声 S9，并引用“95% 满意”；页面包含购买链接。',
    content: [
      '本月推荐榜将云声 S9 列在第一位，排名来自编辑推荐，未公布参与比较的型号与测量方法。',
      '页面中的购买链接为推广链接，读者购买后本站可能获得佣金。',
      '“95% 满意”引自云声体验活动回访，本站未进行独立用户调查。',
    ],
    aboutAuthor: '编辑部主要汇总品牌信息与商品推广材料，没有公布本榜单的实测记录。',
    aboutSite: '本站依靠导购佣金运营。本榜单存在商业合作，排名不是完整市场的性能排名。',
  },
  {
    id: 'lab',
    url: 'https://campus-audio-lab.example/tests/s9',
    title: '云声 S9 与两款同价位耳机的对比记录',
    site: '校园声学观察组',
    author: '周宁 · 声学实验项目成员',
    independent: true,
    summary: '公开测试条件与原始记录：降噪效果随环境变化，未支持“全面第一”。',
    content: [
      '观察组自购三款耳机，在相同音量下比较地铁噪声和人声场景；未接受品牌赞助。',
      'S9 在低频地铁噪声中表现较好，在人声场景中不优于另两款产品，因此不能据此认定同价位降噪排名第一。',
      '开启降噪时，连续播放测得续航约 22 小时；本记录仅覆盖三款样品，不代表所有耳机。',
      '运动佩戴舒适度存在个体差异，建议试戴后再决定。',
    ],
    aboutAuthor: '周宁参与校园声学实验项目，公开仪器、环境与记录；不是产品认证机构。',
    aboutSite: '学生独立观察项目，自购样品并公开方法。三款样本的结论不能推广到整个市场。',
  },
  {
    id: 'survey',
    url: 'https://yunsheng.example/research/feedback',
    title: '“95% 用户满意”的活动回访说明',
    site: '云声体验活动',
    author: '云声用户运营组',
    independent: false,
    summary: '20 位体验活动参与者中有 19 位表示满意，样本由品牌邀请。',
    content: [
      '本次活动邀请 20 位云声 S9 体验者回访，19 位选择“满意”或“非常满意”，计算结果为 95%。',
      '参与者来自品牌体验活动，属于小规模自愿回访，没有随机抽样或覆盖全部购买者。',
      '回访由品牌用户运营组组织，不能据此推断所有用户的满意程度。',
    ],
    aboutAuthor: '用户运营组负责品牌体验活动，调查由品牌发起并整理。',
    aboutSite: '云声旗下体验活动页面，提供回访范围和统计口径；与官方商城属于同一主体。',
  },
]
export function findBrowserSource(value: string): BrowserSource | undefined {
  return [...browserSources, ...additionalBrowserSources].find(
    (source) => source.id === value || source.url === value,
  )
}
export function searchBrowserSources(
  query: string,
  sceneId: SceneId = 'headphones',
): BrowserSource[] {
  const sources =
    sceneId === 'headphones'
      ? browserSources
      : additionalBrowserSources.filter((source) => source.sceneId === sceneId)
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return sources
  const synonyms = ['耳机', '云声', 's9', '900', '降噪', '评测', '测评']
  const relevant = [
    '95%',
    '满意',
    '排名',
    '续航',
    '降噪',
    '交通',
    '换乘',
    '预算',
    '学习',
    '引用',
    '来源',
    '课程',
    '工时',
    '时间',
    '隐私',
  ].filter((word) => query.toLowerCase().includes(word))
  if (relevant.length)
    return sources
      .map((source) => {
        const text = [source.title, source.summary, ...source.content].join(' ').toLowerCase()
        return { source, matches: relevant.filter((word) => text.includes(word)).length }
      })
      .filter((item) => item.matches > 0)
      .sort((a, b) => b.matches - a.matches)
      .map((item) => item.source)
  return sources.filter((source) =>
    words.every(
      (word) =>
        (sceneId === 'headphones' && synonyms.includes(word)) ||
        [source.title, source.site, source.summary, ...source.content]
          .join(' ')
          .toLowerCase()
          .includes(word),
    ),
  )
}

const additionalBrowserSources: BrowserSource[] = [
  {
    id: 'trip-transit',
    sceneId: 'trip',
    url: 'https://hangzhou-transit.example/route-guide',
    title: '杭州采风交通与换乘说明',
    site: '城市出行资料页',
    author: '出行资料编辑组',
    independent: true,
    date: '2026-09-08',
    category: '交通资料',
    summary: '西湖、灵隐寺与河坊街之间有跨区域移动，步行、候车与换乘时间需要计入行程。',
    content: [
      '从西湖周边前往灵隐景区，需为公交接驳、候车和步行预留时间，不能仅按地图距离估计。',
      '两天的采风可将相近地点放在同一天，返程当日为前往车站预留余量。',
      '本页为仿真交通资料，实际班次与出行时间仍需在出行前确认。',
    ],
    aboutAuthor: '编辑组整理示例交通条件，不代表交通运营机构。',
    aboutSite: '独立的仿真公共出行资料页，不提供售票或旅行产品推广。',
  },
  {
    id: 'trip-budget',
    sceneId: 'trip',
    url: 'https://campus-travel.example/hangzhou/budget',
    title: '两人杭州周末采风预算清单',
    site: '校园旅行记录',
    author: '小禾 · 采风成员',
    independent: true,
    date: '2026-09-10',
    category: '经验记录',
    summary: '把往返交通、住宿、餐饮和景区费用分开列出，1200 元预算需要预留交通余量。',
    content: [
      '两人总预算约 1200 元时，需要同时考虑往返交通、住宿、餐饮、门票和当地交通。',
      '免费街区与步行采风可以控制费用，但住宿价格和交通班次会随日期变化。',
      '这是一次经验性记录，不是对所有日期都适用的报价。',
    ],
    aboutAuthor: '作者分享个人采风记录，没有接受本页旅行商品推广。',
    aboutSite: '学生经验分享，无法作为未来价格和服务的保证。',
  },
  {
    id: 'report-notes',
    sceneId: 'report',
    url: 'https://campus-learning.example/course/notes',
    title: '在线教育专题课程笔记',
    site: '社团课程资料库',
    author: '课程资料整理组',
    independent: false,
    date: '2026-09-06',
    category: '课程材料',
    summary: '线上资源可扩大可获得性，学习效果还受到课程设计、互动与自律条件影响。',
    content: [
      '在线教育可以扩大学习资源的可获得性，但学习效果受到课程设计、师生互动与学生支持条件的共同影响。',
      '学生学习动机、设备与网络条件存在差异，因此不能从单一案例推断所有学生的学习表现。',
      '课程笔记是讨论材料，不是直接证明某个因果结论的研究报告。',
    ],
    aboutAuthor: '整理组汇总课堂讨论，没有对研究原文进行系统综述。',
    aboutSite: '社团内部仿真材料库，需要在正式稿中注明材料性质。',
  },
  {
    id: 'report-review',
    sceneId: 'report',
    url: 'https://education-review.example/online-learning',
    title: '在线学习效果：材料摘要与研究限制',
    site: '教育资料观察',
    author: '陈闻 · 资料编辑',
    independent: true,
    date: '2026-09-12',
    category: '研究摘要',
    summary: '积极与消极影响并存，摘要不能替代原始研究；需核查样本与研究设计。',
    content: [
      '部分材料报告了在线学习的便利性，另一些材料指出互动不足与动机下降的问题，结论随课程类型与学生群体不同而变化。',
      '引用摘要前应核查原始来源、样本范围和研究设计；摘要中的相关性不能直接写成因果性。',
      '本资料不提供 Johnson 等（2021）这条引用的原始文献，因此不能证明该引用真实存在。',
    ],
    aboutAuthor: '作者从事示例资料整理，公开指出材料限制，不具备本专题研究认证身份。',
    aboutSite: '独立仿真资料观察页，提供核查方向，不替代可检索的正式文献。',
  },
  {
    id: 'internship-job',
    sceneId: 'internship',
    url: 'https://yunqi-careers.example/internship',
    title: '算法实习岗位：项目与时间要求',
    site: '云启岗位说明',
    author: '云启招聘组',
    independent: false,
    date: '2026-09-14',
    category: '岗位资料',
    summary: '三个月可远程，实际工时、指导安排与项目内容需要向招聘方确认。',
    content: [
      '岗位描述为三个月算法实习，涉及教育科技与大模型项目，需要 Python 和机器学习基础。',
      '远程工作不代表工时完全自由。每周投入、会议频率、导师安排与交付内容尚待沟通。',
      '是否适合个人需要结合课程负担与发展目标，岗位宣传不能替代具体条件确认。',
    ],
    aboutAuthor: '招聘组代表用人单位介绍岗位，有吸引申请者的立场。',
    aboutSite: '合作方的仿真招聘页面，不提供真实投递渠道。',
  },
  {
    id: 'internship-privacy',
    sceneId: 'internship',
    url: 'https://campus-career.example/privacy',
    title: '用 AI 分析实习时的信息边界',
    site: '校园职业资料页',
    author: '职业资料工作组',
    independent: true,
    date: '2026-09-15',
    category: '信息边界',
    summary: '初步匹配通常只需方向、技能与可投入时间，详细身份信息应按具体用途判断。',
    content: [
      '分析岗位匹配时，可以先提供研究方向、已掌握技能与可投入时间，并判断每项信息是否必要。',
      '真实姓名、手机号、学号或身份证号不是初步岗位适配分析的必要条件。',
      '是否投递需要自己确认岗位条件、时间安排与数据用途，而不是把最终决定交给 AI。',
    ],
    aboutAuthor: '工作组整理职业讨论中的一般信息边界，没有代替个人作决定。',
    aboutSite: '独立仿真职业资料页，不收集身份信息或提供招聘中介服务。',
  },
]
export function validateCitation(citation: SourceCitation): boolean {
  const source = findBrowserSource(citation.sourceId)
  const excerpt = citation.excerpt.trim()
  return Boolean(
    source &&
      citation.url === source.url &&
      excerpt.length >= 8 &&
      source.content.some((paragraph) => paragraph.includes(excerpt)),
  )
}
