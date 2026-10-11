import { Bot, Sparkles } from 'lucide-react'

export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="glow-sphere sphere-one" />
      <div className="glow-sphere sphere-two" />
      <div className="interface-frame">
        <div className="frame-top">
          <i />
          <i />
          <i />
        </div>
        <div className="frame-body">
          <div className="bot-tile"><Bot size={44} strokeWidth={1.7} /></div>
          <div className="copy-lines"><i /><i /><i /></div>
        </div>
        <div className="prompt-pill"><Sparkles size={18} /><i /><i /><i /></div>
      </div>
      <div className="ai-cube">AI</div>
    </div>
  )
}
