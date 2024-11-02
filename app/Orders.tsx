import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
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
  Alert,
} from "react-native";
import { db, ref, onValue } from "./firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Option, Product, Category, OrderItem } from "../Data/types";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ProductItem from "../components/ProductItem";
import {} from "react-native-gesture-handler";
import { Swipeable } from "react-native-gesture-handler";
import { database } from "../app/firebase";
import { DatabaseReference, get, set } from "firebase/database";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Settings } from "../Data/types"; // Adjust the path as needed
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1024;

const Orders = () => {
  const { width, height } = Dimensions.get("window");
  const calculateNumColumns = () => {
    if (width < 768) {
      return 2;
    } else if (width <= 1024) {
      return 3;
    } else {
      return 3;
    }
  };

  useEffect(() => {
    const onChange = () => {
      setNumColumns(calculateNumColumns());
    };

    const dimensionsSubscription = Dimensions.addEventListener(
      "change",
      onChange
    );

    return () => {
      dimensionsSubscription.remove();
    };
  }, []);

  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: Option[];
  }>({});
  const [numColumns, setNumColumns] = useState(calculateNumColumns);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get("window").width
  );
  const drawerHeight = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
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
  const [selectedOrderType, setSelectedOrderType] = useState("Dine In");

  const handleSelect = (type: string) => {
    setSelectedOrderType(type); // Set the selected type
  };
  const [receiptNumber, setReceiptNumber] = useState("Loading...");

  useEffect(() => {
    const fetchQueueNumber = async () => {
      const queueRef = ref(database, "lastQueueNumber");
      const snapshot = await get(queueRef);

      if (snapshot.exists()) {
        setQueueNumber(snapshot.val());
      } else {
        // Initialize the queue number to 1 if it doesn't exist
        setQueueNumber(1);
        set(queueRef, 1);
      }
    };

    fetchQueueNumber();
  }, []);

  // Function to increment and update queue number
  const incrementQueueNumber = async () => {
    if (queueNumber !== null) {
      const newQueueNumber = queueNumber + 1;
      setQueueNumber(newQueueNumber);

      // Update the new queue number in Firebase
      const queueRef = ref(database, "lastQueueNumber");
      await set(queueRef, newQueueNumber);
    }
  };
  const [formattedDate, setFormattedDate] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [second, setSecond] = useState("");

  const fadeAnimHour = useRef(new Animated.Value(1)).current;
  const fadeAnimMinute = useRef(new Animated.Value(1)).current;
  const fadeAnimSecond = useRef(new Animated.Value(1)).current;

  const translateYAnimHour = useRef(new Animated.Value(0)).current;
  const translateYAnimMinute = useRef(new Animated.Value(0)).current;
  const translateYAnimSecond = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const updateDateTime = () => {
      const date = new Date();

      // Format date
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      setFormattedDate(
        new Intl.DateTimeFormat("en-US", dateOptions).format(date)
      );

      // Update hour, minute, and second separately
      setHour(
        date
          .toLocaleString("en-US", { hour: "2-digit", hour12: false })
          .padStart(2, "0")
      );
      setMinute(
        date.toLocaleString("en-US", { minute: "2-digit" }).padStart(2, "0")
      );
      setSecond(
        date.toLocaleString("en-US", { second: "2-digit" }).padStart(2, "0")
      ); // Ensure two-digit format
    };

    // Initial setup
    updateDateTime();

    const intervalId = setInterval(() => {
      const date = new Date();

      // Start separate animations based on whether each unit changes
      const newHour = date
        .toLocaleString("en-US", {
          hour: "2-digit",
          hour12: false,
        })
        .padStart(2, "0");
      const newMinute = date
        .toLocaleString("en-US", { minute: "2-digit" })
        .padStart(2, "0");
      const newSecond = date
        .toLocaleString("en-US", { second: "2-digit" })
        .padStart(2, "0"); // Ensure two-digit format

      if (newHour !== hour) {
        animateChange(fadeAnimHour, translateYAnimHour, () => setHour(newHour));
      }
      if (newMinute !== minute) {
        animateChange(fadeAnimMinute, translateYAnimMinute, () =>
          setMinute(newMinute)
        );
      }
      if (newSecond !== second) {
        animateChange(fadeAnimSecond, translateYAnimSecond, () =>
          setSecond(newSecond)
        ); // Update condition for seconds
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [hour, minute, second]);

  const animateChange = (
    fadeAnim: Animated.Value,
    translateYAnim: Animated.Value,
    setTime: () => void
  ) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTime();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const fetchLastReceiptNumber = async () => {
    const receiptRef = ref(database, "lastReceiptNumber");
    const snapshot = await get(receiptRef);

    if (snapshot.exists()) {
      setReceiptNumber(snapshot.val().toString());
    } else {
      const initialReceipt = 1000;
      setReceiptNumber(initialReceipt.toString());
      set(receiptRef, initialReceipt);
    }
  };

  const incrementReceiptNumber = async () => {
    const newReceiptNumber = parseInt(receiptNumber, 10) + 1;
    setReceiptNumber(newReceiptNumber.toString());

    // Update the new receipt number in Firebase
    const receiptRef = ref(database, "lastReceiptNumber");
    await set(receiptRef, newReceiptNumber);
  };

  // Fetch receipt number on mount
  useEffect(() => {
    fetchLastReceiptNumber();
  }, []);
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
              productSize: productData.productSize,
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

  const confirmClearOrderItems = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to clear all items?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => setOrderItems([]), // Clear all items on confirmation
        },
      ],
      { cancelable: true }
    );
  };

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
      const isVerticalSwipe =
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      const hasSufficientSpeed = Math.abs(gestureState.vy) > 0.1;
      return isVerticalSwipe && hasSufficientSpeed && !isDrawerOpen; // Allow gesture only if the drawer is closed
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawerOpen) {
        const newHeight = gestureState.dy > 0 ? gestureState.dy : 0;
        drawerHeight.setValue(newHeight);
        drawerOpacity.setValue(
          newHeight / (windowHeight * (isTablet ? 0.8 : 1.2))
        );
        overlayOpacity.setValue(
          (newHeight / (windowHeight * (isTablet ? 0.8 : 1.2))) * 0.5
        );
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
  const [settings, setSettings] = useState<Settings | null>();
  // 2. Then calculate subtotal
  const subtotal = orderItems.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (parseFloat(item.product.price) +
          item.selectedOptions.reduce((sum, option) => sum + option.price, 0)),
    0
  );

  const discount = settings?.OrderPanels.displayDiscount
  ? (settings?.OrderPanels.isPercentage 
      ? (settings?.OrderPanels.discountValue || 0) / 100 * subtotal // Calculate discount as a percentage of subtotal
      : settings?.OrderPanels.discountValue || 0) // Keep as amount
  : 0;

