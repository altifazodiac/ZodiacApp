import React, { useEffect, useState, useRef, useCallback, memo } from "react";
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
  Vibration,
  Modal,
  ScrollView as RNScrollView,
} from "react-native";

import { db, ref, onValue } from "../utils/firebase";
import { Ionicons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
 

const windowWidth = Dimensions.get("window").width;
const isMobile = windowWidth <= 768;

 
interface Option {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  nameDisplay: string;
  price: string;
  imageUrl?: string | null;
  description?: string;
  categoryId: string;
  status: string;
  options?: Option[];
}

interface OrderItem {
  product: Product;
  quantity: number;
  selectedOptions: Option[];
}

type Category = {
  id: string;
  name: string;
};

 

const PosOrders = () => {
  const calculateNumColumns = useCallback(() => {
    const screenWidth = Dimensions.get("window").width;
    if (screenWidth < 500) return 2;
    if (screenWidth < 900) return 3;
    return 4;
  }, []);

  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: Option[] }>({});
  const [sampleOptions, setSampleOptions] = useState<Option[]>([]);
  const [products, setProducts] = useState<Product[]>([]); 
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null); 
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [numColumns, setNumColumns] = useState(calculateNumColumns());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);
  const drawerHeight = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;
  const pan = useRef(new Animated.ValueXY()).current;

  const isValidOption = (option: any): option is Option => {
    return (
      typeof option === 'object' &&
      typeof option.name === 'string' &&
      typeof option.price === 'number' &&
      typeof option.id === 'string'
    );
  };

  const validateOptions = (options: any): Option[] => {
    if (Array.isArray(options)) {
      return options.filter(isValidOption);
    }
    return [];
  };

  useEffect(() => {
    const categoriesRef = ref(db, "categories");
    const productsRef = ref(db, "products");
    const optionsRef = ref(db, "options"); // Define optionsRef here

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
            const productData = product as Product; // Cast to Product type
            return {
              id,
              nameDisplay: productData.nameDisplay,
              price: productData.price,
              imageUrl: productData.imageUrl || undefined,
              categoryId: productData.categoryId,
              status: productData.status,
              description: productData.description,
              options: validateOptions(productData.options), // Validate options here
            };
          })
        : [];
      setProducts(formattedProducts);
      setIsLoading(false);
    });
    
    const optionsListener = onValue(optionsRef, (snapshot) => {
      const optionsData = snapshot.val();
      const formattedOptions: Option[] = optionsData
        ? Object.entries(optionsData).map(([id, option]) => {
            const optionData = option as Option; // Cast to Option type
            return {
              id,
              name: optionData.name,
              price: optionData.price,
            };
          })
        : [];
      setSampleOptions(formattedOptions);
    });

    return () => {
      categoriesListener();
      productsListener();
      optionsListener();
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

      
    
  const mergeOptions = (existingOptions: Option[], newOptions: Option[]): Option[] => {
    const combinedOptions = [...existingOptions];
    newOptions.forEach((newOption) => {
      const existingOptionIndex = combinedOptions.findIndex((option) => option.id === newOption.id);
      if (existingOptionIndex !== -1) {
        combinedOptions[existingOptionIndex] = {
          ...combinedOptions[existingOptionIndex],
          ...newOption,
        };
      } else {
        combinedOptions.push(newOption);
      }
    });
    return combinedOptions;
  };

  const addItemToOrder = (product: Product, selectedOptions: Option[] = []) => {
    setOrderItems((prevOrderItems) => {
      const existingItemIndex = prevOrderItems.findIndex((item) => item.product.id === product.id);

      if (existingItemIndex !== -1) {
        const updatedOrderItems = [...prevOrderItems];
        const existingItem = updatedOrderItems[existingItemIndex];

        updatedOrderItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          selectedOptions: mergeOptions(existingItem.selectedOptions, selectedOptions),
        };
        return updatedOrderItems;
      } else {
        return [...prevOrderItems, { product, quantity: 1, selectedOptions }];
      }
    });
  };

  const removeItemFromOrder = (id: string) => {
    setOrderItems((prevOrderItems) => prevOrderItems.filter((item) => item.product.id !== id));
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const orderItem = orderItems.find((orderItem) => orderItem.product.id === item.id);
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
      <TouchableOpacity
        onPress={() => {
          addItemToOrder(item);
          toggleDrawer();
          Vibration.vibrate();
        }}
        onLongPress={() => {
          const existingSelectedOptions = orderItems.find((orderItem) => orderItem.product.id === item.id)?.selectedOptions || [];
          
          // Generate formattedOptions for the product
          const formattedOptions: Option[] = existingSelectedOptions.map((option, index) => ({
            id: `option-${item.id}-${index}`,
            name: option.name,
            price: option.price,
          }));
  
        
          setCurrentProduct(item);
          setOrderDetailModalVisible(true);
        }}
      >
        <View style={styles.card}>
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: item.imageUrl || "https://picsum.photos/100" }} style={styles.cardImage} />
            <View>
              <Text style={styles.cardTitle}>{item.nameDisplay}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </View>
          <View style={styles.priceQuantityContainer}>
            <Text style={styles.cardPrice}>{item.price}฿</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => { handleDecreaseQuantity(); Vibration.vibrate(); }} style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{itemQuantity}</Text>
              <TouchableOpacity onPress={() => { handleIncreaseQuantity(); Vibration.vibrate(); }} style={styles.quantityButton}>
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

  const OptionItem: React.FC<{
    option: Option;
    isSelected: boolean;
    onPress: () => void;
  }> = ({ option, isSelected, onPress }) => (
    <View style={styles.gridItem}>
      <TouchableOpacity
        style={[styles.buttonOption, isSelected ? styles.activeButton : styles.inactiveButton]}
        onPress={onPress}
        activeOpacity={1}
      >
        <Text style={isSelected ? styles.activeText : styles.inactiveText}>
          {option.name} - {option.price}฿
        </Text>
      </TouchableOpacity>
    </View>
  );
  const OrderDetailsModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    currentProduct: Product | null;
    selectedOptions: { [key: string]: Option[] };
    setSelectedOptions: React.Dispatch<React.SetStateAction<{ [key: string]: Option[] }>>;
    addItemToOrder: (product: Product, options: Option[]) => void;
  }> = ({ visible, onClose, currentProduct, selectedOptions, setSelectedOptions, addItemToOrder }) => {
    const scrollViewRef = useRef<ScrollView>(null);
  
    // Sample options for testing
    const sampleOptions: Option[] = [
      { id: "opt1", name: "Extra Cheese", price: 10 },
      { id: "opt2", name: "Spicy Sauce", price: 5 },
      { id: "opt3", name: "Double Meat", price: 20 },
    ];
  
    // Option selection handler
    const handleOptionPress = (option: Option) => {
      if (!currentProduct) return;
  
      setSelectedOptions((prevOptions) => {
        const productOptions = prevOptions[currentProduct.id] || [];
        const optionExists = productOptions.some((o) => o.name === option.name);
  
        const updatedOptions = optionExists
          ? productOptions.filter((o) => o.name !== option.name)
          : [...productOptions, option];
  
        return { ...prevOptions, [currentProduct.id]: updatedOptions };
      });
    };
  
    const scrollUp = () => scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    const scrollDown = () => scrollViewRef.current?.scrollToEnd({ animated: true });
  
    return (
      <Modal transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Order Details for {currentProduct?.nameDisplay || "No Product Selected"}
            </Text>
            <View style={styles.container}>
              <TouchableOpacity style={styles.arrowButton} onPress={scrollUp}>
                <AntDesign name="up" size={24} color="black" />
              </TouchableOpacity>
              <RNScrollView ref={scrollViewRef} style={styles.scrollView}>
                {sampleOptions.map((option) => {
                  const isSelected = (selectedOptions[currentProduct?.id || ''] || []).some(o => o.name === option.name);
                  return (
                    <OptionItem 
                      key={option.id} 
                      option={option} 
                      isSelected={isSelected} 
                      onPress={() => handleOptionPress(option)} 
                    />
                  );
                })}
              </RNScrollView>
              <TouchableOpacity style={styles.arrowButton} onPress={scrollDown}>
                <AntDesign name="down" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => {
                if (!currentProduct) return;
                addItemToOrder(currentProduct, selectedOptions[currentProduct?.id || ''] || []);
                onClose(); // Close the modal after adding to order
              }}>
                <Text style={styles.addButtonText}>Add to Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
 
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
              const optionsText = item.selectedOptions
                .map((option) => option.name)
                .join(", ");
                

              return (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderItemTextContainer}>
                    <Text style={[{ fontFamily: "Kanit-Regular" }]}>
                      {item.product.nameDisplay}
                    </Text>
                    {optionsText ? (
                      <Text style={styles.optionsText}>({optionsText})</Text>
                    ) : null}
                  </View>
                  <View style={styles.orderItemQuantityContainer}>
                    <Text style={[{ fontFamily: "GoogleSans" }]}>
                      {item.quantity} x{" "}
                      {parseFloat(item.product.price).toFixed(2)}฿
                    </Text>
                    {optionsText ? (
                      <Text style={styles.optionsPriceText}>
                        (+
                        {item.selectedOptions
                          .reduce((sum, option) => sum + option.price, 0)
                          .toFixed(2)}
                        ฿)
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.orderItemPrice}>
                    {(
                      item.quantity *
                      (parseFloat(item.product.price) +
                        item.selectedOptions.reduce(
                          (sum, option) => sum + option.price,
                          0
                        ))
                    ).toFixed(2)}
                    ฿
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeItemFromOrder(item.product.id)}
                  >
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

               
                {item.selectedOptions.length > 0 && (
                  <View style={styles.optionsContainer}>
                    {item.selectedOptions.map((option, optionIndex) => (
                      <Text
                        key={optionIndex}
                        style={[{ fontFamily: "GoogleSans-Italic" }]}
                      >
                        - {option.name}: {option.price.toFixed(2)}฿
                      </Text>
                    ))}
                  </View>
                )}

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
const { width } = Dimensions.get("window");
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  orderItemPrice: {
    fontFamily: "GoogleSans",
  },
  removeItemText: {
    color: "red",
    fontFamily: "GoogleSans",
  },
  // New styles for the options container
  optionsContainer: {
    marginTop: 5,
    paddingLeft: 20, // Indentation for the options
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    height: "60%",
  },
  modalText: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
  },
  buttonOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: "#bbbbbb",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "auto",
  },
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginVertical: 5,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  gridItem: {
    width: isMobile ? width / 2 - 20 : width / 4 - 20,
    marginBottom: 15,
  },

  activeButton: {
    borderColor: "#9969c7",
  },
  inactiveButton: {
    borderColor: "gray",
  },
  activeText: {
    color: "#9969c7",
    fontSize: 16,
  },
  inactiveText: {
    color: "gray",
    fontSize: 16,
  },
  buttonDetail: {
    alignItems: "center",
    backgroundColor: "#eeeeee",
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    marginBottom: 10,
  },
  orderSummaryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  closeButtonText: {
    color: "black",
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
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

  checkmark: {
    color: "#fff",
    fontSize: 18,
    marginRight: 5,
  },

  optionModalView: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  deselectButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },

  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },

  orderItemTextContainer: {
    flex: 1,
  },
  flatList: {
    paddingHorizontal: 10,
  },
  orderItemQuantityContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginRight: 10,
  },
  optionsText: {
    fontSize: 12,
    color: "gray",
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
  scrollView: {
    maxHeight: 200,
    width: '100%',
  },
});

export default PosOrders;
