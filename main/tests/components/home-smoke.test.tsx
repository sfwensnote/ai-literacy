import { expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import HomePage from '../../src/app/page'

it('renders the assessment entry', () => {
  const html = renderToStaticMarkup(<HomePage />)
  expect(html).toContain('你和 AI 的相处方式')
  expect(html).toContain('href="/assessment/1"')
  expect(html).toContain('开始测评')
})
