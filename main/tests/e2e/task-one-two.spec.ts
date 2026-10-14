import { expect, test, type Page } from '@playwright/test'
import { completeQuestionnaire } from './questionnaire-helpers'

async function startFresh(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('link', { name: /开始测评/ }).click()
  await completeQuestionnaire(page, 'pre')
}

async function reachTaskTwo(page: Page) {
  await startFresh(page)
  await page.getByRole('button', { name: /同价位降噪耳机中排名第一/ }).click()
  await page.getByRole('radio', { name: /再查一查再决定/ }).check()
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('判断理由').fill('缺少统一、正式的比较依据。')
  await page.getByLabel('暂未找到可引用来源').check()
  await page.getByRole('button', { name: /提交并继续/ }).click()
  await expect(page).toHaveURL(/assessment\/2/)
}

test('task one keeps AI collapsed until the user opens it and records a final decision', async ({ page }) => {
  await startFresh(page)
  await expect(page.getByRole('heading', { name: '核查社团采购建议' })).toBeVisible()
  await expect(page.getByLabel('向 AI 追问')).toHaveCount(0)

  await page.getByRole('button', { name: /95% 的用户表示满意/ }).click()
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('95% 的用户满意是从哪里来的？')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText(/无法提供.*正式调查报告/)).toBeVisible()
  await page.getByRole('button', { name: '关闭 AI' }).click()

  await page.getByRole('radio', { name: /再查一查再决定/ }).check()
  await page.getByRole('button', { name: '下一步' }).click()
  await expect(page.getByText('AI 补充信息')).toBeVisible()
  await page.getByLabel('判断理由').fill('我会先核验来源再推荐。')
  await page.getByLabel('暂未找到可引用来源').check()
  await page.getByRole('button', { name: /提交并继续/ }).click()
  await expect(page).toHaveURL(/assessment\/2/)
})

test('task two applies an AI suggestion to the only current itinerary', async ({ page }) => {
  await reachTaskTwo(page)
  await expect(page.getByRole('heading', { name: '当前行程' })).toHaveCount(1)
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('周六会不会太赶？能不能减少换乘？')
  await page.getByRole('button', { name: '发送' }).click()
  await page.getByRole('button', { name: '应用到行程' }).click()
  await expect(page.getByText('西湖慢游 + 雷峰塔附近')).toBeVisible()
  await page.getByRole('button', { name: '关闭 AI' }).click()
  await page.getByRole('button', { name: '完成我的行程' }).click()
  await expect(page.getByText('这就是你愿意实际执行的方案吗？')).toBeVisible()
  await page.getByRole('button', { name: '确认并继续' }).click()
  await expect(page).toHaveURL(/assessment\/3/)
})

test('task two can reject an AI suggestion and keep the current itinerary', async ({ page }) => {
  await reachTaskTwo(page)
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('周六会不会太赶？')
  await page.getByRole('button', { name: '发送' }).click()
  await page.getByRole('button', { name: '先不采用' }).click()
  await expect(page.getByText('西湖步行 + 灵隐寺')).toBeVisible()
  await expect(page.getByText('西湖慢游 + 雷峰塔附近')).toHaveCount(0)
  await page.getByRole('button', { name: '关闭 AI' }).click()
})

test('task two supports direct acceptance through the common confirmation', async ({ page }) => {
  await reachTaskTwo(page)
  await page.getByRole('button', { name: '就这样，可以' }).click()
  await expect(page.getByText('这就是你愿意实际执行的方案吗？')).toBeVisible()
  await page.getByRole('button', { name: '确认并继续' }).click()
  await expect(page).toHaveURL(/assessment\/3/)
})

test('task two edits the current itinerary without creating a second version', async ({ page }) => {
  await reachTaskTwo(page)
  await page.getByRole('button', { name: '我想改一改' }).click()
  await page.getByLabel('上午安排').first().fill('抵达杭州，寄存行李后慢游西湖')
  await page.getByRole('button', { name: /删除 自由活动/ }).click()
  await page.getByRole('button', { name: '添加安排' }).last().click()
  await expect(page.getByRole('heading', { name: '当前行程' })).toHaveCount(1)
  await page.reload()
  await expect(page.getByLabel('上午安排').first()).toHaveValue('抵达杭州，寄存行李后慢游西湖')
  await page.getByRole('button', { name: '完成我的行程' }).click()
  await page.getByRole('button', { name: '确认并继续' }).click()
  await expect(page).toHaveURL(/assessment\/3/)
})
