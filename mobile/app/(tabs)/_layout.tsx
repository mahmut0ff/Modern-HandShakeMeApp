import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();

  const activeColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="responses"
        options={{
          title: 'Responses',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="list" color={color} />,
          href: role === 'MASTER' ? '/responses' : null,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="search" color={color} />,
          href: role === 'MASTER' ? '/jobs' : null,
        }}
      />

      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="briefcase" color={color} />,
          href: role === 'CLIENT' ? '/my-jobs' : null,
        }}
      />
      <Tabs.Screen
        name="masters"
        options={{
          title: 'Masters',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="people" color={color} />,
          href: role === 'CLIENT' ? '/masters' : null,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="chatbubbles" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />

      {/* Hide the default explore screen if it still exists in the file system */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
