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
  
  // Service
  service: (masterId: string, serviceId: string) => ({
    PK: `USER#${masterId}`,
    SK: `SERVICE#${serviceId}`,
  }),
  
  // Portfolio
  portfolio: (masterId: string, itemId: string) => ({
    PK: `USER#${masterId}`,
    SK: `PORTFOLIO#${itemId}`,
  }),
};
