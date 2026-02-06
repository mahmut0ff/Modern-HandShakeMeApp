export type NotificationType =
  | 'order_created'
  | 'order_updated'
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'project_started'
  | 'project_completed'
  | 'project_cancelled'
  | 'payment_received'
  | 'payment_sent'
  | 'review_received'
  | 'message_received'
  | 'system'
  | 'promotion';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationFiltersState {
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_created: 'Новый заказ',
  order_updated: 'Обновление заказа',
  application_received: 'Новая заявка',
  application_accepted: 'Заявка принята',
  application_rejected: 'Заявка отклонена',
  project_started: 'Проект начат',
  project_completed: 'Проект завершен',
  project_cancelled: 'Проект отменен',
  payment_received: 'Платеж получен',
  payment_sent: 'Платеж отправлен',
  review_received: 'Новый отзыв',
  message_received: 'Новое сообщение',
  system: 'Системное',
  promotion: 'Акция',
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Низкий',
  normal: 'Обычный',
  high: 'Высокий',
  urgent: 'Срочный',
};
