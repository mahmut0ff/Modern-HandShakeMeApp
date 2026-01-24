import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface DisputeMessage {
  id: number;
  senderName: string;
  senderRole: 'client' | 'master' | 'mediator' | 'admin';
  message: string;
  messageType: 'text' | 'system' | 'resolution';
  isInternal: boolean;
  createdAt: string;
  isCurrentUser: boolean;
}

export interface DisputeMessagesProps {
  messages: DisputeMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export const DisputeMessages: React.FC<DisputeMessagesProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
}) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim().length === 0) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'mediator':
        return Colors.blue[600];
      case 'admin':
        return Colors.purple[600];
      default:
        return Colors.gray[600];
    }
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'mediator':
        return 'Mediator';
      case 'admin':
        return 'Admin';
      case 'master':
        return 'Master';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  const renderMessage = ({ item }: { item: DisputeMessage }) => {
    if (item.messageType === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Ionicons name="information-circle" size={16} color={Colors.gray[600]} />
          <Text style={styles.systemMessageText}>{item.message}</Text>
        </View>
      );
    }

    if (item.messageType === 'resolution') {
      return (
        <View style={styles.resolutionMessage}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.green[600]} />
          <View style={styles.resolutionContent}>
            <Text style={styles.resolutionTitle}>Resolution Proposed</Text>
            <Text style={styles.resolutionText}>{item.message}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}
      >
        {!item.isCurrentUser && (
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>{item.senderName}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.senderRole) }]}>
              <Text style={styles.roleText}>{getRoleLabel(item.senderRole)}</Text>
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            item.isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isCurrentUser && styles.messageTextRight,
            ]}
          >
            {item.message}
          </Text>
        </View>
        <Text
          style={[
            styles.messageTime,
            item.isCurrentUser && styles.messageTimeRight,
          ]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        inverted
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={Colors.gray[400]}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() ? Colors.white : Colors.gray[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageContainerRight: {
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleLeft: {
    backgroundColor: Colors.gray[100],
    borderTopLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.dark,
  },
  messageTextRight: {
    color: Colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 4,
  },
  messageTimeRight: {
    textAlign: 'right',
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  systemMessageText: {
    fontSize: 13,
    color: Colors.gray[600],
    fontStyle: 'italic',
  },
  resolutionMessage: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.green[50],
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.green[500],
    marginBottom: 16,
  },
  resolutionContent: {
    flex: 1,
  },
  resolutionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.green[700],
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 14,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.dark,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray[200],
  },
});
