import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi, AuthResponse } from '../api/auth';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    signIn: (authData: AuthResponse) => Promise<void>;
    signOut: () => Promise<void>;
    switchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        loadStorageData();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to the sign-in page if user is not signed in
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // Redirect away from the sign-in page if user is signed in
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    async function loadStorageData() {
        try {
            const authDataString = await SecureStore.getItemAsync('userData');
            if (authDataString) {
                setUser(JSON.parse(authDataString));
            }
        } catch (e) {
            console.error('Failed to load auth data', e);
        } finally {
            setIsLoading(false);
        }
    }

    const signIn = async (authData: AuthResponse) => {
        await SecureStore.setItemAsync('accessToken', authData.tokens.access);
        await SecureStore.setItemAsync('refreshToken', authData.tokens.refresh);
        await SecureStore.setItemAsync('userData', JSON.stringify(authData.user));
        setUser(authData.user);
    };

    const signOut = async () => {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
            try {
                await authApi.logout(refreshToken);
            } catch (e) {
                console.error('Logout failed', e);
            }
        }
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userData');
        setUser(null);
    };

    const switchRole = async () => {
        try {
            const response = await authApi.switchRole();
            const { tokens, user: newUser } = response.data;

            await SecureStore.setItemAsync('accessToken', tokens.access);
            await SecureStore.setItemAsync('refreshToken', tokens.refresh);
            await SecureStore.setItemAsync('userData', JSON.stringify(newUser));

            setUser(newUser);
        } catch (e) {
            console.error('Failed to switch role', e);
            throw e;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signOut, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
