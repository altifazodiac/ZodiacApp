import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import DrawerLayout from './DrawerLayout';  
import { useColorScheme } from '../hooks/useColorScheme';  
import 'react-native-reanimated';
import { LoadingProvider, useLoading } from '../components/LoadingContext';
import { TrophySpin } from 'react-loading-indicators';
 
SplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();  
  const [fontsLoaded] = useFonts({
    'GoogleSans-Regular': require('../assets/fonts/GoogleSans-Regular.ttf'),
    'Kanit-Regular': require('../assets/fonts/Kanit-Regular.ttf'),
  });
  
 

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);


  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <TrophySpin color="#357a95" size="medium" text="Loading" textColor="#2d738b" />
      </View>
    ); // Show loading indicator while fonts are loading
  }
  return (
    <LoadingProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DrawerLayout /> 
    </ThemeProvider>
    </LoadingProvider>
  );
}