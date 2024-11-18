import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  Platform,
  Easing,
} from "react-native";
import { Option, Product } from "../Data/types"; // Ensure proper import
import { ref, onValue } from "firebase/database";
import { database } from "../app/firebase";

interface Props {
  visible: boolean;
  onClose: () => void;
  currentProduct: Product | null;
  selectedOptions: { [key: string]: Option[] };
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<{ [key: string]: Option[] }>
  >;
  addItemToOrder: (
    product: Product,
    options: Option[],
   
  ) => void;
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


  const [options, setOptions] = useState<Option[]>([]);

  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slideValue = visible ? 0 : Dimensions.get("window").height;
    const opacityValue = visible ? 1 : 0;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: slideValue,
        duration: visible ? 400 : 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: opacityValue,
        duration: visible ? 400 : 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!visible) {
        onClose();
      }
    });
  }, [visible]);

  useEffect(() => {
    const optionsRef = ref(database, "OrderDetail");

    const unsubscribe = onValue(optionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedOptions: Option[] = Object.keys(data).map((key) => ({
          id: key,
          name: data[key].name,
          price: data[key].price,
          status: data[key].status,
        }));
        setOptions(formattedOptions);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOptionPress = (option: Option) => {
    if (!currentProduct) return;

    setSelectedOptions((prevOptions) => {
      const productOptions = prevOptions[currentProduct.id] || [];
      const optionExists = productOptions.some(
        (o: Option) => o.name === option.name
      ); // Explicit type

      const updatedOptions = optionExists
        ? productOptions.filter((o: Option) => o.name !== option.name) // Explicit type
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
            { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.modalText}>
            Details for {currentProduct?.nameDisplay || "No Product Selected"}
          </Text>

          <View style={styles.contentContainer}>
            <ScrollView ref={scrollViewRef} style={styles.scrollView}>
              <View style={styles.optionsGrid}>
                {options
                  .filter((option) => option.status !== false)
                  .map((option) => {
                    const isSelected = (
                      selectedOptions[currentProduct?.id || ""] || []
                    ).some((o: Option) => o.name === option.name);

                    return (
                      <OptionItem
                        key={option.id}
                        option={option}
                        isSelected={isSelected}
                        onPress={() => handleOptionPress(option)}
                      />
                    );
                  })}
              </View>
             </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (!currentProduct) return;
               
                  addItemToOrder(
                    currentProduct,
                    selectedOptions[currentProduct?.id || ""] || [],
                    
                  );
              
                  onClose();
                }}
              >
                <Text style={styles.addButtonText}>Add</Text>
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
      // Modal view
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
        position: "relative", // Added relative positioning
      },
   
      // Content Container
      contentContainer: {
        flex: 1,
        width: "100%", // Full width for the content
        justifyContent: "space-between", // Space between ScrollView and buttons
      },
      scrollView: {
        flex: 1, // Allow ScrollView to take available space
        maxHeight: "80%",
        width: "100%",
        paddingRight: 20, // Ensure enough space for character count
      },
      
  
  modalText: {
    fontFamily: "GoogleSans, Kanit",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly", // Buttons centered with space between
    marginTop: 10,
    paddingBottom: 10, // Align buttons closer to the bottom
  },
  addButton: {
    backgroundColor: "#3a5565",
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
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  // Styles for each button
  gridItem: {
    width: "45%", // Adjusts to display two buttons per row
    marginBottom: 10,
  },
  buttonOption: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  activeButton: {
    borderColor: "#3a5565",
    borderWidth: 3,
  },
  inactiveButton: {
    backgroundColor: "#fff",
    borderColor: "transparent",
  },
  activeText: {
    color: "#3a5565",
    fontWeight: "bold",
  },
  inactiveText: {
    color: "#666",
  },
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 25,
    marginVertical: 8, // More vertical space
  },
});
