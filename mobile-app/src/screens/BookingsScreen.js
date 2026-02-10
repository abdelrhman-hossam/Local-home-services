import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Surface, Card, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import client from '../api/client';
import Header from '../components/Header';
import Animated, { FadeInUp } from 'react-native-reanimated';

const BookingsScreen = () => {
    const theme = useTheme();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const response = await client.get('/orders/my-orders');
            setBookings(response.data.data);
        } catch (error) {
            console.log('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'جديد': return theme.colors.primary;
            case 'قيد التنفيذ': return theme.colors.tertiary;
            case 'مكتمل': return 'green';
            case 'ملغي': return theme.colors.error;
            default: return 'gray';
        }
    };

    const renderItem = ({ item, index }) => (
        <Animated.View entering={FadeInUp.delay(index * 100).duration(500)}>
            <Card style={styles.card} mode="elevated">
                <Card.Content>
                    <View style={styles.row}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.serviceId[0]?.name || 'Service'}</Text>
                        <Chip textStyle={{ color: 'white' }} style={{ backgroundColor: getStatusColor(item.status) }}>
                            {item.status}
                        </Chip>
                    </View>
                    <Text variant="bodyMedium" style={{ marginTop: 8 }}>Date: {new Date(item.order_date).toLocaleDateString()}</Text>
                    <Text variant="bodyMedium">Total: ${item.totalAmount}</Text>
                    <Text variant="bodySmall" style={{ color: 'gray', marginTop: 4 }}>Note: {item.notes || 'No notes'}</Text>
                </Card.Content>
            </Card>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Header title="My Bookings" />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text>No bookings found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16 },
    card: { marginBottom: 16, backgroundColor: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});

export default BookingsScreen;
