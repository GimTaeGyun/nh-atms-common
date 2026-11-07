import { test, expect, type Page } from '@playwright/test';
import { SCREENS } from './screens';

/**
 * 전 화면 스모크 + 스크린샷 회귀 (목 모드, 로그인 없음 — 목 /api/me 가 고정 사용자).
 *  - 홈 진입(나 확인) → 각 화면 라우트 진입 → (조회 화면이면) 조회 → 결과 렌더 확인 → 스크린샷
 *  - 뷰포트 프로젝트(1280/1920)별로 docs/screenshots/{project}/{화면키}.png 저장
 *  - 화면별 실패는 모아서 마지막에 보고(한 화면 실패가 나머지를 막지 않음)
 */
const enter = async (page: Page) => {
  await page.goto('/home');
  await expect(page.locator('.app-header .top-nav')).toBeVisible();
  await expect(page.locator('.header-user b')).not.toHaveText('-');
};

test('전 화면 스모크 + 스크린샷', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await enter(page);
  const failures: string[] = [];
  for (const s of SCREENS) {
    await test.step(`${s.key} ${s.title}`, async () => {
      try {
        await page.goto(s.path);
        const inner = page.locator(`.app-content-inner[data-screen="${s.key}"]`);
        await expect(inner.locator('.page-title h1')).toHaveText(s.title, { timeout: 15_000 });
        await expect(page.locator('.open-tab.on .ttl')).toHaveText(s.title);
        for (const f of s.prefill ?? []) await inner.getByPlaceholder(f.placeholder).first().fill(f.value);
        if (s.search) {
          await inner.locator('.search-panel button[type="submit"]').first().click();
          await expect(inner.locator('.ant-table-row').first()).toBeVisible({ timeout: 15_000 });
        }
        if (s.wait) await expect(inner.locator(s.wait).first()).toBeVisible({ timeout: 15_000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/${s.key}.png` });
      } catch (e) {
        failures.push(`${s.key} ${s.title}: ${(e as Error).message.split('\n')[0]}`);
        await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/${s.key}-FAILED.png` }).catch(() => undefined);
      }
    });
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('레이아웃: 패널 접기/플라이아웃/탭 닫기/패널 고정', async ({ page }, testInfo) => {
  await enter(page);
  await page.goto('/sample/notice');
  await expect(page.locator('.open-tab.on .ttl')).toHaveText('공지사항');
  await page.goto('/sample/mcn-info');
  await expect(page.locator('.open-tab.on .ttl')).toHaveText('기기정보');
  await expect(page.locator('.open-tab')).toHaveCount(3); // 홈 + 2
  const pinned = page.locator('.app-panel:not(.flyout)');
  const rail = page.locator('.app-rail');
  if ((await pinned.count()) > 0) {
    await expect(rail).toHaveCount(0);
    await page.getByRole('button', { name: '패널 접기' }).click();
  }
  await expect(pinned).toHaveCount(0);
  await expect(rail).toBeVisible();
  await page.locator('.rail-btn', { hasText: '견본' }).hover();
  await expect(page.locator('.app-panel.flyout')).toBeVisible();
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/layout-flyout.png` });
  await page.mouse.move(900, 600);
  await expect(page.locator('.app-panel.flyout')).toHaveCount(0);
  await page.locator('.open-tab', { hasText: '공지사항' }).locator('.cls').click();
  await expect(page.locator('.open-tab')).toHaveCount(2);
  await page.locator('.rail-btn', { hasText: '견본' }).hover();
  await page.getByRole('button', { name: '패널 고정' }).click();
  await expect(pinned).toBeVisible();
  await expect(rail).toHaveCount(0);
});
