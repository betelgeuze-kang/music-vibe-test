export async function declineAnalytics(page) {
  await page.addInitScript(() => localStorage.setItem('music-vibe-consent-v2', 'declined'));
}

export async function completeProfile(page, option = 'a') {
  await page.locator('[data-route="discover"]').first().click();
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press(option);
    await page.waitForTimeout(270);
  }
  await page.locator('.profile-hero').waitFor();
}

export async function profileInvite(page) {
  await page.locator('[data-route="match"]').first().click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.locator('[data-action="copy-invite"]').click();
  return page.evaluate(() => navigator.clipboard.readText());
}
