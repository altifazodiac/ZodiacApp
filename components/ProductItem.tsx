import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Vibration,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Product } from "../Data/types";

interface Props {
  item: Product;
  itemQuantity: number;
  handleIncreaseQuantity: () => void;
  handleDecreaseQuantity: () => void;
  onLongPress: () => void;
}

const ProductItem: React.FC<Props> = ({
  item,
  itemQuantity,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  onLongPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity
  const slideAnim = useRef(new Animated.Value(30)).current; // Initial position (30 units below)
  const scaleAnim = useRef(new Animated.Value(1)).current; // Initial scale

  useEffect(() => {
    // Fade-in and slide-up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Function to handle press in (scaling animation)
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  // Function to handle press out (scaling animation)
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        handleIncreaseQuantity();
        Vibration.vibrate();
      }}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.imageUrl || "https://via.placeholder.com/100" }}
            style={styles.cardImage}
          />
          <View>
            <Text style={styles.cardTitle}>{item.nameDisplay}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        </View>
        <View style={styles.priceQuantityContainer}>
          <Text style={styles.cardPrice}>{item.price}฿</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={() => {
                handleDecreaseQuantity();
                Vibration.vibrate();
              }}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{itemQuantity}</Text>
            <TouchableOpacity
              onPress={() => {
                handleIncreaseQuantity();
                Vibration.vibrate();
              }}
              style={styles.quantityButton}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ProductItem;

const isMobile = false;
const isTablet = true; // Adjust based on your logic for detecting tablet
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: isMobile ? 10 : isTablet ? 12 : 15,
    margin: isMobile ? 5 : isTablet ? 8 : 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: isMobile ? 180 : isTablet ? 220 : 250,
  },
  cardImageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cardImage: {
    width: isMobile ? 50 : isTablet ? 55 : 60,
    height: isMobile ? 50 : isTablet ? 55 : 60,
    resizeMode: "cover",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardTitle: {
    fontFamily: "Kanit, GoogleSans",
    fontSize: isMobile ? 14 : isTablet ? 15 : 16,
    fontWeight: "medium",
    marginTop: isMobile ? 5 : isTablet ? 8 : 10,
  },
  cardDescription: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 12 : isTablet ? 13 : 14,
    color: "#666",
    marginTop: isMobile ? 3 : isTablet ? 4 : 5,
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: isMobile ? 5 : isTablet ? 8 : 10,
  },
  cardPrice: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 16 : isTablet ? 17 : 18,
    fontWeight: "bold",
    marginLeft: "15%",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  quantityButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quantityButtonText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
  },
  quantityText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    marginHorizontal: 10,
  },
});
