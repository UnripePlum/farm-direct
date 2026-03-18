export const API_URL = 'http://localhost:8000/api';

export const ASYNC_STORAGE_KEYS = {
  TOKEN: '@farmdirect_token',
  USER: '@farmdirect_user',
  ONBOARDING_COMPLETE: '@farmdirect_onboarding',
};

export const CATEGORIES = [
  { id: 1, name: '채소', icon: 'leaf', color: '#4CAF50' },
  { id: 2, name: '과일', icon: 'nutrition', color: '#FF9800' },
  { id: 3, name: '곡물', icon: 'grain', color: '#795548' },
  { id: 4, name: '버섯', icon: 'eco', color: '#9C27B0' },
  { id: 5, name: '나물', icon: 'spa', color: '#8BC34A' },
  { id: 6, name: '견과류', icon: 'nature', color: '#FF5722' },
];

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '주문 대기',
  paid: '결제 완료',
  processing: '상품 준비',
  shipped: '배송 중',
  completed: '배송 완료',
  cancelled: '주문 취소',
};

export const PAYMENT_METHODS = [
  { id: 'card', label: '신용/체크카드', icon: 'credit-card' },
  { id: 'bank_transfer', label: '계좌이체', icon: 'account-balance' },
  { id: 'kakao_pay', label: '카카오페이', icon: 'payment' },
  { id: 'naver_pay', label: '네이버페이', icon: 'payment' },
];
