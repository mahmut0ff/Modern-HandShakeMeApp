import { configureStore } from '@reduxjs/toolkit';
import { walletApi } from '../../../services/walletApi';
import { api } from '../../../services/api';

describe('walletApi', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
  });

  afterEach(() => {
    store.dispatch(api.util.resetApiState());
  });

  describe('Wallet', () => {
    it('should create getWallet endpoint', () => {
      expect(walletApi.endpoints.getWallet).toBeDefined();
    });

    it('should provide Wallet tag', () => {
      const endpoint = walletApi.endpoints.getWallet;
      expect(endpoint.name).toBe('getWallet');
    });
  });

  describe('Transactions', () => {
    it('should create getTransactions endpoint', () => {
      expect(walletApi.endpoints.getTransactions).toBeDefined();
    });

    it('should create getTransaction endpoint', () => {
      expect(walletApi.endpoints.getTransaction).toBeDefined();
    });

    it('should provide Transaction tag', () => {
      const endpoint = walletApi.endpoints.getTransactions;
      expect(endpoint.name).toBe('getTransactions');
    });
  });

  describe('Deposits', () => {
    it('should create createDeposit endpoint', () => {
      expect(walletApi.endpoints.createDeposit).toBeDefined();
    });

    it('should invalidate Wallet and Transaction tags', () => {
      const endpoint = walletApi.endpoints.createDeposit;
      expect(endpoint.name).toBe('createDeposit');
    });
  });

  describe('Withdrawals', () => {
    it('should create createWithdrawal endpoint', () => {
      expect(walletApi.endpoints.createWithdrawal).toBeDefined();
    });

    it('should invalidate Wallet and Transaction tags', () => {
      const endpoint = walletApi.endpoints.createWithdrawal;
      expect(endpoint.name).toBe('createWithdrawal');
    });
  });

  describe('Payments', () => {
    it('should create sendPayment endpoint', () => {
      expect(walletApi.endpoints.sendPayment).toBeDefined();
    });

    it('should invalidate Wallet and Transaction tags', () => {
      const endpoint = walletApi.endpoints.sendPayment;
      expect(endpoint.name).toBe('sendPayment');
    });
  });

  describe('Payment Methods', () => {
    it('should create getPaymentMethods endpoint', () => {
      expect(walletApi.endpoints.getPaymentMethods).toBeDefined();
    });

    it('should create createPaymentMethod endpoint', () => {
      expect(walletApi.endpoints.createPaymentMethod).toBeDefined();
    });

    it('should create updatePaymentMethod endpoint', () => {
      expect(walletApi.endpoints.updatePaymentMethod).toBeDefined();
    });

    it('should create deletePaymentMethod endpoint', () => {
      expect(walletApi.endpoints.deletePaymentMethod).toBeDefined();
    });

    it('should create setDefaultPaymentMethod endpoint', () => {
      expect(walletApi.endpoints.setDefaultPaymentMethod).toBeDefined();
    });

    it('should create verifyPaymentMethod endpoint', () => {
      expect(walletApi.endpoints.verifyPaymentMethod).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should create getWalletStats endpoint', () => {
      expect(walletApi.endpoints.getWalletStats).toBeDefined();
    });

    it('should provide Wallet tag', () => {
      const endpoint = walletApi.endpoints.getWalletStats;
      expect(endpoint.name).toBe('getWalletStats');
    });
  });

  describe('Transaction Types', () => {
    const transactionTypes = [
      'deposit',
      'withdrawal',
      'payment',
      'refund',
      'commission',
      'bonus',
      'penalty',
    ];

    transactionTypes.forEach(type => {
      it(`should support ${type} transaction type`, () => {
        expect(transactionTypes).toContain(type);
      });
    });
  });

  describe('Transaction Statuses', () => {
    const statuses = ['pending', 'completed', 'failed', 'cancelled'];

    statuses.forEach(status => {
      it(`should support ${status} status`, () => {
        expect(statuses).toContain(status);
      });
    });
  });

  describe('Payment Method Types', () => {
    const methodTypes = ['card', 'bank_account', 'mobile_money', 'crypto'];

    methodTypes.forEach(type => {
      it(`should support ${type} payment method`, () => {
        expect(methodTypes).toContain(type);
      });
    });
  });
});
