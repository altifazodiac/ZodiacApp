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
  Image,
  TextInput,
} from "react-native";
import { db, ref, onValue } from "./firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Option, Product, Category, OrderItem } from "../Data/types";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ProductItem from "../components/ProductItem";
import {} from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { database } from "../app/firebase";
import { DatabaseReference, get, set, push, getDatabase} from "firebase/database";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Settings } from "../Data/types"; // Adjust the path as needed
import FastImage from "expo-fast-image";
import PhoneDialerModal from "../components/PhoneDialerModal";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import PromptPayQRCodeModal from "../components/PromptPayQRCodeModal";
import { theme } from "../components/theme";
import { curry } from "lodash";
import EditNoteModal from "../components/EditNoteModal";
 
declare const window: any;
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const isMobile = windowWidth <= 768;
const isTablet = windowWidth > 768 && windowWidth <= 1024;
const currentTheme = theme.light;
const Orders = () => {
  const { width, height } = Dimensions.get("window");
  const calculateNumColumns = () => {
    if (width < 768) {
      return 3;
    } else if (width <= 1024) {
      return 4;
    } else {
      return 4;
    }
  };
  type OrderType = "Dine In" | "Take Away" | "Delivery";
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
  const [isDialerVisible, setDialerVisible] = useState(false);
  const [moneyChanged, setMoneyChanged] = useState(0);
  const [cashChange, setCashChange] = useState(0);
  const [savedDiscounts, setSavedDiscounts] = useState<{
    [key: number]: boolean;
  }>({});
  const [inputErrors, setInputErrors] = useState<{ [key: number]: string }>({});
  const handleOpenDialer = () => setDialerVisible(true);
  const handleCloseDialer = () => setDialerVisible(false);
  const handleMoneyChanged = (value: number) => setMoneyChanged(value);
  const handleCashChanged = (newCashValue: number) => {
    setCashChange(newCashValue); // Update cashChange in Orders.tsx
  };
  const [isQrDialerVisible, setQrIsDialerVisible] = useState(false);
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const mobileNumber = "0812345678"; // Replace with customer mobile number

  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrderIndex, setEditingOrderIndex] = useState<number | null>(
    null
  );
  const [customInputText, setCustomInputText] = useState("");
  const openQRCodeModal = () => setQRModalVisible(true); // For showing PromptPay QR modal
  const closeQRCodeModal = () => setQRModalVisible(false);
  const handleQrOpenDialer = () => {
    openQRCodeModal(); // Call QR modal opener function here
  };
  const [inputVisible, setInputVisible] = useState(true); // Tracks visibility of TextInput
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
  const [discounts, setDiscounts] = useState<{ [key: number]: string }>({});
  const [visibleDiscountInput, setVisibleDiscountInput] = useState<
    number | null
  >(null);
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
        mergedOptions[existingOptionIndex] = {
          ...mergedOptions[existingOptionIndex],
          ...option, // Update with new attributes
        };
      } else {
        mergedOptions.push(option);
      }
    });
    return mergedOptions;
  };

  const addItemToOrder = (
    product: Product,
    selectedOptions: Option[] = [],
    customInput: string = ""
  ) => {
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
          customInput: customInput || existingItem.customInput, // Preserve or update customInput
        };
        animateOrderItem(existingItemIndex); // Pass product name for animation
        return updatedOrderItems;
      } else {
        animateOrderItem(prevOrderItems.length); // Pass product name for animation
        return [
          ...prevOrderItems,
          { product, quantity: 1, selectedOptions, customInput }, // Add new item with customInput
        ];
      }
    });
  };

  const animationValues = useRef(
    orderItems.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  ).current;

  const animateOrderItem = (index: number) => {
    const itemAnimationValues = {
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    };

    Animated.parallel([
      Animated.timing(itemAnimationValues.opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(itemAnimationValues.translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Update the animation values for the specific item
    animationValues[index] = itemAnimationValues;
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
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const isConfirmed = window.confirm(
        "Are you sure you want to clear all items?"
      );
      if (isConfirmed) {
        clearOrderState(); // Reset state for web
      }
    } else {
      Alert.alert(
        "Clear All Items",
        "Are you sure you want to clear all items?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: clearOrderState }, // Reset state for mobile
        ]
      );
    }
  };

  // Helper function to reset all relevant states
  const clearOrderState = () => {
    setOrderItems([]); // Clear order items
    setSelectedPaymentMethod([]); // Reset payment methods
    setCashChange(0); // Reset cash change
    setRemainBalance(0); // Reset remaining balance
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const handleIncreaseQuantity = () => addItemToOrder(item);
    const orderItem = orderItems.find(
      (orderItem) => orderItem.product.id === item.id
    );
    const itemQuantity = orderItem ? orderItem.quantity : 0;
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
    productId: string,
    index: number
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={styles.rightActionContainer}>
          <TouchableOpacity
            style={[styles.rightAction, currentTheme.button]}
            onPress={() => openEditModal(index)}
          >
            <Text style={[styles.actionText, { color: "white" }]}>
              Add Note
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rightAction, currentTheme.button]}
            onPress={() => handleDiscountToggle(index)}
          >
            <Text style={[styles.actionText, { color: "white" }]}>Dicount</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rightAction, { backgroundColor: "#FF0000" }]}
            onPress={() => removeItemFromOrder(productId)}
          >
            <Text style={[styles.actionText, { color: "white" }]}>Remove</Text>
          </TouchableOpacity>
        </View>
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
  // Function to calculate the price of an item after discount
  const getDiscountedPrice = (item: OrderItem, index: number) => {
    const discount = parseFloat(discounts[index]) || 0; // Retrieve the custom discount for this item
    const basePrice =
      item.quantity *
      (parseFloat(item.product.price) +
        item.selectedOptions.reduce(
          (sum: number, option) => sum + option.price,
          0
        ));
    return Math.max(basePrice - discount, 0); // Ensure price is not negative
  };

  // Calculate subtotal using getDiscountedPrice
  const subtotal = orderItems.reduce((sum, item, index) => {
    const discountedPrice = getDiscountedPrice(item, index); // Apply per-item discount
    return sum + discountedPrice;
  }, 0);

  // Calculate total discount applied (optional, for display purposes)
  const totalDiscount = orderItems.reduce((sum, item, index) => {
    const basePrice =
      item.quantity *
      (parseFloat(item.product.price) +
        item.selectedOptions.reduce(
          (optionSum, option) => optionSum + option.price,
          0
        ));
    const discountedPrice = getDiscountedPrice(item, index);
    return sum + (basePrice - discountedPrice); // Accumulate the total discount
  }, 0);

  // Calculate tax based on the new subtotal
  const tax = settings?.OrderPanels.displayTax
    ? subtotal * (settings?.OrderPanels.taxValue || 0) // Assuming taxValue is a decimal
    : 0;

  // Calculate service charge based on the new subtotal
  const serviceCharge = settings?.OrderPanels.displayServiceCharge
    ? subtotal * (settings?.OrderPanels.serviceChargeValue || 0) // Assuming serviceChargeValue is a decimal
    : 0;

  // Calculate the total amount
  const total = subtotal + tax + serviceCharge;

  // Format the discount value for display (optional)
  const discountValue =
    totalDiscount >= 1
      ? `-${totalDiscount.toFixed(0)}฿`
      : `${totalDiscount.toFixed(0)}฿`;

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

  const [selectedOrderType, setSelectedOrderType] =
    useState<OrderType>("Dine In");

  // Create Animated.Value for the x-offset of the highlight
  const highlightOffset = useRef(new Animated.Value(0)).current;

  const handleSelect = (type: OrderType) => {
    setSelectedOrderType(type);

    let targetOffset = 0;
    if (type === "Take Away") {
      targetOffset = isMobile
        ? screenWidth * 0.26
        : isTablet
          ? screenWidth * 0.14
          : screenWidth * 0.11;
    } else if (type === "Delivery") {
      targetOffset = isMobile
        ? screenWidth * 0.54
        : isTablet
          ? screenWidth * 0.29
          : screenWidth * 0.22;
    }
    Animated.timing(highlightOffset, {
      toValue: targetOffset,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  const opacity = useRef(new Animated.Value(0)).current; // Controls the fade effect
  const translateY = useRef(new Animated.Value(30)).current; // Controls the bounce effect

  useEffect(() => {
    if (total > 0) {
      // Animate opacity and bounce effect when total > 0
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 4, // Controls the bounce effect; lower value means more bounce
          tension: 100, // Controls how tight the spring is; higher values create a quicker animation
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset to initial state when total <= 0
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [total]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string[]>(
    []
  );
  const [remainbalance, setRemainBalance] = useState(0);

  // Update remainbalance based on cashChanged and total
  useEffect(() => {
    setRemainBalance(cashChange - total);
  }, [cashChange, total]); // Trigger on cashChanged or total updates

  const handleMethodSelect = (method: string) => {
    setSelectedPaymentMethod((prevMethods) => {
      // Determine if the method is already selected
      const updatedMethods = prevMethods.includes(method)
        ? prevMethods.filter((m) => m !== method) // Remove if already selected
        : [...prevMethods, method]; // Add if not selected

      // If only one payment method is selected and it covers the total, clear any second method
      if (
        updatedMethods.length === 1 &&
        updatedMethods[0] === "Cash" &&
        cashChange >= total
      ) {
        return [updatedMethods[0]]; // Only keep the first payment method if it covers the total
      }

      // If there are two payment methods but the first method covers the total, remove the second
      if (updatedMethods.length > 1 && cashChange >= total) {
        return [updatedMethods[0]]; // Keep only the first payment method
      }

      return updatedMethods; // Otherwise, return the updated methods as is
    });
  };
  const openEditModal = (index: number) => {
    setEditingOrderIndex(index);
    setCustomInputText(orderItems[index].customInput || "");
    setModalVisible(true);
  };

  const saveCustomInput = (newInput: string) => {
    if (editingOrderIndex !== null) {
      const updatedOrders = [...orderItems];
      updatedOrders[editingOrderIndex].customInput = newInput;
      setOrderItems(updatedOrders);
    }
    setModalVisible(false);
  };

  const handleDiscountToggle = (index: number) => {
    setVisibleDiscountInput(visibleDiscountInput === index ? null : index);
  };

  const handleDiscountChange = (value: string, index: number) => {
    setDiscounts((prev) => ({
      ...prev,
      [index]: value,
    }));
  };
  const handleSaveDiscount = (index: number) => {
    if (!inputErrors[index]) {
      setSavedDiscounts((prev) => ({
        ...prev,
        [index]: !prev[index], // Toggle ระหว่างบันทึกและลบ
      }));
    }
  };


  const saveOrderToDatabase = async (
    orderItems: OrderItem[],
    receiptNumber: string,
    queueNumber: number,
    selectedOrderType: OrderType,
    total: number,
    subtotal: number,
    tax: number,
    serviceCharge: number,
    cashChange: number,
    remainBalance: number,
    selectedPaymentMethod: string[]
  ) => {
    try {
      const database = getDatabase(); // Get the Firebase Realtime Database instance
      const ordersRef = ref(database, "orders"); // Reference to the "orders" node
  
      // Create the order data object
      const orderData = {
        receiptNumber,
        queueNumber,
        orderType: selectedOrderType,
        items: orderItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.nameDisplay,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          customInput: item.customInput,
          totalPrice:
            item.quantity *
            (Number(item.product.price) +
              item.selectedOptions.reduce(
                (sum: number, option: Option) => sum + (Number(option.price) || 0),
                0
              )),
        })),
        subtotal,
        tax,
        serviceCharge,
        total,
        cashChange,
        remainBalance,
        paymentMethods: selectedPaymentMethod,
        timestamp: new Date().toISOString(), // Add a timestamp for when the order was placed
      };
  
      // Push the order data to the database
      const newOrderRef = push(ordersRef); // Generate a unique key for the new order
      await set(newOrderRef, orderData); // Save the order data under the generated key
  
      console.log("Order saved successfully!");
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };
  const handleProceedToPayment = async () => {
    await incrementReceiptNumber();
    await incrementQueueNumber();
  
    if (queueNumber !== null) {
      await saveOrderToDatabase(
        orderItems,
        receiptNumber,
        queueNumber,
        selectedOrderType,
        total,
        subtotal,
        tax,
        serviceCharge,
        cashChange,
        remainbalance,
        selectedPaymentMethod
      );
      setOrderItems([]); // Clear the order items after saving
    } else {
      console.error("Queue number is not available");
    }
  };
  return (
    <View
      style={
        isMobile
        ? [styles.containerMobile, { backgroundColor: currentTheme.backgroundColor }]
        : [styles.container, { backgroundColor: currentTheme.backgroundColor }]
    }
    >
      <EditNoteModal
        visible={modalVisible}
        customInput={customInputText}
        productName={
          editingOrderIndex !== null
            ? orderItems[editingOrderIndex]?.product.nameDisplay
            : null
        }
        onSave={saveCustomInput}
        onClose={() => setModalVisible(false)}
        onChangeText={setCustomInputText}
      />

      <PromptPayQRCodeModal
        visible={isQRModalVisible}
        mobileNumber={mobileNumber}
        amount={remainbalance ? Math.abs(remainbalance) : total}
        onClose={closeQRCodeModal}
      />
      {isDialerVisible && (
        <PhoneDialerModal
          visible={isDialerVisible}
          total={total}
          cashChange={cashChange} // Pass current cashChange to the modal
          onMoneyChanged={handleMoneyChanged}
          onCashChanged={handleCashChanged}
          onClose={handleCloseDialer}
        />
      )}
      {orderDetailModalVisible && (
        <OrderDetailsModal
          addItemToOrder={addItemToOrder}
          visible={orderDetailModalVisible}
          onClose={() => setOrderDetailModalVisible(false)}
          currentProduct={currentProduct}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
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
                    color={"#3c5867"}
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
            <View style={styles.orderSummaryTitleContainer}>
              <Text
                style={[styles.orderSummaryTitle, { fontFamily: "GoogleSans" }]}
              >
                Orders
              </Text>
            </View>
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderReceiptText}>
                  {" "}
                  #{receiptNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderReceiptText}>
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
                  color={"#3c5867"}
                />
                <Text style={styles.orderHeaderText}> Cashier 1</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Ionicons name="calendar-outline" size={18} color={"#3c5867"} />
                <Text style={styles.dateText}> {formattedDate}</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Ionicons name="time-outline" size={18} color={"#3c5867"} />
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
            <View style={styles.orderHeaderTabs}>
              <Animated.View
                style={{
                  ...styles.highlight,
                  transform: [
                    {
                      translateX: highlightOffset.interpolate({
                        inputRange: [0, 100], // Assuming max offset is 100
                        outputRange: [0, 100], // Map to percentages for responsiveness
                      }),
                    },
                  ],
                }}
              />
              {["Dine In", "Take Away", "Delivery"].map((type: string) => (
                <TouchableOpacity
                  key={type}
                  style={styles.buttonHeader}
                  onPress={() => handleSelect(type as OrderType)}
                >
                  <Text
                    style={[
                      styles.buttonHeaderText,
                      selectedOrderType === type && styles.selectedText,
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
        rightSwipeActions(progress, dragX, item.product.id, index)
      }
    >
      <Animated.View
        style={{
          transform: [{ translateY: animationValues[index].translateY }],
          opacity: animationValues[index].opacity,
        }}
      >
        <View style={styles.orderItem}>
          <View style={styles.orderItemTextContainer}>
            {/* Product Name */}
            <Text style={{ fontFamily: "Kanit-Regular" }}>
              {item.product.nameDisplay}
              {settings?.OrderPanels?.displaySize && item.product?.productSize
                ? ` (${item.product.productSize})`
                : ""}
            </Text>

            {/* Selected Options */}
            {item.selectedOptions.length > 0 && (
              <View style={styles.optionsPriceContainer}>
                {item.selectedOptions.map((option, idx) => (
                  <Text key={idx} style={styles.optionPriceTextItem}>
                    ({option.name})
                  </Text>
                ))}
              </View>
            )}

            {/* Custom Input Note */}
            {item.customInput && (
              <Text
                style={{
                  fontFamily: "Kanit-Regular",
                  color: "#263c48",
                }}
              >
                Note: {item.customInput}
              </Text>
            )}
          </View>

          {/* Quantity & Price */}
          <View style={styles.orderItemQuantityContainer}>
            <Text
              style={{
                fontFamily: "GoogleSans",
                color: "#3a5565",
                fontSize: 14,
              }}
            >
              {item.quantity} x {parseFloat(item.product.price).toFixed(0)}฿
            </Text>

            {item.selectedOptions.length > 0 && (
              <View style={styles.optionsPriceContainer}>
                {item.selectedOptions.map((option, idx) => (
                  <Text key={idx} style={styles.optionPriceTextItem}>
                    (+{option.price.toFixed(0)}฿)
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Total Price */}
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
              {/* Total Quantity */}
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

              {/* Subtotal */}
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans" }]}>Subtotal:</Text>
                <Text
                  style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}
                >
                  {subtotal.toFixed(0)}฿
                </Text>
              </View>

              {/* Discount */}
              {settings?.OrderPanels.displayDiscount && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans", color: "#3a5565" }}>
                    Discount:
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans",
                      textAlign: "right",
                      color: "#3a5565",
                    }}
                  >
                    {discountValue}
                  </Text>
                </View>
              )}

              {/* Tax */}
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

              {/* Service Charge */}
              {settings?.OrderPanels.displayServiceCharge && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans" }}>
                    Service Charge (
                    {(settings.OrderPanels.serviceChargeValue * 100).toFixed(0)}
                    %):
                  </Text>
                  <Text
                    style={{ fontFamily: "GoogleSans", textAlign: "right" }}
                  >
                    {serviceCharge.toFixed(0)}฿
                  </Text>
                </View>
              )}

              {selectedPaymentMethod.length > 0 && (
                <>
                  {/* Primary Payment Method */}
                  <View style={styles.orderTotalRow}>
                    <Text style={{ fontFamily: "GoogleSans" }}>
                      Payment Method:
                    </Text>
                    <Text
                      style={{
                        fontFamily: "GoogleSans",
                        textAlign: "right",
                        fontSize: 14,
                        color: "#3a5565",
                      }}
                    >
                      {selectedPaymentMethod[0] || "N/A"}
                      {selectedPaymentMethod[0] === "Cash"
                        ? ` (${cashChange?.toFixed(0)}฿)`
                        : ` (${total?.toFixed(0)}฿)`}
                    </Text>
                  </View>

                  {/* Secondary Payment Method, if present */}
                  {selectedPaymentMethod.length > 1 && (
                    <View style={styles.orderTotalRow}>
                      <Text style={{ fontFamily: "GoogleSans" }}>
                        Payment Method 2:
                      </Text>
                      <Text
                        style={{
                          fontFamily: "GoogleSans",
                          textAlign: "right",
                          fontSize: 14,
                          color: "#3a5565",
                        }}
                      >
                        {selectedPaymentMethod[1]}
                        {selectedPaymentMethod[1] === "Cash"
                          ? ` (${cashChange?.toFixed(0)}฿)`
                          : ` (${Math.abs(remainbalance).toFixed(0)}฿)`}
                      </Text>
                    </View>
                  )}

                  {/* Change */}
                  <View style={styles.orderTotalRow}>
                    <Text style={{ fontFamily: "GoogleSans" }}>Remaining:</Text>
                    <Text
                      style={{
                        fontFamily: "GoogleSans",
                        textAlign: "right",
                        fontSize: 14,
                      }}
                    >
                      {remainbalance?.toFixed(0)}฿
                    </Text>
                  </View>
                </>
              )}

              {/* Remaining UI elements */}
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
            {total > 0 && (
              <Animated.View
                style={{
                  opacity: opacity,
                  transform: [{ translateY: translateY }],
                }}
              >
                {/* Secondary Payment Option if cashChange < total */}

                <PaymentMethodSelector
                  onMethodSelect={handleMethodSelect}
                  handleOpenDialer={handleOpenDialer}
                  handleOpenQrDialer={handleQrOpenDialer}
                />

                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={handleProceedToPayment}
                >
                  <Text style={styles.proceedButtonText}>
                    Proceed to Payment
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            <TouchableOpacity style={styles.CloseButton} onPress={toggleDrawer}>
              <Text style={styles.CloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

{!isMobile && (
  <View style={styles.layout2}>
    <View style={styles.orderSummaryContainer}>
      {/* Order List Title */}
      <View style={styles.orderSummaryTitleContainer}>
        <Text style={[styles.orderSummaryTitle, { fontFamily: "GoogleSans" }]}>
          Order List
        </Text>
      </View>

      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderGroup}>
          <Text style={styles.orderHeaderReceiptText}>#{receiptNumber}</Text>
        </View>
        <View style={styles.orderHeaderGroup}>
          <Text style={styles.orderHeaderReceiptText}>Queue: #{queueNumber}</Text>
        </View>
        <View style={styles.orderHeaderGroup}>
          <TouchableOpacity style={[styles.circleButton, { marginRight: 5 }]}>
            <AntDesign name="printer" size={16} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleButton} onPress={confirmClearOrderItems}>
            <Ionicons name="trash-outline" size={16} color="#E21818" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderGroup}>
          <Ionicons name="person-circle-outline" size={18} color="#3c5867" />
          <Text style={styles.orderHeaderText}> Cashier 1</Text>
        </View>
        <View style={styles.orderHeaderGroup}>
          <Ionicons name="calendar-outline" size={18} color="#3c5867" />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <View style={styles.orderHeaderGroup}>
          <Ionicons name="time-outline" size={18} color="#3c5867" />
          <View style={styles.timeContainer}>
            <Animated.Text style={[styles.timeText, { opacity: fadeAnimHour, transform: [{ translateY: translateYAnimHour }] }]}>
              {hour}
            </Animated.Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Animated.Text style={[styles.timeText, { opacity: fadeAnimMinute, transform: [{ translateY: translateYAnimMinute }] }]}>
              {minute}
            </Animated.Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Animated.Text style={[styles.timeText, { opacity: fadeAnimSecond, transform: [{ translateY: translateYAnimSecond }] }]}>
              {second}
            </Animated.Text>
          </View>
        </View>
      </View>

      {/* Order Type Tabs */}
      <View style={styles.orderHeaderTabs}>
        <Animated.View
          style={{
            ...styles.highlight,
            transform: [{ translateX: highlightOffset.interpolate({ inputRange: [0, 100], outputRange: [0, 100] }) }],
          }}
        />
        {["Dine In", "Take Away", "Delivery"].map((type) => (
          <TouchableOpacity key={type} style={styles.buttonHeader} onPress={() => handleSelect(type as OrderType)}>
            <Text style={[styles.buttonHeaderText, selectedOrderType === type && styles.selectedText]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order Items List */}
      <ScrollView>
        {orderItems.map((item, index) => (
          <Swipeable
            key={item.product.id}
            renderRightActions={(progress, dragX) => (
              <Animated.View
                style={{
                  transform: [{ scale: dragX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0.5], extrapolate: "clamp" }) }],
                }}
              >
                <View style={styles.rightActionContainer}>
                  <TouchableOpacity style={[styles.rightAction, currentTheme.button]} onPress={() => openEditModal(index)}>
                    <Text style={[styles.actionText, { color: "white" }]}>Add Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.rightAction, currentTheme.button]} onPress={() => handleDiscountToggle(index)}>
                    <Text style={[styles.actionText, { color: "white" }]}>Discount</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.rightAction, { backgroundColor: "#FF0000" }]} onPress={() => removeItemFromOrder(item.product.id)}>
                    <Text style={[styles.actionText, { color: "white" }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          >
            <Animated.View
              style={{
                transform: [{ translateY: animationValues[index]?.translateY || 0 }],
                opacity: animationValues[index]?.opacity || 1,
              }}
            >
              <View style={styles.orderItem}>
                <View style={styles.orderItemTextContainer}>
                  <Text style={[{ fontFamily: "Kanit-Regular" }]}>
                    {item.product.nameDisplay}
                    {settings?.OrderPanels?.displaySize && item.product?.productSize ? ` (${item.product.productSize})` : ""}
                  </Text>

                  {item.selectedOptions.length > 0 && (
                    <View style={styles.optionsPriceContainer}>
                      {item.selectedOptions.map((option, idx) => (
                        <Text key={idx} style={styles.optionPriceTextItem}>({option.name})</Text>
                      ))}
                    </View>
                  )}

                  {item.customInput && (
                    <Text style={[{ fontFamily: "Kanit-Regular", color: "#4682B4" }]}>
                      Note: {item.customInput}
                    </Text>
                  )}
                </View>

                <View style={styles.orderItemQuantityContainer}>
                  <Text style={[{ fontFamily: "GoogleSans", color: "#3a5565", fontSize: 14 }]}>
                    {item.quantity} x {parseFloat(item.product.price).toFixed(0)}฿
                  </Text>
                </View>

                <Text style={styles.orderItemPrice}>{getDiscountedPrice(item, index)}฿</Text>
              </View>
            </Animated.View>
          </Swipeable>
        ))}
      </ScrollView>

      {/* Order Summary */}
      <View style={styles.orderTotalContainer}>
        <View style={styles.orderTotalRow}>
          <Text style={[{ fontFamily: "GoogleSans" }]}>Total Quantity:</Text>
          <Text style={[{ fontFamily: "GoogleSans", textAlign: "right" }]}>{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</Text>
        </View>

        <View style={styles.orderTotalRow}>
          <Text style={[{ fontFamily: "GoogleSans" }]}>Total:</Text>
          <Text style={[{ fontFamily: "GoogleSans", textAlign: "right", fontSize: 18, fontWeight: "bold" }]}>{total.toFixed(0)}฿</Text>
        </View>

        {total > 0 && (
          <Animated.View style={{ opacity: opacity, transform: [{ translateY: translateY }] }}>
            <TouchableOpacity style={styles.proceedButton} onPress={() => { incrementReceiptNumber(); incrementQueueNumber(); }}>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
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
    paddingVertical: 4,
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
    backgroundColor: "#3a5565",
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  orderSummaryTitleContainer: {
    backgroundColor: "#f0f3f5",
    padding: 5,
    borderRadius: 20,
    marginBottom: 10,
    width: "30%",
    justifyContent: "center",
    alignItems: "center",
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#434d52",
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
    borderBottomColor: "#3a5565",
  },
  tabText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    color: "#6d7d85",
  },
  tabTextActive: {
    color: "#434d52",
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
  orderItemQuantityDisplayContainer: {
    flexDirection: "column",
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
    backgroundColor: "#3a5565",
    paddingVertical: 12,
    borderRadius: 25,
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
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
    marginBottom: 20,
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
    marginTop: isMobile ? 5 : isTablet ? 25 : 30,
    marginRight: 14,
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
    width: 65,
    padding: isMobile ? 2 : 5,
    height: "70%",
    borderRadius: 20,
    marginLeft: isMobile ? 2 : 5,
    marginVertical: 5,
  },
  actionText: {
    fontFamily: "GoogleSans",
    fontSize: isMobile ? 10 : 12,
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
  orderHeaderReceiptText: {
    color: "#444",
    fontSize: 18,
    fontWeight: "bold",
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
  orderHeaderTabs: {
    backgroundColor: "#eeeeee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    height: 32,
    paddingHorizontal: 5,
    width: "100%",
    marginBottom: 10,
  },
  buttonHeader: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginRight: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flex: 1, // Distribute space evenly
  },
  buttonHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#aaaaaa",
  },
  selectedText: {
    color: "#263c48", // Text color when selected
  },
  highlight: {
    position: "absolute",
    height: "90%",
    marginLeft: 1,
    width: "33.33%", // Adjust based on number of buttons
    backgroundColor: "#fff",
    borderRadius: 20,
    zIndex: -1, // Place the highlight behind the buttons
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
  orderItemImage: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    marginRight: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  rightActionContainer: {
    flexDirection: "row",
  },
  discountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "60%",
    marginTop: 10,
  },
  discountInput: {
    flex: 1,
    fontFamily: "GoogleSans",
    borderWidth: 1,
    borderColor: "#ddd", // Softer border color for a modern look
    borderRadius: 2, // Rounded corners for a cleaner design
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14, // Smaller font for a more compact look
    color: "#333", // Dark text for clarity
    backgroundColor: "#fff", // White background for a sleek modern appearance
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Subtle shadow
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  saveButton: {
    fontSize: 10, // Smaller font for a more compact look
    marginLeft: 5,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 2, // Slightly rounded corners
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc", // Light border to match input field
    backgroundColor: "#4682B4", // Modern blue color for the button
    shadowColor: "#4682B4", // Matching shadow color for a cohesive design
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Subtle raised effect

    alignSelf: "flex-end",
  },

  saveButtonText: {
    fontFamily: "GoogleSans",
    color: "#fff", // White text for contrast
    fontSize: 10, // Small text for a sleek appearance
    fontWeight: "bold", // Bold text to make the button stand out
  },
});

export default Orders;
