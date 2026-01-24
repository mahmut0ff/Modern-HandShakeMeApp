import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface ReviewResponseProps {
  response: {
    id: number;
    text: string;
    createdAt: string;
  };
  masterName: string;
}

export const ReviewResponse: React.FC<ReviewResponseProps> = ({
  response,
  masterName,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubble" size={16} color={Colors.primary} />
        <Text style={styles.headerText}>Response from {masterName}</Text>
      </View>
      <Text style={styles.responseText}>{response.text}</Text>
      <Text style={styles.date}>{formatDate(response.createdAt)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark,
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: Colors.gray[600],
  },
});
