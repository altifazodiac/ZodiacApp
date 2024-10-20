import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated, 
  Platform, Easing
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Option, Product } from "../Data/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  currentProduct: Product | null;
  selectedOptions: { [key: string]: Option[] };
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<{ [key: string]: Option[] }>
  >;
  addItemToOrder: (product: Product, options: Option[]) => void;
}

const OptionItem: React.FC<{
  option: Option;
  isSelected: boolean;
  onPress: () => void;
}> = ({ option, isSelected, onPress }) => (
  <View style={styles.gridItem}>
    <TouchableOpacity
      style={[
        styles.buttonOption,
        isSelected ? styles.activeButton : styles.inactiveButton,
      ]}
      onPress={onPress}
      activeOpacity={1}
    >
      <Text style={isSelected ? styles.activeText : styles.inactiveText}>
        {option.name} - {option.price}฿
      </Text>
    </TouchableOpacity>
  </View>
);

const OrderDetailsModal: React.FC<Props> = ({
  visible,
  onClose,
  currentProduct,
  selectedOptions,
  setSelectedOptions,
  addItemToOrder,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(Dimensions.get("window").height)).current; // Start off-screen

  useEffect(() => {
    const animationConfig = {
      toValue: visible ? 0 : Dimensions.get("window").height, // Slide in or out
      duration: visible ? 400 : 300, // Longer duration for slide-in
      useNativeDriver: true,
      easing: Platform.OS === "ios" ? Easing.inOut(Easing.ease) : Easing.bezier(0.4, 0.0, 0.2, 1), // Different easing
    };

    Animated.timing(slideAnim, animationConfig).start(() => {
      if (!visible) {
        onClose(); // Close the modal when animation ends
      }
    });
  }, [visible]);

  const sampleOptions: Option[] = [
    { id: "opt1", name: "Extra Cheese", price: 10 },
    { id: "opt2", name: "Spicy Sauce", price: 5 },
    { id: "opt3", name: "Double Meat", price: 20 },
  ];

  const handleOptionPress = (option: Option) => {
    if (!currentProduct) return;

    setSelectedOptions((prevOptions) => {
      const productOptions = prevOptions[currentProduct.id] || [];
      const optionExists = productOptions.some((o) => o.name === option.name);

      const updatedOptions = optionExists
        ? productOptions.filter((o) => o.name !== option.name)
        : [...productOptions, option];

      return { ...prevOptions, [currentProduct.id]: updatedOptions };
    });
  };

  return (
    <Modal transparent={true} visible={visible} animationType="none">
      <View style={styles.centeredView}>
        <Animated.View
          style={[
            styles.modalView,
            { transform: [{ translateY: slideAnim }] }, // Slide animation
          ]}
        >
          <Text style={styles.modalText}>
            Order Details for{" "}
            {currentProduct?.nameDisplay || "No Product Selected"}
          </Text>

          <View style={styles.contentContainer}>
            <ScrollView ref={scrollViewRef} style={styles.scrollView}>
              {sampleOptions.map((option) => {
                const isSelected = (
                  selectedOptions[currentProduct?.id || ""] || []
                ).some((o) => o.name === option.name);
                return (
                  <OptionItem
                    key={option.id}
                    option={option}
                    isSelected={isSelected}
                    onPress={() => handleOptionPress(option)}
                  />
                );
              })}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (!currentProduct) return;
                  addItemToOrder(
                    currentProduct,
                    selectedOptions[currentProduct?.id || ""] || []
                  );
                  onClose();
                }}
              >
                <Text style={styles.addButtonText}>Add to Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default OrderDetailsModal;


const isMobile = false;
const { width, height } = Dimensions.get("window");
const isLandscape = width > height; // Check if the screen is in landscape mode
const isTablet = width > 600; // Assume tablet view if width > 600
const styles = StyleSheet.create({
  container: isMobile
    ? {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }
    : {
        flexDirection: "row",
        width: "100%",
        height: "100%",
      },
      centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      },
      modalView: {
        width: "80%",
        height: "65%",
        backgroundColor: "white",
        borderRadius: 15,
        padding: 20,
        alignItems: "center",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      modalText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
      },
      contentContainer: {
        flex: 1,
        width: "100%", // Full width for the content
        justifyContent: "space-between", // Space between ScrollView and buttons
      },
      scrollView: {
        flex: 1, // Allow ScrollView to take available space
        maxHeight: "80%",
        width: "100%",
      },
      buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly", // Buttons centered with space between
        marginTop: 10,
        paddingBottom: 10, // Align buttons closer to the bottom
      },
      addButton: {
        backgroundColor: "#2196F3",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        width: "40%",
        height: 50,
        alignItems: "center",
        justifyContent: "center", // Center text in the button
      },
      addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
      },
      closeButton: {
        backgroundColor: "#cccccc",
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        width: "40%",
        height: 50,
        alignItems: "center",
        justifyContent: "center", // Center text in the button
      },
      closeButtonText: {
        color: "#333",
        fontSize: 16,
      },
      gridItem: {
        width: "100%", // Full width for the grid items
        marginBottom: 20,
      },    
   
 
  buttonOption: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25, // Rounded corners for buttons
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 25,
    marginVertical: 8, // More vertical space
  },
  
  activeButton: {
    borderColor: "#6a1b9a", // Stronger color for active state
  },
  inactiveButton: {
    borderColor: "lightgray",
  },
  activeText: {
    color: "#6a1b9a", // Stronger active text color
    fontSize: 16,
  },
  inactiveText: {
    color: "gray",
    fontSize: 16,
  },
});