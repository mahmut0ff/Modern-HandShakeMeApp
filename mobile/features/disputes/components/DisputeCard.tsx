import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface DisputeCardProps {
  id: number;
  projectTitle: string;
  reason: string;
  status: 'open' | 'in_mediation' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  initiatorName: string;
  respondentName: string;
  messagesCount: number;
  amountDisputed?: string;
  createdAt: string;
  onPress: () => void;
}

export const DisputeCard: React.FC<DisputeCardProps> = ({
  id,
  projectTitle,
  reason,
  status,
  priority,
  initiatorName,
  respondentName,
  messagesCount,
  amountDisputed,
  createdAt,
  onPress,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'resolved':
        return {
          bgColor: Colors.green[100],
          textColor: Colors.green[700],
          icon: 'checkmark-circle' as const,
          label: 'Resolved',
        };
      case 'in_mediation':
        return {
          bgColor: Colors.blue[100],
          textColor: Colors.blue[700],
          icon: 'people' as const,
          label: 'In Mediation',
        };
      case 'escalated':
        return {
          bgColor: Colors.red[100],
          textColor: Colors.red[700],
          icon: 'alert' as const,
          label: 'Escalated',
        };
      case 'closed':
        return {
          bgColor: Colors.gray[100],
          textColor: Colors.gray[700],
          icon: 'close-circle' as const,
          label: 'Closed',
        };
      default:
        return {
          bgColor: Colors.orange[100],
          textColor: Colors.orange[700],
          icon: 'time' as const,
          label: 'Open',
        };
    }
  };

  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return { color: Colors.red[600], label: 'Urgent' };
      case 'high':
        return { color: Colors.orange[600], label: 'High' };
      case 'medium':
        return { color: Colors.yellow[600], label: 'Medium' };
      default:
        return { color: Colors.gray[600], label: 'Low' };
    }
  };

  const getReasonLabel = (reason: string): string => {
    const labels: Record<string, string> = {
      quality: 'Quality Issue',
      payment: 'Payment Dispute',
      deadline: 'Deadline Issue',
      communication: 'Communication Problem',
      scope: 'Scope Disagreement',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const statusConfig = getStatusConfig();
  const priorityConfig = getPriorityConfig();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.id}>#{id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.textColor} />
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, { borderColor: priorityConfig.color }]}>
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.label}
          </Text>
        </View>
      </View>

      <Text style={styles.projectTitle} numberOfLines={1}>
        {projectTitle}
      </Text>

      <View style={styles.reasonContainer}>
        <Ionicons name="alert-circle-outline" size={16} color={Colors.gray[600]} />
        <Text style={styles.reasonText}>{getReasonLabel(reason)}</Text>
      </View>

      <View style={styles.participants}>
        <View style={styles.participant}>
          <Ionicons name="person" size={14} color={Colors.gray[600]} />
          <Text style={styles.participantText}>{initiatorName}</Text>
        </View>
        <Ionicons name="arrow-forward" size={14} color={Colors.gray[400]} />
        <View style={styles.participant}>
          <Ionicons name="person-outline" size={14} color={Colors.gray[600]} />
          <Text style={styles.participantText}>{respondentName}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {amountDisputed && (
            <View style={styles.amountContainer}>
              <Ionicons name="cash-outline" size={14} color={Colors.primary} />
              <Text style={styles.amountText}>${amountDisputed}</Text>
            </View>
          )}
          <View style={styles.messagesContainer}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.gray[600]} />
            <Text style={styles.messagesText}>{messagesCount}</Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  id: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  participantText: {
    fontSize: 12,
    color: Colors.gray[700],
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  messagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messagesText: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  date: {
    fontSize: 12,
    color: Colors.gray[500],
  },
});
