import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, List, Divider, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const ProfileScreen = ({ navigation }) => {
    const { logout, userInfo, userToken } = useContext(AuthContext);
    const theme = useTheme();

    if (!userToken) {
        return (
            <View style={styles.container}>
                <Header title="Profile" />
                <View style={[styles.container, { justifyContent: 'center', padding: 30 }]}>
                    <Avatar.Icon size={100} icon="account-circle-outline" style={{ alignSelf: 'center', marginBottom: 20, backgroundColor: 'transparent' }} color={theme.colors.primary} />
                    <Text variant="headlineMedium" style={{ textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>Welcome!</Text>
                    <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 40, color: 'gray' }}>
                        Log in to manage your bookings and profile.
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('Login')}
                        style={{ marginBottom: 15, borderRadius: 30, paddingVertical: 5 }}
                    >
                        Login
                    </Button>
                    {/* Add register navigation if available */}
                    <Button
                        mode="outlined"
                        onPress={() => navigation.navigate('Login')}
                        style={{ borderRadius: 30, paddingVertical: 5, borderColor: theme.colors.primary }}
                    >
                        Create Account
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Profile" />

            <View style={styles.profileHeader}>
                <Avatar.Text size={80} label={userInfo?.username?.charAt(0).toUpperCase() || 'U'} style={{ backgroundColor: theme.colors.primary }} />
                <Text variant="headlineSmall" style={styles.name}>{userInfo?.username || 'User'}</Text>
                <Text variant="bodyMedium" style={styles.email}>{userInfo?.email || 'email@example.com'}</Text>
            </View>

            <View style={styles.section}>
                <List.Section>
                    <List.Subheader>Settings</List.Subheader>
                    <List.Item
                        title="Edit Profile"
                        left={() => <List.Icon icon="account-edit" />}
                        onPress={() => { }}
                    />
                    <Divider />
                    <List.Item
                        title="Notifications"
                        left={() => <List.Icon icon="bell" />}
                        onPress={() => { }}
                    />
                    <Divider />
                    <List.Item
                        title="Help & Support"
                        left={() => <List.Icon icon="help-circle" />}
                        onPress={() => { }}
                    />
                </List.Section>

                <Button
                    mode="contained"
                    onPress={logout}
                    style={styles.logoutButton}
                    buttonColor={theme.colors.error}
                >
                    Logout
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    profileHeader: { alignItems: 'center', padding: 30, backgroundColor: 'white' },
    name: { marginTop: 10, fontWeight: 'bold' },
    email: { color: 'gray' },
    section: { marginTop: 20, backgroundColor: 'white', flex: 1 },
    logoutButton: { margin: 20 },
});

export default ProfileScreen;
