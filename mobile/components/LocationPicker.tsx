import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface LocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (location: { address: string; coordinates: { latitude: number; longitude: number } }) => void;
    initialLocation?: { address: string; latitude: number; longitude: number };
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    visible,
    onClose,
    onSelect,
    initialLocation,
}) => {
    const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');

    // Mock suggestions for development
    const suggestions = [
        { id: '1', address: 'Бишкек, пр. Чуй 123', lat: 42.87, lng: 74.59 },
        { id: '2', address: 'Бишкек, ул. Киевская 45', lat: 42.87, lng: 74.60 },
        { id: '3', address: 'Ош, ул. Ленина 12', lat: 40.51, lng: 72.80 },
    ];

    const handleSelect = (item: any) => {
        onSelect({
            address: item.address,
            coordinates: { latitude: item.lat, longitude: item.lng }
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
                    <Text className="text-xl font-bold">Выберите адрес</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="#000" />
                    </TouchableOpacity>
                </View>

                <View className="p-4 bg-white">
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <Ionicons name="search" size={20} color="#6B7280" />
                        <TextInput
                            className="ml-2 flex-1"
                            placeholder="Поиск адреса..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <FlatList
                    data={suggestions.filter(s => s.address.toLowerCase().includes(searchQuery.toLowerCase()))}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-gray-100 bg-white"
                            onPress={() => handleSelect(item)}
                        >
                            <Ionicons name="location-sharp" size={24} color="#3B82F6" />
                            <Text className="ml-3 text-gray-900">{item.address}</Text>
                        </TouchableOpacity>
                    )}
                    ListHeaderComponent={<Text className="p-4 text-xs font-bold text-gray-500 uppercase">Рекомендуемые адреса</Text>}
                />
            </SafeAreaView>
        </Modal>
    );
};
