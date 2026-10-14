export interface BrowserLocation {
  active: string
  query: string
  view: 'article' | 'author' | 'site'
}
export interface BrowserHistory {
  entries: BrowserLocation[]
  index: number
}
export function pushBrowserHistory(
  history: BrowserHistory,
  location: BrowserLocation,
): BrowserHistory {
  const current = history.entries[history.index]
  if (
    current &&
    current.active === location.active &&
    current.query === location.query &&
    current.view === location.view
  )
    return history
  const entries = [...history.entries.slice(0, history.index + 1), location]
  return { entries, index: entries.length - 1 }
}
export function moveBrowserHistory(history: BrowserHistory, direction: -1 | 1): BrowserHistory {
  return {
    ...history,
    index: Math.max(0, Math.min(history.entries.length - 1, history.index + direction)),
  }
}
