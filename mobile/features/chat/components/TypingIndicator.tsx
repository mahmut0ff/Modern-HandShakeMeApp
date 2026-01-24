import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

interface TypingIndicatorProps {
  users: Array<{ id: number; first_name: string; last_name: string }>;
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (users.length === 0) return;

    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      createAnimation(dot1, 0),
      createAnimation(dot2, 150),
      createAnimation(dot3, 300),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [users.length]);

  if (users.length === 0) return null;

  const userName = users.length === 1
    ? users[0].first_name
    : users.length === 2
    ? `${users[0].first_name} и ${users[1].first_name}`
    : `${users[0].first_name} и еще ${users.length - 1}`;

  return (
    <View className="flex-row items-center px-4 py-2">
      <View className="w-8 h-8 mr-2" />
      <View className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm text-gray-600 mr-2">{userName} печатает</Text>
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#9CA3AF',
              opacity: dot1,
            }}
          />
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#9CA3AF',
              opacity: dot2,
            }}
          />
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#9CA3AF',
              opacity: dot3,
            }}
          />
        </View>
      </View>
    </View>
  );
}
