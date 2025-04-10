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
  Modal,
} from "react-native";
import { database, db, ref, onValue } from "../utils/firebase";
import { Option, Product, Category, OrderItem } from "../Data/types";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ProductItem from "../components/ProductItem";
import {} from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  DatabaseReference,
  get,
  set,
  push,
  getDatabase,
} from "firebase/database";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Settings } from "../Data/types"; // Adjust the path as needed
import FastImage from "expo-fast-image";
import PhoneDialerModal from "../components/PhoneDialerModal";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import PromptPayQRCodeModal from "../components/PromptPayQRCodeModal";
import { theme } from "../components/theme";
import { curry } from "lodash";
import EditNoteModal from "../components/EditNoteModal";
import { FaChevronCircleDown, FaChevronCircleUp,FaUser, FaCalendarAlt, FaClock,FaPrint, FaTrashAlt, FaThList   } from "react-icons/fa"; // นำเข้าไอคอนจาก Font Awesome
import { IoChevronForwardOutline } from "react-icons/io5";
import { format } from 'date-fns';
import { LoadingProvider, useLoading } from '../components/LoadingContext';
import { OrbitProgress } from 'react-loading-indicators';
import Clock from "../components/clock";
import localforage from "localforage";
import NetInfo from "@react-native-community/netinfo";
import { ReceiptTemplate } from "../components/ReceiptTemplate";

// ตั้งค่า IndexedDB
localforage.config({
  name: "OrdersPOS",
  storeName: "pendingOrders",
});
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
 
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const mobileNumber = "0651199354"; // Replace with customer mobile number

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
  const [duplicateAlertVisible, setDuplicateAlertVisible] = useState(false);
