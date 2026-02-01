import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface DistanceFilterProps {
  value: number;
  onChange: (value: number) => void;
  options: number[];
}

export const DistanceFilter: React.FC<DistanceFilterProps> = ({ value, onChange, options }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="tune" size={18} color="#6B7280" />
        <Text style={styles.label}>Радиус поиска</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.option, value === option && styles.optionActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.optionText, value === option && styles.optionTextActive]}>
              {option} км
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#3B82F6',
  },
});
