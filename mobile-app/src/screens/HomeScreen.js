import React from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, Card, IconButton, useTheme } from 'react-native-paper';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';

const CATEGORIES = [
    { id: '1', name: 'Plumbing', icon: 'pipe-wrench' },
    { id: '2', name: 'Electrical', icon: 'flash' },
    { id: '3', name: 'Painting', icon: 'format-paint' },
    { id: '4', name: 'Cleaning', icon: 'broom' },
    { id: '5', name: 'Garden', icon: 'flower' },
];

const FEATURED = [
    { id: '1', title: 'AC Repair', price: '$50', image: 'https://via.placeholder.com/300' },
    { id: '2', title: 'Full House Cleaning', price: '$120', image: 'https://via.placeholder.com/300' },
    { id: '3', title: 'Kitchen Plumbing', price: '$80', image: 'https://via.placeholder.com/300' },
];

const HomeScreen = ({ navigation }) => {
    const theme = useTheme();

    const renderCategory = ({ item, index }) => (
        <Animated.View entering={FadeInRight.delay(index * 100).duration(500)}>
            <TouchableOpacity style={styles.categoryItem} onPress={() => { }}>
                <Surface style={[styles.categoryIcon, { backgroundColor: theme.colors.secondaryContainer }]} elevation={2}>
                    <IconButton icon={item.icon} iconColor={theme.colors.primary} size={24} />
                </Surface>
                <Text variant="labelSmall" style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderFeatured = ({ item, index }) => (
        <Animated.View entering={FadeInUp.delay(300 + (index * 100)).duration(700)}>
            <Card style={styles.featuredCard} mode="elevated" onPress={() => { }}>
                <Card.Cover source={{ uri: item.image }} style={styles.cardImage} />
                <Card.Title
                    title={item.title}
                    subtitle={item.price}
                    titleStyle={styles.cardTitle}
                    subtitleStyle={{ color: theme.colors.secondary }}
                    right={(props) => <IconButton {...props} icon="arrow-right" />}
                />
            </Card>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <Header title="Good Morning, Hero" showAvatar={true} userInitials="MH" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Categories</Text>
                    <FlatList
                        horizontal
                        data={CATEGORIES}
                        renderItem={renderCategory}
                        keyExtractor={item => item.id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>

                <View style={styles.section}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Featured Services</Text>
                    {FEATURED.map((item, index) => (
                        <View key={item.id} style={{ marginBottom: 16 }}>
                            {renderFeatured({ item, index })}
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 15,
    },
    categoriesList: {
        paddingRight: 20,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 20,
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        textAlign: 'center',
    },
    featuredCard: {
        marginBottom: 5,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    cardImage: {
        height: 150,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
});

export default HomeScreen;
