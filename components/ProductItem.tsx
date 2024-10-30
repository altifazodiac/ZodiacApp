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
  Dimensions,
} from "react-native";
import { Product } from "../Data/types";

interface Props {
  item: Product;
  itemQuantity: number;
  handleIncreaseQuantity: () => void;
  handleDecreaseQuantity: () => void;
  onLongPress: () => void;
  toggleDrawer: () => void;
}

const ProductItem: React.FC<Props> = ({
  item,
  itemQuantity,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  toggleDrawer,
  onLongPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

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
        toggleDrawer();
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
            borderColor: itemQuantity >= 1 ? "#9969c7" : "transparent", // Conditional border color
            borderWidth: itemQuantity >= 1 ? 2 : 0, // Set border width based on quantity
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
          <View
            style={[
              styles.circleSize,
              item.productSize === "S"
                ? { backgroundColor: "#FFE5CC" }
                : item.productSize === "M"
                ? { backgroundColor: "#DCEFFF" }
                : item.productSize === "XL"
                ? { backgroundColor: "#E5CCFF" }
                : { backgroundColor: "#fff" }, // Default color if none match
            ]}
          >
            <Text
              style={[
                styles.circleText,
                item.productSize === "S"
                  ? { color: "#FF7700" }
                  : item.productSize === "M"
                  ? { color: "#0089FF" }
                  : item.productSize === "XL"
                  ? { color: "#8313CD" }
                  : { color: "#000" }, // Default text color if none match
              ]}
            >
              {item.productSize}
            </Text>
          </View>
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

const windowWidth = Dimensions.get("window").width;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1200; // Adjusted for iPad screen size support

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: isMobile ? 6 : isTablet ? 6 : 12,
    margin: isMobile ? 6 : isTablet ? 6 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: isMobile ? 180 : isTablet ? 200 : 300,
  },
  cardImageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cardImage: {
    width: isMobile ? 50 : isTablet ? 50 : 75,
    height: isMobile ? 50 : isTablet ? 50 : 75,
    resizeMode: "cover",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    left: -8,
  },
  cardTitle: {
    fontFamily: "Kanit, GoogleSans",
    fontSize: isMobile ? 12 : isTablet ? 14 : 18,
    fontWeight: "500",
    marginTop: isMobile ? 4 : isTablet ? 4 : 8,
  },
  cardDescription: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 11 : isTablet ? 14 : 15,
    color: "#666",
    marginTop: isMobile ? 3 : isTablet ? 5 : 6,
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
   
  },
  cardPrice: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 14 : isTablet ? 18 : 20,
    fontWeight: "bold",
    marginLeft: "10%",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  quantityButton: {
    paddingHorizontal: isMobile ? 6 : isTablet ? 10 : 12,
    paddingVertical: isMobile ? 4 : isTablet ? 6 : 8,
  },
  quantityButtonText: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 14 : isTablet ? 16 : 18,
  },
  quantityText: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 14 : isTablet ? 16 : 18,
    marginHorizontal: isMobile ? 6 : isTablet ? 8 : 10,
  },
  circleSize: {
    width: 25, // Set a width value
    height: 25, // Set the same height value
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 50, // Half of width/height to make it a circle
    padding: 5,
  },
  circleText: {
    fontSize: 12,
  },
});
