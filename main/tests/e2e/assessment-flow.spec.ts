import { expect, test } from '@playwright/test'

test('completes four scenes and opens behavior-grounded feedback', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('link', { name: /开始测评/ }).click()
  await expect(page.getByRole('heading', { name: '朋友想买一款耳机，先问了 AI' })).toBeVisible()

  await page.getByRole('button', { name: /95% 的用户表示满意/ }).click()
  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('95% 的用户满意是从哪里来的？')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText(/无法提供.*正式调查报告/)).toBeVisible()
  await page.getByRole('button', { name: '关闭 AI' }).click()
  await page.getByRole('radio', { name: /再查一查再决定/ }).check()
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: /提交并继续/ }).click()
  await expect(page).toHaveURL(/assessment\/2/)

  await page.getByRole('button', { name: '就这样，可以' }).click()
  await page.getByRole('button', { name: '确认并继续' }).click()
  await expect(page).toHaveURL(/assessment\/3/)

  await page.getByRole('button', { name: '问问 AI' }).click()
  await page.getByLabel('向 AI 追问').fill('这些参考资料都是真实的吗？')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.getByText(/示例性.*不一定对应真实存在/)).toBeVisible()
  await page.getByRole('button', { name: '应用到报告' }).click()
  await page.getByRole('button', { name: '关闭 AI' }).click()
  await page.getByRole('button', { name: /进入最终稿/ }).click()
  await page.getByRole('button', { name: /提交我的报告/ }).click()
  await expect(page).toHaveURL(/assessment\/4/)

  await page.getByRole('button', { name: '形成我的判断' }).click()
  await page.getByRole('button', { name: '方向匹配' }).click()
  await page.getByRole('button', { name: '时间可控' }).click()
  await page.getByRole('radio', { name: /再了解一下/ }).check()
  await page.getByRole('button', { name: '确认我的选择' }).click()
  await page.getByRole('button', { name: /提交我的判断/ }).click()
  await expect(page).toHaveURL(/feedback/, { timeout: 6000 })
  await page.getByRole('link', { name: 'AI 评价与批判性分析' }).click()
  await expect(page.getByText(/主动询问了.*95%/).first()).toBeVisible()
})

test('keeps an unfinished scene draft after refresh', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('link', { name: /开始测评/ }).click()
  await page.getByRole('button', { name: '在同价位降噪耳机中排名第一', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '在同价位降噪耳机中排名第一', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
