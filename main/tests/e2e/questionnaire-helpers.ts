import { expect, type Page } from '@playwright/test'
export async function completeQuestionnaire(page: Page, stage: 'pre' | 'post') {
  await expect(page).toHaveURL(new RegExp('questionnaire/' + stage))
  await expect(page.getByRole('radio', { name: '同意', exact: true })).toHaveCount(9)
  for (const radio of await page.getByRole('radio', { name: '同意', exact: true }).all())
    await radio.check()
  await page
    .getByRole('button', { name: stage === 'pre' ? '进入社团工作台' : '查看我的报告' })
    .click()
  await expect(page).toHaveURL(stage === 'pre' ? /assessment\/1/ : /analyzing|feedback/)
  if (stage === 'pre') await openWorkbench(page)
}
export async function openWorkbench(page: Page) {
  await page.getByRole('tab', { name: '工作台', exact: true }).click()
  await expect(page.locator('.desktop-task-document')).toBeVisible()
}
