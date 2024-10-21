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

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1024;
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: isMobile ? 8 : isTablet ? 8 : 10,
    margin: isMobile ? 7 : isTablet ? 6 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: isMobile ? 180 : isTablet ? 205 : 240,
  },
  cardImageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cardImage: {
    width: isMobile ? 45 : isTablet ? 55 : 60,
    height: isMobile ? 45 : isTablet ? 55 : 60,
    resizeMode: "cover",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardTitle: {
    fontFamily: "Kanit, GoogleSans",
    fontSize: isMobile ? 12 : isTablet ? 15 : 16,
    fontWeight: "medium",
    marginTop: isMobile ? 4 : isTablet ? 8 : 10,
  },
  cardDescription: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 11 : isTablet ? 13 : 14,
    color: "#666",
    marginTop: isMobile ? 3 : isTablet ? 4 : 5,
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: isMobile ? 4 : isTablet ? 8 : 10,
  },
  cardPrice: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 14 : isTablet ? 17 : 18,
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
    paddingHorizontal: isMobile ? 8 : 10,
    paddingVertical: isMobile ? 4 : 5,
  },
  quantityButtonText: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 14 : 16,
  },
  quantityText: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 14 : 16,
    marginHorizontal: isMobile ? 8 : 10,
  },
});
