// Order Repository for DynamoDB

import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryItems, updateItem, deleteItem } from '../db/dynamodb-client';
import { Keys } from '../db/dynamodb-keys';
import { logger } from '../utils/logger';

import { Order } from '../types';

export class OrderRepository {
  async create(data: Partial<Order>): Promise<Order> {
    try {
      // Validate required fields
      const missingFields = [];
      if (!data.clientId) missingFields.push('clientId');
      if (!data.categoryId) missingFields.push('categoryId');
      if (!data.title) missingFields.push('title');
      if (!data.description) missingFields.push('description');
      if (!data.city) missingFields.push('city');

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (!data.budgetType) {
        throw new Error('Budget type is required');
      }

      const order: Order = {
        id: uuidv4(),
        clientId: data.clientId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        city: data.city,
        address: data.address,
        hideAddress: data.hideAddress ?? true,
        budgetType: data.budgetType,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || 'ACTIVE',
        applicationsCount: 0,
        viewsCount: 0,
        isUrgent: data.isUrgent || false,
        masterId: data.masterId,
        acceptedApplicationId: data.acceptedApplicationId,

        // Additional fields
        subcategory: data.subcategory,
        workVolume: data.workVolume,
        floor: data.floor,
        hasElevator: data.hasElevator,
        materialStatus: data.materialStatus,
        hasElectricity: data.hasElectricity,
        hasWater: data.hasWater,
        canStoreTools: data.canStoreTools,
        hasParking: data.hasParking,
        requiredExperience: data.requiredExperience,
        needTeam: data.needTeam,
        additionalRequirements: data.additionalRequirements,
        isPublic: data.isPublic ?? true,
        autoCloseApplications: data.autoCloseApplications ?? false,
        images: data.images || [],

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await putItem({
        ...Keys.order(order.id),
        ...order,
        GSI1PK: `CAT#${order.categoryId}`,
        GSI1SK: `${order.createdAt}#${order.id}`,
        GSI2PK: `STATUS#${order.status}`,
        GSI2SK: `${order.createdAt}#${order.id}`,
        GSI3PK: `USER#${order.clientId}`,
        GSI3SK: `${order.createdAt}#${order.id}`,
      });

      logger.info('Order created successfully', { orderId: order.id, clientId: order.clientId });
      return order;
    } catch (error) {
      logger.error('Failed to create order', error, { clientId: data.clientId, title: data.title });
      throw new Error('Failed to create order');
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const item = await getItem(Keys.order(orderId));
      return item as Order | null;
    } catch (error) {
      logger.error('Failed to find order by ID', error, { orderId });
      throw new Error('Failed to retrieve order');
    }
  }

  async findByStatus(status: string, limit = 20): Promise<Order[]> {
    try {
      if (!status) {
        throw new Error('Status is required');
      }

      const items = await queryItems({
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `STATUS#${status}`,
        },
        ScanIndexForward: false,
        Limit: limit,
      });

      return items as Order[];
    } catch (error) {
      logger.error('Failed to find orders by status', error, { status, limit });
      throw new Error('Failed to retrieve orders by status');
    }
  }

