import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export interface Benefit {
  icon: string;
  text: string;
}

export interface VerificationBenefitsProps {
  benefits?: Benefit[];
}

const defaultBenefits: Benefit[] = [
  { icon: 'checkmark-circle', text: 'Increased client trust' },
  { icon: 'trending-up', text: 'Priority in search results' },
  { icon: 'star', text: 'Access to premium orders' },
  { icon: 'shield-checkmark', text: '"Verified Master" badge' },
  { icon: 'cash', text: 'Higher earning potential' },
  { icon: 'people', text: 'More client inquiries' },
];

export const VerificationBenefits: React.FC<VerificationBenefitsProps> = ({
  benefits = defaultBenefits,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Benefits</Text>
      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={benefit.icon as any} size={16} color={Colors.green[600]} />
            </View>
            <Text style={styles.benefitText}>{benefit.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.green[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[700],
  },
});
