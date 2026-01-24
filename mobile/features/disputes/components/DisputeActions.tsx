import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface DisputeActionsProps {
  status: 'open' | 'in_mediation' | 'resolved' | 'closed' | 'escalated';
  isInitiator: boolean;
  hasResolution: boolean;
  onRequestMediation?: () => void;
  onAcceptResolution?: () => void;
  onRejectResolution?: () => void;
  onEscalate?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export const DisputeActions: React.FC<DisputeActionsProps> = ({
  status,
  isInitiator,
  hasResolution,
  onRequestMediation,
  onAcceptResolution,
  onRejectResolution,
  onEscalate,
  onClose,
  isLoading = false,
}) => {
  const handleRequestMediation = () => {
    Alert.alert(
      'Request Mediation',
      'A mediator will be assigned to help resolve this dispute. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: onRequestMediation },
      ]
    );
  };

  const handleAcceptResolution = () => {
    Alert.alert(
      'Accept Resolution',
      'Are you sure you want to accept this resolution? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: onAcceptResolution },
      ]
    );
  };

  const handleRejectResolution = () => {
    Alert.prompt(
      'Reject Resolution',
      'Please provide a reason for rejecting this resolution:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: (reason) => {
            if (reason && reason.trim().length > 0 && onRejectResolution) {
              onRejectResolution();
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleEscalate = () => {
    Alert.prompt(
      'Escalate Dispute',
      'Please provide a reason for escalating this dispute:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          onPress: (reason) => {
            if (reason && reason.trim().length > 0 && onEscalate) {
              onEscalate();
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Close Dispute',
      'Are you sure you want to close this dispute? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', style: 'destructive', onPress: onClose },
      ]
    );
  };

  // Show resolution actions if there's a resolution
  if (hasResolution && status === 'in_mediation') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Resolution Proposed</Text>
        <Text style={styles.subtitle}>
          A resolution has been proposed. Please review and respond.
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleRejectResolution}
            disabled={isLoading}
          >
            <Ionicons name="close-circle" size={20} color={Colors.red[600]} />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleAcceptResolution}
            disabled={isLoading}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show mediation request for open disputes
  if (status === 'open' && onRequestMediation) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Need Help?</Text>
        <Text style={styles.subtitle}>
          If you can't resolve this dispute directly, you can request mediation.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.mediationButton]}
          onPress={handleRequestMediation}
          disabled={isLoading}
        >
          <Ionicons name="people" size={20} color={Colors.white} />
          <Text style={styles.mediationButtonText}>Request Mediation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show escalation option for disputes in mediation
  if (status === 'in_mediation' && !hasResolution && onEscalate) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Not Satisfied?</Text>
        <Text style={styles.subtitle}>
          If mediation isn't working, you can escalate this dispute to administration.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.escalateButton]}
          onPress={handleEscalate}
          disabled={isLoading}
        >
          <Ionicons name="alert" size={20} color={Colors.white} />
          <Text style={styles.escalateButtonText}>Escalate Dispute</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show close option for resolved disputes
  if (status === 'resolved' && isInitiator && onClose) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dispute Resolved</Text>
        <Text style={styles.subtitle}>
          This dispute has been resolved. You can close it if you're satisfied.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={handleClose}
          disabled={isLoading}
        >
          <Ionicons name="checkmark-done" size={20} color={Colors.white} />
          <Text style={styles.closeButtonText}>Close Dispute</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButton: {
    backgroundColor: Colors.green[500],
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  rejectButton: {
    backgroundColor: Colors.red[50],
    borderWidth: 1,
    borderColor: Colors.red[200],
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.red[600],
  },
  mediationButton: {
    backgroundColor: Colors.blue[500],
  },
  mediationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  escalateButton: {
    backgroundColor: Colors.orange[500],
  },
  escalateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  closeButton: {
    backgroundColor: Colors.gray[700],
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
