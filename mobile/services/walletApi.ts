import { api } from './api';

export interface Wallet {
  id: number;
  user: number;
  balance: string;
  pending_balance: string;
  total_earned: string;
  total_spent: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  wallet: number;
  transaction_type: 
    | 'deposit'
    | 'withdrawal'
    | 'payment'
    | 'refund'
    | 'commission'
    | 'bonus'
    | 'penalty';
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  reference_id?: string;
  related_object_type?: 'order' | 'project' | 'application';
  related_object_id?: number;
  payment_method?: string;
  payment_details?: Record<string, any>;
  fee_amount?: string;
  net_amount?: string;
  created_at: string;
  completed_at?: string;
  failed_at?: string;
}

export interface PaymentMethod {
  id: number;
  user: number;
  method_type: 'card' | 'bank_account' | 'mobile_money' | 'crypto';
  provider: string;
  name: string;
  details: Record<string, any>;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  verified_at?: string;
}

export interface DepositRequest {
  amount: number;
  payment_method_id?: number;
  payment_method_type?: 'card' | 'bank_account' | 'mobile_money';
  return_url?: string;
}

export interface WithdrawalRequest {
  amount: number;
  payment_method_id: number;
  description?: string;
}

export interface PaymentMethodCreateData {
  method_type: 'card' | 'bank_account' | 'mobile_money' | 'crypto';
  provider: string;
  name: string;
  details: Record<string, any>;
  is_default?: boolean;
}

export interface PaymentMethodUpdateData {
  name?: string;
  details?: Record<string, any>;
  is_default?: boolean;
}

export interface PaymentRequest {
  recipient_id: number;
  amount: number;
  description?: string;
  order_id?: number;
  project_id?: number;
}

export const walletApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Wallet
    getWallet: builder.query<Wallet, void>({
      query: () => '/wallet',
      providesTags: ['Wallet'],
    }),

    // Transactions
    getTransactions: builder.query<{ results: Transaction[]; count: number }, {
      transaction_type?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (params) => ({
        url: '/wallet/transactions',
        params,
      }),
      providesTags: ['Transaction'],
    }),

    getTransaction: builder.query<Transaction, number>({
      query: (id) => `/wallet/transactions/${id}`,
      providesTags: ['Transaction'],
    }),

    // Deposits
    createDeposit: builder.mutation<{ 
      transaction: Transaction; 
      payment_url?: string; 
      payment_data?: Record<string, any> 
    }, DepositRequest>({
      query: (data) => ({
        url: '/wallet/deposit',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),

    // Withdrawals
    createWithdrawal: builder.mutation<Transaction, WithdrawalRequest>({
      query: (data) => ({
        url: '/wallet/withdraw',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),

    // Payments
    sendPayment: builder.mutation<Transaction, PaymentRequest>({
      query: (data) => ({
        url: '/wallet/send-payment',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),

    // Payment methods
    getPaymentMethods: builder.query<PaymentMethod[], void>({
      query: () => '/wallet/payment-methods',
      providesTags: ['Wallet'],
    }),

    createPaymentMethod: builder.mutation<PaymentMethod, PaymentMethodCreateData>({
      query: (data) => ({
        url: '/wallet/payment-methods',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wallet'],
    }),

    updatePaymentMethod: builder.mutation<PaymentMethod, { id: number; data: PaymentMethodUpdateData }>({
      query: ({ id, data }) => ({
        url: `/wallet/payment-methods/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Wallet'],
    }),

    deletePaymentMethod: builder.mutation<void, number>({
      query: (id) => ({
        url: `/wallet/payment-methods/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wallet'],
    }),

    setDefaultPaymentMethod: builder.mutation<PaymentMethod, number>({
      query: (id) => ({
        url: `/wallet/payment-methods/${id}/set-default`,
        method: 'POST',
      }),
      invalidatesTags: ['Wallet'],
    }),

    verifyPaymentMethod: builder.mutation<PaymentMethod, { id: number; verification_data: Record<string, any> }>({
      query: ({ id, verification_data }) => ({
        url: `/wallet/payment-methods/${id}/verify`,
        method: 'POST',
        body: verification_data,
      }),
      invalidatesTags: ['Wallet'],
    }),

    // Balance and statistics
    getWalletStats: builder.query<{
      total_earned: string;
      total_spent: string;
      pending_earnings: string;
      this_month_earnings: string;
      this_month_spending: string;
      transactions_count: number;
    }, { period?: 'week' | 'month' | 'year' }>({
      query: (params) => ({
        url: '/wallet/stats',
        params,
      }),
      providesTags: ['Wallet'],
    }),

    // Exchange rates (if multi-currency support)
    getExchangeRates: builder.query<Record<string, number>, void>({
      query: () => '/wallet/exchange-rates',
    }),
  }),
});

export const {
  useGetWalletQuery,
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useCreateDepositMutation,
  useCreateWithdrawalMutation,
  useSendPaymentMutation,
  useGetPaymentMethodsQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
  useVerifyPaymentMethodMutation,
  useGetWalletStatsQuery,
  useGetExchangeRatesQuery,
} = walletApi;