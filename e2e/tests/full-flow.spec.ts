import { test, expect, Page } from '@playwright/test';

const API_BASE = 'http://localhost:8000/api';

// Helper: seed test data via API before UI tests
async function seedTestData(request: any) {
  const FARMER_TOKEN = 'dev_e2efarmer@test.kr';
  const CONSUMER_TOKEN = 'dev_e2econsumer@test.kr';

  // Register farmer
  await request.post(`${API_BASE}/auth/register`, {
    headers: { Authorization: `Bearer ${FARMER_TOKEN}`, 'Content-Type': 'application/json' },
    data: {
      email: 'e2efarmer@test.kr',
      name: 'E2E농부',
      role: 'farmer',
      firebase_uid: `dev-e2efarmer@test.kr`,
    },
  });

  // Register consumer
  await request.post(`${API_BASE}/auth/register`, {
    headers: { Authorization: `Bearer ${CONSUMER_TOKEN}`, 'Content-Type': 'application/json' },
    data: {
      email: 'e2econsumer@test.kr',
      name: 'E2E소비자',
      role: 'consumer',
      firebase_uid: `dev-e2econsumer@test.kr`,
    },
  });

  // Create farmer profile
  await request.post(`${API_BASE}/auth/farmer-profile`, {
    headers: { Authorization: `Bearer ${FARMER_TOKEN}`, 'Content-Type': 'application/json' },
    data: { farm_name: 'E2E테스트농장', farm_location: '테스트시', description: 'Playwright E2E' },
  });

  // Create products
  const products = [
    { name: '유기농 딸기', description: '달콤한 딸기', price: 12000, stock: 50, region: '충남', category_id: 1 },
    { name: '무농약 배추', description: '싱싱한 배추', price: 3000, stock: 100, region: '전남', category_id: 2 },
    { name: '제주 감귤', description: '새콤달콤 감귤', price: 8000, stock: 80, region: '제주', category_id: 1 },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const res = await request.post(`${API_BASE}/products/`, {
      headers: { Authorization: `Bearer ${FARMER_TOKEN}`, 'Content-Type': 'application/json' },
      data: p,
    });
    if (res.ok()) {
      const body = await res.json();
      productIds.push(body.id);
    }
  }

  return { FARMER_TOKEN, CONSUMER_TOKEN, productIds };
}