const [potentialDuplicateOrder, setPotentialDuplicateOrder] = useState<any>(null);
const [lastSavedOrder, setLastSavedOrder] = useState<any>(null);
const [paymentDetails, setPaymentDetails] = useState<{ [method: string]: number }>({});
const [isLastOrderModalVisible, setLastOrderModalVisible] = useState(false);
const slideAnim = useRef(new Animated.Value(300)).current;
const [isOnline, setIsOnline] = useState(true);
 
 
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
  const DuplicateOrderAlert = () => {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={duplicateAlertVisible}
        onRequestClose={() => setDuplicateAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>คำเตือน: ออเดอร์อาจซ้ำ</Text>
            <Text style={styles.alertMessage}>
              พบออเดอร์ที่มีรายการคล้ายกับออเดอร์ก่อนหน้า 
              (ใบเสร็จ #{lastSavedOrder?.receiptNumber})
              ต้องการดำเนินการต่อหรือไม่?
            </Text>
            <View style={styles.alertButtonsContainer}>
              <TouchableOpacity
                style={[styles.alertButton, styles.cancelButton]}
                onPress={() => {
                  setDuplicateAlertVisible(false);
                  setPotentialDuplicateOrder(null);
                }}
              >
                <Text style={styles.alertButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, styles.confirmButton]}
                onPress={async () => {
                  setDuplicateAlertVisible(false);
                  if (potentialDuplicateOrder) {
                    await proceedWithOrder(potentialDuplicateOrder);
                  }
                  setPotentialDuplicateOrder(null);
                }}
              >
                <Text style={styles.alertButtonText}>ดำเนินการต่อ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  // ฟังก์ชันช่วยเปรียบเทียบออเดอร์
  const isOrderSimilar = (currentOrder: OrderItem[], previousOrder: any) => {
    if (!previousOrder?.items || !currentOrder.length) return false;
  
    const currentItems = currentOrder.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      options: (item.selectedOptions || []).map(opt => opt.id).sort().join(','),
      customInput: item.customInput || ''
    })).sort((a, b) => a.productId.localeCompare(b.productId));
  
    interface OrderItemComparison {
      productId: string;
      quantity: number;
      options: string;
      customInput: string;
    }

    const previousItems = previousOrder.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      options: (item.selectedOptions || []).map((opt: any) => opt.id).sort().join(','),
      customInput: item.customInput || ''
    })).sort((a: OrderItemComparison, b: OrderItemComparison) => a.productId.localeCompare(b.productId));
  
    if (currentItems.length !== previousItems.length) return false;
  
    console.log("Current Items:", currentItems, "Previous Items:", previousItems);
  
    return currentItems.every((current, index) => {
      const prev = previousItems[index];
      return (
        current.productId === prev.productId &&
        current.quantity === prev.quantity &&
        current.options === prev.options &&
        current.customInput === prev.customInput
      );
    });
  };
  const [formattedDate, setFormattedDate] = useState("");
 
  const [discounts, setDiscounts] = useState<{ [key: number]: string }>({});
  const [visibleDiscountInput, setVisibleDiscountInput] = useState<
    number | null
  >(null);
  

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
    setIsLoading(true); // Start loading
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
    if (Platform.OS === 'web') {
      // Web implementation
      const isConfirmed = window.confirm('Are you sure you want to clear all items?');
      if (isConfirmed) {
        clearOrderState();
      }
    } else {
      // React Native implementation
      Alert.alert(
        'Clear All Items',
        'Are you sure you want to clear all items?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: clearOrderState,
            style: 'destructive', // Optional: makes it red on iOS
          },
        ],
        { cancelable: true } // Allows dismissing by tapping outside
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
      const updatedMethods = prevMethods.includes(method)
        ? prevMethods.filter((m) => m !== method)
        : [...prevMethods, method];
  
      // Ensure paymentDetails is updated before opening modals
      setPaymentDetails((prev) => {
        const newDetails = { ...prev };
        if (!updatedMethods.includes("Cash")) delete newDetails.Cash;
        if (!updatedMethods.includes("Scan")) delete newDetails.Scan;
  
        if (method === "Scan" && updatedMethods.includes("Cash")) {
          // Mixed payment: Set Scan to remaining amount
          newDetails.Scan = total - (newDetails.Cash || 0);
        } else if (method === "Scan" && !updatedMethods.includes("Cash")) {
          // Scan only: Set full amount
          newDetails.Scan = total;
        }
  
        console.log("Payment details after method select:", newDetails);
        return newDetails;
      });
  
      // Open modals after state updates
      setTimeout(() => {
        if (method === "Cash" && !prevMethods.includes("Cash")) {
          handleOpenDialer();
        }
        if (method === "Scan" && !prevMethods.includes("Scan")) {
          console.log("Opening QR modal with total:", total, "and cash:", paymentDetails.Cash);
          handleQrOpenDialer();
        }
      }, 50);
  
      return updatedMethods;
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
      setIsLoading(true); // Start loading
      const db = getDatabase();
      const ordersRef = ref(db, "orders");
  
      const items = orderItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.nameDisplay,
        productSize: item.product.productSize || "",
        quantity: item.quantity,
        price: parseFloat(item.product.price),
        selectedOptions: item.selectedOptions.map((opt) => ({
          id: opt.id,
          name: opt.name,
          price: opt.price,
        })),
        customInput: item.customInput || "",
        totalPrice:
          item.quantity *
          (parseFloat(item.product.price) +
            item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)),
      }));
  
      const now = new Date();
      const timezoneOffset = 7 * 60; // Bangkok UTC+7
      const localTime = new Date(now.getTime() + timezoneOffset * 60 * 1000);
  
      // Debug paymentDetails
      console.log("paymentDetails before saving:", paymentDetails);
  
      // Use total for Cash payment amount when only Cash is selected
      const paymentMethods = selectedPaymentMethod.map((method) => {
        let amount = paymentDetails[method] || 0;
        if (method === "Cash" && selectedPaymentMethod.length === 1) {
          amount = total; // Always use total for Cash-only payment
        }
        console.log(`Saving ${method} with amount:`, amount);
        return { method, amount };
      });
  
      // Calculate remainBalance based on cashChange
      const totalPaid = paymentMethods.reduce((sum, { amount }) => sum + amount, 0);
      const correctedRemainBalance = cashChange >= total ? cashChange - total : 0;
  
      const orderData = {
        receiptNumber,
        queueNumber,
        orderType: selectedOrderType,
        items,
        subtotal,
        tax,
        serviceCharge,
        total,
        cashChange,
        remainBalance: correctedRemainBalance, // Use corrected value
        paymentMethods,
        orderDate: localTime.toISOString().replace("T", " ").replace(/\..+/, ""),
      };
  
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, orderData);
  
      console.log("✅ Order saved successfully:", orderData);
      setIsLoading(false); // Stop loading on success
      return true;
    } catch (error) {
      console.error("❌ Failed to save order:", error);
      window.alert("Save Failed", "ไม่สามารถบันทึกคำสั่งซื้อลงในฐานข้อมูลได้");
      return false;
    }
  };

 interface OrderData {
  orderItems: OrderItem[];
  receiptNumber: string;
  queueNumber: number;
  selectedOrderType: OrderType;
  total: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  cashChange: number;
  remainbalance: number;
  selectedPaymentMethod: string[];
}