// Calculate tax based on settings
const tax = settings?.OrderPanels.displayTax
  ? subtotal * (settings?.OrderPanels.taxValue || 0) // Assuming taxValue is a decimal
  : 0;

// Calculate service charge based on settings
const serviceCharge = settings?.OrderPanels.displayServiceCharge
  ? subtotal * (settings?.OrderPanels.serviceChargeValue || 0) // Assuming serviceChargeValue is a decimal
  : 0;

// Calculate the total amount
const total = subtotal - discount + tax + serviceCharge;


const discountValue = discount >= 1 ? `-${discount.toFixed(0)}฿` : `${discount.toFixed(0)}฿`;
  useEffect(() => {
    const settingsRef: DatabaseReference = ref(database, "settings");

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Settings data:", data); // Log the data
      if (data && data.OrderPanels) {
        setSettings(data as Settings);
      }
    });
  

    return () => {
      unsubscribe();
    };
  }, [database]);

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
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderText}>
                  {" "}
                  Receipt No.{receiptNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderText}>
                  {" "}
                  Queue No. #{queueNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <TouchableOpacity
                  style={[styles.circleButton, { marginRight: 5 }]}
                >
                  <AntDesign name="printer" size={16} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={confirmClearOrderItems}
                >
                  <Ionicons name="trash-outline" size={16} color="#E21818" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
                <Ionicons
                  name="person-circle-outline"
                  size={18}
                  color="#9969c7"
                />
                <Text style={styles.orderHeaderText}> Cashier 1</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Ionicons name="calendar-outline" size={18} color="#9969c7" />
                <Text style={styles.dateText}> {formattedDate}</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Ionicons name="time-outline" size={18} color="#9969c7" />
                <View style={styles.timeContainer}>
                  <Animated.Text
                    style={[
                      styles.timeText,
                      {
                        opacity: fadeAnimHour,
                        transform: [{ translateY: translateYAnimHour }],
                      },
                    ]}
                  >
                    {hour}
                  </Animated.Text>
                  <Text style={styles.timeSeparator}>:</Text>
                  <Animated.Text
                    style={[
                      styles.timeText,
                      {
                        opacity: fadeAnimMinute,
                        transform: [{ translateY: translateYAnimMinute }],
                      },
                    ]}
                  >
                    {minute}
                  </Animated.Text>
                  <Text style={styles.timeSeparator}>:</Text>
                  <Animated.Text
                    style={[
                      styles.timeText,
                      {
                        opacity: fadeAnimSecond,
                        transform: [{ translateY: translateYAnimSecond }],
                      },
                    ]}
                  >
                    {second}
                  </Animated.Text>
                </View>
              </View>
            </View>
            <View style={styles.orderHeader}>
              {["Dine In", "Take Away", "Delivery"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.buttonHeader,
                    selectedOrderType === type && styles.selectedButton, // Apply selected style
                  ]}
                  onPress={() => handleSelect(type)}
                >
                  <Text
                    style={[
                      styles.buttonHeaderText,
                      selectedOrderType === type && styles.selectedText, // Apply selected text style
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
                          {item.product.nameDisplay}{" "}
                          {item.product.productSize
                            ? ` (${item.product.productSize})`
                            : ""}
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
                        <Text
                          style={[
                            {
                              fontFamily: "GoogleSans",
                              color: "#808080",
                              fontSize: 16,
                            },
                          ]}
                        >
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
              {settings?.OrderPanels.displayDiscount && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans", color: "#9969c7"  }}>Discount:</Text>
                  <Text
                    style={{ fontFamily: "GoogleSans", textAlign: "right", color: "#9969c7" }}
                  >
                   {discountValue}
                  </Text>
                </View>
              )}
              {settings?.OrderPanels.displayTax && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans" }}>
                    Tax ({(settings?.OrderPanels.taxValue * 100).toFixed(0)}%):
                  </Text>
                  <Text
                    style={{ fontFamily: "GoogleSans", textAlign: "right" }}
                  >
                    {tax.toFixed(0)}฿
                  </Text>
                </View>
              )}
          {settings ? ( // Check if settings is not null
    settings.OrderPanels.displayServiceCharge && ( // Then check for displayServiceCharge
      <View style={styles.orderTotalRow}>
        <Text style={{ fontFamily: "GoogleSans" }}>
          Service Charge ({(settings.OrderPanels.serviceChargeValue * 100).toFixed(0)}%): 
        </Text>
        <Text style={{ fontFamily: "GoogleSans", textAlign: "right" }}>
          {serviceCharge.toFixed(0)}฿ 
        </Text>
      </View>
    )
  ) : (
    <Text>Loading settings...</Text> // Optional: Display a loading message
  )}
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
                <Text
                  style={[
                    {
                      fontFamily: "GoogleSans",
                      textAlign: "right",
                      fontSize: 18,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {total.toFixed(0)}฿
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={() => {
                incrementReceiptNumber();
                incrementQueueNumber();
              }}
            >
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
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderText}>
                  {" "}
                  Receipt No.{receiptNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderText}>
                  {" "}
                  Queue: #{queueNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <TouchableOpacity
                  style={[styles.circleButton, { marginRight: 5 }]}
                >
                  <AntDesign name="printer" size={16} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={confirmClearOrderItems}
                >
                  <Ionicons name="trash-outline" size={16} color="#E21818" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
                <Ionicons
                  name="person-circle-outline"
                  size={18}
                  color="#9969c7"
                />
                <Text style={styles.orderHeaderText}> Cashier 1</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Ionicons name="calendar-outline" size={18} color="#9969c7" />
                <Text style={styles.dateText}> {formattedDate}</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Ionicons name="time-outline" size={18} color="#9969c7" />
                <View style={styles.timeContainer}>
                  <Animated.Text
                    style={[
                      styles.timeText,
                      {
                        opacity: fadeAnimHour,
                        transform: [{ translateY: translateYAnimHour }],
                      },
                    ]}
                  >
                    {hour}
                  </Animated.Text>
                  <Text style={styles.timeSeparator}>:</Text>
                  <Animated.Text
                    style={[
                      styles.timeText,
                      {
                        opacity: fadeAnimMinute,
                        transform: [{ translateY: translateYAnimMinute }],
                      },
                    ]}
                  >
                    {minute}
                  </Animated.Text>
                  <Text style={styles.timeSeparator}>:</Text>
                  <Animated.Text
                    style={[
                      styles.timeText,
                      {
                        opacity: fadeAnimSecond,
                        transform: [{ translateY: translateYAnimSecond }],
                      },
                    ]}
                  >
                    {second}
                  </Animated.Text>
                </View>
              </View>
            </View>
            <View style={styles.orderHeader}>
              {["Dine In", "Take Away", "Delivery"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.buttonHeader,
                    selectedOrderType === type && styles.selectedButton, // Apply selected style
                  ]}
                  onPress={() => handleSelect(type)}
                >
                  <Text
                    style={[
                      styles.buttonHeaderText,
                      selectedOrderType === type && styles.selectedText, // Apply selected text style
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
                          {item.product.productSize
                            ? ` (${item.product.productSize})`
                            : ""}
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
                        <Text
                          style={[
                            {
                              fontFamily: "GoogleSans",
                              color: "#808080",
                              fontSize: 16,
                            },
                          ]}
                        >
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
              {settings?.OrderPanels.displayDiscount && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans", color: "#9969c7"  }}>Discount:</Text>
                  <Text
                    style={{ fontFamily: "GoogleSans", textAlign: "right", color: "#9969c7"  }}
                  >{discountValue}
                  </Text>
                </View>
              )}
              {settings?.OrderPanels.displayTax && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans" }}>
                    Tax ({(settings?.OrderPanels.taxValue * 100).toFixed(0)}%):
                  </Text>
                  <Text
                    style={{ fontFamily: "GoogleSans", textAlign: "right" }}
                  >
                    {tax.toFixed(0)}฿
                  </Text>
                </View>
              )}
            {settings ? ( // Check if settings is not null
    settings.OrderPanels.displayServiceCharge && ( // Then check for displayServiceCharge
      <View style={styles.orderTotalRow}>
        <Text style={{ fontFamily: "GoogleSans" }}>
          Service Charge ({(settings.OrderPanels.serviceChargeValue * 100).toFixed(0)}%): 
        </Text>
        <Text style={{ fontFamily: "GoogleSans", textAlign: "right" }}>
          {serviceCharge.toFixed(0)}฿ 
        </Text>
      </View>
    )
  ) : (
    <Text>Loading settings...</Text> // Optional: Display a loading message
  )}
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
                <Text
                  style={[
                    {
                      fontFamily: "GoogleSans",
                      textAlign: "right",
                      fontSize: 18,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {total.toFixed(0)}฿
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={() => {
                incrementReceiptNumber();
                incrementQueueNumber();
              }}
            >
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const isPortrait = screenHeight < screenWidth;
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
    paddingHorizontal: 10,
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
    height: isMobile ? "74%" : "100%",
    padding: 20,
    backgroundColor: isMobile ? "rgba(255, 255, 255, 0.5)" : "#f7f7f7",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
  },
  orderSummaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#aaaaaa",
    marginBottom: 5,
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
    width:
      screenWidth >= 768 && screenWidth <= 1024
        ? isPortrait
          ? "100%" // In portrait mode, layout1 takes 100% width
          : "64%" // In landscape mode, layout1 takes 64% width
        : "64%", // Default width for other screen sizes
    justifyContent: "center",
    alignItems: "center",
  },
  layout2: {
    width:
      screenWidth >= 768 && screenWidth <= 1024 && isPortrait ? "0%" : "38%", // Hide layout2 in portrait mode
    height: "100%",
    marginLeft: 5,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
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
    top: 5,
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginRight: 10,
  },
  orderHeaderText: {
    color: "#444",
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    color: "#606060",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#606060",
  },
  timeSeparator: {
    fontSize: 14,
    marginHorizontal: 2,
    color: "#606060",
  },
  orderHeaderGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  buttonHeader: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginRight: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,

    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent", // Default border color
  },
  buttonHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#444",
  },
  selectedButton: {
    borderColor: "#6a1b9a", // Border color when selected
  },
  selectedText: {
    color: "#6a1b9a", // Text color when selected
  },
  circleButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent", // Default border color
  },
});

export default Orders;
