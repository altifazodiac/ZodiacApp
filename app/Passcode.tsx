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
  Vibration,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { Asset } from "expo-asset";
import * as SecureStore from "expo-secure-store";
import { ref, get } from "firebase/database";
import { db } from "../utils/firebase";
import NetInfo from "@react-native-community/netinfo";

const PasscodeButton = ({
  number,
  onPress,
  disabled,
}: {
  number: string;
  onPress: (number: string) => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity 
    style={[styles.button, disabled && styles.disabledButton]} 
    onPress={() => onPress(number)}
    disabled={disabled}
  >
    <Text style={styles.number}>{number}</Text>
  </TouchableOpacity>
);

export default function PasscodeScreen() {
  const [inputPasscode, setInputPasscode] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const navigation: NavigationProp<any> = useNavigation();
  const logotype = Asset.fromModule(require("../assets/images/face-id.png")).uri;

  // Check network connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Check biometric support
  useEffect(() => {
    const checkBiometricType = async () => {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      }
    };

    checkBiometricType();
  }, []);

  const verifyPasscode = async (inputPasscode: string): Promise<boolean> => {
    try {
      // First try Firebase if online
      if (isOnline) {
        const userId = "user1"; // Replace with actual user ID
        const passcodeRef = ref(db, `passcodes/${userId}/passcode`);
        const snapshot = await get(passcodeRef);
        
        if (snapshot.exists()) {
          const savedPasscode = snapshot.val();
          return savedPasscode === inputPasscode;
        }
      }

      // Fallback to SecureStore for mobile devices
      if (Platform.OS !== 'web') {
        const localPasscode = await SecureStore.getItemAsync("userPasscode");
        if (localPasscode) {
          return localPasscode === inputPasscode;
        }
      }

      Alert.alert("Error", "No passcode found");
      return false;
    } catch (error) {
      console.error("Verification error:", error);
      
      // Final fallback for mobile
      if (Platform.OS !== 'web') {
        try {
          const localPasscode = await SecureStore.getItemAsync("userPasscode");
          return localPasscode === inputPasscode;
        } catch (localError) {
          console.error("Local passcode check failed:", localError);
        }
      }

      Alert.alert(
        "Connection Error", 
        "Could not verify passcode. Please check your internet connection."
      );
      return false;
    }
  };

  const handlePress = async (number: string) => {
    if (isLoading || inputPasscode.length >= 6) return;

    const newPasscode = [...inputPasscode, number];
    setInputPasscode(newPasscode);

    if (newPasscode.length === 6) {
      setIsLoading(true);
      
      if (attempts >= 4) { // 5 attempts (0-4)
        Alert.alert(
          "Locked", 
          "Too many failed attempts. Please try again later."
        );
        setInputPasscode([]);
        setIsLoading(false);
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
        setAttempts(prev => prev + 1);
        setMessage(`Incorrect passcode. Attempts: ${attempts + 1}/5`);
        
        // Vibrate on wrong passcode (mobile only)
        if (Platform.OS !== 'web') {
          Vibration.vibrate(500);
        }
      }
      
      setIsLoading(false);
    }
  };

  const handleBackspace = () => {
    if (!isLoading) {
      setInputPasscode(prev => prev.slice(0, -1));
    }
  };

  const handleBiometricAuth = async () => {
    if (!biometricType) {
      Alert.alert(
        "Error",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    try {
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
    } catch (error) {
      console.error("Biometric error:", error);
      Alert.alert("Error", "Biometric authentication failed");
    }
  };

  const renderCircles = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.circle,
          inputPasscode[index] ? styles.filledCircle : styles.emptyCircle,
          isLoading && styles.loadingCircle,
        ]}
      />
    ));
  };

  // Show offline message for web
  if (!isOnline && Platform.OS === 'web') {
    return (
      <LinearGradient
        style={styles.background}
        colors={["#f2f5f8", "#dee4ec", "#cfd8e3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.offlineText}>
            You are offline. Passcode verification unavailable.
          </Text>
          <Text style={styles.offlineSubText}>
            Please check your internet connection.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      style={styles.background}
      colors={["#f2f5f8", "#dee4ec", "#cfd8e3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Enter Passcode</Text>
        
        {message && (
          <Text style={[
            styles.feedbackText,
            attempts >= 3 && styles.warningText
          ]}>
            {message}
          </Text>
        )}

        {!isOnline && Platform.OS !== 'web' && (
          <Text style={styles.offlineWarning}>
            Offline mode - using local verification
          </Text>
        )}

        <View style={styles.circlesContainer}>{renderCircles()}</View>

        <View style={styles.row}>
          <PasscodeButton number="1" onPress={handlePress} disabled={isLoading} />
          <PasscodeButton number="2" onPress={handlePress} disabled={isLoading} />
          <PasscodeButton number="3" onPress={handlePress} disabled={isLoading} />
        </View>
        <View style={styles.row}>
          <PasscodeButton number="4" onPress={handlePress} disabled={isLoading} />
          <PasscodeButton number="5" onPress={handlePress} disabled={isLoading} />
          <PasscodeButton number="6" onPress={handlePress} disabled={isLoading} />
        </View>
        <View style={styles.row}>
          <PasscodeButton number="7" onPress={handlePress} disabled={isLoading} />
          <PasscodeButton number="8" onPress={handlePress} disabled={isLoading} />
          <PasscodeButton number="9" onPress={handlePress} disabled={isLoading} />
        </View>
        <View style={styles.row}>
          {biometricType ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBiometricAuth}
              disabled={isLoading}
            >
              {biometricType === "Face ID" ? (
                <Image style={styles.biometricIcon} source={{ uri: logotype }} />
              ) : (
                <Ionicons name="finger-print" size={28} color="#263c48" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}

          <PasscodeButton number="0" onPress={handlePress} disabled={isLoading} />

          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleBackspace}
            disabled={isLoading || inputPasscode.length === 0}
          >
            <Ionicons 
              name="backspace" 
              size={28} 
              color={inputPasscode.length === 0 ? "#ccc" : "#263c48"} 
            />
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
    padding: 20,
  },
  title: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: "600",
    color: "#263c48",
    marginBottom: 10,
  },
  circlesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 30,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
  },
  emptyCircle: {
    backgroundColor: "#ddd",
  },
  filledCircle: {
    backgroundColor: "#263c48",
  },
  loadingCircle: {
    backgroundColor: "#aaa",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: isTablet ? 15 : 10,
    width: "100%",
    maxWidth: 300,
  },
  button: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#43677e",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginHorizontal: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  number: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: "600",
    color: "#fff",
  },
  feedbackText: {
    color: "#ff4444",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  warningText: {
    color: "#ff8800",
    fontWeight: "bold",
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  biometricIcon: {
    width: 30,
    height: 30,
  },
  offlineText: {
    fontSize: 18,
    color: "#263c48",
    textAlign: "center",
    marginBottom: 10,
  },
  offlineSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  offlineWarning: {
    fontSize: 14,
    color: "#ff8800",
    marginBottom: 10,
    fontStyle: "italic",
  },
});