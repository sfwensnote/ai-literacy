'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Logo } from '../ui/logo'
import { ProgressDots } from '../ui/progress-dots'
import { NarrativeThread } from './narrative-thread'
import { clubTasks } from '../../features/assessment/narrative'

export function AssessmentTaskShell({ current, children }: {
  current: number
  title: string
  subtitle: string
  children: ReactNode
}) {
  const router = useRouter()
  return (
    <main className="focused-task-page">
      <header className="focused-task-header">
        <Logo />
        <ProgressDots current={current} />
        <button type="button" className="focused-exit" onClick={() => router.push('/')}>退出</button>
      </header>
      <section className="focused-task-shell">
        <div className="focused-task-intro">
          <h1>{clubTasks[current - 1].title}</h1>
        </div>
        <div className="club-workspace"><NarrativeThread current={current} /><div className="club-task-content">{children}</div></div>
      </section>
    </main>
  )
}