interface OrderData {
  orderItems: OrderItem[];
  receiptNumber: string;
  queueNumber: number;
  selectedOrderType: OrderType;
  total: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  cashChange: number;
  remainbalance: number;
  selectedPaymentMethod: string[];
}

const updatePaymentDetails = async (cashValue?: number): Promise<{ [key: string]: number }> => {
  return new Promise((resolve) => {
    setPaymentDetails((prev) => {
      const updatedDetails = { ...prev };
      console.log("updatePaymentDetails - Initial paymentDetails:", prev, "cashValue:", cashValue, "cashChange:", cashChange);

      if (selectedPaymentMethod.length === 1) {
        if (selectedPaymentMethod.includes("Cash")) {
          // Cap payment amount at total, use cashValue or cashChange for change calculation
          updatedDetails.Cash = total; // Always use total for payment amount
          updatedDetails.Scan = 0;
        } else if (selectedPaymentMethod.includes("Scan")) {
          updatedDetails.Scan = total;
          updatedDetails.Cash = 0;
        }
      } else if (selectedPaymentMethod.includes("Cash") && selectedPaymentMethod.includes("Scan")) {
        updatedDetails.Cash = cashValue || cashChange || 0;
        updatedDetails.Scan = total - (cashValue || cashChange || 0);
      }

      console.log("Updated paymentDetails:", updatedDetails);
      resolve(updatedDetails);
      return updatedDetails;
    });
  });
};

const handleProceedToPayment = async (cashValue?: number) => {
  try {
    console.log("handleProceedToPayment called with cashValue:", cashValue);
    if (orderItems.length === 0) {
      showAlert("ไม่มีรายการ", "กรุณาเพิ่มอย่างน้อยหนึ่งรายการ");
      return false;
    }
    if (selectedPaymentMethod.length === 0) {
      showAlert("ไม่ได้เลือกวิธีชำระ", "กรุณาเลือกวิธีการชำระเงิน");
      return false;
    }

    const updatedPaymentDetails = await updatePaymentDetails(cashValue);
    console.log("After updatePaymentDetails:", updatedPaymentDetails);

    if (!(await validatePayment(updatedPaymentDetails))) {
      return false;
    }

    console.log("Checking for duplicate order...");
    if (await checkDuplicateOrder(updatedPaymentDetails)) {
      console.log("Duplicate order detected, waiting for user confirmation");
      return false; // รอการยืนยันจากผู้ใช้
    }

    return await processPayment(updatedPaymentDetails);
  } catch (error) {
    handlePaymentError(error);
    return false;
  }
};

const validatePayment = async (paymentDetails: { [key: string]: number }) => {
  const totalPaid = calculateTotalPaid(paymentDetails);
  console.log("Validating payment:", { totalPaid, total, paymentDetails });

  if (totalPaid < total) {
    showPaymentAlert(totalPaid, paymentDetails);
    console.error(`Payment insufficient: ${totalPaid} < ${total}`);
    return false;
  }
  if (totalPaid === 0) {
    console.error("No payment recorded");
    showAlert("No Payment", "กรุณาระบุยอดชำระเงิน");
    return false;
  }
  return true;
};

const calculateTotalPaid = (details: { [key: string]: number }) => {
  return Object.values(details).reduce((sum, val) => sum + val, 0);
};

const checkDuplicateOrder = async (paymentDetails: { [key: string]: number }) => {
  if (!lastSavedOrder || !isOrderSimilar(orderItems, lastSavedOrder)) return false;

  setPotentialDuplicateOrder({
    orderItems,
    receiptNumber,
    queueNumber: (queueNumber || 0) + 1,
    selectedOrderType,
    total,
    subtotal,
    tax,
    serviceCharge,
    cashChange: paymentDetails.Cash || 0,
    remainbalance: total - calculateTotalPaid(paymentDetails),
    selectedPaymentMethod,
  });
  setDuplicateAlertVisible(true);
  return true;
};

