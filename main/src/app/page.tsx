import { ArrowDown, BarChart3, Clock3, Feather, Lightbulb, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { HeroVisual } from '../components/landing/hero-visual'
import { HomeActions } from '../components/landing/home-actions'
import { ValueCard } from '../components/landing/value-card'
import { Logo } from '../components/ui/logo'

const values = [
  { icon: Feather, title: '真实场景', description: '来自学习、工作与生活中的常见情境' },
  { icon: BarChart3, title: '个性反馈', description: '了解你的优势与提升方向' },
  { icon: Lightbulb, title: '实用建议', description: '获得可落地的 AI 使用建议' },
  { icon: ShieldCheck, title: '安全保密', description: '你的数据仅用于研究分析' },
]

export default function HomePage() {
  return (
    <main className="landing">
      <header className="site-header">
        <Logo />
        <nav className="site-nav" aria-label="首页导航">
          <a href="#values">介绍</a>
          <a href="#privacy">说明</a>
          <Link className="nav-login" href="/assessment/1">登录</Link>
        </nav>
      </header>

      <div className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <h1><span>测一测</span>你和 AI 的相处方式</h1>
            <p>在真实任务中认识自己的 AI 使用方式</p>
            <HomeActions />
            <div className="trust-row" id="privacy">
              <span className="trust-item"><Clock3 size={21} />预计 15–20 分钟</span>
              <span className="trust-item"><MonitorSmartphone size={21} />支持电脑 / 手机</span>
              <span className="trust-item"><ShieldCheck size={21} />测评数据仅用于研究，保障隐私</span>
            </div>
          </div>
          <HeroVisual />
        </section>

        <section className="values" id="values" aria-label="测评特点">
          {values.map((item) => <ValueCard key={item.title} {...item} />)}
        </section>
        <a className="learn-more" href="#values"><span><ArrowDown size={19} /></span>向下了解更多</a>
      </div>
    </main>
  )
}
