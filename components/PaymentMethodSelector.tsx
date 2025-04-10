import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FaMoneyBillAlt, FaCreditCard, FaQrcode } from 'react-icons/fa';

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: string) => void;
  handleOpenDialer: () => void;
  handleOpenQrDialer: () => void;
  selectedMethods: string[];
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodSelect,
  handleOpenDialer,
  handleOpenQrDialer,
  selectedMethods,
}) => {
  const handleMethodToggle = (method: string) => {
    const isMethodSelected = selectedMethods.includes(method);
    
    // If selecting Cash and Scan is already selected, deselect Scan first
    if (method === "Cash" && selectedMethods.includes("Scan")) {
      onMethodSelect("Scan"); // Deselect Scan
    }
    
    // Toggle the selected method
    onMethodSelect(method);

    // Open appropriate dialog only if the method is being selected (not deselected)
    if (!isMethodSelected) {
      if (method === "Cash") {
        handleOpenDialer();
      } else if (method === "Scan") {
        handleOpenQrDialer();
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Methods</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedMethods.includes("Cash") && styles.selectedButton,
          ]}
          onPress={() => handleMethodToggle("Cash")}
        >
          <FaMoneyBillAlt
            size={16}
            color={selectedMethods.includes("Cash") ? "#3a5565" : "#6e6e6e"}
          />
          <Text
            style={[
              styles.buttonText,
              selectedMethods.includes("Cash") && styles.selectedText,
            ]}
          >
            Cash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled
          style={[
            styles.button,
            selectedMethods.includes("Card") && styles.selectedButton,
          ]}
        >
          <FaCreditCard
            size={16}
            color={selectedMethods.includes("Card") ? "#3a5565" : "#6e6e6e"}
          />
          <Text
            style={[
              styles.buttonText,
              selectedMethods.includes("Card") && styles.selectedText,
            ]}
          >
            Card
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            selectedMethods.includes("Scan") && styles.selectedButton,
          ]}
          onPress={() => handleMethodToggle("Scan")}
        >
          <FaQrcode
            size={16}
            color={selectedMethods.includes("Scan") ? "#3a5565" : "#6e6e6e"}
          />
          <Text
            style={[
              styles.buttonText,
              selectedMethods.includes("Scan") && styles.selectedText,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FCFCFC",
    borderRadius: 8,
  },
  title: {
    fontFamily: "GoogleSans-Regular",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#999",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedButton: {
    borderColor: "#3a5565",
    backgroundColor: "#d0dce1",
  },
  buttonText: {
    fontFamily: "GoogleSans-Regular",
    fontSize: 14,
    color: "#6e6e6e",
    marginLeft: 4,
  },
  selectedText: {
    color: "#3a5565",
  },
});

export default PaymentMethodSelector;