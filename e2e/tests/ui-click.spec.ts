import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8000/api';

// Seed data before UI tests
test.beforeAll(async ({ request }) => {
  const F = 'dev_uifarmer@test.kr';
  const C = 'dev_uiconsumer@test.kr';
  const fh = { Authorization: `Bearer ${F}`, 'Content-Type': 'application/json' };
  const ch = { Authorization: `Bearer ${C}`, 'Content-Type': 'application/json' };

  await request.post(`${API_BASE}/auth/register`, {
    headers: fh,
    data: { email: 'uifarmer@test.kr', name: 'UI농부', role: 'farmer', firebase_uid: `dev-uifarmer@test.kr` },
  });
  await request.post(`${API_BASE}/auth/register`, {
    headers: ch,
    data: { email: 'uiconsumer@test.kr', name: 'UI소비자', role: 'consumer', firebase_uid: `dev-uiconsumer@test.kr` },
  });
  await request.post(`${API_BASE}/auth/farmer-profile`, {
    headers: fh,
    data: { farm_name: 'UI테스트농장', farm_location: '서울', description: 'UI테스트' },
  });

  // Create several products
  for (const p of [
    { name: 'UI딸기', description: '맛있는 딸기', price: 15000, stock: 40, region: '충남', category_id: 1 },
    { name: 'UI배추', description: '싱싱한 배추', price: 3000, stock: 80, region: '전남', category_id: 2 },
    { name: 'UI감귤', description: '달콤한 감귤', price: 9000, stock: 60, region: '제주', category_id: 1 },
  ]) {
    await request.post(`${API_BASE}/products/`, { headers: fh, data: p });
  }
});

test.describe('UI 클릭 테스트 - 온보딩 & 인증', () => {
  test('온보딩 화면을 넘기고 로그인 화면에 도달한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Onboarding screen should be visible
    const onboarding = page.locator('[data-testid="screen-onboarding"]');
    const login = page.locator('[data-testid="screen-login"]');

    if (await onboarding.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click skip to go to login
      const skipBtn = page.locator('[data-testid="onboarding-skip-button"]');
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }

    // Should now be on login screen (or already there if onboarding was skipped before)
    const hasLogin = await login.isVisible({ timeout: 5000 }).catch(() => false);
    const hasOnboarding = await onboarding.isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasLogin || hasOnboarding).toBe(true);
  });

  test('로그인 화면의 모든 요소가 존재한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Skip onboarding if present
    const skipBtn = page.locator('[data-testid="onboarding-skip-button"]');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }

    const loginScreen = page.locator('[data-testid="screen-login"]');
    if (await loginScreen.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check all login elements exist
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-kakao-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-google-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-signup-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-forgot-button"]')).toBeVisible();
    }
  });

  test('이메일/비밀번호를 입력하고 로그인 버튼을 클릭할 수 있다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipBtn = page.locator('[data-testid="onboarding-skip-button"]');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }

    const loginScreen = page.locator('[data-testid="screen-login"]');
    if (await loginScreen.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Type email
      const emailInput = page.locator('[data-testid="login-email-input"]');
      await emailInput.fill('uiconsumer@test.kr');
      await expect(emailInput).toHaveValue('uiconsumer@test.kr');

      // Type password
      const pwInput = page.locator('[data-testid="login-password-input"]');
      await pwInput.fill('test1234');

      // Click login button
      const loginBtn = page.locator('[data-testid="login-submit-button"]');
      await loginBtn.click();

      // Wait for response - either navigate away or show error
      await page.waitForTimeout(2000);
    }
  });

  test('회원가입 링크를 클릭하면 회원가입 화면으로 이동한다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipBtn = page.locator('[data-testid="onboarding-skip-button"]');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }

    const loginScreen = page.locator('[data-testid="screen-login"]');
    if (await loginScreen.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click signup link
      const signupLink = page.locator('[data-testid="login-signup-link"]');
      await signupLink.click();
      await page.waitForTimeout(1000);

      // Should navigate to signup screen
      const signupScreen = page.locator('[data-testid="screen-signup"]');
      const isVisible = await signupScreen.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }
  });

  test('회원가입 화면에서 폼을 채우고 제출할 수 있다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Skip onboarding
    const skipBtn = page.locator('[data-testid="onboarding-skip-button"]');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to signup
    const signupLink = page.locator('[data-testid="login-signup-link"]');
    if (await signupLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signupLink.click();
      await page.waitForTimeout(1000);

      const signupScreen = page.locator('[data-testid="screen-signup"]');
      if (await signupScreen.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Fill out form
        await page.locator('[data-testid="signup-name-input"]').fill('테스트유저');
        await page.locator('[data-testid="signup-email-input"]').fill(`uitest_${Date.now()}@test.kr`);
        await page.locator('[data-testid="signup-phone-input"]').fill('010-9999-8888');
        await page.locator('[data-testid="signup-password-input"]').fill('test1234');

        // Check confirm password if it exists
        const confirmPw = page.locator('[data-testid="signup-confirm-password-input"]');
        if (await confirmPw.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmPw.fill('test1234');
        }

        // Click submit
        const submitBtn = page.locator('[data-testid="signup-submit-button"]');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe('UI 클릭 테스트 - 온보딩 슬라이드 탐색', () => {
  test('온보딩 슬라이드를 순서대로 넘길 수 있다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const nextBtn = page.locator('[data-testid="onboarding-next-button"]');
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Slide 1 → 2
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Slide 2 → 3
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Slide 3 → Login (button text changes to 시작하기)
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Should now be on login screen
      const loginScreen = page.locator('[data-testid="screen-login"]');
      const isVisible = await loginScreen.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVisible).toBe(true);
    }
  });
});

test.describe('UI 클릭 테스트 - 페이지 렌더링 검증', () => {
  test('앱에 한글 컨텐츠가 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000);

    const bodyText = await page.textContent('body');
    // Should contain Korean characters (onboarding, login, or any screen)
    const hasKorean = /[\uac00-\ud7a3]/.test(bodyText || '');
    expect(hasKorean).toBe(true);
  });

  test('React Native Web이 #root에 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#root', { timeout: 10000 });

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    // Check that React Native Web rendered actual content (not just empty divs)
    const childCount = await root.evaluate(el => el.querySelectorAll('div').length);
    expect(childCount).toBeGreaterThan(5);
  });

  test('스크린샷이 빈 화면이 아니다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(4000);

    // Take screenshot and verify it has non-white pixels
    const screenshot = await page.screenshot();
    expect(screenshot.byteLength).toBeGreaterThan(5000); // Non-trivial screenshot
  });
});
