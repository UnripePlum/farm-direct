import apiClient from './client';
import {
  PaymentPrepareRequest,
  PaymentPrepareResponse,
  PaymentConfirmRequest,
  Payment,
} from '../types';

export const paymentsApi = {
  preparePayment: async (data: PaymentPrepareRequest): Promise<PaymentPrepareResponse> => {
    const response = await apiClient.post<PaymentPrepareResponse>('/payments/prepare', data);
    return response.data;
  },

  confirmPayment: async (data: PaymentConfirmRequest): Promise<Payment> => {
    const response = await apiClient.post<Payment>('/payments/confirm', data);
    return response.data;
  },
};
