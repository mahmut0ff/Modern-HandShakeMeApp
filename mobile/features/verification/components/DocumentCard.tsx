import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface DocumentCardProps {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  required: boolean;
  icon: string;
  imageUrl?: string;
  rejectionReason?: string;
  onUpload: () => void;
  onDelete?: () => void;
  isUploading?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  title,
  description,
  status,
  required,
  icon,
  imageUrl,
  rejectionReason,
  onUpload,
  onDelete,
  isUploading = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          bgColor: Colors.green[100],
          iconColor: Colors.green[600],
          textColor: Colors.green[700],
          icon: 'checkmark-circle' as const,
          label: 'Approved',
        };
      case 'in_review':
        return {
          bgColor: Colors.orange[100],
          iconColor: Colors.orange[600],
          textColor: Colors.orange[700],
          icon: 'time' as const,
          label: 'Under Review',
        };
      case 'rejected':
        return {
          bgColor: Colors.red[100],
          iconColor: Colors.red[600],
          textColor: Colors.red[700],
          icon: 'close-circle' as const,
          label: 'Rejected',
        };
      default:
        return {
          bgColor: Colors.gray[100],
          iconColor: Colors.gray[600],
          textColor: Colors.gray[700],
          icon: 'ellipse-outline' as const,
          label: 'Pending',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Document',
        'Are you sure you want to delete this document?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: statusConfig.bgColor }]}>
          <Ionicons name={icon as any} size={24} color={statusConfig.iconColor} />
        </View>
        
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {status === 'rejected' && rejectionReason && (
        <View style={styles.rejectionContainer}>
          <Ionicons name="alert-circle" size={14} color={Colors.red[600]} />
          <Text style={styles.rejectionText}>
            Rejection reason: {rejectionReason}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Ionicons name={statusConfig.icon} size={14} color={statusConfig.iconColor} />
          <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>

        <View style={styles.actions}>
          {status !== 'approved' && (
            <TouchableOpacity
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={onUpload}
              disabled={isUploading}
            >
              <Text style={styles.uploadButtonText}>
                {isUploading ? 'Uploading...' : imageUrl ? 'Change' : 'Upload'}
              </Text>
            </TouchableOpacity>
          )}

          {onDelete && imageUrl && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash" size={14} color={Colors.red[600]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.red[100],
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.red[700],
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.red[50],
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.red[700],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.red[100],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 128,
  },
});
