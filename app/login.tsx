import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, StyleSheet, Animated, Easing } from 'react-native';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const slideAnim = useRef(new Animated.Value(-200)).current; // Start higher off-screen

  const handleLogin = () => {
    // Implement login logic
    console.log('Logging in with:', email, password);
  };

  useEffect(() => {
    // Start the slide-in animation when the component mounts
    Animated.timing(slideAnim, {
      toValue: 0, // Final vertical position
      duration: 750, // Duration of the animation (e.g., 750ms)
      easing: Easing.out(Easing.ease), // Add easing function
      useNativeDriver: true, // Use native driver for performance
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
  },
});

export default Login;
