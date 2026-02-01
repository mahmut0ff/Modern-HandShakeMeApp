import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { VerificationStatusCard } from '../components/VerificationStatusCard';
import { VerificationProgress } from '../components/VerificationProgress';
import { VerificationBenefits } from '../components/VerificationBenefits';

export const VerificationScreen: React.FC = () => {
    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-900 mb-6">Верификация аккаунта</Text>

                <VerificationStatusCard
                    status="in_review"
                    approvedCount={1}
                    totalCount={3}
                />

                <View className="mt-6">
                    <VerificationProgress completed={1} total={3} />
                </View>

                <View className="mt-8">
                    <VerificationBenefits />
                </View>
            </View>
        </ScrollView>
    );
};
