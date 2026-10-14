import type { Metadata } from 'next'
import './globals.css'
import './assessment-tasks.css'
import './assessment-enhancements.css'
import 'katex/dist/katex.min.css'

export const metadata: Metadata = {
  title: 'AI 素养场景化测评',
  description: '在真实任务中认识自己的 AI 使用方式',
}

const directionContract = `THESIS: Real AI literacy is revealed by choices inside ordinary tasks, not a quiz dashboard. OWN-WORLD: quiet blue research atmosphere, deep navy type, luminous white task surfaces, and paired-circle identity. STORY: understand the promise, complete four scenes, receive evidence-grounded feedback. FIRST VIEWPORT: compact mark and navigation above a left-led statement, primary action, trust row, and an abstract interaction window. FORM: reference-led calm assessment world, seed reference-locked. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.body.prepend(document.createComment(${JSON.stringify(directionContract)}))`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
