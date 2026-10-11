import { AlertCircle, BriefcaseBusiness, CheckCircle2 } from 'lucide-react'

export function InternshipAnalysis({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`internship-analysis-card ${compact ? 'compact' : ''}`}>
      <h2>AI 的分析</h2>
      <div className="analysis-groups">
        <div><CheckCircle2 aria-hidden="true" /><span><strong>值得关注的优势</strong><small>方向与你的教育科技兴趣匹配，也有机会获得真实项目经验。</small>{!compact && <small>支持远程，时间安排相对灵活。</small>}</span></div>
        <div><AlertCircle aria-hidden="true" /><span><strong>还需要确认的事项</strong><small>每周投入、项目深度和导师机制尚不明确。</small>{!compact && <small>远程协作需要较强的自我管理能力。</small>}</span></div>
        {!compact && <div><BriefcaseBusiness aria-hidden="true" /><span><strong>建议</strong><small>先补充了解真实任务与时间要求，再结合课程安排自行决定。</small></span></div>}
      </div>
    </section>
  )
}
