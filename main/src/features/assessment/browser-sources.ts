import type { SourceCitation } from './types'

export interface BrowserSource {
  id: string; url: string; title: string; site: string; author: string; summary: string
  content: string[]; aboutAuthor: string; aboutSite: string; independent: boolean
}
export const browserSources: BrowserSource[] = [
  {
    id: 'brand', url: 'https://yunsheng.example/products/s9', title: '云声 S9：降噪与续航规格',
    site: '云声官方商城', author: '云声产品团队', independent: false,
    summary: '售价 899 元，标称续航 30 小时，提供降噪功能。',
    content: ['云声 S9 建议零售价 899 元，支持主动降噪。', '标称续航约 30 小时，测试条件为关闭降噪、音量 50%；实际续航受音量和环境影响。', '宣传页称“同价位表现出色”，未提供横向排名测试数据。'],
    aboutAuthor: '云声产品团队负责产品宣传与销售，没有独立测评资质说明。',
    aboutSite: '本站由云声品牌运营，内容用于推广自有产品；产品参数不等同于独立评价。',
  },
  {
    id: 'ranking', url: 'https://bestbuy-audio.example/rankings/900', title: '900 元耳机榜单：云声 S9 排名第一？',
    site: '好物音频榜', author: '好物推荐编辑部', independent: false,
    summary: '榜单推荐云声 S9，并引用“95% 满意”；页面包含购买链接。',
    content: ['本月推荐榜将云声 S9 列在第一位，排名来自编辑推荐，未公布参与比较的型号与测量方法。', '页面中的购买链接为推广链接，读者购买后本站可能获得佣金。', '“95% 满意”引自云声体验活动回访，本站未进行独立用户调查。'],
    aboutAuthor: '编辑部主要汇总品牌信息与商品推广材料，没有公布本榜单的实测记录。',
    aboutSite: '本站依靠导购佣金运营。本榜单存在商业合作，排名不是完整市场的性能排名。',
  },
  {
    id: 'lab', url: 'https://campus-audio-lab.example/tests/s9', title: '云声 S9 与两款同价位耳机的对比记录',
    site: '校园声学观察组', author: '周宁 · 声学实验项目成员', independent: true,
    summary: '公开测试条件与原始记录：降噪效果随环境变化，未支持“全面第一”。',
    content: ['观察组自购三款耳机，在相同音量下比较地铁噪声和人声场景；未接受品牌赞助。', 'S9 在低频地铁噪声中表现较好，在人声场景中不优于另两款产品，因此不能据此认定同价位降噪排名第一。', '开启降噪时，连续播放测得续航约 22 小时；本记录仅覆盖三款样品，不代表所有耳机。', '运动佩戴舒适度存在个体差异，建议试戴后再决定。'],
    aboutAuthor: '周宁参与校园声学实验项目，公开仪器、环境与记录；不是产品认证机构。',
    aboutSite: '学生独立观察项目，自购样品并公开方法。三款样本的结论不能推广到整个市场。',
  },
  {
    id: 'survey', url: 'https://yunsheng.example/research/feedback', title: '“95% 用户满意”的活动回访说明',
    site: '云声体验活动', author: '云声用户运营组', independent: false,
    summary: '20 位体验活动参与者中有 19 位表示满意，样本由品牌邀请。',
    content: ['本次活动邀请 20 位云声 S9 体验者回访，19 位选择“满意”或“非常满意”，计算结果为 95%。', '参与者来自品牌体验活动，属于小规模自愿回访，没有随机抽样或覆盖全部购买者。', '回访由品牌用户运营组组织，不能据此推断所有用户的满意程度。'],
    aboutAuthor: '用户运营组负责品牌体验活动，调查由品牌发起并整理。',
    aboutSite: '云声旗下体验活动页面，提供回访范围和统计口径；与官方商城属于同一主体。',
  },
]
export function findBrowserSource(value: string): BrowserSource | undefined {
  return browserSources.find((source) => source.id === value || source.url === value)
}
export function searchBrowserSources(query: string): BrowserSource[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return browserSources
  const synonyms = ['耳机', '云声', 's9', '900', '降噪', '评测', '测评']
  return browserSources.filter((source) => words.every((word) => synonyms.includes(word) || [source.title, source.site, source.summary, ...source.content].join(' ').toLowerCase().includes(word)))
}
export function validateCitation(citation: SourceCitation): boolean {
  const source = findBrowserSource(citation.sourceId)
  const excerpt = citation.excerpt.trim()
  return Boolean(source && citation.url === source.url && excerpt.length >= 8 && source.content.some((paragraph) => paragraph.includes(excerpt)))
}
