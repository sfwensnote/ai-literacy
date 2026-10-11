import type { DimensionScores } from '../../features/assessment/types'

export function RadarChart({ scores }: { scores: DimensionScores }) {
  const values = [scores.information_judgement, scores.ai_use, scores.ai_evaluation, scores.ai_responsibility]
  const center = 150
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + index * Math.PI / 2
    const radius = 105 * value / 100
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`
  }
  const grid = [25, 50, 75, 100].map((level) => values.map((_, index) => point(index, level)).join(' '))
  return (
    <div className="radar-wrap">
      <h2>四个维度的表现</h2>
      <svg viewBox="0 0 300 300" role="img" aria-label="四维能力雷达图">
        {grid.map((points, index) => <polygon key={points} points={points} fill={index === 3 ? 'rgba(22,119,255,.025)' : 'none'} stroke="#cfe2f8" />)}
        <line x1="150" y1="45" x2="150" y2="255" stroke="#d9e8f8" /><line x1="45" y1="150" x2="255" y2="150" stroke="#d9e8f8" />
        <polygon points={values.map((value, index) => point(index, value)).join(' ')} fill="rgba(22,119,255,.16)" stroke="#1677ff" strokeWidth="2" />
        {values.map((value, index) => { const [x,y] = point(index,value).split(','); return <circle key={index} cx={x} cy={y} r="4" fill="#1677ff" /> })}
      </svg>
      <span className="radar-label top">信息理解与判断 <b>{values[0]}</b></span>
      <span className="radar-label right">AI 使用与问题解决 <b>{values[1]}</b></span>
      <span className="radar-label bottom">AI 评价与批判性分析 <b>{values[2]}</b></span>
      <span className="radar-label left">AI 责任与合理使用 <b>{values[3]}</b></span>
    </div>
  )
}
