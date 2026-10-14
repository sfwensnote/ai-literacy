'use client'

import { useState } from 'react'
import { ArrowLeft, Search, X, Plus } from 'lucide-react'
import { findBrowserSource, searchBrowserSources, validateCitation } from '../../features/assessment/browser-sources'
import type { SourceCitation } from '../../features/assessment/types'

type BrowserState = { query: string; tabs: string[]; active: string; view: 'article' | 'author' | 'site'; excerpt: string }
export function SimulatedBrowser({ draft, updateDraft, recordEvent }: {
  draft: Record<string, unknown>; updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
}) {
  const raw = draft.browserState as Partial<BrowserState> | undefined
  const state: BrowserState = {
    query: raw?.query ?? '', tabs: (raw?.tabs ?? []).filter((id) => Boolean(findBrowserSource(id))),
    active: raw?.active ?? 'search', view: raw?.view ?? 'article', excerpt: raw?.excerpt ?? '',
  }
  const citations = Array.isArray(draft.citations) ? (draft.citations as SourceCitation[]).filter(validateCitation) : []
  const [searchText, setSearchText] = useState(state.query)
  const [error, setError] = useState('')
  const source = findBrowserSource(state.active)
  const save = (patch: Partial<BrowserState>) => updateDraft({ browserState: { ...state, ...patch } })
  const open = (id: string) => {
    const next = findBrowserSource(id)!
    save({ tabs: state.tabs.includes(id) ? state.tabs : [...state.tabs, id], active: id, view: 'article', excerpt: '' })
    recordEvent('browser_source_open', { sourceId: id, url: next.url })
    setError('')
  }
  return <section className="simulated-browser" aria-label="仿真浏览器">
    <div className="browser-title"><h2>查证浏览器</h2><span>仿真材料</span></div>
    <div className="browser-tabs" role="tablist" aria-label="浏览器标签">
      <button role="tab" aria-selected={!source} onClick={() => { save({ active: 'search' }); recordEvent('browser_tab_switch', { sourceId: 'search' }) }}>搜索结果</button>
      {state.tabs.map((id) => <div className="browser-tab" key={id}>
        <button role="tab" aria-selected={state.active === id} onClick={() => { save({ active: id, view: 'article', excerpt: '' }); recordEvent('browser_tab_switch', { sourceId: id, url: findBrowserSource(id)!.url }); setError('') }}>{findBrowserSource(id)!.site}</button>
        <button aria-label={`关闭 ${findBrowserSource(id)!.site} 标签`} onClick={() => {
          save({ tabs: state.tabs.filter((tab) => tab !== id), ...(state.active === id ? { active: 'search', excerpt: '' } : {}) })
          recordEvent('browser_tab_close', { sourceId: id })
        }}><X size={14} /></button>
      </div>)}
      <button aria-label="新建搜索标签" onClick={() => { save({ active: 'search' }); setSearchText(''); recordEvent('browser_tab_new') }}><Plus size={16} /></button>
    </div>
    <form className="browser-search" onSubmit={(event) => {
      event.preventDefault(); save({ query: searchText.trim(), active: 'search' }); recordEvent('browser_search', { query: searchText.trim() })
    }}><Search size={17} /><input aria-label="搜索查证材料" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="搜索耳机、排名、95% 满意…" /><button type="submit">搜索</button></form>
    {source ? <div className="browser-article" role="tabpanel" aria-label={source.title}>
      <div className="browser-address">{source.url}</div>
      <button className="browser-back" onClick={() => save({ active: 'search' })}><ArrowLeft size={15} /> 返回结果</button>
      <h3>{source.title}</h3>
      <div className="browser-meta">{source.author} · {source.site}</div>
      <nav aria-label="信源信息">
        <button aria-pressed={state.view === 'article'} onClick={() => save({ view: 'article' })}>文章</button>
        <button aria-pressed={state.view === 'author'} onClick={() => { save({ view: 'author' }); recordEvent('browser_about_author', { sourceId: source.id, url: source.url }) }}>关于作者</button>
        <button aria-pressed={state.view === 'site'} onClick={() => { save({ view: 'site' }); recordEvent('browser_about_site', { sourceId: source.id, url: source.url }) }}>关于本站</button>
      </nav>
      {state.view === 'article' ? <>
        {source.content.map((paragraph) => <div className="browser-paragraph" key={paragraph}><p>{paragraph}</p><button onClick={() => { save({ excerpt: paragraph }); setError('') }}>摘录此段</button></div>)}
        <label className="browser-excerpt">证据摘录<textarea aria-label="证据摘录" value={state.excerpt} maxLength={700} onChange={(event) => { save({ excerpt: event.target.value }); setError('') }} placeholder="从原文摘录一段支持或限制结论的内容" /></label>
        <div className="browser-cite-action"><button className="task-secondary" disabled={!state.excerpt.trim()} onClick={() => {
          const citation = { sourceId: source.id, url: source.url, excerpt: state.excerpt.trim() }
          if (!validateCitation(citation)) { setError('请使用原文中至少 8 个字的连续摘录。'); return }
          if (citations.some((item) => item.url === citation.url && item.excerpt === citation.excerpt)) { setError('这段证据已经加入消息。'); return }
          updateDraft({ citations: [...citations, citation], browserState: { ...state, excerpt: '' } })
          recordEvent('browser_citation_add', citation); setError('')
        }}>加入引用消息</button><span role="status">{error}</span></div>
      </> : <p className="browser-about">{state.view === 'author' ? source.aboutAuthor : source.aboutSite}</p>}
    </div> : <div className="browser-results" role="tabpanel" aria-label="搜索结果">
      {searchBrowserSources(state.query).length ? searchBrowserSources(state.query).map((result) => <article key={result.id}>
        <span>{result.site} · {result.url}</span>
        <button onClick={() => open(result.id)}>{result.title}</button><p>{result.summary}</p>
      </article>) : <div className="browser-no-results"><p>没有找到相关材料。</p><button onClick={() => { save({ query: '' }); setSearchText(''); recordEvent('browser_search', { query: '' }) }}>查看全部材料</button></div>}
    </div>}
    {citations.length > 0 && <div className="browser-citations"><h3>已加入消息的证据 · {citations.length}</h3>{citations.map((item, index) => <div key={item.url + item.excerpt}>
      <div><b>{findBrowserSource(item.sourceId)!.site}</b><span>{item.url}</span><p>{item.excerpt}</p></div>
      <button aria-label={`移除第 ${index + 1} 条引用`} onClick={() => { updateDraft({ citations: citations.filter((_, i) => i !== index) }); recordEvent('browser_citation_remove', { ...item }) }}><X size={16} /></button>
    </div>)}</div>}
  </section>
}