const processPayment = async (paymentDetails: { [key: string]: number }) => {
  await incrementReceiptNumber();
  const newQueueNumber = (queueNumber || 0) + 1;
  await set(ref(database, "lastQueueNumber"), newQueueNumber);

  const success = await saveOrderData({
    paymentDetails,
    newQueueNumber,
    totalPaid: calculateTotalPaid(paymentDetails),
  });

  if (success) {
    resetPaymentState(newQueueNumber);
    if (Platform.OS === "web") {
      const html = ReceiptTemplate({
        receiptNumber,
        queueNumber,
        orderItems,
        subtotal,
        tax,
        serviceCharge,
        total,
        totalDiscount,
        selectedPaymentMethod,
        paymentDetails,
        remainbalance,
        settings,
      });
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
    return true;
  }
  throw new Error("Failed to save order");
};
 
const saveOrderData = async ({
  paymentDetails,
  newQueueNumber,
  totalPaid
}: {
  paymentDetails: { [key: string]: number };
  newQueueNumber: number;
  totalPaid: number;
}) => {
  return await saveOrderToDatabase(
    orderItems,
    receiptNumber,
    newQueueNumber,
    selectedOrderType,
    total,
    subtotal,
    tax,
    serviceCharge,
    paymentDetails.Cash || 0,
    total - totalPaid,
    selectedPaymentMethod
  );
};

const resetPaymentState = (newQueueNumber: number) => {
  setLastSavedOrder({
    receiptNumber,
    items: orderItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
      customInput: item.customInput || ''
    }))
  });
  setOrderItems([]);
  setSelectedPaymentMethod([]);
  setCashChange(0);
  setRemainBalance(0);
  setQueueNumber(newQueueNumber);
  setPaymentDetails({});
  console.log("Payment state reset, lastSavedOrder:", lastSavedOrder);
 };

// Utility functions
const waitForStateUpdate = () => new Promise(resolve => setTimeout(resolve, 50));

const showAlert = (title: string, message: string) => {
  window.alert(title, message);
};

