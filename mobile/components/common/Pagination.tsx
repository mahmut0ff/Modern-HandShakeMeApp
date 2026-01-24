import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}) => {
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canGoPrev && styles.buttonDisabled]}
        onPress={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev || loading}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={canGoPrev ? '#007AFF' : '#CCC'}
        />
      </TouchableOpacity>

      <View style={styles.pages}>
        {getPageNumbers().map((page, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageButton,
              page === currentPage && styles.pageButtonActive,
            ]}
            onPress={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page !== 'number' || loading}
          >
            <Text
              style={[
                styles.pageText,
                page === currentPage && styles.pageTextActive,
              ]}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !canGoNext && styles.buttonDisabled]}
        onPress={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || loading}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={canGoNext ? '#007AFF' : '#CCC'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  button: {
    padding: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pages: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  pageButtonActive: {
    backgroundColor: '#007AFF',
  },
  pageText: {
    fontSize: 14,
    color: '#666',
  },
  pageTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
