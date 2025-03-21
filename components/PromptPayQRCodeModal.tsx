import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Easing, Image  } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
 

interface PromptPayQRCodeModalProps {
  visible: boolean;
  mobileNumber: string;
  amount: number;
  onClose: () => void;
}

const PromptPayQRCodeModal: React.FC<PromptPayQRCodeModalProps> = ({ visible, mobileNumber, amount, onClose }) => {
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
    const formattedMobileNumber = formatMobileNumber(mobileNumber);
    const qrCodeData = `00020101021129370016A000000677010111${formattedMobileNumber}5802TH5303764${formatAmount(amount)}6304`;
    setQRCodeValue(qrCodeData);
  };

  const formatMobileNumber = (number: string) => {
    return `0066${number.slice(1)}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(2).replace('.', '');
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
      setQRCodeValue(null); // Reset QR code value when closing
      onClose();
    }, 500);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.modalBackground, { opacity: opacityAnim }]}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY: translateYAnim }] }]}
        >
          {/* Top-right close button */}
          <TouchableOpacity style={styles.topRightCloseButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
           <Image source={require('../assets/images/thai_qr_payment.png')} style={styles.image} />
          {qrCodeValue && <QRCode value={qrCodeValue} size={200} />}
          <Text style={styles.subtitle}>Pay {amount.toFixed(2)} THB</Text>
          <Text style={styles.subtitleII}> To {mobileNumber}</Text>
          {/* Bottom close button if needed */}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '70%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: "GoogleSans",
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
    color: "#666",
  },
  subtitle: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
  subtitleII: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    color: 'gray',
    
  },
  topRightCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  bottomCloseButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
     fontWeight: 'bold',
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
    marginTop: 20,
  },
});

export default PromptPayQRCodeModal;
