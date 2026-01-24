import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface DisputeDetailsProps {
  reason: string;
  description: string;
  status: string;
  priority: string;
  amountDisputed?: string;
  amountResolved?: string;
  resolution?: string;
  resolutionType?: string;
  createdAt: string;
  resolvedAt?: string;
}

export const DisputeDetails: React.FC<DisputeDetailsProps> = ({
  reason,
  description,
  status,
  priority,
  amountDisputed,
  amountResolved,
  resolution,
  resolutionType,
  createdAt,
  resolvedAt,
}) => {
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

  const getResolutionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      refund: 'Full Refund',
      partial_refund: 'Partial Refund',
      redo_work: 'Redo Work',
      compensation: 'Compensation',
      no_action: 'No Action',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispute Reason</Text>
        <View style={styles.reasonContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.primary} />
          <Text style={styles.reasonText}>{getReasonLabel(reason)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {amountDisputed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount Disputed</Text>
          <View style={styles.amountContainer}>
            <Ionicons name="cash" size={20} color={Colors.primary} />
            <Text style={styles.amountText}>${amountDisputed}</Text>
          </View>
        </View>
      )}

      {resolution && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolution</Text>
          <View style={styles.resolutionBox}>
            <View style={styles.resolutionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.green[600]} />
              {resolutionType && (
                <Text style={styles.resolutionType}>
                  {getResolutionTypeLabel(resolutionType)}
                </Text>
              )}
            </View>
            <Text style={styles.resolutionText}>{resolution}</Text>
            {amountResolved && (
              <View style={styles.resolvedAmountContainer}>
                <Text style={styles.resolvedAmountLabel}>Resolved Amount:</Text>
                <Text style={styles.resolvedAmountValue}>${amountResolved}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Created</Text>
              <Text style={styles.timelineDate}>{formatDate(createdAt)}</Text>
            </View>
          </View>
          {resolvedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotResolved]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Resolved</Text>
                <Text style={styles.timelineDate}>{formatDate(resolvedAt)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.blue[50],
    padding: 16,
    borderRadius: 12,
  },
  reasonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.gray[700],
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.blue[50],
    padding: 16,
    borderRadius: 12,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  resolutionBox: {
    backgroundColor: Colors.green[50],
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.green[500],
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resolutionType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.green[700],
  },
  resolutionText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.gray[700],
    marginBottom: 12,
  },
  resolvedAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.green[200],
  },
  resolvedAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  resolvedAmountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.green[600],
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  timelineDotResolved: {
    backgroundColor: Colors.green[500],
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    color: Colors.gray[600],
  },
});
