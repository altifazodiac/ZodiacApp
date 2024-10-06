import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Image, Animated, PanResponder, Easing } from 'react-native';

const { width } = Dimensions.get('window');

type Product = {
  id: string;
  name: string;
  price: string;
  category: string;
};

const productsData: Product[] = [
  { id: '1', name: 'Product 1', price: '10', category: 'Electronics' },
  { id: '2', name: 'Product 2', price: '20', category: 'Clothing' },
  { id: '3', name: 'Product 3', price: '15', category: 'Electronics' },
  { id: '4', name: 'Product 4', price: '30', category: 'Clothing' },
  { id: '5', name: 'Product 5', price: '10', category: 'Electronics' },
  { id: '6', name: 'Product 6', price: '20', category: 'Clothing' },
  { id: '7', name: 'Product 7', price: '15', category: 'Electronics' },
  { id: '8', name: 'Product 8', price: '30', category: 'Clothing' },
];

const PosOrders = () => {
  const calculateNumColumns = () => {
    const screenWidth = Dimensions.get('window').width;
    if (screenWidth < 500) {
      return 3;
    } else if (screenWidth < 900) {
      return 4;
    } else {
      return 6;
    }
  };

  const [numColumns, setNumColumns] = useState(calculateNumColumns());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Product[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for drawer toggle
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width); // Track window width
  const drawerHeight = useRef(new Animated.Value(0)).current; // Animated height for drawer
  const drawerOpacity = useRef(new Animated.Value(0)).current; // Animated opacity for drawer
  const pan = useRef(new Animated.ValueXY()).current; // PanResponder value

  const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const discount = subtotal > 50 ? 5 : 0;
  const total = subtotal - discount;

  const categories = ['All', 'Electronics', 'Clothing'];

  const filteredProducts = selectedCategory
    ? productsData.filter(product => product.category === selectedCategory)
    : productsData;

  const addItemToOrder = (product: Product) => {
    setOrderItems([...orderItems, product]);
  };

  const removeItemFromOrder = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => {
      addItemToOrder(item);
      toggleDrawer();
    }}>
    <View style={styles.card}>
      <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardPrice}>${item.price}</Text>
    </View>
  </TouchableOpacity>   
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(Dimensions.get('window').width);
      const newNumColumns = calculateNumColumns();
      setNumColumns(newNumColumns);
    };

    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => {
      subscription.remove();
    };
  }, [numColumns]);

  const isMobile = windowWidth <= 768;
  const screenHeight = Dimensions.get('window').height;
  // Function to handle drawer animation (toggle)
  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(drawerHeight, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,  
          easing: Easing.inOut(Easing.ease), // Add easing
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

  // PanResponder for swipe gesture
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 20; // Detect vertical swipe
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!isDrawerOpen && gestureState.dy < 0) {
        // Swiping up when drawer is closed
        Animated.event([null, { dy: drawerHeight }], { useNativeDriver: false })(evt, gestureState);
      } else if (isDrawerOpen && gestureState.dy > 0) {
        // Swiping down when drawer is open
        Animated.event([null, { dy: drawerHeight }], { useNativeDriver: false })(evt, gestureState);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (!isDrawerOpen && gestureState.dy < -50) {
        // Open drawer after swipe up
        toggleDrawer();
      } else if (isDrawerOpen && gestureState.dy > 50) {
        // Close drawer after swipe down
        toggleDrawer();
      }
    },
  });

  return (
    <View style={isMobile ? styles.containerMobile : styles.container}>
      <View style={isMobile ? styles.layoutMobile : styles.layout1}>
        <View style={styles.productListContainer}>
          <View style={styles.tabsContainer}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={selectedCategory === category ? styles.tabActive : styles.tab}
                onPress={() => setSelectedCategory(category === 'All' ? null : category)}
              >
                <Text style={styles.tabText}>{category}</Text>
              </TouchableOpacity>
            ))}
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
                <Text>{item.name}</Text>
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
                <Text>{item.name}</Text>
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
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
    marginVertical: 15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cardPrice: {
    fontSize: 16,
    color: '#666',
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
    padding: 10,
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
});

export default PosOrders;
