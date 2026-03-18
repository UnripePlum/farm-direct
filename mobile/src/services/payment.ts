// Payment service interface and implementations

export interface PaymentProvider {
  requestPayment(params: {
    merchantUid: string;
    amount: number;
    orderName: string;
    buyerName: string;
    buyerPhone: string;
  }): Promise<{ imp_uid: string; merchant_uid: string; success: boolean }>;
}

// Dummy implementation for development - simulates PortOne/PG payment
export class DummyPaymentProvider implements PaymentProvider {
  async requestPayment(params: {
    merchantUid: string;
    amount: number;
    orderName: string;
    buyerName: string;
    buyerPhone: string;
  }) {
    await new Promise((r) => setTimeout(r, 1000));
    return {
      imp_uid: `imp_dummy_${Date.now()}`,
      merchant_uid: params.merchantUid,
      success: true,
    };
  }
}

// Real PortOne SDK integration (to be used in production)
export class PortOnePaymentProvider implements PaymentProvider {
  async requestPayment(_params: {
    merchantUid: string;
    amount: number;
    orderName: string;
    buyerName: string;
    buyerPhone: string;
  }): Promise<{ imp_uid: string; merchant_uid: string; success: boolean }> {
    // const response = await IMP.request_pay({ ... });
    throw new Error('PortOne not configured. Set USE_REAL_PAYMENT=true and install iamport-react-native');
  }
}

// Factory - change to true when PortOne is configured
const USE_REAL_PAYMENT = false;

export const paymentProvider: PaymentProvider = USE_REAL_PAYMENT
  ? new PortOnePaymentProvider()
  : new DummyPaymentProvider();
