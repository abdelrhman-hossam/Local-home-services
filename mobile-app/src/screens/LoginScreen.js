import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, useTheme } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useContext(AuthContext);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        await login(email, password);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>

                <Animated.View entering={FadeInUp.delay(200).duration(1000)}>
                    <Text variant="displayMedium" style={[styles.title, { color: theme.colors.primary }]}>
                        Welcome Back
                    </Text>
                    <Text variant="bodyLarge" style={styles.subtitle}>
                        Sign in to continue
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(1000)} style={styles.form}>
                    <Surface style={styles.card} elevation={2}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="email" />}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            left={<TextInput.Icon icon="lock" />}
                            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                        />
                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            Login
                        </Button>
                    </Surface>
                </Animated.View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.7,
    },
    form: {
        width: '100%',
    },
    card: {
        padding: 20,
        borderRadius: 15,
        backgroundColor: 'white',
    },
    input: {
        marginBottom: 20,
        backgroundColor: 'white',
    },
    button: {
        marginTop: 10,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
});

export default LoginScreen;
