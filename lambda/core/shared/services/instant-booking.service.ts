/**
 * Instant Booking Service
 * Сервис для работы с мгновенными бронированиями
 */

import AWS from 'aws-sdk';
import { 
  InstantBooking, 
  BookingTransaction, 
  NotificationData,
  NotificationType 
} from '../types/instant-booking';
import { 
  generateTransactionId,
  calculatePlatformFee,
  formatBookingDate 
} from '../utils/instant-booking';

const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

export class InstantBookingService {
  
  /**
   * Send booking notification
   */
  async sendBookingNotification(
    userId: string,
    booking: InstantBooking,
    type: NotificationType
  ): Promise<void> {
    const notificationData = this.createNotificationData(userId, booking, type);
    
    try {
      await sns.publish({
        TopicArn: process.env.SNS_PUSH_TOPIC_ARN!,
        Message: JSON.stringify(notificationData)
      }).promise();
      
      console.log(`Notification sent: ${type} to user ${userId}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw error - notifications are not critical
    }
  }
  
  /**
   * Process booking payment
   */
  async processBookingPayment(booking: InstantBooking): Promise<void> {
    const transaction: BookingTransaction = {
      id: generateTransactionId(),
      userId: booking.clientId,
      type: 'INSTANT_BOOKING_PAYMENT',
      amount: booking.totalAmount,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethodId: booking.paymentMethodId,
      relatedObjectType: 'INSTANT_BOOKING',
      relatedObjectId: booking.id,
      description: `Payment for instant booking ${booking.id}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    
    await this.createTransaction(transaction);
  }
  
  /**
   * Process booking refund
   */
  async processBookingRefund(
    booking: InstantBooking, 
    refundAmount: number
  ): Promise<void> {
    const transaction: BookingTransaction = {
      id: generateTransactionId(),
      userId: booking.clientId,
      type: 'REFUND',
      amount: refundAmount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethodId: booking.paymentMethodId,
      relatedObjectType: 'INSTANT_BOOKING',
      relatedObjectId: booking.id,
      description: `Refund for cancelled booking ${booking.id}`,
      createdAt: new Date().toISOString()
    };
    
    await this.createTransaction(transaction);
  }
  
  /**
   * Process additional payment for rescheduling
   */
  async processAdditionalPayment(
    booking: InstantBooking, 
    amount: number
  ): Promise<void> {
    const transaction: BookingTransaction = {
      id: generateTransactionId(),
      userId: booking.clientId,
      type: 'ADDITIONAL_PAYMENT',
      amount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethodId: booking.paymentMethodId,
      relatedObjectType: 'INSTANT_BOOKING',
      relatedObjectId: booking.id,
      description: `Additional payment for rescheduled booking ${booking.id}`,
      createdAt: new Date().toISOString()
    };
    
    await this.createTransaction(transaction);
  }
  
  /**
   * Process partial refund for rescheduling
   */
  async processPartialRefund(
    booking: InstantBooking, 
    amount: number
  ): Promise<void> {
    const transaction: BookingTransaction = {
      id: generateTransactionId(),
      userId: booking.clientId,
      type: 'PARTIAL_REFUND',
      amount,
      currency: 'USD',
      status: 'PENDING',
      paymentMethodId: booking.paymentMethodId,
      relatedObjectType: 'INSTANT_BOOKING',
      relatedObjectId: booking.id,
      description: `Partial refund for rescheduled booking ${booking.id}`,
      createdAt: new Date().toISOString()
    };
    
    await this.createTransaction(transaction);
  }
  
  /**
   * Release payment to master
   */
  async releasePaymentToMaster(booking: InstantBooking): Promise<void> {
    const platformFee = calculatePlatformFee(booking.totalAmount);
    const masterAmount = booking.totalAmount - platformFee;
    
    const transaction: BookingTransaction = {
      id: generateTransactionId(),
      userId: booking.masterId,
      type: 'BOOKING_PAYOUT',
      amount: masterAmount,
      currency: 'USD',
      status: 'PENDING',
      relatedObjectType: 'INSTANT_BOOKING',
      relatedObjectId: booking.id,
      description: `Payout for completed booking ${booking.id}`,
      createdAt: new Date().toISOString()
    };
    
    await this.createTransaction(transaction);
  }
  
  /**
   * Check if time slot is available
   */
  async checkTimeSlotAvailability(
    masterId: string,
    dateTime: Date,
    duration: number,
    excludeBookingId?: string
  ): Promise<boolean> {
    const endTime = new Date(dateTime.getTime() + duration * 60 * 1000);
    
    // Query for conflicting bookings
    const result = await dynamodb.query({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      FilterExpression: excludeBookingId ?
        '#status IN (:confirmed, :inProgress) AND #id <> :excludeId AND ((scheduledDateTime <= :startTime AND endDateTime > :startTime) OR (scheduledDateTime < :endTime AND endDateTime >= :endTime) OR (scheduledDateTime >= :startTime AND endDateTime <= :endTime))' :
        '#status IN (:confirmed, :inProgress) AND ((scheduledDateTime <= :startTime AND endDateTime > :startTime) OR (scheduledDateTime < :endTime AND endDateTime >= :endTime) OR (scheduledDateTime >= :startTime AND endDateTime <= :endTime))',
      ExpressionAttributeNames: {
        '#status': 'status',
        ...(excludeBookingId && { '#id': 'id' })
      },
      ExpressionAttributeValues: {
        ':pk': `MASTER#${masterId}`,
        ':confirmed': 'CONFIRMED',
        ':inProgress': 'IN_PROGRESS',
        ':startTime': dateTime.toISOString(),
        ':endTime': endTime.toISOString(),
        ...(excludeBookingId && { ':excludeId': excludeBookingId })
      }
    }).promise();
    
    return (result.Items?.length || 0) === 0;
  }
  
  /**
   * Create transaction record
   */
  private async createTransaction(transaction: BookingTransaction): Promise<void> {
    await dynamodb.put({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: {
        PK: `TRANSACTION#${transaction.id}`,
        SK: `DETAILS`,
        GSI1PK: `USER#${transaction.userId}`,
        GSI1SK: `TRANSACTION#${transaction.createdAt}`,
        GSI2PK: `TYPE#${transaction.type}`,
        GSI2SK: `TRANSACTION#${transaction.createdAt}`,
        
        ...transaction,
        
        entityType: 'TRANSACTION'
      }
    }).promise();
  }
  
  /**
   * Create notification data
   */
  private createNotificationData(
    userId: string,
    booking: InstantBooking,
    type: NotificationType
  ): NotificationData {
    const formattedDate = formatBookingDate(booking.scheduledDateTime);
    
    const notifications = {
      'NEW_INSTANT_BOOKING': {
        title: '⚡ Мгновенное бронирование!',
        body: `Новое бронирование на ${formattedDate}`
      },
      'BOOKING_CONFIRMED': {
        title: '✅ Бронирование подтверждено',
        body: `Ваше бронирование на ${formattedDate} подтверждено`
      },
      'BOOKING_CANCELLED': {
        title: '❌ Бронирование отменено',
        body: `Бронирование на ${formattedDate} было отменено`
      },
      'BOOKING_RESCHEDULED': {
        title: '📅 Бронирование перенесено',
        body: `Бронирование перенесено на ${formattedDate}`
      },
      'BOOKING_STARTED': {
        title: '🚀 Работа началась',
        body: `Мастер начал работу по вашему бронированию`
      },
      'BOOKING_COMPLETED': {
        title: '✨ Работа завершена',
        body: `Работа по бронированию завершена. Оставьте отзыв!`
      }
    };
    
    const notification = notifications[type];
    
    return {
      userId,
      type,
      title: notification.title,
      body: notification.body,
      data: {
        bookingId: booking.id,
        type: 'instant_booking',
        masterId: booking.masterId,
        serviceId: booking.serviceId,
        scheduledDateTime: booking.scheduledDateTime
      }
    };
  }
}