# FarmDirect - 더미 → 실제 서비스 교체 가이드

현재 앱은 모든 외부 서비스를 **더미 구현**으로 동작합니다.
프로덕션 배포 전에 아래 항목들을 실제 서비스로 교체해야 합니다.

---

## 아키텍처 개요

```
mobile/src/services/auth.ts       ← AuthProvider (Dummy / Firebase)
mobile/src/services/payment.ts    ← PaymentProvider (Dummy / PortOne)

backend/app/services/auth_service.py        ← AuthService (Dummy / Firebase)
backend/app/services/payment_service.py     ← PaymentService (Dummy / PortOne)
backend/app/services/storage_service.py     ← StorageService (Dummy / S3)
backend/app/services/notification_service.py ← NotificationPushService (Dummy / FCM)
backend/app/services/container.py           ← ServiceContainer (설정에 따라 자동 선택)
```

전환 방법: 각 서비스의 플래그를 `True`로 변경하면 실제 구현이 활성화됩니다.

---

## 1. Firebase Auth 연동

### 필요한 작업

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 1-1 | Firebase 프로젝트 생성 | [Firebase Console](https://console.firebase.google.com) | 쉬움 |
| 1-2 | Firebase Admin SDK 서비스 계정 키 다운로드 | Firebase Console → 프로젝트 설정 → 서비스 계정 | 쉬움 |
| 1-3 | 서비스 계정 키를 서버에 배치 | `backend/firebase-credentials.json` | 쉬움 |
| 1-4 | 환경변수 설정 | `FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json` | 쉬움 |
| 1-5 | 백엔드 플래그 전환 | `backend/app/config.py` → `USE_REAL_SERVICES=True` | 쉬움 |
| 1-6 | React Native Firebase SDK 설치 | `npx expo install @react-native-firebase/app @react-native-firebase/auth` | 중간 |
| 1-7 | iOS GoogleService-Info.plist 추가 | `mobile/ios/GoogleService-Info.plist` | 쉬움 |
| 1-8 | Android google-services.json 추가 | `mobile/android/app/google-services.json` | 쉬움 |
| 1-9 | FirebaseAuthProvider 구현 완성 | `mobile/src/services/auth.ts` → FirebaseAuthProvider 클래스 | 중간 |
| 1-10 | 모바일 플래그 전환 | `mobile/src/services/auth.ts` → `USE_REAL_AUTH=true` | 쉬움 |

### FirebaseAuthProvider에서 구현할 메서드

```typescript
// mobile/src/services/auth.ts - FirebaseAuthProvider

import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

async signInWithEmail(email: string, password: string) {
  const credential = await auth().signInWithEmailAndPassword(email, password);
  const token = await credential.user.getIdToken();
  return { uid: credential.user.uid, token };
}

async signUpWithEmail(email: string, password: string) {
  const credential = await auth().createUserWithEmailAndPassword(email, password);
  const token = await credential.user.getIdToken();
  return { uid: credential.user.uid, token };
}

async signInWithSocial(provider: 'google' | 'kakao') {
  if (provider === 'google') {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(googleCredential);
    const token = await result.user.getIdToken();
    return { uid: result.user.uid, token };
  }
  // Kakao: @react-native-seoul/kakao-login 패키지 사용
}

async signOut() {
  await auth().signOut();
}

async resetPassword(email: string) {
  await auth().sendPasswordResetEmail(email);
}
```

### Kakao 로그인 추가 패키지
```bash
npm install @react-native-seoul/kakao-login
# Kakao Developers에서 앱 등록 필요
```

---

## 2. PG 결제 연동 (PortOne / 아임포트)

### 필요한 작업

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 2-1 | PortOne 가입 및 상점 생성 | [PortOne](https://portone.io) | 쉬움 |
| 2-2 | API Key / Secret 발급 | PortOne 관리자 → 결제 연동 | 쉬움 |
| 2-3 | 환경변수 설정 | `PG_MERCHANT_ID`, `PG_API_KEY`, `PG_API_SECRET` | 쉬움 |
| 2-4 | 백엔드 플래그 전환 | `USE_REAL_SERVICES=True` (1-5와 동일) | 쉬움 |
| 2-5 | React Native PortOne SDK 설치 | `npm install iamport-react-native` | 중간 |
| 2-6 | PortOnePaymentProvider 구현 완성 | `mobile/src/services/payment.ts` | 중간 |
| 2-7 | 모바일 플래그 전환 | `mobile/src/services/payment.ts` → `USE_REAL_PAYMENT=true` | 쉬움 |

### PortOnePaymentProvider에서 구현할 메서드

```typescript
// mobile/src/services/payment.ts - PortOnePaymentProvider

import IMP from 'iamport-react-native';

async requestPayment(params) {
  return new Promise((resolve, reject) => {
    // IMP.request_pay를 CheckoutScreen에서 컴포넌트로 렌더링
    // 결과를 콜백으로 받아서 resolve/reject
    // 실제로는 CheckoutScreen에 IMP.Payment 컴포넌트를 렌더링해야 함
  });
}
```

> **참고:** PortOne React Native SDK는 컴포넌트 기반이므로,
> `CheckoutScreen.tsx`에 `<IMP.Payment>` 컴포넌트를 조건부 렌더링하는 방식으로 구현해야 합니다.

---

## 3. PostgreSQL 데이터베이스 설정

### 필요한 작업

| # | 작업 | 난이도 |
|---|------|--------|
| 3-1 | PostgreSQL 설치 (로컬: `brew install postgresql@16`) | 쉬움 |
| 3-2 | DB 생성: `createdb farmdirect` | 쉬움 |
| 3-3 | 환경변수: `DATABASE_URL=postgresql+asyncpg://localhost/farmdirect` | 쉬움 |
| 3-4 | Alembic 마이그레이션 생성: `cd backend && alembic revision --autogenerate -m "init"` | 쉬움 |
| 3-5 | 마이그레이션 실행: `alembic upgrade head` | 쉬움 |
| 3-6 | 시드 데이터 로드: `python -m scripts.seed_data` | 쉬움 |

---

## 4. 이미지 저장소 (S3)

### 필요한 작업

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 4-1 | AWS S3 버킷 생성 (또는 MinIO 로컬) | AWS Console | 중간 |
| 4-2 | IAM 사용자 + 액세스 키 발급 | AWS IAM | 중간 |
| 4-3 | 환경변수: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` | 쉬움 |
| 4-4 | boto3 설치: `pip install boto3` | 쉬움 |
| 4-5 | S3StorageService 구현 완성 | `backend/app/services/storage_service.py` | 중간 |
| 4-6 | 상품 이미지 업로드 API 엔드포인트 추가 | `backend/app/routers/products.py` | 중간 |
| 4-7 | 모바일 이미지 피커 → 업로드 연동 | `mobile/src/screens/farmer/AddProductScreen.tsx` | 중간 |

---

## 5. 푸시 알림 (FCM)

### 필요한 작업

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 5-1 | Firebase 프로젝트에서 Cloud Messaging 활성화 | Firebase Console | 쉬움 |
| 5-2 | 서버 키 확인 (Firebase Admin SDK가 자동 처리) | - | 없음 |
| 5-3 | expo-notifications 설정 | `mobile/app.json` 에 push notification config | 중간 |
| 5-4 | 푸시 토큰 등록 API 추가 | `backend/app/routers/notifications.py` | 중간 |
| 5-5 | FCMNotificationService 구현 완성 | `backend/app/services/notification_service.py` | 중간 |
| 5-6 | 모바일에서 푸시 토큰 발급 → 서버 전송 | `mobile/src/store/notificationStore.ts` | 중간 |

---

## 6. AI/ML 모델 운영

### 필요한 작업

| # | 작업 | 난이도 |
|---|------|--------|
| 6-1 | Prophet 설치: `pip install prophet` (시스템에 따라 cmdstan 필요) | 중간 |
| 6-2 | 실제 농산물 가격 데이터 수집 (KAMIS API 등) | 높음 |
| 6-3 | 시드 데이터를 실제 데이터로 교체 | 중간 |
| 6-4 | 모델 학습: `python -m scripts.seed_data --train` | 쉬움 |
| 6-5 | 정기 학습 cron job 설정 | 중간 |
| 6-6 | LSTM 모델 추가 (선택) | 높음 |

---

## 전환 체크리스트

### 개발 → 스테이징
```bash
# backend/.env
USE_REAL_SERVICES=false      # 스테이징에서도 더미 사용 가능
DATABASE_URL=postgresql+asyncpg://localhost/farmdirect  # 실제 DB는 필요
```

### 스테이징 → 프로덕션
```bash
# backend/.env
USE_REAL_SERVICES=true
DATABASE_URL=postgresql+asyncpg://prod-host/farmdirect
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
PG_MERCHANT_ID=your_merchant_id
PG_API_KEY=your_api_key
PG_API_SECRET=your_api_secret
SECRET_KEY=your-production-secret-key
```

```typescript
// mobile/src/services/auth.ts
const USE_REAL_AUTH = true;

// mobile/src/services/payment.ts
const USE_REAL_PAYMENT = true;
```

---

## 우선순위 추천

1. **PostgreSQL 설정** (3번) - 모든 기능의 기반, 가장 먼저 해야 함
2. **Firebase Auth** (1번) - 실제 사용자 인증 필수
3. **PG 결제** (2번) - 결제 기능 필수
4. **이미지 저장소** (4번) - 상품 사진 업로드
5. **푸시 알림** (5번) - 부가 기능
6. **AI 모델 운영** (6번) - 실제 데이터 확보 후

---

## 현재 상태로 할 수 있는 것

더미 서비스로 **앱 전체 플로우를 테스트**할 수 있습니다:

1. 회원가입/로그인 (아무 이메일/비밀번호로 가능)
2. 소셜 로그인 (Google/Kakao 버튼 클릭 시 더미 로그인)
3. 상품 탐색/검색/필터링
4. 장바구니 추가/수정/삭제
5. 주문/결제 (더미 결제가 자동 성공)
6. 농부 대시보드 (AI 예측 데이터 확인)
7. 리뷰 작성
8. 알림 확인
