'use client'

import { Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type { SceneConfig } from '../../features/assessment/scene-config'
import { Logo } from '../ui/logo'
import { ProgressDots } from '../ui/progress-dots'
import { MaterialCard } from './material-card'

export function ScenarioLayout({ config, chat, submission }: { config: SceneConfig; chat: ReactNode; submission: ReactNode }) {
  const router = useRouter()
  return (
    <main className="assessment-page">
      <header className="scenario-top">
        <Logo />
        <ProgressDots current={config.step} />
        <button type="button" className="exit-button" onClick={() => router.push('/')}>退出</button>
      </header>
      <div className="scenario-grid">
        <section className="scenario-left">
          <div className="scene-intro"><h1>{config.title}</h1><p>{config.intro}</p></div>
          <div className="materials">{config.sections.map((section) => <MaterialCard key={section.title} section={section} />)}</div>
          <aside className="tip-card"><Lightbulb size={30} /><p><strong>小提示：</strong><br />你可以继续追问、补充条件或指出不确定之处，最终根据自己的判断完成提交。</p></aside>
        </section>
        <section className="scenario-right">{chat}{submission}</section>
      </div>
    </main>
  )
}
