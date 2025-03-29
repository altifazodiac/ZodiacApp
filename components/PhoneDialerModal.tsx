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
  cashChange: number;
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
  const [numberValue, setNumberValue] = useState<string>(cashChange.toString());
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
    setTimeout(onClose, 300);
  };

  const dialPadButtons = [
    { digit: "1", letters: "", type: "number" },
    { digit: "2", letters: "ABC", type: "number" },
    { digit: "3", letters: "DEF", type: "number" },
    { digit: "100", letters: "CASH", type: "cash" },
    { digit: "4", letters: "GHI", type: "number" },
    { digit: "5", letters: "JKL", type: "number" },
    { digit: "6", letters: "MNO", type: "number" },
    { digit: "500", letters: "CASH", type: "cash" },
    { digit: "7", letters: "PQRS", type: "number" },
    { digit: "8", letters: "TUV", type: "number" },
    { digit: "9", letters: "WXYZ", type: "number" },
    { digit: "1000", letters: "CASH", type: "cash" },
    { digit: "C", letters: "", type: "function" },
    { digit: "0", letters: "", type: "number" },
    { digit: "00", letters: "", type: "number" },
    { digit: "Del", letters: "", type: "function" },
  ];

  useEffect(() => {
    const parsedValue = parseInt(numberValue) || 0;
    const calculatedMoneyChanged = parsedValue - total;
    onCashChanged(parsedValue);
    onMoneyChanged(calculatedMoneyChanged);
  }, [numberValue, total]);

  const handleButtonPress = (digit: string) => {
    if (digit === "C") {
      setNumberValue("");
    } else if (digit === "Del") {
      setNumberValue((prev) => prev.slice(0, -1));
    } else if (digit === "100" || digit === "500" || digit === "1000") {
      const addedValue = parseInt(digit);
      setNumberValue((prev) => (parseInt(prev) || 0) + addedValue + "");
    } else {
      setNumberValue((prev) => prev + digit);
    }
  };

  return (
    <Modal transparent={true} visible={visible} onRequestClose={onClose} animationType="none">
      <Animated.View style={[styles.modalBackground, { opacity: opacityAnim }]}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY: translateYAnim }] }]}
        >
          <TouchableOpacity style={styles.topRightCloseButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Add Cash Payment</Text>
          
          <Text style={[styles.phoneNumber, { color: parseInt(numberValue) >= total ? "green" : "#3a5665" }]}>
            {numberValue || "0"}฿
          </Text>
          
          <Text style={styles.callingText}>
            Total: {total}฿ {" "}
            {parseInt(numberValue) > total ? (
              <Text style={{ color: "green" }}>
                (Change: {parseInt(numberValue) - total}฿)
              </Text>
            ) : (
              <Text style={{ color: "red" }}>
                (Remaining: {total - (parseInt(numberValue) || 0)}฿)
              </Text>
            )}
          </Text>
          
          <View style={styles.dialPad}>
            {dialPadButtons.map((button, index) => (
              <DialButton
                key={index}
                digit={button.digit}
                letters={button.letters}
                type={button.type}
                onPress={() => handleButtonPress(button.digit)}
              />
            ))}
          </View>
          
          <TouchableOpacity style={styles.SubmitButton} onPress={handleClose}>
            <MaterialIcons name="currency-exchange" size={22} color="white"/>
            <Text style={styles.SubmitButtonText}>Cash {numberValue || "0"}฿</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const DialButton: React.FC<{
  digit: string;
  letters: string;
  type: string;
  onPress: () => void;
}> = ({ digit, letters, type, onPress }) => {
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
    onPress();
  };

  const getButtonStyle = () => {
    switch(type) {
      case "cash":
        return { backgroundColor: "#d0e3f0", borderColor: "#a8c6e0" };
      case "function":
        if (digit === "Del") {
          return { backgroundColor: "#ffebee", borderColor: "#ffcdd2" };
        }
        return { backgroundColor: "#e0e0e0", borderColor: "#bdbdbd" };
      default:
        return { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" };
    }
  };

  const getTextStyle = () => {
    switch(type) {
      case "cash":
        return { color: "#1976d2" };
      case "function":
        if (digit === "Del") {
          return { color: "#d32f2f" };
        }
        return { color: "#424242" };
      default:
        return { color: "#212121" };
    }
  };

  return (
    <Animated.View style={[styles.dialButton, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.dialButtonInner, getButtonStyle()]}
      >
        <Text style={[styles.dialButtonText, getTextStyle()]}>{digit}</Text>
        {letters ? <Text style={[styles.letterText, { color: getTextStyle().color }]}>{letters}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const windowWidth = Dimensions.get("window").width;
const isSmallPhone = windowWidth <= 375; // iPhone 8
const isMediumPhone = windowWidth > 375 && windowWidth <= 414; // iPhone 13 Pro Max

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: isSmallPhone ? "90%" : isMediumPhone ? "85%" : "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: isSmallPhone ? 16 : 20,
    alignItems: "center",
    elevation: 5,
    maxWidth: 400,
  },
  title: {
    fontFamily: "GoogleSans",
    fontSize: isSmallPhone ? 20 : 22,
    marginBottom: 8,
    textAlign: "center",
    color: "#3a5665",
    fontWeight: "bold",
  },
  phoneNumber: {
    fontSize: isSmallPhone ? 32 : 36,
    marginBottom: 8,
    fontWeight: "bold",
  },
  callingText: {
    fontFamily: "GoogleSans",
    fontSize: isSmallPhone ? 14 : 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  dialPad: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialButton: {
    width: "23%",
    aspectRatio: 1,
    marginBottom: isSmallPhone ? 8 : 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dialButtonInner: {
    width: "90%",
    height: "90%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
  dialButtonText: {
    fontFamily: "GoogleSans",
    fontSize: isSmallPhone ? 20 : 22,
    fontWeight: "600",
  },
  letterText: {
    fontSize: isSmallPhone ? 9 : 10,
    marginTop: 4,
  },
  SubmitButton: {
    backgroundColor: "#3a5565",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
    elevation: 3,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    minHeight: 50,
  },
  SubmitButtonText: {
    color: "white",
    fontSize: isSmallPhone ? 16 : 18,
    marginLeft: 8,
    fontWeight: "bold",
  },
  topRightCloseButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 1,
  },
  closeButtonText: {
    fontWeight: "bold",
    fontSize: isSmallPhone ? 16 : 18,
    color: "#666",
  },
});

export default PhoneDialerModal;