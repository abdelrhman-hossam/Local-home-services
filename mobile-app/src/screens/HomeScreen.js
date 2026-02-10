import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import client from '../api/client';

const { width } = Dimensions.get('window');

// Features Data (Matching index.html)
const FEATURES = [
    {
        id: '1',
        title: 'Cleaning',
        desc: 'Deep cleaning with safe tools.',
        image: require('../assets/feature_cleaning.jpg'),
    },
    {
        id: '2',
        title: 'Maintenance',
        desc: 'Expert electrical & plumbing fixes.',
        image: require('../assets/feature_maintenance.jpg'),
    },
    {
        id: '3',
        title: 'Safety',
        desc: 'Vetted professionals for your peace of mind.',
        image: require('../assets/feature_safety.jpg'),
    },
    {
        id: '4',
        title: 'Best Price',
        desc: 'Transparent pricing, no surprises.',
        image: require('../assets/feature_price.jpg'),
    },
];

const HomeScreen = ({ navigation }) => {
    const theme = useTheme();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchServices = async () => {
        try {
            // Adjust endpoint if necessary, check routes/services.js
            const res = await client.get('/services');
            if (res.data.success) {
                setServices(res.data.data);
            }
        } catch (error) {
            console.log('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const renderFeature = ({ item, index }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 200).duration(800)}
            style={styles.featureCardContainer}
        >
            <Surface style={styles.featureCard} elevation={2}>
                <Image source={item.image} style={styles.featureIcon} resizeMode="cover" />
                <Text variant="titleMedium" style={styles.featureTitle}>{item.title}</Text>
                <Text variant="bodySmall" style={styles.featureDesc}>{item.desc}</Text>
            </Surface>
        </Animated.View>
    );

    const renderService = ({ item, index }) => (
        <Animated.View entering={FadeInRight.delay(index * 150 + 500).duration(800)}>
            <Card style={styles.serviceCard} mode="elevated" onPress={() => { }}>
                {/* Use a placeholder if image is missing or local path issue */}
                <Card.Cover source={{ uri: item.image || 'https://via.placeholder.com/300' }} style={styles.serviceImage} />
                <Card.Content style={styles.serviceContent}>
                    <Text variant="titleMedium" style={styles.serviceTitle}>{item.name}</Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        {item.price} EGP
                    </Text>
                    <Text variant="bodySmall" numberOfLines={2} style={styles.serviceDesc}>
                        {item.description}
                    </Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.navigate('Bookings')} // Should ideally go to Booking Flow
                        style={styles.bookBtn}
                        labelStyle={{ fontSize: 12 }}
                    >
                        Book Now
                    </Button>
                </Card.Content>
            </Card>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={['#f0fdfd', '#ffffff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.heroContent}>
                        <Animated.View entering={FadeInDown.duration(1000)}>
                            <Text style={styles.heroSub}>We don't rest</Text>
                            <Text style={styles.heroTitle}>
                                Until you feel <Text style={{ color: theme.colors.primary }}>Comfortable.</Text>
                            </Text>
                            <Text style={styles.heroDesc}>
                                Keep your family comfortable with "Raya". We provide top-level home cleaning and maintenance services.
                            </Text>

                            <View style={styles.heroButtons}>
                                <Button
                                    mode="contained"
                                    onPress={() => {
                                        // Scroll to services or navigate
                                    }}
                                    style={styles.heroBtnPrimary}
                                    contentStyle={{ height: 50 }}
                                >
                                    Order Now
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => { }}
                                    style={styles.heroBtnOutline}
                                    contentStyle={{ height: 50 }}
                                >
                                    Learn More
                                </Button>
                            </View>
                        </Animated.View>

                        <Animated.Image
                            entering={FadeIn.delay(500).duration(1000)}
                            source={require('../assets/hero_image.jpg')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Features Section */}
                <View style={styles.sectionContainer}>
                    <Text variant="headlineMedium" style={styles.sectionHeader}>Why Choose Us?</Text>
                    <Text variant="bodyMedium" style={styles.sectionSubHeader}>
                        A different experience in home services
                    </Text>

                    <View style={styles.featuresGrid}>
                        {FEATURES.map((item, index) => (
                            <View key={item.id} style={{ width: '48%', marginBottom: 15 }}>
                                {renderFeature({ item, index })}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Services Section */}
                <View style={[styles.sectionContainer, { backgroundColor: '#f8f9fa' }]}>
                    <Text variant="headlineMedium" style={styles.sectionHeader}>Our Services</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        services.map((item, index) => (
                            <View key={item._id} style={{ marginBottom: 20 }}>
                                {renderService({ item, index })}
                            </View>
                        ))
                    )}

                    <Button mode="outlined" style={{ marginTop: 20, borderColor: theme.colors.primary }}>
                        View All Services
                    </Button>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    heroContainer: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        minHeight: Dimensions.get('window').height * 0.85, // Almost full screen
        justifyContent: 'center',
    },
    heroContent: {
        alignItems: 'center',
    },
    heroSub: {
        fontSize: 18,
        fontWeight: '900',
        color: '#333',
        letterSpacing: 1,
        marginBottom: 5,
        opacity: 0.8,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
        lineHeight: 40,
        marginBottom: 15,
        textAlign: 'center',
    },
    heroDesc: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    heroButtons: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 40,
    },
    heroBtnPrimary: {
        borderRadius: 25,
        paddingHorizontal: 10,
    },
    heroBtnOutline: {
        borderRadius: 25,
        paddingHorizontal: 10,
        borderColor: '#2bc6c1',
        borderWidth: 2,
    },
    heroImage: {
        width: '100%',
        height: 300,
        borderRadius: 20,
    },
    sectionContainer: {
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    sectionSubHeader: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 40,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureCardContainer: {
        width: '100%',
    },
    featureCard: {
        padding: 20,
        borderRadius: 15,
        backgroundColor: 'white',
        alignItems: 'center',
        height: 200,
        justifyContent: 'center',
    },
    featureIcon: {
        width: 60,
        height: 60,
        marginBottom: 15,
        borderRadius: 30,
    },
    featureTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    featureDesc: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
    },
    serviceCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        overflow: 'hidden',
    },
    serviceImage: {
        height: 180,
    },
    serviceContent: {
        padding: 15,
    },
    serviceTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    serviceDesc: {
        color: '#666',
        marginBottom: 15,
    },
    bookBtn: {
        alignSelf: 'flex-start',
    }
});

export default HomeScreen;
