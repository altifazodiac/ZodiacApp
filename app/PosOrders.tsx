import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, Animated, PanResponder, Easing, ScrollView, Platform } from 'react-native';
import { db, ref, onValue } from './firebase';
import { Ionicons } from '@expo/vector-icons';
 

type Product = {
  id: string;
  nameDisplay: string;
  price: string;
  imageUrl: string | null;
 // productSize : string;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
};
interface ProductData {
  nameDisplay: string;
  price: string;
  imageUrl: string | null;
  //productSize : string;
  categoryId: string;
}

const PosOrders = () => {
  const calculateNumColumns = useCallback(() => {
    const screenWidth = Dimensions.get('window').width;
    if (screenWidth < 500) return 3;
    if (screenWidth < 900) return 4;
    return 6;
  }, []);

  const [numColumns, setNumColumns] = useState(calculateNumColumns());
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Product[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  const drawerHeight = useRef(new Animated.Value(0)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  const pan = useRef(new Animated.ValueXY()).current;

  // Fetch categories and products from Firebase
  useEffect(() => {
    const categoriesRef = ref(db, 'categories');
    const productsRef = ref(db, 'products');

    const categoriesListener = onValue(categoriesRef, (snapshot) => {
      const categoriesData = snapshot.val();
      const formattedCategories = categoriesData
        ? Object.keys(categoriesData).map((key) => ({
            id: key, // Use the key as the categoryId
            name: categoriesData[key].name,
          }))
        : [];
      setCategories([{ id: 'All', name: 'All' }, ...formattedCategories]);
    });

    const productsListener = onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val();
      const formattedProducts = productsData
        ? Object.entries(productsData).map(([id, product]) => {
            const productData = product as ProductData; // Type assertion
            return {
              id,
              nameDisplay: productData.nameDisplay,
             // productSize : productData.productSize,
              price: productData.price,
              imageUrl: productData.imageUrl,
              categoryId: productData.categoryId,
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

  // Handle window resize for dynamic columns
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get('window').width);
      setNumColumns(calculateNumColumns());
    };

    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => {
      subscription.remove();
    };
  }, [calculateNumColumns]);

  const isMobile = windowWidth <= 768;

  // Filter products based on selected categoryId
  const filteredProducts = selectedCategory && selectedCategory !== 'All'
    ? products.filter((product) => product.categoryId === selectedCategory)
    : products;

  const addItemToOrder = (product: Product) => setOrderItems([...orderItems, product]);
  const removeItemFromOrder = (id: string) => setOrderItems(orderItems.filter((item) => item.id !== id));

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => {
      addItemToOrder(item);
      toggleDrawer();
    }}>
      <View style={styles.card}>
        <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.cardImage} />
        <Text style={styles.cardTitle}>{item.nameDisplay}</Text>
        <Text style={styles.cardPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>   
  );

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
    onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dy) > 20,
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawerOpen && gestureState.dy < 0) {
        Animated.event([null, { dy: drawerHeight }], { useNativeDriver: false })(evt, gestureState);
      } else if (isDrawerOpen && gestureState.dy > 0) {
        Animated.event([null, { dy: drawerHeight }], { useNativeDriver: false })(evt, gestureState);
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

  const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const discount = subtotal > 50 ? 5 : 0;
  const total = subtotal - discount;

  return (
    <View style={isMobile ? styles.containerMobile : styles.container}>
      <View style={isMobile ? styles.layoutMobile : styles.layout1}>
    
    {Platform.OS === 'web' ? (
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.productListContainer}>
           
          <View style={styles.tabsContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={selectedCategory === category.id ? styles.tabActive : styles.tab}
                onPress={() => setSelectedCategory(category.id === 'All' ? null : category.id)}
              >
                 <Text
        style={[
          styles.tabText,
          selectedCategory === category.id ? styles.tabTextActive : null
        ]}
      >{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FlatList for Products */}
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={numColumns} // Forces re-render when numColumns changes
            initialNumToRender={numColumns * 2}
            contentContainerStyle={styles.productListContainer}
          />

          {/* Drawer Toggle Button (Only for Mobile) */}
          {isMobile && (
            <TouchableOpacity style={styles.drawerToggleButton} onPress={toggleDrawer}>
              <Text style={styles.drawerToggleButtonText}>
                {isDrawerOpen ? 'Hide Order Summary' : 'Show Order Summary'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    ) : (
      // Regular layout for mobile
      <View style={styles.productListContainer}>
    <View style={styles.tabsWrapper}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View style={styles.tabsContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={selectedCategory === category.id ? styles.tabActive : styles.tab}
          onPress={() => setSelectedCategory(category.id === 'All' ? null : category.id)}
        >
           <Text
        style={[
          styles.tabText,
          selectedCategory === category.id ? styles.tabTextActive : null
        ]}
      >{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
  
  {/* Add scroll indicator icon */}
  {categories.length > 4 && (
    <View style={styles.scrollHintIcon}>
      <Ionicons name="chevron-forward-outline" size={24} color="#9969c7" />
    </View>
  )}
</View>

        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          initialNumToRender={numColumns * 2}
          contentContainerStyle={styles.productListContainer}
        />

        {isMobile && (
          <TouchableOpacity style={styles.drawerToggleButton} onPress={toggleDrawer}>
            <Text style={styles.drawerToggleButtonText}>
              {isDrawerOpen ? 'Hide Order Summary' : 'Show Order Summary'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
 
      {/* Show animated drawer if in mobile view */}
      {isMobile && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.animatedDrawer, { height: drawerHeight, opacity: drawerOpacity }]}
        >
          <View style={styles.orderSummaryContainer}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            {orderItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text>{item.nameDisplay}</Text>
                <Text>${item.price}</Text>
                <TouchableOpacity onPress={() => removeItemFromOrder(item.id)}>
                  <Text style={styles.removeItemText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.orderTotalContainer}>
              <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
              <Text>Discount: ${discount.toFixed(2)}</Text>
              <Text>Total: ${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.proceedButton}>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Desktop order summary */}
      {!isMobile && (
        <View style={styles.layout2}>
          <View style={styles.orderSummaryContainer}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            {orderItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text>{item.nameDisplay}</Text>
                <Text>${item.price}</Text>
                <TouchableOpacity onPress={() => removeItemFromOrder(item.id)}>
                  <Text style={styles.removeItemText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.orderTotalContainer}>
              <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
              <Text>Discount: ${discount.toFixed(2)}</Text>
              <Text>Total: ${total.toFixed(2)}</Text>
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
  // Existing styles
  container: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  layout1: {
    width: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layout2: {
    width: '30%', 
    height: '100%',
    padding: 10,
    
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tab: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    padding: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#9969c7',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000', // Default color for non-active tabs
  },
  tabTextActive: {
    color: '#9969c7', // Color for active tab text
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 10,
    marginVertical: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 2, height: 3 },
    elevation: 3,
    alignItems: 'center',
    width: 120,
    height: 170,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  cardPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productListContainer: {
    flexGrow: 1, // Allows the container to grow with content
 
  },
  orderSummaryContainer: {
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 20,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
    marginBottom: 10,
  },
  orderSummaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderTotalContainer: {
    marginTop: 20,
  },
  proceedButton: {
    backgroundColor: '#9969c7',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  proceedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  removeItemText: {
    color: '#ff4444',
  },
  // Mobile-specific styling
  containerMobile: {
    flex: 1,
    padding: 10,
  },
  tabsWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  layoutMobile: {
    flex: 1,
    padding: 10,
  },
  drawerToggleButton: {
    backgroundColor: '#9969c7',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  drawerToggleButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  animatedDrawer: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
    marginBottom: 10,
  },
  scrollViewContent: {
    flexGrow: 1, // Ensures the ScrollView content can grow for scrolling
    paddingBottom: 20, // Extra padding for smooth scrolling
  },
  scrollHintIcon: {
    
    justifyContent: 'center',
    right: -10,
    bottom: 5,
  },
 });

export default PosOrders;
