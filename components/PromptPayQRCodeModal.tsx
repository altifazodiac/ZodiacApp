import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Easing, Image } from "react-native";
import QRCode from "react-native-qrcode-svg";
const generatePayload = require("promptpay-qr");

interface PromptPayQRCodeModalProps {
  visible: boolean;
  mobileNumber: string;
  amount: number; // This is the total or remaining amount to be paid via QR
  onClose: () => void;
  onProceedToPayment?: () => void;
  setPaymentDetails?: (
    details:
      | { [method: string]: number }
      | ((prev: { [method: string]: number }) => { [method: string]: number })
  ) => void;
}

const PromptPayQRCodeModal: React.FC<PromptPayQRCodeModalProps> = ({
  visible,
  mobileNumber,
  amount, // This is the total or remaining amount to be paid via QR
  onClose,
  onProceedToPayment,
  setPaymentDetails,
}) => {
  const [qrCodeValue, setQRCodeValue] = useState<string | null>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      generatePromptPayQRCode();
      fadeInModal();
    } else {
      fadeOutModal();
    }
  }, [visible, mobileNumber, amount]);

  const generatePromptPayQRCode = () => {
    console.log("Generating QR with amount:", amount);
    const payload = generatePayload(mobileNumber, { amount });
    setQRCodeValue(payload);
  };

  const fadeInModal = () => {
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
  };

  const fadeOutModal = () => {
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
  };

  const handleClose = () => {
    fadeOutModal();
    setTimeout(() => {
      setQRCodeValue(null);
      onClose();
    }, 500);
  };

  const handlePayClick = async () => {
    try {
      if (amount <= 0) {
        console.error("Invalid amount in handlePayClick:", amount);
        handleClose();
        return;
      }
  
      if (setPaymentDetails) {
        setPaymentDetails((prev) => {
          const updatedDetails = { ...prev, Scan: amount };
          console.log("Updated paymentDetails in QR modal:", updatedDetails);
          return updatedDetails;
        });
      }
  
      await new Promise((resolve) => setTimeout(resolve, 100));
  
      if (onProceedToPayment) {
        console.log("Proceeding to payment with amount:", amount);
        onProceedToPayment();
      }
  
      handleClose();
    } catch (error) {
      console.error("Payment error in QR modal:", error);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.modalBackground, { opacity: opacityAnim }]}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY: translateYAnim }] }]}
        >
          <TouchableOpacity style={styles.topRightCloseButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Image
            source={require("../assets/images/thai_qr_payment.png")}
            style={styles.image}
          />
          {qrCodeValue && <QRCode value={qrCodeValue} size={200} />}
          <Text style={styles.subtitle}>Pay {amount.toFixed(2)} THB</Text>
          <Text style={styles.subtitleIIA}>To {mobileNumber}</Text>

          <TouchableOpacity style={styles.payButton} onPress={handlePayClick}>
            <Text style={styles.payButtonText}>Pay with QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomCloseButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "70%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
  subtitleIIA: {
    fontSize: 16,
    color: "gray",
  },
  topRightCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
  },
  bottomCloseButton: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  payButton: {
    marginTop: 20,
    backgroundColor: "#3a5565",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 80,
    resizeMode: "contain",
    marginTop: 20,
  },
});

export default PromptPayQRCodeModal;