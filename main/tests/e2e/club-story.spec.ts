import { expect, test, type Page } from '@playwright/test'
import { completeQuestionnaire, openWorkbench } from './questionnaire-helpers'
import { findBrowserSource } from '../../src/features/assessment/browser-sources'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

async function captureBoth(page: Page, name: string) {
  await expect(page.locator('h1')).toBeVisible()
  const directory = path.join(process.cwd(), 'playwright-report', 'desktop-redesign')
  await mkdir(directory, { recursive: true })
  for (const [kind, width, height] of [
    ['desktop', 1440, 900],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
    await page.screenshot({
      path: path.join(directory, name + '-' + kind + '.png'),
      fullPage: true,
    })
  }
  await page.setViewportSize({ width: 1440, height: 900 })
}
test('four tools preserve the attachment, browser history, AI context and complete dual-evidence flow', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: /开始测评/ }).click()
  await completeQuestionnaire(page, 'pre')
  await page.getByRole('tab', { name: '和社团聊天', exact: true }).click()
  await expect(page.getByRole('tab', { name: '工作台', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '已收到，开始处理' }).click()
  await page.getByLabel('给社团的消息').fill('我会先核对排名和满意度来源，再给出采购判断。')
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await expect(page.getByText('我会先核对排名和满意度来源，再给出采购判断。')).toBeVisible()
  await captureBoth(page, 'club-chat')
  await page.getByRole('button', { name: /采购建议（待核查）/ }).click()
  await expect(page.getByRole('tab', { name: '工作台', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.getByRole('button', { name: '在同价位降噪耳机中排名第一', exact: true }).click()
  await page.getByRole('button', { name: '约 95% 的用户表示满意', exact: true }).click()
  await captureBoth(page, 'workbench')
  await page.getByRole('tab', { name: '查证浏览器', exact: true }).click()
  await expect(page.getByLabel('浏览器地址栏')).toHaveValue(/search\.example/)
  await page.getByLabel('搜索查证材料').fill('排名')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await captureBoth(page, 'browser-search')
  await page
    .getByRole('button', { name: '900 元耳机榜单：云声 S9 排名第一？', exact: true })
    .click()
  await page.getByRole('button', { name: '关于本站', exact: true }).click()
  await expect(page.getByText(/本站依靠导购佣金运营/)).toBeVisible()
  await page.getByRole('button', { name: '后退', exact: true }).click()
  await expect(page.getByRole('button', { name: '文章', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: '前进', exact: true }).click()
  await expect(page.getByRole('button', { name: '关于本站', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('tab', { name: '搜索结果', exact: true }).click()
  await page.getByLabel('搜索查证材料').fill('耳机 评测')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page
    .getByRole('button', { name: '云声 S9 与两款同价位耳机的对比记录', exact: true })
    .click()
  await page.getByRole('button', { name: '关于作者', exact: true }).click()
  await expect(page.getByText(/不是产品认证机构/)).toBeVisible()
  await page.getByRole('button', { name: '文章', exact: true }).click()
  const source = findBrowserSource('lab')!
  await page.getByLabel('证据摘录', { exact: true }).fill(source.content[1])
  await page.getByRole('button', { name: '加入引用消息', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: '已加入消息的证据 · 1' })).toBeVisible()
  await expect(page.getByRole('tab', { name: '好物音频榜', exact: true })).toBeVisible()
  await page.getByLabel('浏览器地址栏').fill('https://not-in-corpus.example/')
  await page.getByRole('button', { name: '前往地址', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('未收录')
  await page.getByRole('tab', { name: '问问 AI', exact: true }).click()
  await expect(page.getByText(/已标记待确认/)).toBeVisible()
  await page.getByLabel('向 AI 追问').fill('95% 用户满意有正式来源吗？')
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await expect(page.getByText(/无法提供.*正式调查报告/)).toBeVisible()
  await page.getByLabel('向 AI 追问').fill('同价位排名第一有明确排名依据吗？')
  await page.getByRole('button', { name: '发送', exact: true }).click()
  await expect(page.getByRole('log', { name: 'AI 对话' })).toContainText('排名')
  await expect(
    page.locator('.desktop-ai .desktop-message:not(.mine) .desktop-message-body'),
  ).toHaveCount(2)
  await expect(page.getByLabel('向 AI 追问')).toHaveValue('')
  await captureBoth(page, 'ai-chat')
  await openWorkbench(page)
  await expect(
    page.getByRole('button', { name: '约 95% 的用户表示满意', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('radio', { name: '再查一查再决定', exact: true }).check()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByLabel('判断理由').fill('三款样品不足以支持全面第一；先试戴，再考虑购买。')
  await page.getByRole('button', { name: '提交并继续', exact: true }).click()
  await expect(page).toHaveURL(/assessment\/2/)
  await expect(page.getByText(/上一件事已收好：你的建议是/)).toBeVisible()
  await openWorkbench(page)
  await page.getByRole('button', { name: '就这样，可以', exact: true }).click()
  await page.getByRole('button', { name: '确认并继续', exact: true }).click()
  await expect(page).toHaveURL(/assessment\/3/)
  await page.getByRole('tab', { name: '查证浏览器', exact: true }).click()
  await page.getByRole('button', { name: '在线学习效果：材料摘要与研究限制', exact: true }).click()
  const reportSource = findBrowserSource('report-review')!
  await page.getByLabel('证据摘录').fill(reportSource.content[0])
  await page.getByRole('button', { name: '加入引用消息', exact: true }).click()
  await openWorkbench(page)
  await page.getByRole('button', { name: '进入最终稿', exact: true }).click()
  await page.getByRole('button', { name: '提交我的报告', exact: true }).click()
  await openWorkbench(page)
  await page.getByRole('button', { name: '形成我的判断', exact: true }).click()
  await page.getByRole('radio', { name: '再了解一下', exact: true }).check()
  await page.getByRole('button', { name: '确认我的选择', exact: true }).click()
  await page.getByRole('button', { name: '提交我的判断', exact: true }).click()
  await completeQuestionnaire(page, 'post')
  await expect(page).toHaveURL(/feedback$/, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: '我的态度变化' })).toBeVisible()
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ai-literacy-assessment-v1')!).state.session,
  )
  expect(saved.scenes.headphones.finalSubmission.citations).toHaveLength(1)
  expect(saved.scenes.report.finalSubmission.citations).toHaveLength(1)
  expect(saved.evidence.some((item: { key: string }) => item.key === 'traceable_sources')).toBe(
    true,
  )
  expect(
    saved.scenes.headphones.actions.some(
      (item: { type: string }) => item.type === 'browser_history_back',
    ),
  ).toBe(true)
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /icon\.svg/)
})
test('partial pre responses persist and direct links cannot bypass it', async ({ page }) => {
  await page.goto('/questionnaire/pre')
  await page.locator('#open_1').getByRole('radio', { name: '同意', exact: true }).check()
  await page.reload()
  await expect(
    page.locator('#open_1').getByRole('radio', { name: '同意', exact: true }),
  ).toBeChecked()
  await page.goto('/questionnaire/post')
  await expect(page).toHaveURL(/questionnaire\/pre/)
  await page.getByRole('button', { name: '进入社团工作台' }).click()
  await expect(page.getByRole('status')).toHaveText('还有 8 题未回答。')
  await page.goto('/assessment/4')
  await expect(page).toHaveURL(/questionnaire\/pre/)
})
