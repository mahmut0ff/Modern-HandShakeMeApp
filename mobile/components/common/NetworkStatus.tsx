import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

interface NetworkStatusProps {
  onRetry?: () => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onRetry }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [networkType, setNetworkType] = useState<string>('');
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setNetworkType(state.type);
      
      if (state.isConnected === false) {
        // Show offline banner
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (state.isConnected === true) {
        // Hide offline banner
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => unsubscribe();
  }, [slideAnim]);

  if (isConnected === null || isConnected === true) {
    return null;
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      className="bg-red-500 px-4 py-3 shadow-lg"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="wifi-outline" size={20} color="white" />
          <Text className="text-white font-medium ml-2 flex-1">
            Нет подключения к интернету
          </Text>
        </View>
        
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            className="bg-white/20 px-3 py-1 rounded-full"
          >
            <Text className="text-white text-sm font-medium">
              Повторить
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default NetworkStatus;