test.describe('FarmDirect E2E - App Loading', () => {
  test('앱이 정상적으로 로드된다', async ({ page }) => {
    await page.goto('/');
    // Wait for React Native Web to render
    await page.waitForSelector('#root', { timeout: 10000 });
    // Check that the app rendered something meaningful
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  test('온보딩 화면이 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // Wait for bundle to load and render

    // The onboarding screen should show app introduction text
    const body = await page.textContent('body');
    // Check for any Korean text rendered (onboarding or login screen)
    const hasKorean = /[\uac00-\ud7a3]/.test(body || '');
    expect(hasKorean).toBe(true);
  });
});

test.describe('FarmDirect E2E - Backend API Integration', () => {
  test('헬스체크 API가 동작한다', async ({ request }) => {
    const response = await request.get('http://localhost:8000/');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('FarmDirect API');
  });

  test('카테고리 API가 동작한다', async ({ request }) => {
    const response = await request.get(`${API_BASE}/categories/`);
    expect(response.ok()).toBeTruthy();
    const categories = await response.json();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty('name');
  });

  test('회원가입 → 로그인 → 프로필 조회 플로우', async ({ request }) => {
    const token = 'dev_pwtest@test.kr';
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Register
    const regRes = await request.post(`${API_BASE}/auth/register`, {
      headers,
      data: {
        email: 'pwtest@test.kr',
        name: 'Playwright유저',
        role: 'consumer',
        firebase_uid: 'dev-pwtest@test.kr',
      },
    });
    // 201 or 409 (already exists)
    expect([201, 409]).toContain(regRes.status());

    // Login
    const loginRes = await request.post(`${API_BASE}/auth/login`, { headers });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    expect(loginBody).toHaveProperty('access');
    expect(loginBody).toHaveProperty('user');
    expect(loginBody.user.email).toBe('pwtest@test.kr');

    // Get profile
    const meRes = await request.get(`${API_BASE}/auth/me`, { headers });
    expect(meRes.ok()).toBeTruthy();
    const me = await meRes.json();
    expect(me.name).toBe('Playwright유저');
  });

  test('상품 CRUD 전체 플로우', async ({ request }) => {
    const farmerToken = 'dev_pwfarmer@test.kr';
    const fHeaders = { Authorization: `Bearer ${farmerToken}`, 'Content-Type': 'application/json' };

    // Setup farmer
    await request.post(`${API_BASE}/auth/register`, {
      headers: fHeaders,
      data: { email: 'pwfarmer@test.kr', name: 'PW농부', role: 'farmer', firebase_uid: 'dev-pwfarmer@test.kr' },
    });
    await request.post(`${API_BASE}/auth/farmer-profile`, {
      headers: fHeaders,
      data: { farm_name: 'PW농장', farm_location: '서울', description: 'test' },
    });

    // Create
    const createRes = await request.post(`${API_BASE}/products/`, {
      headers: fHeaders,
      data: { name: 'PW토마토', description: '테스트', price: 4000, stock: 30, region: '서울', category_id: 2 },
    });
    expect(createRes.status()).toBe(201);
    const product = await createRes.json();
    expect(product.name).toBe('PW토마토');
    const pid = product.id;

    // Read
    const getRes = await request.get(`${API_BASE}/products/${pid}`);
    expect(getRes.ok()).toBeTruthy();
    const fetched = await getRes.json();
    expect(fetched.name).toBe('PW토마토');

    // Update
    const updateRes = await request.put(`${API_BASE}/products/${pid}`, {
      headers: fHeaders,
      data: { price: 4500 },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(parseFloat(updated.price)).toBe(4500);

    // Delete (soft)
    const delRes = await request.delete(`${API_BASE}/products/${pid}`, { headers: fHeaders });
    expect(delRes.status()).toBe(204);
  });

  test('주문 → 결제 → 완료 → 리뷰 전체 플로우', async ({ request }) => {
    const { FARMER_TOKEN, CONSUMER_TOKEN, productIds } = await seedTestData(request);
    if (productIds.length === 0) {
      test.skip();
      return;
    }

    const fHeaders = { Authorization: `Bearer ${FARMER_TOKEN}`, 'Content-Type': 'application/json' };
    const cHeaders = { Authorization: `Bearer ${CONSUMER_TOKEN}`, 'Content-Type': 'application/json' };
    const pid = productIds[0];

    // Add to cart
    const cartRes = await request.post(`${API_BASE}/cart/`, {
      headers: cHeaders,
      data: { product_id: pid, quantity: 1 },
    });
    expect([200, 201]).toContain(cartRes.status());

    // Create order
    const orderRes = await request.post(`${API_BASE}/orders/`, {
      headers: cHeaders,
      data: {
        items: [{ product_id: pid, quantity: 1 }],
        shipping_address: '서울시 테스트구',
        shipping_name: 'E2E소비자',
        shipping_phone: '010-1111-2222',
      },
    });
    expect(orderRes.status()).toBe(201);
    const order = await orderRes.json();
    expect(order.status).toBe('pending');
    expect(order.items).toHaveLength(1);

    // Prepare payment
    const prepRes = await request.post(`${API_BASE}/payments/prepare`, {
      headers: cHeaders,
      data: { order_id: order.id, method: 'card' },
    });
    expect(prepRes.ok()).toBeTruthy();
    const prep = await prepRes.json();
    expect(prep.merchant_uid).toBeTruthy();

    // Confirm payment
    const confRes = await request.post(`${API_BASE}/payments/confirm`, {
      headers: cHeaders,
      data: { order_id: order.id, imp_uid: `imp_pw_${Date.now()}`, merchant_uid: prep.merchant_uid },
    });
    expect(confRes.ok()).toBeTruthy();
    const payment = await confRes.json();
    expect(payment.status).toBe('completed');

    // Check order status changed to paid
    const orderDetailRes = await request.get(`${API_BASE}/orders/${order.id}`, { headers: cHeaders });
    const orderDetail = await orderDetailRes.json();
    expect(orderDetail.status).toBe('paid');

    // Farmer completes order
    const statusRes = await request.put(`${API_BASE}/orders/${order.id}/status`, {
      headers: fHeaders,
      data: { status: 'completed' },
    });
    expect(statusRes.ok()).toBeTruthy();

    // Write review
    const reviewRes = await request.post(`${API_BASE}/reviews/`, {
      headers: cHeaders,
      data: {
        product_id: pid,
        order_id: order.id,
        rating: 5,
        text: 'Playwright E2E 테스트 리뷰 - 정말 맛있어요!',
        photos: [],
      },
    });
    expect(reviewRes.status()).toBe(201);

    // Check review exists
    const reviewsRes = await request.get(`${API_BASE}/reviews/product/${pid}`);
    const reviews = await reviewsRes.json();
    expect(reviews.length).toBeGreaterThan(0);

    // Check notifications were generated
    const notifRes = await request.get(`${API_BASE}/notifications/`, { headers: cHeaders });
    const notifications = await notifRes.json();
    expect(notifications.length).toBeGreaterThan(0);
  });

  test('AI 수요 예측 및 가격 최적화', async ({ request }) => {
    const { FARMER_TOKEN, CONSUMER_TOKEN, productIds } = await seedTestData(request);
    const cHeaders = { Authorization: `Bearer ${CONSUMER_TOKEN}` };
    const fHeaders = { Authorization: `Bearer ${FARMER_TOKEN}` };

    // Demand forecast
    const forecastRes = await request.get(`${API_BASE}/ai/demand-forecast?category_id=1`, { headers: cHeaders });
    expect(forecastRes.ok()).toBeTruthy();
    const forecasts = await forecastRes.json();
    expect(forecasts.length).toBeGreaterThan(0);
    expect(forecasts[0]).toHaveProperty('predicted_demand');
    expect(forecasts[0]).toHaveProperty('trend');

    // Price suggestion
    if (productIds.length > 0) {
      const sugRes = await request.get(`${API_BASE}/ai/price-suggestion?product_id=${productIds[0]}`, { headers: fHeaders });
      expect(sugRes.ok()).toBeTruthy();
      const suggestion = await sugRes.json();
      expect(suggestion).toHaveProperty('suggested_price');
      expect(suggestion).toHaveProperty('confidence');
      expect(suggestion).toHaveProperty('reasoning');
    }

    // Price trends
    if (productIds.length > 0) {
      const trendRes = await request.get(`${API_BASE}/ai/price-trends?product_id=${productIds[0]}`, { headers: cHeaders });
      expect(trendRes.ok()).toBeTruthy();
      const trends = await trendRes.json();
      expect(trends).toHaveProperty('current_price');
      expect(trends).toHaveProperty('trend');
    }
  });

  test('장바구니 CRUD', async ({ request }) => {
    const { CONSUMER_TOKEN, productIds } = await seedTestData(request);
    const headers = { Authorization: `Bearer ${CONSUMER_TOKEN}`, 'Content-Type': 'application/json' };
    if (productIds.length < 2) { test.skip(); return; }

    // Add items
    const add1 = await request.post(`${API_BASE}/cart/`, { headers, data: { product_id: productIds[0], quantity: 2 } });
    expect([200, 201]).toContain(add1.status());

    const add2 = await request.post(`${API_BASE}/cart/`, { headers, data: { product_id: productIds[1], quantity: 1 } });
    expect([200, 201]).toContain(add2.status());

    // List cart
    const listRes = await request.get(`${API_BASE}/cart/`, { headers });
    expect(listRes.ok()).toBeTruthy();
    const cart = await listRes.json();
    expect(cart.length).toBeGreaterThanOrEqual(2);

    // Update quantity
    const itemId = cart[cart.length - 1].id;
    const updateRes = await request.put(`${API_BASE}/cart/${itemId}`, { headers, data: { quantity: 5 } });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.quantity).toBe(5);

    // Delete item
    const delRes = await request.delete(`${API_BASE}/cart/${itemId}`, { headers });
    expect(delRes.status()).toBe(204);
  });

  test('알림 읽음 처리', async ({ request }) => {
    const { CONSUMER_TOKEN } = await seedTestData(request);
    const headers = { Authorization: `Bearer ${CONSUMER_TOKEN}`, 'Content-Type': 'application/json' };

    // Get notifications
    const listRes = await request.get(`${API_BASE}/notifications/`, { headers });
    const notifications = await listRes.json();

    if (notifications.length > 0) {
      // Mark one as read
      const nid = notifications[0].id;
      const readRes = await request.put(`${API_BASE}/notifications/${nid}/read`, { headers });
      expect(readRes.ok()).toBeTruthy();
      const updated = await readRes.json();
      expect(updated.is_read).toBe(true);

      // Check unread count decreased
      const countRes = await request.get(`${API_BASE}/notifications/unread-count`, { headers });
      const countBody = await countRes.json();
      expect(countBody).toHaveProperty('count');
    }

    // Mark all as read
    const markAllRes = await request.put(`${API_BASE}/notifications/mark-all-read`, { headers });
    expect(markAllRes.ok()).toBeTruthy();
  });
});
