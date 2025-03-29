import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform 
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from 'expo-secure-store';
import { ref, set } from "firebase/database";
import { db } from "../utils/firebase"; // make sure this path is correct
 

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
export default function CreatePasscodeScreen() {
  const navigation = useNavigation();
  const [passcode, setPasscode] = useState<string[]>([]);
  const [confirmPasscode, setConfirmPasscode] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string>("Enter a new passcode:");
 
 
 

  const savePasscode = async (passcode: string) => {
    try {
      // ตรวจสอบ Platform ก่อนใช้ SecureStore
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync("userPasscode", passcode);
        console.log("Passcode saved to SecureStore");
      }
  
      // ส่วนของ Firebase ยังทำงานได้บนเว็บ
      const userId = "user1";
      const passcodeRef = ref(db, "passcodes/" + userId);
      await set(passcodeRef, {
        passcode: passcode,
        createdAt: new Date().toISOString(),
      });
  
      console.log("✅ Passcode saved to Firebase");
      return true;
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to save passcode");
      return false;
    }
  };
  
  const handlePress = async (number: string) => {
    const currentPasscode = isConfirming ? confirmPasscode : passcode;
  
    if (currentPasscode.length >= 6) return;
  
    const newPasscode = [...currentPasscode, number];
    isConfirming ? setConfirmPasscode(newPasscode) : setPasscode(newPasscode);
  
    if (newPasscode.length === 6) {
      if (isConfirming) {
        if (newPasscode.join("") === passcode.join("")) {
          const saveResult = await savePasscode(newPasscode.join(""));
          if (saveResult) {
            Alert.alert("Success", "Passcode created successfully!");
            resetState("Passcode set successfully!");
             
          }
        } else {
          handleMismatch();
        }
      } else {
        setIsConfirming(true);
        setMessage("Confirm your passcode:");
      }
    }
  };

  const handleMismatch = () => {
    setMessage("Passcodes do not match. Please try again.");
    setTimeout(() => {
      resetState("Enter a new passcode:");
    }, 1500);
  };

  const resetState = (newMessage: string) => {
    setPasscode([]);
    setConfirmPasscode([]);
    setIsConfirming(false);
    setMessage(newMessage);
  };

 

  const handleBackspace = () => {
    if (isConfirming) {
      setConfirmPasscode((prev) => prev.slice(0, -1));
    } else {
      setPasscode((prev) => prev.slice(0, -1));
    }
  };

  const renderCircles = () => {
    const currentPasscode = isConfirming ? confirmPasscode : passcode;
    return Array.from({ length: 6 }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.circle,
          currentPasscode[index] ? styles.filledCircle : styles.emptyCircle,
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
        {message && (
          <Text
            style={[
              styles.messageText,
              message.includes("do not match") ? styles.errorText : styles.successText,
            ]}
          >
            {message}
          </Text>
        )}

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
          <View style={styles.placeholder} />
          <PasscodeButton number="0" onPress={handlePress} />
          <TouchableOpacity style={styles.iconButton} onPress={handleBackspace}>
            <Text style={styles.iconText}>⌫</Text>
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
    marginVertical: isTablet ? 15 : 10,
  },
  button: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#43677e",
    borderRadius: Dimensions.get("window").width / 8,
    marginHorizontal: 10,
  },
  number: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: "600",
    color: "#fff",
  },
  placeholder: {
    width: 80,
    height: 80,
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
  iconText: {
    fontSize: 28,
    color: "#263c48",
  },
  messageText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  errorText: {
    color: "red",
  },
  successText: {
    
  },
});
