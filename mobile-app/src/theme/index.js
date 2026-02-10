import { MD3LightTheme } from 'react-native-paper';

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#2bc6c1', // Web Primary
        onPrimary: '#ffffff',
        secondary: '#000000', // Web Secondary
        background: '#f8f9fa', // Web Bg Light
        surface: '#ffffff',
        error: '#B00020',
        text: '#000000',
        onSurface: '#000000',
        placeholder: '#333333',
    },
    roundness: 8,
};
