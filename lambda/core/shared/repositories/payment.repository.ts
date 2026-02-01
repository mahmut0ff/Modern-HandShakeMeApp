// Payment Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';

export interface PaymentCard {
  id: string;
  userId: string;
  stripeCardId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class PaymentRepository {
  async createCard(data: Partial<PaymentCard>): Promise<PaymentCard> {
    const card: PaymentCard = {
      id: uuidv4(),
      userId: data.userId!,
      stripeCardId: data.stripeCardId!,
      last4: data.last4!,
      brand: data.brand!,
      expiryMonth: data.expiryMonth!,
      expiryYear: data.expiryYear!,
      cardholderName: data.cardholderName,
      isDefault: data.isDefault || false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await putItem({
      PK: `USER#${card.userId}`,
      SK: `CARD#${card.id}`,
      ...card,
      GSI1PK: `CARD#${card.stripeCardId}`,
      GSI1SK: `USER#${card.userId}`,
    });
    
    return card;
  }
  
  async findCardById(cardId: string, userId: string): Promise<PaymentCard | null> {
    const item = await getItem({
      PK: `USER#${userId}`,
      SK: `CARD#${cardId}`,
    });
    
    return item as PaymentCard | null;
  }
  
  async findCardByStripeId(stripeCardId: string, userId: string): Promise<PaymentCard | null> {
    const items = await queryItems({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `CARD#${stripeCardId}`,
        ':sk': `USER#${userId}`,
      },
      Limit: 1,
    });
    
    return items.length > 0 ? items[0] as PaymentCard : null;
  }
  
  async findUserCards(userId: string): Promise<PaymentCard[]> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CARD#',
        ':active': true,
      },
    });
    
    return (items as PaymentCard[]).sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async countUserCards(userId: string): Promise<number> {
    const items = await queryItems({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: 'isActive = :active',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'CARD#',
        ':active': true,
      },
      Select: 'COUNT',
    });
    
    return items.length;
  }
  
  async updateCard(cardId: string, userId: string, updates: Partial<PaymentCard>): Promise<PaymentCard> {
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
        PK: `USER#${userId}`,
        SK: `CARD#${cardId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
    });
    
    return updated as PaymentCard;
  }
  
  async setDefaultCard(cardId: string, userId: string): Promise<void> {
    // First, unset all default cards for the user
    const userCards = await this.findUserCards(userId);
    
    for (const card of userCards) {
      if (card.isDefault && card.id !== cardId) {
        await this.updateCard(card.id, userId, { isDefault: false });
      }
    }
    
    // Set the specified card as default
    await this.updateCard(cardId, userId, { isDefault: true });
  }
  
  async deleteCard(cardId: string, userId: string): Promise<void> {
    await this.updateCard(cardId, userId, { 
      isActive: false, 
      isDefault: false 
    });
  }
}