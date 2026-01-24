import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface VerificationStatusCardProps {
  status: 'unverified' | 'partial' | 'in_review' | 'verified' | 'rejected';
  approvedCount: number;
  totalCount: number;
  verificationLevel?: 'basic' | 'standard' | 'premium';
}

export const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  status,
  approvedCount,
  totalCount,
  verificationLevel = 'basic',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          bgColor: Colors.green[500],
          icon: 'shield-checkmark' as const,
          title: 'Verified',
          description: 'Your account is fully verified',
        };
      case 'in_review':
        return {
          bgColor: Colors.orange[500],
          icon: 'shield-half' as const,
          title: 'Under Review',
          description: 'Documents are being reviewed',
        };
      case 'rejected':
        return {
          bgColor: Colors.red[500],
          icon: 'shield' as const,
          title: 'Verification Failed',
          description: 'Some documents were rejected',
        };
      case 'partial':
        return {
          bgColor: Colors.blue[500],
          icon: 'shield-half' as const,
          title: 'Partially Verified',
          description: 'Complete all steps for full verification',
        };
      default:
        return {
          bgColor: Colors.primary,
          icon: 'shield' as const,
          title: 'Verification Required',
          description: 'Complete verification to build trust',
        };
    }
  };

  const config = getStatusConfig();

  const getLevelBadge = () => {
    const levels = {
      basic: { label: 'Basic', color: Colors.gray[600] },
      standard: { label: 'Standard', color: Colors.blue[600] },
      premium: { label: 'Premium', color: Colors.yellow[600] },
    };
    return levels[verificationLevel];
  };

  const levelBadge = getLevelBadge();

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={32} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{config.title}</Text>
            {status === 'verified' && (
              <View style={[styles.levelBadge, { backgroundColor: levelBadge.color }]}>
                <Text style={styles.levelText}>{levelBadge.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{config.description}</Text>
          <Text style={styles.progress}>
            Documents: {approvedCount}/{totalCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  progress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
