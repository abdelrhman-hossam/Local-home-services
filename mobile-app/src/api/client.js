import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your actual backend URL (for Android Emulator use 10.0.2.2, for physical device use your IP)
const BASE_URL = 'http://192.168.1.108:5000/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default client;
