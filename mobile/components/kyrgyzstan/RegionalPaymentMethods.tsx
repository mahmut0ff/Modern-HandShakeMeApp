import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type PaymentMethodType = 'cash' | 'card' | 'o_money' | 'mega_pay' | 'usdt' | 'bank_transfer';

interface RegionalPaymentMethodsProps {
  selectedMethod?: PaymentMethodType;
  onMethodSelect: (method: PaymentMethodType, details?: any) => void;
  showDetails?: boolean;
}

export const RegionalPaymentMethods: React.FC<RegionalPaymentMethodsProps> = ({
  selectedMethod,
  onMethodSelect,
  showDetails = false,
}) => {
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethodType | null>(null);
  const [methodDetails, setMethodDetails] = useState<Record<string, any>>({});

  const paymentMethods = [
    {
      type: 'cash' as PaymentMethodType,
      name: 'Наличные',
      description: 'Оплата при встрече',
      icon: 'payments',
      color: '#10B981',
      popular: true,
      requiresDetails: false,
    },
    {
      type: 'o_money' as PaymentMethodType,
      name: 'O!Money',
      description: 'Beeline мобильные платежи',
      icon: 'phone-android',
      color: '#FF6B00',
      popular: true,
      requiresDetails: true,
    },
    {
      type: 'mega_pay' as PaymentMethodType,
      name: 'MegaPay',
      description: 'MegaCom мобильные платежи',
      icon: 'phone-iphone',
      color: '#9333EA',
      popular: true,
      requiresDetails: true,
    },
    {
      type: 'card' as PaymentMethodType,
      name: 'Банковская карта',
      description: 'Visa, MasterCard, Элкарт',
      icon: 'credit-card',
      color: '#3B82F6',
      popular: false,
      requiresDetails: true,
    },
    {
      type: 'usdt' as PaymentMethodType,
      name: 'USDT (Crypto)',
      description: 'Tether TRC20/ERC20',
      icon: 'currency-bitcoin',
      color: '#26A17B',
      popular: false,
      requiresDetails: true,
    },
    {
      type: 'bank_transfer' as PaymentMethodType,
      name: 'Банковский перевод',
      description: 'Перевод через банк',
      icon: 'account-balance',
      color: '#6366F1',
      popular: false,
      requiresDetails: true,
    },
  ];

  const handleMethodPress = (method: typeof paymentMethods[0]) => {
    if (method.requiresDetails && showDetails) {
      setExpandedMethod(expandedMethod === method.type ? null : method.type);
    } else {
      onMethodSelect(method.type);
    }
  };

  const handleConfirmDetails = (type: PaymentMethodType) => {
    const details = methodDetails[type];
    
    if (type === 'o_money' || type === 'mega_pay') {
      if (!details?.phoneNumber || !/^\+996[0-9]{9}$/.test(details.phoneNumber)) {
        Alert.alert('Ошибка', 'Введите корректный номер телефона (+996XXXXXXXXX)');
        return;
      }
    }

    onMethodSelect(type, details);
    setExpandedMethod(null);
  };

  const updateMethodDetails = (type: PaymentMethodType, field: string, value: string) => {
    setMethodDetails((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const renderMethodDetails = (method: typeof paymentMethods[0]) => {
    if (expandedMethod !== method.type) return null;

    return (
      <View style={styles.detailsContainer}>
        {(method.type === 'o_money' || method.type === 'mega_pay') && (
          <>
            <Text style={styles.detailsLabel}>Номер телефона</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="+996 XXX XXX XXX"
              keyboardType="phone-pad"
              value={methodDetails[method.type]?.phoneNumber || ''}
              onChangeText={(value) => updateMethodDetails(method.type, 'phoneNumber', value)}
              maxLength={13}
            />
          </>
        )}

        {method.type === 'usdt' && (
          <>
            <Text style={styles.detailsLabel}>Адрес кошелька</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="0x..."
              value={methodDetails[method.type]?.walletAddress || ''}
              onChangeText={(value) => updateMethodDetails(method.type, 'walletAddress', value)}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirmDetails(method.type)}
        >
          <Text style={styles.confirmButtonText}>Подтвердить</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="payment" size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Способы оплаты</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Популярные</Text>
        {paymentMethods.filter((m) => m.popular).map((method) => (
          <View key={method.type}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === method.type && styles.methodCardSelected,
              ]}
              onPress={() => handleMethodPress(method)}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                <MaterialIcons name={method.icon as any} size={24} color={method.color} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              {selectedMethod === method.type && (
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
              )}
            </TouchableOpacity>
            {renderMethodDetails(method)}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Другие способы</Text>
        {paymentMethods.filter((m) => !m.popular).map((method) => (
          <View key={method.type}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === method.type && styles.methodCardSelected,
              ]}
              onPress={() => handleMethodPress(method)}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                <MaterialIcons name={method.icon as any} size={24} color={method.color} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              {selectedMethod === method.type && (
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
              )}
            </TouchableOpacity>
            {renderMethodDetails(method)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  section: { backgroundColor: '#FFF', marginBottom: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  methodIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodName: { fontSize: 15, fontWeight: '500', color: '#111827' },
  methodDescription: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  detailsContainer: { padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 8 },
  detailsLabel: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 8 },
  detailsInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
