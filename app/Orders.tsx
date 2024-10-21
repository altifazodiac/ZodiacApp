import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Easing,
  ScrollView,
  Platform,
  Vibration,
} from "react-native";
import { db, ref, onValue } from "./firebase";
import { Ionicons } from "@expo/vector-icons";
import { Option, Product, Category, OrderItem } from "../Data/types";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ProductItem from "../components/ProductItem";
import {} from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
import { transform } from "lodash";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1024;

const Orders = () => {
  const calculateNumColumns = useCallback(() => {
    const screenWidth = Dimensions.get("window").width;
  
    // Handle ranges more clearly
    if (screenWidth < 500) return 2; // Small screens
    if (screenWidth >= 768 && screenWidth <= 1024) return 3; // Tablets or medium screens
    return 4; // Larger screens
  }, []);

  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: Option[];
  }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [numColumns, setNumColumns] = useState(calculateNumColumns());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const drawerHeight = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const animateOrderItem = () => {
    // Animates scaling of the item
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.1, // Scale up
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1, // Scale back to normal
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const isValidOption = (option: any): option is Option => {
    return (
      typeof option === "object" &&
      typeof option.name === "string" &&
      typeof option.price === "number" &&
      typeof option.id === "string"
    );
  };

  const validateOptions = (options: any): Option[] => {
    if (Array.isArray(options)) {
      return options.filter(isValidOption);
    }
    return [];
  };
  useEffect(() => {
    const handleDimensionsChange = () => {
      setNumColumns(calculateNumColumns());
    };

    const subscription = Dimensions.addEventListener("change", handleDimensionsChange);

    // Cleanup listener on unmount
    return () => {
      subscription?.remove();
    };
  }, [calculateNumColumns]);
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
      const formattedProducts: Product[] = productsData
        ? Object.entries(productsData).map(([id, product]) => {
            const productData = product as Product;
            return {
              id,
              nameDisplay: productData.nameDisplay,
              price: productData.price,
              imageUrl: productData.imageUrl || undefined,
              categoryId: productData.categoryId,
              status: productData.status,
              description: productData.description,
              options: validateOptions(productData.options),
            };
          })
        : [];
      setProducts(formattedProducts);
      setIsLoading(false);
    });

    return () => {
      categoriesListener();
      productsListener();
    };
  }, []);

  const filteredProducts =
    selectedCategory && selectedCategory !== "All"
      ? products.filter(
          (product) =>
            product.categoryId === selectedCategory &&
            Boolean(product.status) === true
        )
      : products.filter((product) => Boolean(product.status) === true);

  const mergeOptions = (existingOptions: Option[], newOptions: Option[]) => {
    const mergedOptions = [...existingOptions];
    newOptions.forEach((option) => {
      const existingOptionIndex = mergedOptions.findIndex(
        (mergedOption) => mergedOption.id === option.id
      );
      if (existingOptionIndex !== -1) {
        mergedOptions[existingOptionIndex] = option;
      } else {
        mergedOptions.push(option);
      }
    });
    return mergedOptions;
  };
  const animation = useRef(new Animated.Value(1)).current; // Initialize useRef in component body
  const addItemToOrder = (product: Product, selectedOptions: Option[] = []) => {
    setOrderItems((prevOrderItems) => {
      const existingItemIndex = prevOrderItems.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex !== -1) {
        const updatedOrderItems = [...prevOrderItems];
        const existingItem = updatedOrderItems[existingItemIndex];

        updatedOrderItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          selectedOptions: mergeOptions(
            existingItem.selectedOptions,
            selectedOptions
          ),
        };
        animateOrderItem(); // Trigger animation on update
        return updatedOrderItems;
      } else {
        animateOrderItem(); // Trigger animation on new addition
        return [...prevOrderItems, { product, quantity: 1, selectedOptions }];
      }
    });
  };

  const removeItemFromOrder = (id: string) => {
    setOrderItems((prevOrderItems) =>
      prevOrderItems.filter((item) => item.product.id !== id)
    );
  };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => {
    const openDuration = 300;
    const closeDuration = 200;

    Animated.parallel([
      Animated.timing(drawerHeight, {
        toValue: isDrawerOpen ? 0 : windowHeight * (isTablet ? 0.8 : 1.2),
        duration: isDrawerOpen ? closeDuration : openDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(drawerOpacity, {
        toValue: isDrawerOpen ? 0 : 1,
        duration: isDrawerOpen ? closeDuration : openDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isDrawerOpen ? 0 : 0.5, // Fade overlay in or out
        duration: isDrawerOpen ? closeDuration : openDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsDrawerOpen((previousState) => !previousState);
    });
  };
  const subtotal = orderItems.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (parseFloat(item.product.price) +
          item.selectedOptions.reduce((sum, option) => sum + option.price, 0)),
    0
  );
  //const discount = subtotal > 50 ? 5 : 0;
  const discount = 0;
  const total = subtotal - discount;

  const renderProductItem = ({ item }: { item: Product }) => {
    const orderItem = orderItems.find(
      (orderItem) => orderItem.product.id === item.id
    );

    const itemQuantity = orderItem ? orderItem.quantity : 0;

    const handleIncreaseQuantity = () => addItemToOrder(item);

    const handleDecreaseQuantity = () => {
      if (itemQuantity > 1) {
        setOrderItems((prevOrderItems) =>
          prevOrderItems.map((orderItem) =>
            orderItem.product.id === item.id
              ? { ...orderItem, quantity: orderItem.quantity - 1 }
              : orderItem
          )
        );
      } else if (itemQuantity === 1) {
        removeItemFromOrder(item.id);
      }
    };

    return (
      <ProductItem
        item={item}
        itemQuantity={itemQuantity}
        handleIncreaseQuantity={handleIncreaseQuantity}
        handleDecreaseQuantity={handleDecreaseQuantity}
        toggleDrawer={toggleDrawer}
        onLongPress={() => {
          const existingSelectedOptions =
            orderItems.find((orderItem) => orderItem.product.id === item.id)
              ?.selectedOptions || [];

          setCurrentProduct(item);
          setSelectedOptions((prevOptions) => ({
            ...prevOptions,
            [item.id]: existingSelectedOptions,
          }));
          setOrderDetailModalVisible(true);
        }}
      />
    );
  };
  const rightSwipeActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    productId: string
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.rightAction}
          onPress={() => removeItemFromOrder(productId)}
        >
          <Text style={styles.actionText}>Remove</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const isVerticalSwipe = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      const hasSufficientSpeed = Math.abs(gestureState.vy) > 0.1;
      return isVerticalSwipe && hasSufficientSpeed && !isDrawerOpen; // Allow gesture only if the drawer is closed
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawerOpen) {
        const newHeight = gestureState.dy > 0 ? gestureState.dy : 0;
        drawerHeight.setValue(newHeight);
        drawerOpacity.setValue(newHeight / (windowHeight * (isTablet ? 0.8 : 1.2)));
        overlayOpacity.setValue(newHeight / (windowHeight * (isTablet ? 0.8 : 1.2)) * 0.5);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!isDrawerOpen) {
        const threshold = windowHeight * (isTablet ? 0.4 : 0.6);
        const shouldOpen = gestureState.dy > threshold || gestureState.vy > 0.5;

        if (shouldOpen) {
          Animated.timing(drawerHeight, {
            toValue: windowHeight * (isTablet ? 0.8 : 1.2),
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start(() => {
            setIsDrawerOpen(true);
          });
          Animated.timing(drawerOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
          Animated.timing(overlayOpacity, {
            toValue: 0.5,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(drawerHeight, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start(() => {
            setIsDrawerOpen(false);
          });
          Animated.timing(drawerOpacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        }
      }
    },
  });


  return (
    <View style={isMobile ? styles.containerMobile : styles.container}>
      {orderDetailModalVisible && (
        <OrderDetailsModal
          visible={orderDetailModalVisible}
          onClose={() => setOrderDetailModalVisible(false)}
          currentProduct={currentProduct}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          addItemToOrder={addItemToOrder}
        />
      )}
      <View style={isMobile ? styles.layoutMobile : styles.layout1}>
        {Platform.OS === "web" ? (
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
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
  numColumns={numColumns} // Dynamically calculated columns
  key={numColumns} // Forces re-render when columns change
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
         {
           height: drawerHeight,
           opacity: drawerOpacity,
           transform: [
             {
               translateY: drawerHeight.interpolate({
                 inputRange: [0, windowHeight * (isTablet ? 0.8 : 1.2)],
                 outputRange: [windowHeight * (isTablet ? 0.8 : 1.2), 0],
               }),
             },
           ],
         },
       ]}
        >
          <View style={styles.orderSummaryContainer}>
            <Text
              style={[styles.orderSummaryTitle, { fontFamily: "GoogleSans" }]}
            >
              Order Summary
            </Text>
            <ScrollView>
              {orderItems.map((item, index) => (
                <Swipeable
                  key={item.product.id}
                  renderRightActions={(progress, dragX) =>
                    rightSwipeActions(progress, dragX, item.product.id)
                  }
                >
                  <Animated.View style={{ transform: [{ scale: animation }] }}>
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemTextContainer}>
                        <Text style={[{ fontFamily: "Kanit-Regular" }]}>
                          {item.product.nameDisplay}
                        </Text>
                        {item.selectedOptions.length > 0 && (
                          <View style={styles.optionsPriceContainer}>
                            {item.selectedOptions.map((option, idx) => (
                              <Text
                                key={idx}
                                style={styles.optionPriceTextItem}
                              >
                                ({option.name})
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.orderItemQuantityContainer}>
                        <Text style={[{ fontFamily: "GoogleSans", color: "#808080",fontSize: 16  }]}>
                          {item.quantity} x{" "}
                          {parseFloat(item.product.price).toFixed(0)}฿
                        </Text>
                        {item.selectedOptions.length > 0 && (
                          <View style={styles.optionsPriceContainer}>
                            {item.selectedOptions.map((option, idx) => (
                              <Text
                                key={idx}
                                style={styles.optionPriceTextItem}
                              >
                                (+{option.price.toFixed(0)}฿)
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={styles.orderItemPrice}>
                        {(
                          item.quantity *
                          (parseFloat(item.product.price) +
                            item.selectedOptions.reduce(
                              (sum, option) => sum + option.price,
                              0
                            ))
                        ).toFixed(0)}
                        ฿
                      </Text>
                    </View>
                  </Animated.View>
                </Swipeable>
              ))}
            </ScrollView>
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
                  {subtotal.toFixed(0)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Discount:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {discount.toFixed(0)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right", fontSize: 18, fontWeight: "bold" }]}
                >
                  {total.toFixed(0)}฿
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.proceedButton}>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.CloseButton} onPress={toggleDrawer}>
              <Text style={styles.CloseButtonText}>Close</Text>
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
            <ScrollView>
              {orderItems.map((item, index) => (
                <Swipeable
                  key={item.product.id}
                  renderRightActions={(progress, dragX) =>
                    rightSwipeActions(progress, dragX, item.product.id)
                  }
                >
                  <Animated.View style={{ transform: [{ scale: animation }] }}>
                    <View style={styles.orderItem}>
                      <View style={styles.orderItemTextContainer}>
                        <Text style={[{ fontFamily: "Kanit-Regular" }]}>
                          {item.product.nameDisplay}
                        </Text>
                        {item.selectedOptions.length > 0 && (
                          <View style={styles.optionsPriceContainer}>
                            {item.selectedOptions.map((option, idx) => (
                              <Text
                                key={idx}
                                style={styles.optionPriceTextItem}
                              >
                                ({option.name})
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.orderItemQuantityContainer}>
                        <Text style={[{ fontFamily: "GoogleSans", color: "#808080",fontSize: 16 }]}>
                          {item.quantity} x{" "}
                          {parseFloat(item.product.price).toFixed(0)}฿
                        </Text>
                        {item.selectedOptions.length > 0 && (
                          <View style={styles.optionsPriceContainer}>
                            {item.selectedOptions.map((option, idx) => (
                              <Text
                                key={idx}
                                style={styles.optionPriceTextItem}
                              >
                                (+{option.price.toFixed(0)}฿)
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                      <Text style={styles.orderItemPrice}>
                        {(
                          item.quantity *
                          (parseFloat(item.product.price) +
                            item.selectedOptions.reduce(
                              (sum, option) => sum + option.price,
                              0
                            ))
                        ).toFixed(0)}
                        ฿
                      </Text>
                    </View>
                  </Animated.View>
                </Swipeable>
              ))}
            </ScrollView>
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
                  {subtotal.toFixed(0)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Discount:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {discount.toFixed(0)}฿
                </Text>
              </View>
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right", fontSize: 18, fontWeight: "bold" }]}
                >
                  {total.toFixed(0)}฿
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
  container: isMobile
    ? {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }
    : isTablet
    ? {
        flexDirection: "row", // Horizontal layout for tablets
        justifyContent: "space-between", // Adjust space between containers for tablets
        paddingHorizontal: 15, // Add padding for better layout on tablets
        width: "100%",
        height: "100%",
      }
    : {
        flexDirection: "row", // Horizontal layout for larger screens (desktops or large tablets)
        width: "100%",
        height: "100%",
        paddingHorizontal: 20, // Larger padding for bigger screens
      },
  containerMobile: {
    flex: 1,
    padding: 10,
  },

  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  orderItemTextContainer: {
    flex: 1,
    flexDirection: "column",
    marginBottom: 5,
  },
  orderItemText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  optionsText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  orderItemPrice: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    color: "#333",
  },
  removeItemText: {
    color: "red",
    fontSize: 14,
    marginLeft: 10,
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
  animatedDrawer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
  },
  orderSummaryContainer: {
    maxHeight: isMobile ? "95%" : '100%',
     
    padding: 20,
    backgroundColor: isMobile ? "rgba(255, 255, 255, 0.5)" : "#f7f7f7",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
  },
  orderSummaryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 15,
    textAlign: "center",
  },

  optionsContainer: {
    marginTop: 8,
    paddingLeft: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    padding: 5,
    borderColor: "#eee",
    borderWidth: 1,
  },
  onsPriceText: {
    fontSize: 10,
    color: "#888",
  },
  layout1: {
    width: "64%",
    justifyContent: "center",
    alignItems: "center",
  },
  layout2: {
    width: "36%",
    height: "100%",
    padding: 15,
    
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
    padding: isMobile ? 10 : 15,
    margin: isMobile ? 5 : 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    width: isMobile ? 180 : 250,
  },

  orderItemQuantityContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginRight: 10,
  },
  orderTotalContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  orderTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    
  },
  proceedButton: {
    backgroundColor: "#9969c7",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  proceedButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  CloseButton: {
    backgroundColor: "#bbbbbb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  CloseButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  productListContainer: {
    flexGrow: 1,
    marginBottom: 40,
  },
  scrollHintIcon: {
    justifyContent: "center",
    right: -10,
    bottom: 5,
  },

  cardImageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cardImage: {
    width: isMobile ? 50 : 60,
    height: isMobile ? 50 : 60,
    resizeMode: "cover",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: "bold",
    marginTop: isMobile ? 5 : 10,
  },
  cardDescription: {
    fontSize: isMobile ? 12 : 14,
    color: "#666",
    marginTop: isMobile ? 3 : 5,
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: isMobile ? 5 : 10,
  },
  cardPrice: {
    fontSize: isMobile ? 16 : 18,
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

  tabsWrapper: {
    flexDirection: "row",
    marginBottom: 10,
  },
  layoutMobile: {
    flex: 1,
    padding: 10,
   
  },

  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  optionsPriceText: {
    fontSize: 10,
    color: "gray",
  },
  noOptionsText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginVertical: 10,
  },
  optionsPriceContainer: {
    flexWrap: "wrap",
    marginTop: 4,
  },
  optionPriceTextItem: {
    fontFamily: "GoogleSans",
    color: "#888",
    fontSize: 12,
    marginLeft: 4,
  },
  rightAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    backgroundColor: "red",
    padding: 10,
    height: "100%",
    borderRadius: 6,
  },
  actionText: {
    color: "white",
    fontWeight: "bold",
  },

  orderItemSwipeableContainer: {
    marginBottom: 10,
  },
});

export default Orders;
