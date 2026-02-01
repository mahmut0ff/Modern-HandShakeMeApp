// Wallet Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem } from '../db/dynamodb-client';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  stripeCustomerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'FEE' | 'RESERVE' | 'COMMISSION';
  amount: number;
  commission?: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description?: string;
  projectId?: string;
  stripePaymentIntentId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class WalletRepository {
  async createWallet(data: Partial<Wallet>): Promise<Wallet> {
    const wallet: Wallet = {
      id: uuidv4(),
      userId: data.userId!,
      balance: data.balance || 0,
      currency: data.currency || 'KGS',
      stripeCustomerId: data.stripeCustomerId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `USER#${wallet.userId}`,
      SK: `WALLET#${wallet.id}`,
      ...wallet,
      GSI1PK: `WALLET#${wallet.id}`,
      GSI1SK: 'DETAILS',
    });
    
    return wallet;
  }
  
  async findUserWallet(userId: string): Promise<Wallet | null> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'WALLET#',
        ':active': true,
      },
      Limit: 1,
    });
    
    return items.length > 0 ? items[0] as Wallet : null;
  }
  
  async findWalletById(walletId: string): Promise<Wallet | null> {
    const item = await getItem({
      PK: `WALLET#${walletId}`,
      SK: 'DETAILS',
    });
    
    return item as Wallet | null;
  }
  
  async updateWallet(walletId: string, updates: Partial<Wallet>): Promise<Wallet> {
    const updateExpressions: string[] = [];
    const attributeValues: Record<string, any> = {};
    const attributeNames: Record<string, string> = {};
    
    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined && key !== 'id' && key !== 'userId' && key !== 'createdAt') {
        updateExpressions.push(`#attr${index} = :val${index}`);
        attributeNames[`#attr${index}`] = key;
        attributeValues[`:val${index}`] = value;
      }
    });
    
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();
    
    const updated = await updateItem({
      Key: {
        PK: `WALLET#${walletId}`,
        SK: 'DETAILS',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as Wallet;
  }
  
  async updateBalance(walletId: string, amount: number): Promise<Wallet> {
    const updated = await updateItem({
      Key: {
        PK: `WALLET#${walletId}`,
        SK: 'DETAILS',
      },
      UpdateExpression: 'ADD balance :amount SET #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':amount': amount,
        ':updatedAt': new Date().toISOString(),
      },
    });
    
    return updated as Wallet;
  }
  
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      userId: data.userId!,
      walletId: data.walletId!,
      type: data.type!,
      amount: data.amount!,
      commission: data.commission,
      currency: data.currency || 'KGS',
      status: data.status || 'PENDING',
      description: data.description,
      projectId: data.projectId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      idempotencyKey: data.idempotencyKey,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `USER#${transaction.userId}`,
      SK: `TXN#${transaction.id}`,
      ...transaction,
      GSI1PK: `WALLET#${transaction.walletId}`,
      GSI1SK: `TXN#${transaction.createdAt}#${transaction.id}`,
      GSI2PK: `STATUS#${transaction.status}`,
      GSI2SK: `${transaction.createdAt}#${transaction.id}`,
    });
    
    return transaction;
  }
  
  async findTransactionByIdempotencyKey(idempotencyKey: string): Promise<Transaction | null> {
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      FilterExpression: 'idempotencyKey = :key',
      ExpressionAttributeValues: {
        ':pk': 'IDEMPOTENCY',
        ':key': idempotencyKey,
      },
      Limit: 1,
    });
    
    return items.length > 0 ? items[0] as Transaction : null;
  }
  
  async findUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TXN#',
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    return items as Transaction[];
  }
  
  async updateTransactionStatus(transactionId: string, userId: string, status: Transaction['status']): Promise<Transaction> {
    const updated = await updateItem({
      Key: {
        PK: `USER#${userId}`,
        SK: `TXN#${transactionId}`,
      },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    });
    
    return updated as Transaction;
  }
  
  async countPendingTransactions(userId: string): Promise<number> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'TXN#',
        ':status': 'PENDING',
      },
      Select: 'COUNT',
    });
    
    return items.length;
  }
  
  async findProjectTransactions(projectId: string, limit = 50): Promise<Transaction[]> {
    // We need to scan for transactions with projectId since it's not in the key
    // In a production system, you might want to add a GSI for projectId
    const items = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      FilterExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':pk': 'STATUS#COMPLETED',
        ':projectId': projectId,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    // Also get pending transactions for the project
    const pendingItems = await queryItems({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      FilterExpression: 'projectId = :projectId',
      ExpressionAttributeValues: {
        ':pk': 'STATUS#PENDING',
        ':projectId': projectId,
      },
      ScanIndexForward: false,
      Limit: limit,
    });
    
    // Combine and sort by creation date
    const allTransactions = [...items, ...pendingItems] as Transaction[];
    return allTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
  }
}