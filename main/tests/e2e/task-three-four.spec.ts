import { expect, test, type Page } from '@playwright/test'

async function startFresh(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('link', { name: /开始测评/ }).click()
}

async function reachTaskThree(page: Page) {
  await startFresh(page)
  await page.getByRole('radio', { name: /再查一查再决定/ }).check()
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: /提交并继续/ }).click()
  await page.getByRole('button', { name: '就这样，可以' }).click()
  await page.getByRole('button', { name: '确认并继续' }).click()
  await expect(page).toHaveURL(/assessment\/3/)
}

async function reachTaskFour(page: Page) {
  await reachTaskThree(page)
  await page.getByRole('button', { name: /进入最终稿/ }).click()
  await page.getByRole('button', { name: /提交我的报告/ }).click()
  await expect(page).toHaveURL(/assessment\/4/)
}

test('task three verifies and updates the only current report', async ({ page }) => {
  await reachTaskThree(page)
  await expect(page.getByRole('heading', { name: '当前报告' })).toHaveCount(1)
  await page.getByRole('button', { name: /Johnson 等/ }).click()
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('这些参考资料都是真实的吗？')
  await page.getByRole('button', { name: '发送' }).click()
  await page.getByRole('button', { name: '应用到报告' }).click()
  await expect(page.getByText(/需补充可检索来源/)).toBeVisible()
  await expect(page.getByRole('heading', { name: '当前报告' })).toHaveCount(1)
})

test('task three keeps manual edits after refresh', async ({ page }) => {
  await reachTaskThree(page)
  await page.getByRole('button', { name: '编辑报告' }).click()
  await page.getByLabel('报告标题').fill('我修改后的在线教育报告')
  await page.reload()
  await expect(page.getByLabel('报告标题')).toHaveValue('我修改后的在线教育报告')
  await expect(page.getByRole('heading', { name: '当前报告' })).toHaveCount(1)
})

test('task four preserves the privacy boundary and supports an independent decision', async ({ page }) => {
  await reachTaskFour(page)
  await expect(page.getByLabel('真实姓名')).not.toBeChecked()
  await expect(page.getByLabel('手机号')).not.toBeChecked()
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('最大的风险是什么？')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText(/时间投入与项目期望不匹配/)).toBeVisible()
  await page.getByRole('button', { name: '关闭 AI' }).click()
  await page.getByRole('button', { name: '形成我的判断' }).click()
  await page.getByRole('button', { name: '方向匹配' }).click()
  await page.getByRole('button', { name: '时间可控' }).click()
  await page.getByRole('button', { name: '成长空间' }).click()
  await expect(page.getByRole('button', { name: '方向匹配' })).not.toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: '时间可控' })).toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: '成长空间' })).toHaveClass(/selected/)
  await page.getByRole('radio', { name: /再了解一下/ }).check()
  await page.getByRole('button', { name: '确认我的选择' }).click()
  await page.getByRole('button', { name: '提交我的判断' }).click()
  await expect(page).toHaveURL(/analyzing|feedback/)
})

test('task four keeps shared-information choices after refresh', async ({ page }) => {
  await reachTaskFour(page)
  await page.getByLabel('可投入时间').uncheck()
  await page.getByLabel('真实姓名').check()
  await page.reload()
  await expect(page.getByLabel('可投入时间')).not.toBeChecked()
  await expect(page.getByLabel('真实姓名')).toBeChecked()
})
