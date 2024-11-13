import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";

import { MaterialIcons } from "@expo/vector-icons";
 

interface PhoneDialerModalProps {
  visible: boolean;
  total: number;
  cashChange: number; // Add cashChange prop
  onMoneyChanged: (value: number) => void;
  onCashChanged: (value: number) => void;
  onClose: () => void;
}

const PhoneDialerModal: React.FC<PhoneDialerModalProps> = ({
  visible,
  onClose,
  total,
  cashChange,
  onMoneyChanged,
  onCashChanged,
}) => {
  const [numberValue, setNumberValue] = useState<string>(cashChange.toString()); // Initialize with cashChange
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setNumberValue(cashChange.toString());
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 300,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, cashChange]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 100,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    // Delay closing modal until animations complete
    setTimeout(onClose, 300); // Adjust time to match the animation duration
  };

  const dialPadButtons = [
    { digit: "1", letters: "" },
    { digit: "2", letters: "ABC" },
    { digit: "3", letters: "DEF" },
    { digit: "100", letters: "CASH" },
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
    { digit: "500", letters: "CASH" },
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
    { digit: "1000", letters: "CASH" },
    { digit: "C", letters: "" },
    { digit: "0", letters: "" },
    { digit: "00", letters: "" },
    { digit: "Del", letters: "" },
  ];

  // Calculate cashChange and moneyChanged when numberValue changes
  useEffect(() => {
    const parsedValue = parseInt(numberValue) || 0;
    const calculatedMoneyChanged = parsedValue - total;

    onCashChanged(parsedValue); // Sync parsedValue to cashChange in Orders.tsx
    onMoneyChanged(calculatedMoneyChanged); // Update moneyChanged in Orders.tsx
  }, [numberValue, total]);

  // Function to handle button presses
  const handleButtonPress = (digit: string) => {
    if (digit === "C") {
      setNumberValue(""); // Clear the entire input
    } else if (digit === "Del") {
      setNumberValue((prev) => prev.slice(0, -1)); // Delete the last character
    } else if (digit === "100" || digit === "500" || digit === "1000") {
      const addedValue = parseInt(digit);
      setNumberValue((prev) => (parseInt(prev) || 0) + addedValue + ""); // Convert back to string
    } else {
      setNumberValue((prev) => prev + digit); // Append digit to the current number
    }
  };

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose} animationType="none">
       <Animated.View style={[styles.modalBackground, { opacity: opacityAnim }]}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY: translateYAnim }] }]}
        >
          {/* Top-right close button */}
          <TouchableOpacity style={styles.topRightCloseButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Cash Payment</Text>
          <Text
            style={[
              styles.phoneNumber,
              { color: parseInt(numberValue) >= total ? "green" : "#3a5665" }, // Conditional color
            ]}
          >
            {numberValue}
            {numberValue ? "฿" : ""}
          </Text>
          <Text style={styles.callingText}>
            {"Total: "}
            {total.toFixed(0)}
            {"฿"}
            {parseInt(numberValue) > total ? (
              <Text style={{ color: "green" }}>
                {" "}
                (Change: {(parseInt(numberValue) - total).toFixed(0)}฿)
              </Text>
            ) : (
              <Text style={{ color: "red" }}>
                {" "}
                (Remaining: {(cashChange - total).toFixed(0)}฿)
              </Text>
            )}
          </Text>
          <View style={styles.dialPad}>
            {dialPadButtons.map((button, index) => (
              <DialButton
                key={index}
                digit={button.digit}
                letters={button.letters}
                onPress={() => handleButtonPress(button.digit)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.SubmitButton} onPress={handleClose}>
           <MaterialIcons name="currency-exchange" size={22} color="white"/>
           <Text style={styles.SubmitButtonText}>Cash {parseInt(numberValue).toFixed(0)}{" ฿"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
    
  );
};

// DialButton component with haptic feedback
const DialButton: React.FC<{
  digit: string;
  letters: string;
  onPress: () => void;
}> = ({ digit, letters, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(); // Trigger the onPress callback after animation
  };

  const textColor =
    digit === "100" || digit === "500" || digit === "1000"
      ? "#696e70"
      : digit === "Del"
      ? "red"
      : "#333";
      const BGColor =
    digit === "100" || digit === "500" || digit === "1000"
      ? "#d0dce1"
      : digit === "Del"
      ? "#ffdede"
      : "#f3f7f9";

  return (
    <Animated.View
      style={[
        styles.dialButton,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.dialButtonInner, {backgroundColor: BGColor}]}
      >
        <Text style={[styles.dialButtonText, { color: textColor }]}>
          {digit}
        </Text>
        {letters ? <Text style={styles.letterText}>{letters}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1024;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: isMobile ? "89%" : "60%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  phoneNumber: {
    fontSize: 36,
    marginBottom: 10,
  },
  callingText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  dialPad: {
    width: isMobile ? "100%" : "58%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dialButton: {
    width: "22%", // Adjust width to fit four buttons per row
    aspectRatio: 1, // Keep buttons square
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  dialButtonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eeeeee",
    borderRadius: 10,
  },
  dialButtonText: {
    fontFamily: "GoogleSans",
    fontSize: 22,
  },
  letterText: {
    fontSize: 10,
    color: "gray",
    marginTop: 2,
  },
  SubmitButton: {
    backgroundColor: "#3a5565",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
    padding: 20,
    flexDirection: "row", // Aligns icon and text horizontally
    justifyContent: "center", // Center everything inside the button
    width: isMobile ? "100%" : "58%",
  },
  SubmitButtonText: {
    color: "white",
    fontSize: 18,
    
    marginLeft: 10, // Space between icon and text
    fontWeight: "bold",
  },
  topRightCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    fontWeight: 'bold',
   fontSize: 16,
 },
 title: {
   fontFamily: "GoogleSans",
   fontSize: 24,
   marginBottom: 10,
   textAlign: "center",
   color: "#666",
 },
 
});

export default PhoneDialerModal;
