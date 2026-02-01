import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGetPaymentMethodsQuery } from '../../services/walletApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface PaymentMethodSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    selectedId?: string | number;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    visible,
    onClose,
    onSelect,
    selectedId,
}) => {
    const { data: paymentMethods, isLoading } = useGetPaymentMethodsQuery();

    const renderItem = ({ item }: { item: any }) => {
        const isSelected = String(item.id) === String(selectedId);

        return (
            <TouchableOpacity
                className={`flex-row items-center p-4 m-2 rounded-lg border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                onPress={() => onSelect(String(item.id))}
            >
                <Ionicons
                    name={item.method_type === 'card' ? 'card-outline' : 'cash-outline'}
                    size={24}
                    color={isSelected ? '#3B82F6' : '#6B7280'}
                />
                <View className="ml-3 flex-1">
                    <Text className={`text-base font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        {item.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                        {item.provider} {item.details.last4 ? `**** ${item.details.last4}` : ''}
                    </Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />}
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
                    <Text className="text-xl font-bold">Выберите способ оплаты</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="#000" />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <FlatList
                        data={paymentMethods}
                        renderItem={renderItem}
                        keyExtractor={(item) => String(item.id)}
                        ListEmptyComponent={
                            <View className="p-8 items-center">
                                <Text className="text-gray-500 text-center">У вас нет сохраненных способов оплаты</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
};