const showPaymentAlert = (totalPaid: number, paymentDetails: { [key: string]: number }) => {
  const breakdown = selectedPaymentMethod.map(method => 
    `${method}: ${paymentDetails[method] || 0}฿`
  ).join(", ");
  showAlert(
    "Insufficient Payment",
    `ยอดชำระรวม ${totalPaid}฿ ไม่ครบ ${total}฿ (${breakdown})`
  );
};
const slideIn = () => {
  setLastOrderModalVisible(true);
  Animated.timing(slideAnim, {
    toValue: 0, // Slide to the visible position
    duration: 300,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  }).start();
};
const LastOrderModal = () => {
  return (
    <Modal
      transparent={true}
      visible={isLastOrderModalVisible}
      animationType="none"
      onRequestClose={slideOut}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={slideOut}
      >
        <Animated.View
          style={[
            styles.lastOrderModalContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.lastOrderModalContent}>
            <Text style={styles.lastOrderModalTitle}>รายการสั่งซื้อล่าสุด</Text>
            {lastSavedOrder ? (
              <View>
                <Text style={styles.lastOrderText}>
                  Receipt #: {lastSavedOrder.receiptNumber}
                </Text>
                <Text style={styles.lastOrderText}>รายการ:</Text>
                {lastSavedOrder.items.map((item: any, index: number) => {
                  // Find the product in the products array by productId
                  const product = products.find(
                    (p) => p.id === item.productId
                  );
                  const productName = product
                    ? product.nameDisplay
                    : item.productId; // Fallback to productId if not found

                  return (
                    <View key={index} style={styles.lastOrderItem}>
                      <Text style={styles.lastOrderItemText}>
                        - สินค้า: {productName}
                      </Text>
                      <Text style={styles.lastOrderItemText}>
                        จำนวน: {item.quantity}
                      </Text>
                      {item.selectedOptions.length > 0 && (
                        <Text style={styles.lastOrderItemText}>
                          Options:{" "}
                          {item.selectedOptions.map((opt: any) => opt.id).join(", ")}
                        </Text>
                      )}
                      {item.customInput && (
                        <Text style={styles.lastOrderItemText}>
                          Note: {item.customInput}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.lastOrderText}>No previous order found.</Text>
            )}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={slideOut}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};
const slideOut = () => {
  Animated.timing(slideAnim, {
    toValue: 300, // Slide back off-screen
    duration: 200,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  }).start(() => setLastOrderModalVisible(false));
};
const logPaymentValidation = (paymentDetails: { [key: string]: number }, totalPaid: number) => {
  console.log("Payment Validation:", {
    paymentDetails,
    total,
    totalPaid,
    paymentMethods: selectedPaymentMethod
  });
};

const handlePaymentError = (error: unknown) => {
  console.error("Payment process failed:", error);
  showAlert("Error", "ไม่สามารถดำเนินการชำระเงินให้เสร็จสมบูรณ์ได้");
};

// Proceed with duplicate order
const proceedWithOrder = async (orderData: OrderData) => {
  try {
    await incrementReceiptNumber();
    await set(ref(database, "lastQueueNumber"), orderData.queueNumber);

    const success = await saveOrderToDatabase(
      orderData.orderItems,
      orderData.receiptNumber,
      orderData.queueNumber,
      orderData.selectedOrderType,
      orderData.total,
      orderData.subtotal,
      orderData.tax,
      orderData.serviceCharge,
      orderData.cashChange,
      orderData.remainbalance,
      orderData.selectedPaymentMethod
    );

    if (success) {
      resetPaymentState(orderData.queueNumber);
      return true;
    }
    throw new Error("Failed to save duplicate order");
  } catch (error) {
    handlePaymentError(error);
    return false;
  }
};
// ฟังก์ชันพิมพ์ใบเสร็จ
const printReceipt = () => {
  if (Platform.OS === "web") {
    const html = ReceiptTemplate({
      receiptNumber,
      queueNumber: queueNumber ?? 0, // กำหนด default เป็น 0 ถ้า null
      orderItems,
      subtotal,
      tax,
      serviceCharge,
      total,
      totalDiscount: totalDiscount ?? 0, // กำหนด default เป็น 0 ถ้า null
      selectedPaymentMethod,
      paymentDetails,
      remainbalance,
      settings,
    });
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      console.error("Failed to open print window. Please allow pop-ups.");
      Alert.alert("Error", "กรุณาอนุญาต Pop-up เพื่อพิมพ์ใบเสร็จ");
    }
  } else {
    console.warn("This function is intended for web platform only");
  }
};
  const isMobile =
    windowWidth <= 768 ||
    (typeof navigator !== "undefined" &&
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  return (
    <View
      style={
        isMobile
          ? [
              styles.containerMobile,
              { backgroundColor: currentTheme.backgroundColor },
            ]
          : [
              styles.container,
              { backgroundColor: currentTheme.backgroundColor },
            ]
      }
    >
      {isLoading && (
      <View style={styles.loadingContainer}>
        <OrbitProgress color="#1575a1" size="small" text="" textColor="" />
      </View>
    )}
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
  amount={
    (() => {
      const cashAmount = paymentDetails.Cash || 0;
      const calculatedAmount =
        selectedPaymentMethod.includes("Cash") && selectedPaymentMethod.includes("Scan")
          ? Math.max(total - cashAmount, 0)
          : total;
      return calculatedAmount;
    })()
  }
  onClose={closeQRCodeModal}
  onProceedToPayment={handleProceedToPayment}
  setPaymentDetails={setPaymentDetails}
/>
{isDialerVisible && (
  <PhoneDialerModal
    visible={isDialerVisible}
    total={total}
    cashChange={cashChange}
    onMoneyChanged={handleMoneyChanged}
    onCashChanged={handleCashChanged}
    onClose={handleCloseDialer}
    onProceedToPayment={handleProceedToPayment}
    setPaymentDetails={setPaymentDetails} // Ensure this is passed correctly
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
      <DuplicateOrderAlert />
      <LastOrderModal />
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
                        { fontFamily: "GoogleSans-Regular" },
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
              {isMobile && (
              <Animated.View style={[styles.drawerToggleButton]}>
                <TouchableOpacity
                  onPress={toggleDrawer}
                  style={{
                    padding: 10,
                    borderRadius: 50,
                    backgroundColor: isDrawerOpen ? "#3a5565" : "#3a5565",
                  }}
                >
                  
                  {isDrawerOpen ? (
  <FaChevronCircleDown size={32} color="#fff" />
) : (
  <FaChevronCircleUp size={32} color="#fff" />
)}
                </TouchableOpacity>
              </Animated.View>
            )}
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
                          { fontFamily: "GoogleSans-Regular" },
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
                 <IoChevronForwardOutline size={24} color={"#3c5867"} />
                </View>
              )}
            </View>
          {/* Fixed toggle button (outside ScrollView) */}
  {isMobile && (
     <Animated.View style={[styles.drawerToggleButtonweb]}>
     <TouchableOpacity
       onPress={toggleDrawer}
       style={{
        
       }}
     >
       {isDrawerOpen ? (
  <FaChevronCircleDown size={32} color="#fff" />
) : (
  <FaChevronCircleUp size={32} color="#fff" />
)}
     </TouchableOpacity>
   </Animated.View>
  )}
  {/* Main content with scrolling */}
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
                style={[
                  styles.orderSummaryTitle,
                  { fontFamily: "GoogleSans-Regular" },
                ]}
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
                  คิวที่ #{queueNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
              <TouchableOpacity
                  style={[styles.circleButton, { marginRight: 5 }]}
                >
                <TouchableOpacity
  style={[styles.circleButton, { marginRight: 5 }]}
  onPress={slideIn} // Trigger the slide-in animation
>
  <FaThList size={16} />
</TouchableOpacity>
                <TouchableOpacity
      style={[styles.circleButton, { marginRight: 5 }]}
      onPress={printReceipt}
    >
      <FaPrint size={16} />
    </TouchableOpacity>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={confirmClearOrderItems}
                >
                 <FaTrashAlt size={16} color="red" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
              <FaUser size={16} />
                <Text style={styles.orderHeaderText}> Cashier 1</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
              <FaCalendarAlt size={16} color={"#3c5867"} />
                <Text style={styles.dateText}> {formattedDate}</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
              <FaClock size={16} color={"#3c5867"} />
                <Clock/>
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
                      transform: [
                        { translateY: animationValues[index].translateY },
                      ],
                      opacity: animationValues[index].opacity,
                    }}
                  >
                    <View style={styles.orderItem}>
                      <View style={styles.orderItemTextContainer}>
                        {/* Product Name */}
                        <Text style={{ fontFamily: "Kanit-Regular" }}>
                          {item.product.nameDisplay}
                          {settings?.OrderPanels?.displaySize &&
                          item.product?.productSize
                            ? ` (${item.product.productSize})`
                            : ""}
                        </Text>

                        {/* Selected Options */}
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
                            fontFamily: "GoogleSans-Regular",
                            color: "#3a5565",
                            fontSize: 14,
                          }}
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
                <Text style={[{ fontFamily: "GoogleSans-Regular" }]}>
                  Total Quantity:
                </Text>
                <Text
                  style={[
                    { fontFamily: "GoogleSans-Regular", textAlign: "right" },
                  ]}
                >
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>

              {/* Subtotal */}
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans-Regular" }]}>
                  Subtotal:
                </Text>
                <Text
                  style={[
                    { fontFamily: "GoogleSans-Regular", textAlign: "right" },
                  ]}
                >
                  {subtotal.toFixed(0)}฿
                </Text>
              </View>

              {/* Discount */}
              {settings?.OrderPanels.displayDiscount && (
                <View style={styles.orderTotalRow}>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
                      color: "#3a5565",
                    }}
                  >
                    Discount:
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
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
                  <Text style={{ fontFamily: "GoogleSans-Regular" }}>
                    Tax ({(settings?.OrderPanels.taxValue * 100).toFixed(0)}%):
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
                      textAlign: "right",
                    }}
                  >
                    {tax.toFixed(0)}฿
                  </Text>
                </View>
              )}

              {/* Service Charge */}
              {settings?.OrderPanels.displayServiceCharge && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans-Regular" }}>
                    Service Charge (
                    {(settings.OrderPanels.serviceChargeValue * 100).toFixed(0)}
                    %):
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
                      textAlign: "right",
                    }}
                  >
                    {serviceCharge.toFixed(0)}฿
                  </Text>
                </View>
              )}

