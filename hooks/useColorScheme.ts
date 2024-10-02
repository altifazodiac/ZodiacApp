import { useColorScheme as useThemeColorScheme } from 'react-native'; // For using built-in React Native hook

// Custom hook if needed
export const useColorScheme = () => {
  return useThemeColorScheme(); // This will return 'light' or 'dark'
};
