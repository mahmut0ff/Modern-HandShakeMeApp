import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProcessedFilePreviewProps {
  fileId: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  onDelete?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProcessedFilePreview: React.FC<ProcessedFilePreviewProps> = ({
  fileId,
  fileName,
  fileUrl,
  thumbnailUrl,
  fileType,
  fileSize,
  dimensions,
  onDelete,
  onDownload
}) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isDocument = fileType.startsWith('application/') || fileType.startsWith('text/');

  const renderPreview = () => {
    if (isImage && !imageError) {
      return (
        <TouchableOpacity onPress={() => setShowFullImage(true)}>
          <Image
            source={{ uri: thumbnailUrl || fileUrl }}
            style={styles.thumbnail}
            onError={() => setImageError(true)}
          />
        </TouchableOpacity>
      );
    }

    if (isVideo) {
      return (
        <View style={styles.iconContainer}>
          <MaterialIcons name="play-circle-outline" size={48} color="#3B82F6" />
        </View>
      );
    }

    if (isDocument) {
      return (
        <View style={styles.iconContainer}>
          <MaterialIcons name="description" size={48} color="#6B7280" />
        </View>
      );
    }

    return (
      <View style={styles.iconContainer}>
        <MaterialIcons name="insert-drive-file" size={48} color="#6B7280" />
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          {renderPreview()}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.fileName} numberOfLines={2}>
            {fileName}
          </Text>
          
          <View style={styles.metadataRow}>
            <MaterialIcons name="check-circle" size={14} color="#10B981" />
            <Text style={styles.metadataText}>Обработан</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>{formatFileSize(fileSize)}</Text>
            {dimensions && (
              <Text style={styles.detailText}>
                {dimensions.width}×{dimensions.height}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {onDownload && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDownload(fileId)}
            >
              <MaterialIcons name="download" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(fileId)}
            >
              <MaterialIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Full Image Modal */}
      <Modal
        visible={showFullImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFullImage(false)}
          >
            <Image
              source={{ uri: fileUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFullImage(false)}
            >
              <MaterialIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  previewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6'
  },
  thumbnail: {
    width: '100%',
    height: '100%'
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between'
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  metadataText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280'
  },
  actionsContainer: {
    justifyContent: 'center',
    gap: 8
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '80%'
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
