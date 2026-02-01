// DynamoDB Key Patterns

export const Keys = {
  // User
  user: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROFILE',
  }),
  
  userByPhone: (phone: string) => ({
    GSI2PK: `PHONE#${phone}`,
    GSI2SK: 'USER',
  }),
  
  // Order
  order: (orderId: string) => ({
    PK: `ORDER#${orderId}`,
    SK: 'DETAILS',
  }),
  
  ordersByStatus: (status: string) => ({
    GSI2PK: `STATUS#${status}`,
  }),
  
  ordersByCategory: (categoryId: string) => ({
    GSI1PK: `CAT#${categoryId}`,
  }),
  
  // Application
  application: (orderId: string, applicationId: string) => ({
    PK: `ORDER#${orderId}`,
    SK: `APP#${applicationId}`,
  }),
  
  applicationsByMaster: (masterId: string) => ({
    PK: `USER#${masterId}`,
    SK: 'APP#',
  }),
  
  // Project
  project: (projectId: string) => ({
    PK: `PROJECT#${projectId}`,
    SK: 'DETAILS',
  }),
  
  projectsByUser: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROJECT#',
  }),
  
  // Review
  review: (userId: string, reviewId: string) => ({
    PK: `USER#${userId}`,
    SK: `REVIEW#${reviewId}`,
  }),
  
  // Chat
  chatRoom: (roomId: string) => ({
    PK: `ROOM#${roomId}`,
    SK: 'DETAILS',
  }),
  
  message: (roomId: string, messageId: string) => ({
    PK: `ROOM#${roomId}`,
    SK: `MSG#${messageId}`,
  }),
  
  // Disputes
  dispute: (disputeId: string) => ({
    PK: `DISPUTE#${disputeId}`,
    SK: 'DETAILS',
  }),
  
  disputesByUser: (userId: string) => ({
    GSI1PK: `USER#${userId}#DISPUTES`,
  }),
  
  disputesByOrder: (orderId: string) => ({
    GSI2PK: `ORDER#${orderId}#DISPUTES`,
  }),
  
  disputesByStatus: (status: string) => ({
    GSI3PK: `STATUS#${status}#DISPUTES`,
  }),
  
  disputeEvidence: (disputeId: string, evidenceId: string) => ({
    PK: `DISPUTE#${disputeId}`,
    SK: `EVIDENCE#${evidenceId}`,
  }),
  
  disputeMessage: (disputeId: string, timestamp: string, messageId: string) => ({
    PK: `DISPUTE#${disputeId}`,
    SK: `MESSAGE#${timestamp}#${messageId}`,
  }),
  
  disputeTimeline: (disputeId: string, timestamp: string, timelineId: string) => ({
    PK: `DISPUTE#${disputeId}`,
    SK: `TIMELINE#${timestamp}#${timelineId}`,
  }),
  
  // Notification
  notification: (userId: string, notificationId: string) => ({
    PK: `USER#${userId}`,
    SK: `NOTIF#${notificationId}`,
  }),
  
  // Transaction
  transaction: (userId: string, transactionId: string) => ({
    PK: `USER#${userId}`,
    SK: `TXN#${transactionId}`,
  }),
  
  // Wallet
  wallet: (walletId: string) => ({
    PK: `WALLET#${walletId}`,
    SK: 'DETAILS',
  }),
  
  // Verification
  verification: (verificationId: string) => ({
    PK: `VERIFICATION#${verificationId}`,
    SK: 'DETAILS',
  }),
  
  verificationByUser: (userId: string) => ({
    GSI1PK: `USER#${userId}`,
    GSI1SK: 'VERIFICATION',
  }),
  
  // Service
  service: (serviceId: string) => ({
    PK: `SERVICE#${serviceId}`,
    SK: 'DETAILS',
  }),
  
  servicesByMaster: (masterId: string) => ({
    PK: `USER#${masterId}`,
    SK: 'SERVICE#',
  }),
  
  // Booking
  booking: (bookingId: string) => ({
    PK: `BOOKING#${bookingId}`,
    SK: 'DETAILS',
  }),
  
  bookingsByMaster: (masterId: string) => ({
    GSI1PK: `MASTER#${masterId}#BOOKINGS`,
  }),
  
  bookingsByClient: (clientId: string) => ({
    GSI2PK: `CLIENT#${clientId}#BOOKINGS`,
  }),
  
  // Portfolio
  portfolio: (masterId: string, itemId: string) => ({
    PK: `USER#${masterId}`,
    SK: `PORTFOLIO#${itemId}`,
  }),
  
  // Telegram Auth Session
  telegramSession: (sessionId: string) => ({
    PK: `TELEGRAM_SESSION#${sessionId}`,
    SK: 'DETAILS',
  }),
  
  // Token Blacklist
  tokenBlacklist: (token: string) => ({
    PK: `TOKEN_BLACKLIST#${token}`,
    SK: 'DETAILS',
  }),

  // Payment Cards
  paymentCard: (userId: string, cardId: string) => ({
    PK: `USER#${userId}`,
    SK: `CARD#${cardId}`,
  }),

  // Time Tracking
  timeSession: (sessionId: string) => ({
    PK: `SESSION#${sessionId}`,
    SK: 'DETAILS',
  }),

  timeSessionsByMaster: (masterId: string) => ({
    GSI1PK: `MASTER#${masterId}`,
  }),

  timeEntry: (sessionId: string, timestamp: string, entryId: string) => ({
    PK: `SESSION#${sessionId}`,
    SK: `ENTRY#${timestamp}#${entryId}`,
  }),
};
