'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '../ui/logo'

const tabs = [
  ['总反馈', '/feedback'], ['信息理解与判断', '/feedback/1'], ['AI 使用与问题解决', '/feedback/2'], ['AI 评价与批判性分析', '/feedback/3'], ['AI 责任与合理使用', '/feedback/4'],
]

export function FeedbackNav({ page }: { page: number }) {
  return (
    <>
      <header className="feedback-header"><Logo /><nav>{tabs.map(([label, href], index) => <Link key={href} className={page === index ? 'active' : ''} href={href}>{label}</Link>)}</nav></header>
      <footer className="feedback-footer">
        {page > 0 ? <Link href={tabs[page - 1][1]}><ArrowLeft size={20} />上一页</Link> : <span />}
        <div><div className="feedback-dots">{tabs.map((_, index) => <i key={index} className={page === index ? 'active' : ''} />)}</div><small>{page + 1} / 5</small></div>
        {page < 4 ? <Link className="next" href={tabs[page + 1][1]}>下一页<ArrowRight size={20} /></Link> : <Link className="next" href="/">完成</Link>}
      </footer>
    </>
  )
}
