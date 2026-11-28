// Multi-game journeys may leave either a completed round or a game in progress.
export async function acceptGameExits(page) {
  const dialog = page.getByRole('dialog', { name: '進行中のゲームを終了しますか？' });
  await page.addLocatorHandler(dialog, async () => {
    await dialog.getByRole('button', { name: '終了して移動' }).click();
  });
}

export async function openDetailScores(page) {
  await page.locator('#btn-detail-menu').click();
  await page.getByRole('button', { name: /スコアボード/ }).click();
}