{selectedPaymentMethod.length > 0 && (
  <>
    {/* แสดงวิธีการชำระเงินทั้งหมด */}
    {selectedPaymentMethod.map((method, index) => (
      <View key={index} style={styles.orderTotalRow}>
        <Text style={{ fontFamily: "GoogleSans-Regular" }}>
          Payment Method {index + 1}:
        </Text>
        <Text
          style={{
            fontFamily: "GoogleSans-Regular",
            textAlign: "right",
            fontSize: 14,
            color: "#3a5565",
          }}
        >
          {method} ({paymentDetails[method]?.toFixed(0) || "0"}฿)
        </Text>
      </View>
    ))}

    {/* Remaining */}
    <View style={styles.orderTotalRow}>
      <Text style={{ fontFamily: "GoogleSans-Regular" }}>
        Remaining:
      </Text>
      <Text
        style={{
          fontFamily: "GoogleSans-Regular",
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
                <Text style={[{ fontFamily: "GoogleSans-Regular" }]}>
                  Total:
                </Text>
                <Text
                  style={[
                    {
                      fontFamily: "GoogleSans-Regular",
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
  selectedMethods={selectedPaymentMethod} // Pass the state
/>

                 
              </Animated.View>
            )}
            <TouchableOpacity style={styles.CloseButton} onPress={toggleDrawer}>
              <Text style={styles.CloseButtonText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {!isMobile && (
        <View style={styles.layout2}>
          <DuplicateOrderAlert />
          <LastOrderModal />
          <View style={styles.orderSummaryContainer}>
            {/* Order List Title */}
            <View style={styles.orderSummaryTitleContainer}>
              <Text
                style={[
                  styles.orderSummaryTitle,
                  { fontFamily: "GoogleSans-Regular" },
                ]}
              >
                Order List
              </Text>
            </View>

            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderReceiptText}>
                  #{receiptNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
                <Text style={styles.orderHeaderReceiptText}>
                คิวที่: #{queueNumber}
                </Text>
              </View>
              <View style={styles.orderHeaderGroup}>
              <TouchableOpacity
  style={[styles.circleButton, { marginRight: 5 }]}
  onPress={slideIn} // Trigger the slide-in animation
>
  <FaThList size={16} />
</TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circleButton, { marginRight: 5 }]}
                >
                 <FaPrint size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={confirmClearOrderItems}
                >
                 <FaTrashAlt size={16} color="#E21818" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderGroup}>
              <FaUser size={16} />
                <Text style={styles.orderHeaderText}> Cashier 1</Text>
              </View>
              <View style={styles.orderHeaderGroup}>
              <FaCalendarAlt size={16} color={"#3c5867"} />
              </View>
              <View style={styles.orderHeaderGroup}>
              <FaClock size={16} color={"#3c5867"} />
                <Clock/>
              </View>
            </View>

            {/* Order Type Tabs */}
            <View style={styles.orderHeaderTabs}>
              <Animated.View
                style={{
                  ...styles.highlight,
                  transform: [
                    {
                      translateX: highlightOffset.interpolate({
                        inputRange: [0, 100],
                        outputRange: [0, 100],
                      }),
                    },
                  ],
                }}
              />
              {["Dine In", "Take Away", "Delivery"].map((type) => (
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

            {/* Order Items List */}
            <ScrollView>
              {orderItems.map((item, index) => (
                <Swipeable
                  key={item.product.id}
                  renderRightActions={(progress, dragX) => (
                    <Animated.View
                      style={{
                        transform: [
                          {
                            scale: dragX.interpolate({
                              inputRange: [-100, 0],
                              outputRange: [1, 0.5],
                              extrapolate: "clamp",
                            }),
                          },
                        ],
                      }}
                    >
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
                          <Text style={[styles.actionText, { color: "white" }]}>
                            Discount
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.rightAction,
                            { backgroundColor: "#FF0000" },
                          ]}
                          onPress={() => removeItemFromOrder(item.product.id)}
                        >
                          <Text style={[styles.actionText, { color: "white" }]}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  )}
                >
                  <Animated.View
                    style={{
                      transform: [
                        { translateY: animationValues[index]?.translateY || 0 },
                      ],
                      opacity: animationValues[index]?.opacity || 1,
                    }}
                  >
                    <View style={styles.orderItem}>
                      <View style={styles.orderItemTextContainer}>
                        <Text style={[{ fontFamily: "Kanit-Regular" }]}>
                          {item.product.nameDisplay}
                          {settings?.OrderPanels?.displaySize &&
                          item.product?.productSize
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

                        {item.customInput && (
                          <Text
                            style={[
                              { fontFamily: "Kanit-Regular", color: "#4682B4" },
                            ]}
                          >
                            Note: {item.customInput}
                          </Text>
                        )}
                      </View>

                      <View style={styles.orderItemQuantityContainer}>
                        <Text
                          style={[
                            {
                              fontFamily: "GoogleSans-Regular",
                              color: "#3a5565",
                              fontSize: 14,
                            },
                          ]}
                        >
                          {item.quantity} x{" "}
                          {parseFloat(item.product.price).toFixed(0)}฿
                        </Text>
                      </View>

                      <Text style={styles.orderItemPrice}>
                        {getDiscountedPrice(item, index)}฿
                      </Text>
                    </View>
                  </Animated.View>
                </Swipeable>
              ))}
            </ScrollView>

            {/* Order Summary */}
            <View style={styles.orderTotalContainer}>
              {/* Total Quantity */}
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans-Regular" }]}>
                  Total Quantity:
                </Text>
                <Text
                  style={[
                    { fontFamily: "GoogleSans-Regular", textAlign: "right" },
                  ]}
                >
                  {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>

              {/* Subtotal */}
              <View style={styles.orderTotalRow}>
                <Text style={[{ fontFamily: "GoogleSans-Regular" }]}>
                  Subtotal:
                </Text>
                <Text
                  style={[
                    { fontFamily: "GoogleSans-Regular", textAlign: "right" },
                  ]}
                >
                  {subtotal.toFixed(0)}฿
                </Text>
              </View>

              {/* Discount */}
              {settings?.OrderPanels.displayDiscount && (
                <View style={styles.orderTotalRow}>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
                      color: "#3a5565",
                    }}
                  >
                    Discount:
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
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
                  <Text style={{ fontFamily: "GoogleSans-Regular" }}>
                    Tax ({(settings?.OrderPanels.taxValue * 100).toFixed(0)}%):
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
                      textAlign: "right",
                    }}
                  >
                    {tax.toFixed(0)}฿
                  </Text>
                </View>
              )}

              {/* Service Charge */}
              {settings?.OrderPanels.displayServiceCharge && (
                <View style={styles.orderTotalRow}>
                  <Text style={{ fontFamily: "GoogleSans-Regular" }}>
                    Service Charge (
                    {(settings.OrderPanels.serviceChargeValue * 100).toFixed(0)}
                    %):
                  </Text>
                  <Text
                    style={{
                      fontFamily: "GoogleSans-Regular",
                      textAlign: "right",
                    }}
                  >
                    {serviceCharge.toFixed(0)}฿
                  </Text>
                </View>
              )}

{selectedPaymentMethod.length > 0 && (
  <>
    {/* แสดงวิธีการชำระเงินทั้งหมด */}
    {selectedPaymentMethod.map((method, index) => (
      <View key={index} style={styles.orderTotalRow}>
        <Text style={{ fontFamily: "GoogleSans-Regular" }}>
          Payment Method {index + 1}:
        </Text>
        <Text
          style={{
            fontFamily: "GoogleSans-Regular",
            textAlign: "right",
            fontSize: 14,
            color: "#3a5565",
          }}
        >
          {method} ({paymentDetails[method]?.toFixed(0) || "0"}฿)
        </Text>
      </View>
    ))}

    {/* Remaining */}
    <View style={styles.orderTotalRow}>
      <Text style={{ fontFamily: "GoogleSans-Regular" }}>
        Remaining:
      </Text>
      <Text
        style={{
          fontFamily: "GoogleSans-Regular",
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
                <Text style={[{ fontFamily: "GoogleSans-Regular" }]}>
                  Total:
                </Text>
                <Text
                  style={[
                    {
                      fontFamily: "GoogleSans-Regular",
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
  selectedMethods={selectedPaymentMethod} // Pass the state
/>
 </Animated.View>
            )}
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
    fontFamily: "GoogleSans-Regular",
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
    opacity: 0.5,
    padding: 1,
    borderRadius: 40,
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  drawerToggleButtonweb: {
    backgroundColor: "#3a5565",
    height: 52,
    opacity: 0.5,
    padding: 1,
    borderRadius: 40,
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1001,
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
    fontFamily: "GoogleSans-Regular",
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
    fontFamily: "GoogleSans-Regular",
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
    fontFamily: "GoogleSans-Regular",
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
    fontFamily: "GoogleSans-Regular",
    color: "#444",
    fontSize: 14,
  },
  orderHeaderReceiptText: {
    fontFamily: "Kanit-Regular,GoogleSans-Regular",
    color: "#444",
    fontSize: 18,
    fontWeight: "bold",
  },
  dateText: {
    fontFamily: "GoogleSans-Regular",
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
    fontFamily: "GoogleSans-Regular",
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
    fontFamily: "GoogleSans-Regular",
    color: "#fff", // White text for contrast
    fontSize: 10, // Small text for a sleek appearance
    fontWeight: "bold", // Bold text to make the button stand out
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  alertTitle: {
    fontFamily: "GoogleSans-Regular",
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  alertMessage: {
    fontFamily: "GoogleSans-Regular",
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#bbbbbb',
  },
  confirmButton: {
    backgroundColor: '#3a5565',
  },
  alertButtonText: {
    fontFamily: "GoogleSans-Regular",
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent overlay
    zIndex: 1000, // Ensure it appears above other content
  },
  lastOrderModalContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300, // Fixed width for the modal
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  lastOrderModalContent: {
    flex: 1,
    padding: 20,
  },
  lastOrderModalTitle: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  lastOrderText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lastOrderItem: {
    marginLeft: 10,
    marginBottom: 10,
  },
  lastOrderItemText: {
    fontFamily: 'GoogleSans-Regular',
    fontSize: 12,
    color: '#444',
  },
  closeModalButton: {
    backgroundColor: '#3a5565',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    fontFamily: 'GoogleSans-Regular',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Orders;
 
