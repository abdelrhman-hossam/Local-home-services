import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
import { theme } from '../theme';

const Header = ({ title, showAvatar = false, userInitials = 'U' }) => {
    return (
        <Surface style={styles.header} elevation={4}>
            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>{title}</Text>
                {showAvatar && (
                    <Avatar.Text size={40} label={userInitials} style={{ backgroundColor: theme.colors.secondary }} />
                )}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: 50, // Safe area padding can be dynamic
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    content: {
        flexDirection: 'row',
        justifybenhav: 'space-between',
        alignItems: 'center',
    },
    title: {
        color: theme.colors.onPrimary,
        fontWeight: 'bold',
    },
});

export default Header;
