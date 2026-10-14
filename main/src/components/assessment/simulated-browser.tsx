'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  X,
  Plus,
  FileText,
  Globe,
  LockKeyhole,
} from 'lucide-react'
import {
  findBrowserSource,
  searchBrowserSources,
  validateCitation,
} from '../../features/assessment/browser-sources'
import {
  pushBrowserHistory,
  moveBrowserHistory,
  type BrowserHistory,
} from '../../features/assessment/browser-navigation'
import { taskContext, toolDescriptions } from '../../features/assessment/workspace-config'
import type { SourceCitation, SceneId } from '../../features/assessment/types'

type BrowserState = {
  query: string
  searchDraft?: string
  tabs: string[]
  active: string
  view: 'article' | 'author' | 'site'
  excerpt: string
  history: BrowserHistory
}
export function SimulatedBrowser({
  draft,
  updateDraft,
  recordEvent,
  sceneId = 'headphones',
}: {
  draft: Record<string, unknown>
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  sceneId?: SceneId
}) {
  const raw = draft.browserState as Partial<BrowserState> | undefined
  const available = (id: string) => {
    const source = findBrowserSource(id)
    return source && (source.sceneId ?? 'headphones') === sceneId
  }
  const location = {
    active: raw?.active === 'search' || available(raw?.active ?? '') ? raw!.active! : 'search',
    query: typeof raw?.query === 'string' ? raw.query : '',
    view: raw?.view ?? 'article',
  }
  const history = raw?.history?.entries?.length ? raw.history : { entries: [location], index: 0 }
  const state: BrowserState = {
    ...location,
    tabs: Array.isArray(raw?.tabs) ? raw.tabs.filter(available) : [],
    excerpt: raw?.excerpt ?? '',
    searchDraft: raw?.searchDraft,
    history,
  }
  const citations = Array.isArray(draft.citations)
    ? (draft.citations as SourceCitation[]).filter(validateCitation)
    : []
  const [addressInput, setAddressInput] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const source = findBrowserSource(state.active)
  const address = source
    ? source.url + (state.view === 'article' ? '' : '#' + state.view)
    : 'https://search.example/?q=' + encodeURIComponent(state.query)
  const searchText = state.searchDraft ?? state.query
  const results = searchBrowserSources(state.query, sceneId)
  const save = (patch: Partial<BrowserState>) =>
    updateDraft({ browserState: { ...state, ...patch } })
  const navigate = (patch: Partial<BrowserState>) => {
    const next = { ...state, ...patch }
    save({
      ...patch,
      history: pushBrowserHistory(state.history, {
        active: next.active,
        query: next.query,
        view: next.view,
      }),
    })
    setAddressInput(null)
    setNotice('')
  }
  const open = (id: string) => {
    const next = findBrowserSource(id)!
    navigate({
      tabs: state.tabs.includes(id) ? state.tabs : [...state.tabs, id],
      active: id,
      view: 'article',
      excerpt: '',
    })
    recordEvent('browser_source_open', { sourceId: id, url: next.url })
  }
  const goHistory = (direction: -1 | 1) => {
    const next = moveBrowserHistory(state.history, direction)
    const target = next.entries[next.index]
    const tabs =
      target.active !== 'search' && !state.tabs.includes(target.active)
        ? [...state.tabs, target.active]
        : state.tabs
    save({ ...target, history: next, tabs, excerpt: '', searchDraft: target.query })
    setAddressInput(null)
    setNotice('')
    recordEvent(direction === -1 ? 'browser_history_back' : 'browser_history_forward', {
      sourceId: target.active,
    })
  }
  const home = () => {
    navigate({ active: 'search', query: '', searchDraft: '', view: 'article', excerpt: '' })
    recordEvent('browser_home')
  }
  const categories: Record<string, string> = {
    brand: '产品参数',
    ranking: '导购资料',
    lab: '对比记录',
    survey: '活动说明',
  }
  return (
    <section className="desktop-browser browser-window" aria-label="仿真浏览器">
      <div className="browser-chrome">
        <div className="browser-window-tabs">
          <div role="tablist" aria-label="信源标签">
            <button
              className="browser-window-tab"
              role="tab"
              aria-selected={!source}
              onClick={() => {
                navigate({ active: 'search', view: 'article' })
                recordEvent('browser_tab_switch', { sourceId: 'search' })
              }}
            >
              <Globe aria-hidden="true" size={18} />
              <span>搜索结果</span>
            </button>
            {state.tabs.map((id) => (
              <div
                className={`browser-window-tab-group ${state.active === id ? 'active' : ''}`}
                key={id}
              >
                <button
                  className="browser-window-tab"
                  role="tab"
                  aria-selected={state.active === id}
                  onClick={() => {
                    navigate({ active: id, view: 'article', excerpt: '' })
                    recordEvent('browser_tab_switch', {
                      sourceId: id,
                      url: findBrowserSource(id)!.url,
                    })
                  }}
                >
                  <Globe aria-hidden="true" size={18} />
                  <span>{findBrowserSource(id)!.site}</span>
                </button>
                <button
                  className="browser-tab-close"
                  aria-label={`关闭 ${findBrowserSource(id)!.site} 标签`}
                  onClick={() => {
                    navigate({
                      tabs: state.tabs.filter((tab) => tab !== id),
                      ...(state.active === id
                        ? { active: 'search', view: 'article', excerpt: '' }
                        : {}),
                    })
                    recordEvent('browser_tab_close', { sourceId: id })
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="browser-chrome-button"
            aria-label="新建搜索标签"
            onClick={() => {
              navigate({ active: 'search', query: '', searchDraft: '' })
              recordEvent('browser_tab_new')
            }}
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="browser-navigation-bar">
          <button
            className="browser-chrome-button"
            aria-label="后退"
            disabled={state.history.index <= 0}
            onClick={() => goHistory(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            className="browser-chrome-button"
            aria-label="前进"
            disabled={state.history.index >= state.history.entries.length - 1}
            onClick={() => goHistory(1)}
          >
            <ArrowRight size={20} />
          </button>
          <button
            className="browser-chrome-button"
            aria-label="刷新页面"
            onClick={() => {
              setAddressInput(null)
              setNotice('已重新载入仿真页面。')
              recordEvent('browser_reload', { url: address })
            }}
          >
            <RotateCw size={18} />
          </button>
          <button className="browser-chrome-button" aria-label="浏览器主页" onClick={home}>
            <Home size={19} />
          </button>
          <form
            className="browser-address-bar"
            onSubmit={(event) => {
              event.preventDefault()
              const url = (addressInput ?? address).trim()
              if (url.startsWith('https://search.example/')) {
                const query = new URL(url).searchParams.get('q') ?? ''
                navigate({ active: 'search', query, searchDraft: query })
                recordEvent('browser_search', { query })
                return
              }
              const next = findBrowserSource(url.replace(/#(author|site)$/, ''))
              if (!next || !available(next.id)) {
                setNotice('这个地址未收录在本次仿真资料库中。')
                setAddressInput(null)
                recordEvent('browser_address_unavailable', { url })
                return
              }
              open(next.id)
              recordEvent('browser_address_navigate', { url })
            }}
          >
            <LockKeyhole size={15} aria-hidden="true" />
            <input
              aria-label="浏览器地址栏"
              value={addressInput ?? address}
              onChange={(event) => setAddressInput(event.target.value)}
              spellCheck={false}
            />
            <button type="submit" aria-label="前往地址">
              <ArrowRight size={17} />
            </button>
          </form>
          <span className="browser-environment-label">仿真</span>
        </div>
      </div>
      <div className="browser-page-viewport">
        {notice && (
          <p className="browser-notice" role="status">
            {notice}
          </p>
        )}
        <div className="desktop-panel-title">
          <div>
            <h1>{source ? source.site : '查证浏览器'}</h1>
            <p>{source ? '查看资料与发布者背景，保留可追溯的证据。' : toolDescriptions[sceneId]}</p>
          </div>
          <span className="simulation-label">仿真资料</span>
        </div>
        {!source && (
          <>
            <div className="desktop-context">
              <FileText aria-hidden="true" />
              <p>
                <strong>待核查内容：</strong>
                {taskContext(sceneId, draft)}
              </p>
            </div>
            <form
              className="desktop-search"
              onSubmit={(event) => {
                event.preventDefault()
                navigate({ query: searchText.trim(), active: 'search', view: 'article' })
                recordEvent('browser_search', { query: searchText.trim() })
              }}
            >
              <label>
                <Search aria-hidden="true" />
                <input
                  aria-label="搜索查证材料"
                  value={searchText}
                  onChange={(event) => save({ searchDraft: event.target.value })}
                  placeholder="输入需要核查的内容或关键词"
                />
              </label>
              <button className="desktop-primary" type="submit">
                搜索
              </button>
            </form>
          </>
        )}
        <div className="desktop-browser-content">
          {source ? (
            <article className="desktop-source-article" aria-label={source.title}>
              <button
                className="desktop-text-button"
                onClick={() => {
                  navigate({ active: 'search', view: 'article' })
                  recordEvent('browser_tab_switch', { sourceId: 'search' })
                }}
              >
                <ArrowLeft size={18} />
                返回搜索结果
              </button>
              <h2>{source.title}</h2>
              <p className="desktop-source-url">{source.url}</p>
              <p className="desktop-source-meta">
                {source.author} · {source.date ?? '2026-09-12'}
              </p>
              <nav className="desktop-source-nav" aria-label="信源信息">
                <button
                  aria-pressed={state.view === 'article'}
                  onClick={() => navigate({ view: 'article' })}
                >
                  文章
                </button>
                <button
                  aria-pressed={state.view === 'author'}
                  onClick={() => {
                    navigate({ view: 'author' })
                    recordEvent('browser_about_author', { sourceId: source.id, url: source.url })
                  }}
                >
                  关于作者
                </button>
                <button
                  aria-pressed={state.view === 'site'}
                  onClick={() => {
                    navigate({ view: 'site' })
                    recordEvent('browser_about_site', { sourceId: source.id, url: source.url })
                  }}
                >
                  关于本站
                </button>
              </nav>
              {state.view === 'article' ? (
                <>
                  {source.content.map((paragraph) => (
                    <div className="desktop-source-paragraph" key={paragraph}>
                      <p>{paragraph}</p>
                      <button
                        className="desktop-text-button"
                        onClick={() => {
                          save({ excerpt: paragraph })
                          setNotice('')
                        }}
                      >
                        摘录此段
                      </button>
                    </div>
                  ))}
                  <label className="desktop-excerpt">
                    证据摘录
                    <textarea
                      aria-label="证据摘录"
                      maxLength={700}
                      value={state.excerpt}
                      placeholder="摘录一段支持或限制结论的原文"
                      onChange={(event) => {
                        save({ excerpt: event.target.value })
                        setNotice('')
                      }}
                    />
                  </label>
                  <div className="desktop-cite-actions">
                    <button
                      className="desktop-primary"
                      disabled={!state.excerpt.trim()}
                      onClick={() => {
                        const citation = {
                          sourceId: source.id,
                          url: source.url,
                          excerpt: state.excerpt.trim(),
                        }
                        if (!validateCitation(citation)) {
                          setNotice('请使用原文中至少 8 个字的连续摘录。')
                          return
                        }
                        if (
                          citations.some(
                            (item) =>
                              item.url === citation.url && item.excerpt === citation.excerpt,
                          )
                        ) {
                          setNotice('这段证据已经加入消息。')
                          return
                        }
                        updateDraft({
                          citations: [...citations, citation],
                          browserState: { ...state, excerpt: '' },
                        })
                        recordEvent('browser_citation_add', citation)
                        setNotice('已加入引用消息。')
                      }}
                    >
                      加入引用消息
                    </button>
                  </div>
                </>
              ) : (
                <div className="desktop-about">
                  <h3>{state.view === 'author' ? '关于作者' : '关于本站'}</h3>
                  <p>{state.view === 'author' ? source.aboutAuthor : source.aboutSite}</p>
                </div>
              )}
            </article>
          ) : (
            <div className="desktop-search-results" aria-label="搜索结果">
              {results.length ? (
                results.map((result) => (
                  <article key={result.id}>
                    <span className="desktop-result-icon">
                      <FileText aria-hidden="true" />
                    </span>
                    <div className="desktop-result-main">
                      <button onClick={() => open(result.id)}>{result.title}</button>
                      <span className="desktop-source-url">{result.url}</span>
                      <p>{result.summary}</p>
                    </div>
                    <div className="desktop-result-meta">
                      <span>{result.category ?? categories[result.id]}</span>
                      <time>{result.date ?? '2026-09-12'}</time>
                    </div>
                  </article>
                ))
              ) : (
                <div className="desktop-empty">
                  <h2>没有找到相关材料</h2>
                  <p>换一个关键词，或查看这项任务的全部材料。</p>
                  <button className="desktop-secondary" onClick={home}>
                    查看全部材料
                  </button>
                </div>
              )}
            </div>
          )}
          {citations.length > 0 && (
            <section className="desktop-citations">
              <h2>已加入消息的证据 · {citations.length}</h2>
              {citations.map((item, index) => (
                <article key={item.url + item.excerpt}>
                  <div>
                    <strong>{findBrowserSource(item.sourceId)!.site}</strong>
                    <span className="desktop-source-url">{item.url}</span>
                    <p>{item.excerpt}</p>
                  </div>
                  <button
                    className="desktop-icon-button"
                    aria-label={`移除第 ${index + 1} 条引用`}
                    onClick={() => {
                      updateDraft({ citations: citations.filter((_, i) => i !== index) })
                      recordEvent('browser_citation_remove', { ...item })
                    }}
                  >
                    <X size={18} />
                  </button>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
