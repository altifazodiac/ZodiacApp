import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as SecureStore from "expo-secure-store";

export default function DisplayPasscodeScreen() {
  const [savedPasscode, setSavedPasscode] = useState<string | null>(null);

  const fetchPasscode = async () => {
    try {
      const passcode = await SecureStore.getItemAsync("userPasscode");
      if (passcode) {
        setSavedPasscode(passcode);
        console.log("Retrieved Passcode: ", passcode);
      } else {
        Alert.alert("No Passcode", "No passcode is set in SecureStore.");
      }
    } catch (error) {
      console.error("Error retrieving passcode: ", error);
      Alert.alert("Error", "Failed to retrieve the passcode.");
    }
  };

  useEffect(() => {
    fetchPasscode();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Passcode:</Text>
      {savedPasscode ? (
        <Text style={styles.passcode}>{savedPasscode}</Text>
      ) : (
        <Text style={styles.passcode}>No passcode available.</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={fetchPasscode}>
        <Text style={styles.buttonText}>Reload Passcode</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f5f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  passcode: {
    fontSize: 20,
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#43677e",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
