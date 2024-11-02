import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Animated, Platform, Alert as RNAlert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database'; // Import database functions
import { firebaseConfig } from './firebase'; // Ensure this file exists and is correctly set up

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<boolean>(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState<boolean>(false);
  const phoneInputRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(1)).current; // Initial opacity for phone input
  const slideAnim = useRef(new Animated.Value(0)).current; // Initial slide position for code input
  const displaySlideAnim = useRef(new Animated.Value(0)).current; // Slide animation for displaying phone number

  const MOCK_CODE = "123456"; // Define a mock code for testing

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`); // Use browser alert for web
    } else {
      RNAlert.alert(title, message); // Use native alert for mobile platforms
    }
  };

  const sendVerificationCode = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showAlert('Invalid phone number', 'Please enter a valid phone number with the country code.');
      return;
    }

    // Simulate sending SMS without real API call
    console.log('Mock sending verification to:', phoneNumber);
    setConfirmation(true);

    // Fade out phone input form
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Slide in code input form after fade-out completes
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    showAlert('Success', `Mock verification code sent successfully! Use ${MOCK_CODE} to test.`);
  };

  const confirmCode = async () => {
    if (code === MOCK_CODE) {
      // Insert the phone number into Firebase Realtime Database
      try {
        await set(ref(database, 'users/' + phoneNumber), {
          phoneNumber: phoneNumber,
          verified: true,
          timestamp: Date.now(),
        });
        showAlert('Success', 'Code confirmed and phone number saved!');
        setConfirmation(false);
        setShowPhoneNumber(true);

        // Slide in the display page for phone number
        Animated.timing(displaySlideAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (error: unknown) {
        if (error instanceof Error) {
          showAlert('Error', `Failed to save phone number: ${error.message}`);
        } else {
          console.error('Unknown error:', error);
        }
      }
    } else {
      showAlert('Failed', 'The code you entered is incorrect.');
    }
  };

  const cancelVerification = () => {
    setConfirmation(false);
    setCode('');
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {!confirmation && !showPhoneNumber && (
        <Animated.View style={{ ...styles.form, opacity: fadeAnim }}>
          <TextInput
            ref={phoneInputRef}
            placeholder="Phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <Button title="Send code" onPress={sendVerificationCode} />
        </Animated.View>
      )}

      {confirmation && !showPhoneNumber && (
        <Animated.View
          style={{
            ...styles.form,
            transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
            opacity: slideAnim,
          }}
        >
          <TextInput
            placeholder="Enter code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={styles.input}
          />
          <Button title="Confirm code" onPress={confirmCode} />
          <Button title="Cancel" onPress={cancelVerification} color="red" />
        </Animated.View>
      )}

      {showPhoneNumber && (
        <Animated.View
          style={{
            ...styles.slidePage,
            transform: [{ translateX: displaySlideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
            opacity: displaySlideAnim,
          }}
        >
          <Text style={styles.phoneNumberDisplay}>Verified Phone Number: {phoneNumber}</Text>
        
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  slidePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneNumberDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