  async findByCategory(categoryId: string, limit = 20): Promise<Order[]> {
    try {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }

      const items = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CAT#${categoryId}`,
        },
        ScanIndexForward: false,
        Limit: limit,
      });

      return items as Order[];
    } catch (error) {
      logger.error('Failed to find orders by category', error, { categoryId, limit });
      throw new Error('Failed to retrieve orders by category');
    }
  }

  async update(orderId: string, data: Partial<Order>): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Validate that order exists first
      const existingOrder = await this.findById(orderId);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const updateExpressions: string[] = [];
      const attributeValues: Record<string, any> = {};
      const attributeNames: Record<string, string> = {};

      Object.entries(data).forEach(([key, value], index) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt') {
          updateExpressions.push(`#attr${index} = :val${index}`);
          attributeNames[`#attr${index}`] = key;
          attributeValues[`:val${index}`] = value;
        }
      });

      updateExpressions.push('#updatedAt = :updatedAt');
      attributeNames['#updatedAt'] = 'updatedAt';
      attributeValues[':updatedAt'] = new Date().toISOString();

      const updated = await updateItem({
        Key: Keys.order(orderId),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: attributeNames,
        ExpressionAttributeValues: attributeValues,
      });

      logger.info('Order updated successfully', { orderId });
      return updated as Order;
    } catch (error) {
      logger.error('Failed to update order', error, { orderId });
      throw new Error('Failed to update order');
    }
  }

  async delete(orderId: string): Promise<void> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      // Validate that order exists first
      const existingOrder = await this.findById(orderId);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      await deleteItem(Keys.order(orderId));
      logger.info('Order deleted successfully', { orderId });
    } catch (error) {
      logger.error('Failed to delete order', error, { orderId });
      throw new Error('Failed to delete order');
    }
  }

  async findByClient(clientId: string, limit = 50): Promise<Order[]> {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const items = await queryItems({
        IndexName: 'GSI3',
        KeyConditionExpression: 'GSI3PK = :pk AND begins_with(GSI3SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${clientId}`,
          ':sk': '20', // Most orders will start with 20 (year 20xx)
        },
        ScanIndexForward: false,
        Limit: limit,
      });

      return items as Order[];
    } catch (error) {
      logger.error('Failed to find orders by client', error, { clientId, limit });
      throw new Error('Failed to retrieve orders by client');
    }
  }

  async updateStatus(orderId: string, status: Order['status']): Promise<Order> {
    try {
      if (!orderId || !status) {
        throw new Error('Order ID and status are required');
      }

      const updated = await updateItem({
        Key: Keys.order(orderId),
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, GSI2PK = :gsi2pk',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
          ':gsi2pk': `STATUS#${status}`
        },
      });

      logger.info('Order status updated', { orderId, status });
      return updated as Order;
    } catch (error) {
      logger.error('Failed to update order status', error, { orderId, status });
      throw new Error('Failed to update order status');
    }
  }

  async pause(orderId: string): Promise<Order> {
    return this.updateStatus(orderId, 'PAUSED');
  }

  async resume(orderId: string): Promise<Order> {
    return this.updateStatus(orderId, 'ACTIVE');
  }

  async archive(orderId: string): Promise<Order> {
    return this.updateStatus(orderId, 'ARCHIVED');
  }

  /**
   * Atomically increment applications count for an order
   * Uses DynamoDB ADD operation which is atomic and safe for concurrent updates
   */
  async incrementApplicationsCount(orderId: string): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const updated = await updateItem({
        Key: Keys.order(orderId),
        UpdateExpression: 'ADD #applicationsCount :inc SET #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#applicationsCount': 'applicationsCount',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':updatedAt': new Date().toISOString(),
        },
      });

      logger.info('Order applications count incremented', { orderId });
      return updated as Order;
    } catch (error) {
      logger.error('Failed to increment applications count', error, { orderId });
      throw new Error('Failed to increment applications count');
    }
  }

  async incrementViewsCount(orderId: string): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const updated = await updateItem({
        Key: Keys.order(orderId),
        UpdateExpression: 'ADD #viewsCount :inc SET #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#viewsCount': 'viewsCount',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':updatedAt': new Date().toISOString(),
        },
      });

      logger.info('Order views count incremented', { orderId });
      return updated as Order;
    } catch (error) {
      logger.error('Failed to increment views count', error, { orderId });
      throw new Error('Failed to increment views count');
    }
  }

  async findByClientWithFilters(
    clientId: string,
    filters: {
      status?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { status, page = 1, pageSize = 20 } = filters;

      let items: Order[];

      if (status) {
        // Query by status first, then filter by client
        const allStatusOrders = await queryItems({
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `STATUS#${status}`,
          },
          ScanIndexForward: false,
          Limit: 100, // Get more to filter by client
        });

        items = (allStatusOrders as Order[]).filter(order => order.clientId === clientId);
      } else {
        // Get all orders for client using GSI3
        items = await this.findByClient(clientId, 100);
      }

      const total = items.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedItems = items.slice(startIndex, startIndex + pageSize);

      return { orders: paginatedItems, total };
    } catch (error) {
      logger.error('Failed to find orders by client with filters', error, { clientId, filters });
      throw new Error('Failed to retrieve filtered orders');
    }
  }

  async addToFavorites(userId: string, orderId: string): Promise<void> {
    try {
      if (!userId || !orderId) {
        throw new Error('User ID and Order ID are required');
      }

      await putItem({
        PK: `USER#${userId}`,
        SK: `FAV_ORDER#${orderId}`,
        userId,
        orderId,
        createdAt: new Date().toISOString(),
      });

      logger.info('Order added to favorites', { userId, orderId });
    } catch (error) {
      logger.error('Failed to add order to favorites', error, { userId, orderId });
      throw new Error('Failed to add order to favorites');
    }
  }

  async removeFromFavorites(userId: string, orderId: string): Promise<void> {
    try {
      if (!userId || !orderId) {
        throw new Error('User ID and Order ID are required');
      }

      await deleteItem({
        PK: `USER#${userId}`,
        SK: `FAV_ORDER#${orderId}`,
      });

      logger.info('Order removed from favorites', { userId, orderId });
    } catch (error) {
      logger.error('Failed to remove order from favorites', error, { userId, orderId });
      throw new Error('Failed to remove order from favorites');
    }
  }

  async getFavorites(userId: string): Promise<string[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const items = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'FAV_ORDER#',
        },
      });

      return items.map((item: any) => item.orderId);
    } catch (error) {
      logger.error('Failed to get favorite orders', error, { userId });
      throw new Error('Failed to retrieve favorite orders');
    }
  }

  async isFavorite(userId: string, orderId: string): Promise<boolean> {
    try {
      if (!userId || !orderId) {
        throw new Error('User ID and Order ID are required');
      }

      const item = await getItem({
        PK: `USER#${userId}`,
        SK: `FAV_ORDER#${orderId}`,
      });

      return !!item;
    } catch (error) {
      logger.error('Failed to check if order is favorite', error, { userId, orderId });
      throw new Error('Failed to check favorite status');
    }
  }

  /**
   * Records a unique view of an order by a user
   * If the user hasn't viewed this order yet, increments viewsCount
   */
  async recordUniqueView(orderId: string, userId: string): Promise<void> {
    try {
      if (!orderId || !userId) {
        throw new Error('Order ID and User ID are required');
      }

      const viewKey = {
        PK: `ORDER#${orderId}`,
        SK: `VIEW#USER#${userId}`,
      };

      // Check if user already viewed
      const existingView = await getItem(viewKey);
      if (existingView) {
        return; // Already counted
      }

      // Save view record
      await putItem({
        ...viewKey,
        userId,
        orderId,
        createdAt: new Date().toISOString(),
      });

      // Increment count
      await this.incrementViewsCount(orderId);

      logger.info('Unique view recorded', { orderId, userId });
    } catch (error) {
      logger.error('Failed to record unique view', error, { orderId, userId });
      // Don't throw here to avoid failing the get order request
    }
  }
}
