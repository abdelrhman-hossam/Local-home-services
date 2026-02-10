import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(false);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await client.post('/auth/login', {
                email,
                password,
            });

            console.log('Login successful:', response.data);
            const token = response.data.token;
            const user = response.data.user;

            setUserInfo(user);
            setUserToken(token);

            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

        } catch (e) {
            console.log('Login error:', e);
            alert('Login Failed: ' + (e.response?.data?.message || 'Something went wrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setSplashLoading(true);
            let userToken = await SecureStore.getItemAsync('userToken');
            let userInfo = await SecureStore.getItemAsync('userInfo');

            if (userInfo) {
                userInfo = JSON.parse(userInfo);
                setUserInfo(userInfo);
            }

            if (userToken) {
                setUserToken(userToken);
            }

            setSplashLoading(false);
        } catch (e) {
            setSplashLoading(false);
            console.log('isLoggedIn error:', e);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                userToken,
                userInfo,
                splashLoading,
                login,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    );
};
