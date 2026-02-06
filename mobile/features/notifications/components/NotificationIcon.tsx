import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationType } from '../types';

interface NotificationIconProps {
  type: NotificationType;
  size?: number;
}

const ICON_CONFIG: Record<NotificationType, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  order_created: { name: 'document-text', color: '#3B82F6', bg: 'bg-blue-100' },
  order_updated: { name: 'create', color: '#8B5CF6', bg: 'bg-purple-100' },
  application_received: { name: 'mail', color: '#10B981', bg: 'bg-green-100' },
  application_accepted: { name: 'checkmark-circle', color: '#10B981', bg: 'bg-green-100' },
  application_rejected: { name: 'close-circle', color: '#EF4444', bg: 'bg-red-100' },
  project_started: { name: 'play-circle', color: '#3B82F6', bg: 'bg-blue-100' },
  project_completed: { name: 'trophy', color: '#F59E0B', bg: 'bg-yellow-100' },
  project_cancelled: { name: 'ban', color: '#EF4444', bg: 'bg-red-100' },
  payment_received: { name: 'wallet', color: '#10B981', bg: 'bg-green-100' },
  payment_sent: { name: 'arrow-up-circle', color: '#F59E0B', bg: 'bg-yellow-100' },
  review_received: { name: 'star', color: '#F59E0B', bg: 'bg-yellow-100' },
  message_received: { name: 'chatbubble', color: '#3B82F6', bg: 'bg-blue-100' },
  system: { name: 'information-circle', color: '#6B7280', bg: 'bg-gray-100' },
  promotion: { name: 'gift', color: '#EC4899', bg: 'bg-pink-100' },
};

export function NotificationIcon({ type, size = 24 }: NotificationIconProps) {
  const config = ICON_CONFIG[type] || ICON_CONFIG.system;

  return (
    <View className={`w-10 h-10 rounded-full items-center justify-center ${config.bg}`}>
      <Ionicons name={config.name} size={size} color={config.color} />
    </View>
  );
}
