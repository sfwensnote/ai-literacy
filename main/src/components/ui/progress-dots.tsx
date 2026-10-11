export function ProgressDots({ current, total = 4 }: { current: number; total?: number }) {
  return (
    <div className="progress-dots" aria-label={`第 ${current} 个场景，共 ${total} 个`}>
      {Array.from({ length: total }, (_, index) => <span key={index} className={index + 1 === current ? 'active' : index + 1 < current ? 'done' : ''} />)}
    </div>
  )
}
