import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  PanResponder,
  Easing,
  ScrollView,
  Platform,
  ActivityIndicator,
  Vibration,
  Modal,
} from "react-native";
import { db, ref, onValue, database } from "./firebase";
import { Ionicons } from "@expo/vector-icons";

const windowWidth = Dimensions.get("window").width;
const isMobile = windowWidth <= 768; // Adjust this breakpoint based on your needs
 
type Product = {
  id: string;
  nameDisplay: string;
  price: string;
  imageUrl: string | null;
  categoryId: string;
  status: string;
  description: string;
  itemQuantity?: number;
  
};

type Category = {
  id: string;
  name: string;
};

interface ProductData {
  nameDisplay: string;
  price: string;
  imageUrl: string | null;
  categoryId: string;
  status: string;
  description: string;
}
 

const PosOrders = () => {
  const calculateNumColumns = useCallback(() => {
    const screenWidth = Dimensions.get("window").width;
    if (screenWidth < 500) return 2;
    if (screenWidth < 900) return 3;
    return 4;
  }, []);


  const [optionModalVisible, setOptionModalVisible] = useState(false); // State for OptionModal
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false); // State for OrderDetailModal
  const [isLoading, setIsLoading] = useState(true);
  const [numColumns, setNumColumns] = useState(calculateNumColumns());
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<
  { product: Product; quantity: number; selectedOptions: { name: string; price: number }[] }[]
  >([]);  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const [status, setStatus] = useState<boolean>(false);
  const drawerHeight = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const [quantity, setQuantity] = useState(0);
 const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(-20)).current;
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); 
 
  const { height } = Dimensions.get('window');
 
  useEffect(() => {
    const categoriesRef = ref(db, "categories");
    const productsRef = ref(db, "products");
    
    const categoriesListener = onValue(categoriesRef, (snapshot) => {
      const categoriesData = snapshot.val();
      const formattedCategories = categoriesData
        ? Object.keys(categoriesData).map((key) => ({
            id: key,
            name: categoriesData[key].name,
          }))
        : [];
      setCategories([{ id: "All", name: "All" }, ...formattedCategories]);
    });

    const productsListener = onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val();
      const formattedProducts = productsData
        ? Object.entries(productsData).map(([id, product]) => {
            const productData = product as ProductData;
            return {
              id,
              nameDisplay: productData.nameDisplay,
              price: productData.price,
              imageUrl: productData.imageUrl,
              categoryId: productData.categoryId,
              status: productData.status,
              description: productData.description,
            };
          })
        : [];
      setProducts(formattedProducts);
    });

    
    return () => {
      categoriesListener();
      productsListener();
     
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width);
      setNumColumns(calculateNumColumns());
    };

    const subscription = Dimensions.addEventListener("change", handleResize);
    return () => {
      subscription.remove();
    };
  }, [calculateNumColumns]);

  const isMobile = windowWidth <= 768;

  const filteredProducts =
    selectedCategory && selectedCategory !== "All"
      ? products.filter(
          (product) =>
            product.categoryId === selectedCategory &&
            Boolean(product.status) === true
        )
      : products.filter((product) => Boolean(product.status) === true);

      const addItemToOrder = (product: Product, selectedOptions: { name: string; price: number }[] = []) => {
        setOrderItems((prevOrderItems) => {
          const existingItem = prevOrderItems.find((item) => item.product.id === product.id);
          if (existingItem) {
            return prevOrderItems.map((item) =>
              item.product.id === product.id
                ? { 
                    ...item, 
                    quantity: item.quantity + 1, 
                    selectedOptions: [...item.selectedOptions, ...selectedOptions] 
                  }
                : item
            );
          } else {
            return [...prevOrderItems, { product, quantity: 1, selectedOptions }];
          }
        });
      };
  const removeItemFromOrder = (id: string) => {
    setOrderItems(orderItems.filter((item) => item.product.id !== id));
  };
  const renderProductItem = ({ item }: { item: Product }) => {
    const orderItem = orderItems.find(
      (orderItem) => orderItem.product.id === item.id
    );
    const itemQuantity = orderItem ? orderItem.quantity : 0;

    const handleIncreaseQuantity = () => addItemToOrder(item);

    const handleDecreaseQuantity = () => {
      if (itemQuantity > 1) {
        // Changed to 1 to trigger remove at 0
        setOrderItems((prevOrderItems) =>
          prevOrderItems.map((orderItem) =>
            orderItem.product.id === item.id
              ? { ...orderItem, quantity: orderItem.quantity - 1 }
              : orderItem
          )
        );
      }
      if (itemQuantity <= 1) {
        // Changed to 1 to trigger remove at 0
        removeItemFromOrder(item.id); // Directly use item.id
      }
    };

     

    return (
      <TouchableOpacity
        onPress={() => {
          addItemToOrder(item);
          toggleDrawer();
          Vibration.vibrate();
        }}
        onLongPress= {() => setOrderDetailModalVisible(true)} 
      >
        <View style={styles.card}>
          <View style={styles.cardImageContainer}>
            <Image
              source={{
                uri: item.imageUrl || "https://via.placeholder.com/100",
              }}
              style={styles.cardImage}
            />
            <View>
              <Text style={[styles.cardTitle, { fontFamily: "Kanit-Regular" }]}>
                {item.nameDisplay}
              </Text>
              <Text
                style={[styles.cardDescription, { fontFamily: "GoogleSans" }]}
              >
                {item.description}
              </Text>
            </View>
          </View>
          <View style={styles.priceQuantityContainer}>
            <Text style={[styles.cardPrice, { fontFamily: "GoogleSans" }]}>
              {item.price}฿
            </Text>
            {!isMobile && (
               <TouchableOpacity 
               onPress= {() => setOrderDetailModalVisible(true)} 
               style={styles.buttonDetail}
             >
               <Text style={[styles.buttonTextDetail, { fontFamily: "GoogleSans,Kanit-Regular", color: "Black" }]}>
                 Add More
               </Text>
             </TouchableOpacity>
            )}
           
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
        </View>
      </TouchableOpacity>
    );
  };

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(drawerHeight, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(drawerOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.parallel([
        Animated.timing(drawerHeight, {
          toValue: screenHeight * 1.2,
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(drawerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) =>
      Math.abs(gestureState.dy) > 20,
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawerOpen && gestureState.dy < 0) {
        Animated.event([null, { dy: drawerHeight }], {
          useNativeDriver: false,
        })(evt, gestureState);
      } else if (isDrawerOpen && gestureState.dy > 0) {
        Animated.event([null, { dy: drawerHeight }], {
          useNativeDriver: false,
        })(evt, gestureState);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!isDrawerOpen && gestureState.dy < -50) {
        toggleDrawer();
      } else if (isDrawerOpen && gestureState.dy > 50) {
        toggleDrawer();
      }
    },
  });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );
  const discount = subtotal > 50 ? 5 : 0;
  const total = subtotal - discount;

  
  const OrderDetailModal = ({
    visible,
    onClose,
    products, // Receive the products as a prop
  }: {
    visible: boolean;
    onClose: () => void;
    products: Product[]; // Define the type of the products prop
  }) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const modalAnimation = useRef(new Animated.Value(screenHeight)).current;
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const animatedValues = useRef<Animated.Value[]>([]);
    const colorAnims = useRef<Animated.Value[]>([]);
    const [isPressed, setIsPressed] = useState<number | null>(null);
    const [activeButtons, setActiveButtons] = useState<string[]>([]);
    const [optionModalVisible, setOptionModalVisible] = useState<boolean>(false);
  
    const handlePress = (product: Product) => {
      setSelectedProduct(product);
      setOptionModalVisible(true);
    };
  
    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.timing(modalAnimation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]).start();
      } else {
        Animated.sequence([
          Animated.timing(modalOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(modalAnimation, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      }
    }, [visible]);
  
    return (
      <Modal transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <Animated.View
            style={[
              styles.modalView,
              {
                opacity: modalOpacity,
                transform: [{ translateY: modalAnimation }],
              },
            ]}
          >
            <Text style={styles.modalText}>Order Details</Text>
            {products.map((product, index) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.button,
                  { margin: 10 },
                  activeButtons.includes(product.id)
                    ? styles.activeButton
                    : styles.inactiveButton,
                ]}
                onPressIn={() => {
                  Animated.spring(animatedValues.current[index], {
                    toValue: 0.95,
                    useNativeDriver: true,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(animatedValues.current[index], {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                }}
                onPress={() => {
                  handlePress(product);
                  setActiveButtons((prevActiveButtons) =>
                    prevActiveButtons.includes(product.id)
                      ? prevActiveButtons.filter((id) => id !== product.id)
                      : [...prevActiveButtons, product.id]
                  );
                }}
                activeOpacity={1}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: animatedValues.current[index] }],
                  }}
                >
                  <Text
                    style={
                      activeButtons.includes(product.id)
                        ? styles.activeText
                        : styles.inactiveText
                    }
                  >
                    {product.nameDisplay}
                  </Text>
                  <Text>Price: {product.price}</Text>
                  {product.itemQuantity && (
                    <Text>Quantity: {product.itemQuantity}</Text>
                  )}
                </Animated.View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.textStyle}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  return (
    <View style={isMobile ? styles.containerMobile : styles.container}>
   <OrderDetailModal
  visible={orderDetailModalVisible}
  onClose={() => setOrderDetailModalVisible(false)}
  products={filteredProducts} // Pass filtered products to the modal
/>
      <View style={isMobile ? styles.layoutMobile : styles.layout1}>
        {Platform.OS === "web" ? (
          <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
            <View style={styles.productListContainer}>
              <View style={styles.tabsContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={
                      selectedCategory === category.id
                        ? styles.tabActive
                        : styles.tab
                    }
                    onPress={() => {
                      setSelectedCategory(
                        category.id === "All" ? null : category.id
                      );
                      Vibration.vibrate();
                    }}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        selectedCategory === category.id
                          ? styles.tabTextActive
                          : null,
                        { fontFamily: "GoogleSans" },
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                key={numColumns}
                initialNumToRender={numColumns * 2}
                contentContainerStyle={styles.productListContainer}
              />
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.productListContainer}>
            <View style={styles.tabsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
                <View style={styles.tabsContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={
                        selectedCategory === category.id
                          ? styles.tabActive
                          : styles.tab
                      }
                      onPress={() => {
                        setSelectedCategory(
                          category.id === "All" ? null : category.id
                        );
                        Vibration.vibrate();
                      }}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          selectedCategory === category.id
                            ? styles.tabTextActive
                            : null,
                          { fontFamily: "GoogleSans" },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {categories.length > 4 && (
                <View style={styles.scrollHintIcon}>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={24}
                    color="#9969c7"
                  />
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              key={numColumns}
              initialNumToRender={numColumns * 2}
              contentContainerStyle={styles.productListContainer}
            />
            </ScrollView>
            {isMobile && (
              <Animated.View style={[styles.drawerToggleButton]}>
                <TouchableOpacity onPress={toggleDrawer}>
                  <Ionicons
                    name={
                      isDrawerOpen
                        ? "chevron-down-circle-outline"
                        : "chevron-up-circle-outline"
                    }
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
      </View>
      {isMobile && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.animatedDrawer,
            { height: drawerHeight, opacity: drawerOpacity },
          ]}
        >
          <View style={styles.orderSummaryContainer}>
            <Text
              style={[styles.orderSummaryTitle, { fontFamily: "GoogleSans" }]}
            >
              Order Summary
            </Text>
            {orderItems.map((item, index) => {
  
  const optionsText = item.selectedOptions.map(option => option.name).join(', ');

  return (
    <View key={index} style={styles.orderItem}>
      <View style={styles.orderItemTextContainer}> 
        <Text style={[{ fontFamily: "Kanit-Regular" }]}>
          {item.product.nameDisplay} 
        </Text>
        {optionsText ? <Text style={styles.optionsText}>({optionsText})</Text> : null}
      </View>
      <View style={styles.orderItemQuantityContainer}>
        <Text style={[{ fontFamily: "GoogleSans" }]}>
          {item.quantity} x {parseFloat(item.product.price).toFixed(2)}฿ 
        </Text>
        {optionsText ? <Text style={styles.optionsPriceText}>
          (+{item.selectedOptions.reduce((sum, option) => sum + option.price, 0).toFixed(2)}฿)
        </Text> : null}
      </View>
      <Text style={styles.orderItemPrice}>
        
        {(
          item.quantity * 
          (parseFloat(item.product.price) + 
          item.selectedOptions.reduce((sum, option) => sum + option.price, 0))
        ).toFixed(2)}฿ 
      </Text>
      <TouchableOpacity onPress={() => removeItemFromOrder(item.product.id)}>
        <Text style={styles.removeItemText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
})}

            <View style={styles.orderTotalContainer}>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>
                  Total Quantity:
                </Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Subtotal:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {subtotal.toFixed(2)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Discount:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {discount.toFixed(2)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {total.toFixed(2)}฿
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.proceedButton}>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      {!isMobile && (
        <View style={styles.layout2}>
          <View style={styles.orderSummaryContainer}>
            <Text
              style={[styles.orderSummaryTitle, { fontFamily: "GoogleSans" }]}
            >
              Order Summary
            </Text>
            {orderItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={[{ fontFamily: "Kanit-Regular" }]}>
                  {item.product.nameDisplay}
                </Text>
                <Text style={[{ fontFamily: "GoogleSans" }]}>
                  {item.quantity}
                </Text>
                <Text style={[{ fontFamily: "GoogleSans" }]}>
                  {(item.quantity * parseFloat(item.product.price)).toFixed(2)}฿
                </Text>
                <TouchableOpacity
                  onPress={() => removeItemFromOrder(item.product.id)}
                >
                  <Text style={styles.removeItemText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.orderTotalContainer}>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>
                  Total Quantity:
                </Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Subtotal:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {subtotal.toFixed(2)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Discount:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {discount.toFixed(2)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {total.toFixed(2)}฿
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.proceedButton}>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    
  },
  activeButton: {
    borderColor: '#9969c7', // Blue border when active
    backgroundColor: '#9969c7', // Blue background when active
  },
  inactiveButton: {
    borderColor: 'gray', // Gray border when inactive
  },
  activeText: {
    color: '#fff', // Blue text when active
    fontSize: 16,
  },
  inactiveText: {
    color: 'gray', // Gray text when inactive
    fontSize: 16,
  },
  buttonDetail: {
    alignItems: 'center',
    backgroundColor: '#eeeeee',
    height: 30,
    padding: 10,
   borderRadius: 10,
   marginTop: 2,
  },
  buttonTextDetail: {
    bottom: 3,
    fontSize: 12,
 },
  layout1: {
    width: "64%",
    justifyContent: "center",
    alignItems: "center",
  },
  layout2: {
    width: "36%",
    height: "100%",
    padding: 10,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  tab: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  tabActive: {
    padding: 10,
    borderBottomWidth: 3,
    borderBottomColor: "#9969c7",
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  tabTextActive: {
    color: "#9969c7",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: isMobile ? 10 : 15, // Reduce padding on mobile
    margin: isMobile ? 5 : 10, // Reduce margin on mobile
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: isMobile ? 180 : 250, // Smaller width on mobile
  },
  cardImageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cardImage: {
    width: isMobile ? 50 : 60, // Smaller image size on mobile
    height: isMobile ? 50 : 60,
    resizeMode: "cover",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    
  },
  cardTitle: {
    fontSize: isMobile ? 14 : 16, // Smaller font size on mobile
    fontWeight: "bold",
    marginTop: isMobile ? 5 : 10, // Adjust margin on mobile
  },
  cardDescription: {
    fontSize: isMobile ? 12 : 14, // Smaller font size on mobile
    color: "#666",
    marginTop: isMobile ? 3 : 5, // Adjust margin on mobile
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: isMobile ? 5 : 10, // Adjust margin on mobile
  },
  cardPrice: {
    fontSize: isMobile ? 16 : 18, // Smaller font size on mobile
    fontWeight: "bold",
    marginLeft: 1,
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
    fontSize: 16,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  productListContainer: {
    flexGrow: 1,
    marginBottom: 40,
  },
  orderSummaryContainer: {
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 20,
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 10,
  },
  orderSummaryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
   
  orderTotalContainer: {
    marginTop: 20,
  },
  proceedButton: {
    backgroundColor: "#9969c7",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  proceedButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  removeItemText: {
    color: "#ff4444",
  },
  containerMobile: {
    flex: 1,
    padding: 10,
  },
  tabsWrapper: {
    flexDirection: "row",
    marginBottom: 10,
  },
  layoutMobile: {
    flex: 1,
    padding: 10,
  },
  drawerToggleButton: {
    backgroundColor: "#9969c7",
    height: 52,
    opacity: 0.8,
    padding: 10,
    borderRadius: 40,
    position: "absolute",
    bottom: 50,
    right: 0,
  },
  drawerToggleButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  orderTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  animatedDrawer: {
    overflow: "hidden",
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  scrollHintIcon: {
    justifyContent: "center",
    right: -10,
    bottom: 5,
  },
  orderTotalText: {},
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent dark background
  },
  modalView: {
     backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  closeButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    backgroundColor: '#aaaaaa', 
    marginTop: 20,
    width: 100,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor:   
   '#eee', 
  },
  orderItemTextContainer: {
    flex: 1, 
  },
  orderItemQuantityContainer: {
    flexDirection: 'column', 
    alignItems: 'flex-end', 
    marginRight: 10, 
  },
  optionsText: {
    fontSize: 12,
    color: 'gray', 
  },
  optionsPriceText: {
    fontSize: 10,
    color: 'gray', 
  },
  orderItemPrice: {
    fontFamily: "GoogleSans",
    fontWeight: 'bold', 
    marginLeft: 10, 
  }
});

export default PosOrders;
