import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

interface PaymentMethodSelectorProps {
  onMethodSelect: (method: string) => void;
  handleOpenDialer: () => void;
  handleOpenQrDialer: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onMethodSelect,
  handleOpenDialer,
  handleOpenQrDialer,
}) => {
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  const handleMethodToggle = (method: string) => {
    const isMethodSelected = selectedMethods.includes(method);
    const newSelectedMethods = isMethodSelected
      ? selectedMethods.filter((m) => m !== method)
      : [...selectedMethods, method];

    setSelectedMethods(newSelectedMethods);
    onMethodSelect(method);

    // Open modals only if method is selected (not unselected)
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
          <Ionicons
            name="cash-outline"
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
          style={[
            styles.button,
            selectedMethods.includes("Card") && styles.selectedButton,
          ]}
          onPress={() => handleMethodToggle("Card")}
        >
          <FontAwesome5
            name="credit-card"
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
          <Ionicons
            name="qr-code-outline"
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
    fontFamily: "GoogleSans",
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
    fontFamily: "GoogleSans",
    fontSize: 14,
    color: "#6e6e6e",
    marginLeft: 4,
  },
  selectedText: {
    color: "#3a5565",
  },
});

export default PaymentMethodSelector;
