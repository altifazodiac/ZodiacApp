import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { Asset } from "expo-asset";
import * as SecureStore from "expo-secure-store";

 

const PasscodeButton = ({
  number,
  onPress,
}: {
  number: string;
  onPress: (number: string) => void;
}) => (
  <TouchableOpacity style={styles.button} onPress={() => onPress(number)}>
    <Text style={styles.number}>{number}</Text>
  </TouchableOpacity>
);

export default function PasscodeScreen() {
  const [inputPasscode, setInputPasscode] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [disableInput, setDisableInput] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const navigation: NavigationProp<any> = useNavigation();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const logotype = Asset.fromModule(require("../assets/images/face-id.png")).uri;

  const verifyPasscode = async (inputPasscode: string): Promise<boolean> => {
    try {
      const savedPasscode = await SecureStore.getItemAsync("userPasscode");
      console.log("Retrieved Passcode: ", savedPasscode);
      console.log("Input Passcode: ", inputPasscode);
      if (!savedPasscode) {
        Alert.alert("Error", "No passcode set.");
        return false;
      }
      return savedPasscode.trim() === inputPasscode.trim();
    } catch (error) {
      console.error("Error verifying passcode: ", error);
      Alert.alert("Error", "Failed to verify the passcode.");
      return false;
    }
  };
  
  const handlePress = async (number: string) => {
    if (disableInput || inputPasscode.length >= 6) return;
  
    const newPasscode = [...inputPasscode, number];
    setInputPasscode(newPasscode);
  
    if (newPasscode.length === 6) {
      setDisableInput(true); // Prevent additional inputs
      if (attempts >= 5) {
        Alert.alert("Locked", "Too many failed attempts. Try again later.");
        setDisableInput(false);
        return;
      }
  
      const isVerified = await verifyPasscode(newPasscode.join(""));
      if (isVerified) {
        setMessage(null);
        setInputPasscode([]);
        setAttempts(0);
        navigation.navigate("Orders");
      } else {
        setInputPasscode([]);
        setAttempts((prev) => prev + 1);
        setMessage(`Incorrect password. Attempts: ${attempts + 1}`);
      }
      setDisableInput(false); // Re-enable input
    }
  };

  const handleBackspace = () => {
    setInputPasscode((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const checkBiometricType = async () => {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        setBiometricType("Face ID");
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        setBiometricType("Fingerprint");
      } else {
        setBiometricType(null);
      }
    };

    checkBiometricType();
  }, []);

  const handleBiometricAuth = async () => {
    if (!biometricType) {
      Alert.alert(
        "Error",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate with ${biometricType}`,
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      navigation.navigate("Orders");
    } else {
      Alert.alert(
        "Error",
        `${biometricType} authentication failed. Please try again.`
      );
    }
  };

  const renderCircles = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.circle,
          inputPasscode[index] ? styles.filledCircle : styles.emptyCircle,
        ]}
      />
    ));
  };

  return (
    <LinearGradient
      style={styles.background}
      colors={["#f2f5f8", "#dee4ec", "#cfd8e3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.container}>
        {message && <Text style={styles.feedbackText}>{message}</Text>}

        <View style={styles.circlesContainer}>{renderCircles()}</View>

        <View style={styles.row}>
          <PasscodeButton number="1" onPress={handlePress} />
          <PasscodeButton number="2" onPress={handlePress} />
          <PasscodeButton number="3" onPress={handlePress} />
        </View>
        <View style={styles.row}>
          <PasscodeButton number="4" onPress={handlePress} />
          <PasscodeButton number="5" onPress={handlePress} />
          <PasscodeButton number="6" onPress={handlePress} />
        </View>
        <View style={styles.row}>
          <PasscodeButton number="7" onPress={handlePress} />
          <PasscodeButton number="8" onPress={handlePress} />
          <PasscodeButton number="9" onPress={handlePress} />
        </View>
        <View style={styles.row}>
          {biometricType === "Face ID" ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBiometricAuth}
            >
              <Image style={{ width: 30, height: 30 }} source={{ uri: logotype }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBiometricAuth}
            >
              <Ionicons name="finger-print" size={28} color="#263c48" />
            </TouchableOpacity>
          )}

          <PasscodeButton number="0" onPress={handlePress} />

          <TouchableOpacity style={styles.iconButton} onPress={handleBackspace}>
            <Ionicons name="backspace" size={28} color="#263c48" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const isTablet = Dimensions.get("window").width > 768;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  circlesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  emptyCircle: {
    backgroundColor: "#ddd",
  },
  filledCircle: {
    backgroundColor: "#263c48",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: isTablet ? 15 : 10,
  },
  button: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#43677e",
    borderRadius: Dimensions.get("window").width / 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginHorizontal: 10,
  },
  number: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: "600",
    color: "#fff",
  },
  feedbackText: {
    color: "#ff0000",
    fontSize: 16,
    marginBottom: 20,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: isTablet ? 16 : 12,
  },
});
