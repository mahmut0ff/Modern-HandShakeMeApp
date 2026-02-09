import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Request with token:', config.method?.toUpperCase(), config.url);
        } else {
            console.warn('No access token found for request:', config.method?.toUpperCase(), config.url);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        // Automatically unwrap the 'data' field from our standardized API response
        if (response.data && response.data.success === true && response.data.data) {
            return {
                ...response,
                data: response.data.data,
            };
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    // The refresh endpoint uses the same standardized format
                    const { access, refresh } = response.data.data;

                    await SecureStore.setItemAsync('accessToken', access);
                    await SecureStore.setItemAsync('refreshToken', refresh);
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Handle logout or redirect to login
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
