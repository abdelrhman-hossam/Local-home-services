import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#1A237E', // Deep Navy
        secondary: '#FFC107', // Amber/Gold
        tertiary: '#00BCD4', // Cyan
        background: '#F5F5F5',
        surface: '#FFFFFF',
        error: '#B00020',
        text: '#000000',
        onPrimary: '#FFFFFF',
        onSecondary: '#000000',
    },
    roundness: 12,
};
