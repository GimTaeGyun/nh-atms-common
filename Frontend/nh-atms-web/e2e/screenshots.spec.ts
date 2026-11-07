import { test, expect, type Page } from '@playwright/test';
import { SCREENS } from './screens';
import type { ScreenKey } from '@/screens/screenIds';

/** 화면키 → 라우트 (e2e/screens.ts 목록에서; 런타임 import 없이 타입만 쓴다) */
const screenPath = (key: ScreenKey) => SCREENS.find((s) => s.key === key)!.path;

/**
 * 전 화면 스모크 + 스크린샷 회귀 (목 모드).
 *  - 로그인 1회 → 각 화면 라우트 진입 → (조회 화면이면) 조회 → 결과 렌더 확인 → 스크린샷
 *  - 뷰포트 프로젝트(1280/1920)별로 docs/screenshots/{project}/{id}.png 저장
 *  - 화면별 실패는 soft assertion 으로 모아 마지막에 보고(한 화면 실패가 나머지를 막지 않음)
 */
const login = async (page: Page) => {
  await page.goto('/login');
  await page.getByPlaceholder('사번 또는 아이디').fill('admin');
  await page.getByPlaceholder('비밀번호').fill('admin1234!');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('.app-header .top-nav')).toBeVisible();
};

test('로그인 화면', async ({ page }, testInfo) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/login.png` });
});

test('전 화면 스모크 + 스크린샷', async ({ page }, testInfo) => {
  test.setTimeout(900_000); // 느린 PC·컨테이너에서도 69화면이 끝나도록(2026-11-03)
  await login(page);
  const failures: string[] = [];
  for (const s of SCREENS) {
    await test.step(`${s.key} ${s.title}`, async () => {
      try {
        // 열린 탭 최대 개수(12) 제한에 걸리지 않도록 화면마다 '전체 닫기' 후 진입
        if ((await page.locator('.open-tab').count()) > 1) await page.getByRole('button', { name: /전체 닫기/ }).click();
        await page.goto(s.path);
        const inner = page.locator(`.app-content-inner[data-screen="${s.key}"]`);
        await expect(inner.locator('.page-title h1')).toHaveText(s.title, { timeout: 15_000 });
        await expect(page.locator('.open-tab.on .ttl')).toHaveText(s.title);
        for (const f of s.prefill ?? []) await inner.getByPlaceholder(f.placeholder).first().fill(f.value);
        if (s.search) {
          await inner.locator('.search-panel button[type="submit"]').first().click();
          await expect(inner.locator('.ant-table-row, .atm-card').first()).toBeVisible({ timeout: 15_000 });
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
  await login(page);
  await page.goto(screenPath('mgmt.faultStatus'));
  await expect(page.locator('.open-tab.on .ttl')).toHaveText('장애 현황');
  await page.goto(screenPath('outsrc.dispatchStatus'));
  await expect(page.locator('.open-tab.on .ttl')).toHaveText('업체 출동 현황조회');
  await expect(page.locator('.app-content-inner[data-screen="outsrc.dispatchStatus"] h1')).toBeVisible();
  await expect(page.locator('.open-tab')).toHaveCount(3); // 홈 + 2
  // 펼친 상태는 시안 B 그대로(아이콘 줄 없음), 접으면 아이콘 줄이 나타난다(현업 결정).
  // 1366px 미만은 기본 접힘이고, 넓은 화면은 직접 접는다
  const pinned = page.locator('.app-panel:not(.flyout)');
  const rail = page.locator('.app-rail');
  if ((await pinned.count()) > 0) {
    await expect(rail).toHaveCount(0);
    await page.getByRole('button', { name: '패널 접기' }).click();
  }
  await expect(pinned).toHaveCount(0);
  await expect(rail).toBeVisible();
  await page.locator('.rail-btn', { hasText: '일괄용역' }).hover();
  await expect(page.locator('.app-panel.flyout')).toBeVisible();
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/layout-flyout.png` });
  // 레일/패널 영역을 벗어나면 플라이아웃이 닫힌다
  await page.mouse.move(900, 600);
  await expect(page.locator('.app-panel.flyout')).toHaveCount(0);
  await page.locator('.open-tab', { hasText: '장애 현황' }).locator('.cls').click();
  await expect(page.locator('.open-tab')).toHaveCount(2);
  // 플라이아웃에서 '패널 고정' → 펼침 상태로 복귀
  await page.locator('.rail-btn', { hasText: '종합관리' }).hover();
  await page.getByRole('button', { name: '패널 고정' }).click();
  await expect(pinned).toBeVisible();
  await expect(rail).toHaveCount(0);
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/layout-pinned.png` });
  // 다시 접은 뒤 아이콘 줄 맨 위 '펼치기' 버튼으로도 펼친 상태로 돌아온다
  await page.getByRole('button', { name: '패널 접기' }).click();
  await expect(rail).toBeVisible();
  await page.getByRole('button', { name: '패널 펼치기' }).click();
  await expect(pinned).toBeVisible();
  await expect(rail).toHaveCount(0);
});

test('팝업: 3000 코너 정보 수정(9300), 1000 거래 상세(9101)', async ({ page }, testInfo) => {
  await login(page);
  await page.goto(screenPath('mgmt.cornerMgmt'));
  const inner = page.locator('.app-content-inner[data-screen="mgmt.cornerMgmt"]');
  await inner.locator('.search-panel button[type="submit"]').first().click();
  await expect(inner.locator('.ant-table-row').first()).toBeVisible({ timeout: 15_000 });
  await inner.locator('.ant-table-row').first().dblclick();
  await expect(page.locator('.ant-modal').getByText('코너 정보 수정')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/9300.png` });
  await page.keyboard.press('Escape');
  await page.goto(screenPath('tx.specificTx'));
  const tx = page.locator('.app-content-inner[data-screen="tx.specificTx"]');
  await tx.getByPlaceholder(/계좌번호/).fill('3021234');
  await tx.locator('.search-panel button[type="submit"]').first().click();
  await expect(tx.locator('.ant-table-row').first()).toBeVisible({ timeout: 15_000 });
  await tx.locator('.ant-table-row').first().dblclick();
  await expect(page.locator('.ant-modal').getByText(/거래 상세화면/)).toBeVisible();
  await expect(page.locator('.ant-modal .detail-grid').first()).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `docs/screenshots/${testInfo.project.name}/9101.png` });
});
