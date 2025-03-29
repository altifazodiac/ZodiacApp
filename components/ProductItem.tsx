import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, Vibration, TouchableOpacity, Dimensions, Easing } from "react-native";
import { Product, Settings } from "../Data/types";
import { getDatabase, onValue, ref } from "firebase/database";
import FastImage from 'expo-fast-image';
import { theme } from "../components/theme";

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
  const [settings, setSettings] = useState<Settings | null>(null);
  const currentTheme = theme.light;  
  useEffect(() => {
    const db = getDatabase();
    const settingsRef = ref(db, "settings/OrderPanels/displaySize");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const displaySize = snapshot.val();
      setSettings((prevSettings) => ({
        ...prevSettings,
        OrderPanels: {
          displaySize: displaySize ?? false,
          displayDiscount: prevSettings?.OrderPanels?.displayDiscount ?? false,
          discountValue: prevSettings?.OrderPanels?.discountValue ?? 0,
          displayTax: prevSettings?.OrderPanels?.displayTax ?? false,
          taxValue: prevSettings?.OrderPanels?.taxValue ?? 0,
          displayServiceCharge: prevSettings?.OrderPanels?.displayServiceCharge ?? false,
          serviceChargeValue: prevSettings?.OrderPanels?.serviceChargeValue ?? 0,
          largeimage: prevSettings?.OrderPanels?.largeimage ?? false,
          ordersListPaper: prevSettings?.OrderPanels?.ordersListPaper ?? false,
          isPercentage: prevSettings?.OrderPanels?.isPercentage ?? false,
        },
      }));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { 
      toValue: 0.95, 
      duration: 50, // Shorter duration for a quicker animation
      useNativeDriver: true 
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { 
      toValue: 1, 
      speed: 15,  
      bounciness: 5, 
      useNativeDriver: true 
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => { handleIncreaseQuantity();  Vibration.vibrate(); }}
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
            borderColor: itemQuantity >= 1 ? "#3a5565" : "transparent",
            borderWidth: itemQuantity >= 1 ? 2 : 0,
          },
        ]}
      >
        {settings?.OrderPanels?.displaySize && (
          <View
            style={[
              styles.circleSize,
              item.productSize === "S" ? { backgroundColor: "#e9f0f4" } : item.productSize === "M" ? { backgroundColor: "#dee9ee" } : item.productSize === "XL" ? { backgroundColor: "#d0dce1" } :  item.productSize === "T" ? { backgroundColor: "#eeeeee" } :{ },
            ]}
          >
            <Text style={[styles.circleText,{color: currentTheme.textDarkColor}]}>{item.productSize}</Text>
          </View>
        )}
        <View style={styles.cardImageContainer}>
          <FastImage
            source={{ uri: item.imageUrl || "https://picsum.photos/100" }}
            style={styles.cardImage}
            cacheKey={item.id} // Cache key for offline support
          />
        </View>
        <View style={styles.cardContent}>
          <View>
            <Text style={[styles.cardTitle,{ color: currentTheme.textColor }]}>{item.nameDisplay}</Text>
            <Text style={[styles.cardDescription,{ color: currentTheme.textColor }]}>{item.description}</Text>
            <Text style={styles.cardPrice}>{item.price}฿</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => { handleDecreaseQuantity(); Vibration.vibrate(); }} style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{itemQuantity}</Text>
              <TouchableOpacity onPress={() => { handleIncreaseQuantity(); Vibration.vibrate(); }} style={styles.quantityButtonleft}>
                <Text style={styles.quantityButtonTextleft}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default ProductItem;

const windowWidth = Dimensions.get("window").width;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1200;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fcfdfe",
    borderRadius: 25,
    borderColor:"#fff",
    borderWidth: 5,
    padding: isMobile ? 6 : isTablet ? 6 : 12,
    margin: isMobile ? 6 : isTablet ? 6 : 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    width: isMobile ? 120 : isTablet ? 155 : 250,
    height: isMobile ? 150 : isTablet ? 205 : 330,
    flexDirection: 'column',  
    alignItems: 'center',    
    position: 'relative',
  },
  circleSize: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    position: 'absolute', 
    marginTop: isMobile ? 0 : isTablet ? 0 : -12,
    right: 18, 
    opacity: 0.7,
    zIndex: 1, 
  },
  circleText: {
    fontFamily: "GoogleSans-Regular",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardImageContainer: {
    width: "100%",
    alignItems: "center",
    height: isMobile ? "40%" : isTablet ? "45%" : "50%",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain", 
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: '100%',  
  alignItems: 'center', 
  margin: isMobile ? 3 : isTablet ? 5 : 6,
  },
 
  cardTitle: {
    fontFamily: "Kanit",
    fontSize: isMobile ? 12 : isTablet ? 16 : 18,
    
    marginTop: isMobile ? 4 : isTablet ? 4 : 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontFamily: "GoogleSans-Regular",
    fontSize: isMobile ? 8 : isTablet ? 10 : 15,
 
    marginTop: 1,
    textAlign: 'center',
  },
  
  cardPrice: {
    fontFamily: "GoogleSans-Regular",
    fontSize: isMobile ? 14 : isTablet ? 18 : 20,
    fontWeight: "bold",
    textAlign: 'center',
    color: "#3a5665",
    margin: isMobile ? 3 : isTablet ? 5 : 6,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: isMobile ? 20 : isTablet ? 20 : 50,
    overflow: 'hidden', // This is important for the button shapes
    backgroundColor: '#eeeeee',
    width: isMobile ? 90 : isTablet ? 110 : 200,
    height: isMobile ? 22 : isTablet ? 30 : 50,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  quantityButton: {
    backgroundColor: '#fff', 
    borderRadius: 50,
    width: isMobile? 20 : isTablet? 25 : 42,
   
    justifyContent: "center",
    alignItems: "center",
    
    aspectRatio: 1, 
  },
   quantityButtonText: {
    paddingBottom: isMobile ? 2 :isTablet ? 2 : 10,
    fontSize: isMobile ? 16 : isTablet ? 18 : 38,
  
  },
  quantityButtonleft: {
    backgroundColor: '#3a5565', 
    borderRadius: 50,
    width: isMobile? 20 : isTablet? 25 : 42,
    
    justifyContent: "center",
    alignItems: "center",
    
    aspectRatio: 1, 
  },
   quantityButtonTextleft: {
    paddingBottom: isMobile ? 2 :isTablet ? 2 : 10,
    fontSize: isMobile ? 12 : isTablet ? 18 : 38,
    color: '#fff',
  },
  quantityText: {
    fontFamily: "GoogleSans-Regular",
    fontSize: isMobile ? 12 : isTablet ? 16 : 18,
    marginHorizontal: isMobile ? 4 : isTablet ? 8 : 10,
  },
});
