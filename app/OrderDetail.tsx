import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Animated,
  TouchableOpacity,
  Switch,
  StyleSheet,
  LayoutAnimation,
  RefreshControl,
  Platform,
  Alert,
  ActivityIndicator,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { ref, onValue, remove, update, push, set } from 'firebase/database';
import { database } from "../utils/firebase";  
import styled from 'styled-components/native';
import { AntDesign, Ionicons } from '@expo/vector-icons';

type OrderDetail = {
  id: string;
  name: string;
  price: number;
  status: boolean;
};

// Styled components for UI
const SearchBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  height: 40px;
  padding-left: 10px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 5px;
`;

const ClearButton = styled.TouchableOpacity`
  margin-left: 10px;
`;

const AddButton = styled.TouchableOpacity`
  background-color: #9969c7;
  padding: 10px;
  border-radius: 5px;
`;

const OrderDetailComponent = () => {
  const [OrderDetail, setOrderDetail] = useState<OrderDetail[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>(''); // Handle number or empty string
  const [status, setStatus] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [drawerAnim] = useState(new Animated.Value(0));
  const [cardAnim] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const dimensions = useWindowDimensions(); // To handle responsive changes
  const [nameError, setNameError] = useState(false); 
  const [priceError, setPriceError] = useState(false);

   
  useEffect(() => {
    const OrderDetailRef = ref(database, 'OrderDetail');
    const unsubscribe = onValue(OrderDetailRef, (snapshot) => {
      const OrderDetailData = snapshot.val();
      const OrderDetailList: OrderDetail[] = OrderDetailData
        ? Object.keys(OrderDetailData).map((key) => ({
            id: key,
            ...OrderDetailData[key],
          }))
        : [];
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      triggerCardAnimation();
      setOrderDetail(OrderDetailList);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  const triggerCardAnimation = () => {
    cardAnim.setValue(0);
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const filteredOrderDetail = useMemo(() => {
    return searchQuery.trim() === ''
      ? OrderDetail
      : OrderDetail.filter(OrderDetail =>
          OrderDetail.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
  }, [OrderDetail, searchQuery]);
  function resetForm() {
    setName('');
    setPrice(0);
    setStatus(false);
  }
  const handleCreate = () => {

    const OrderDetailRef = ref(database, 'OrderDetail');
    const orderPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (nameError || priceError || !name || orderPrice < 0) {
      alert('Please fill in all fields correctly.'); 
      return;
    }
    if (isNaN(orderPrice)) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }
  
    const orderData = { name, price: orderPrice, status};
  
    if (isEditing && editId) {
      const updateRef = ref(database, `OrderDetail/${editId}`);
      update(updateRef, orderData)
        .then(() => {
          resetForm();
        })
        .catch((error) => {
          console.error('Error updating order:', error);
          Alert.alert('Error', 'Failed to update order.');
        });
    } else {
      const newOrderDetail = push(OrderDetailRef);
      set(newOrderDetail, orderData)
        .then(() => {
          resetForm();
        })
        .catch((error) => {
          console.error('Error creating order:', error);
          Alert.alert('Error', 'Failed to create order.');
        });
    }
  
  
    setName('');
    setPrice(0);
    setStatus(false);
    closeDrawer();
    setIsEditing(false);
  };

  const handleEdit = (item: OrderDetail) => {
    setName(item.name);
    setPrice(item.price.toString()); // Convert number to string for input
    setStatus(item.status);
    
    setEditId(item.id);
    setIsEditing(true);
    openDrawer();
  };

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      AccessibilityInfo.announceForAccessibility('Drawer opened');
    });
  };

  const closeDrawer = () => {
    setName('');
    setPrice(0);
    setStatus(false);
    setIsEditing(false);
    setEditId(null);
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
      AccessibilityInfo.announceForAccessibility('Drawer closed');
    });
  };

  const resetSearch = () => {
    setSearchQuery('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetail();
  };

  const fetchOrderDetail = () => {
    const OrderDetailRef = ref(database, 'OrderDetail');
    onValue(OrderDetailRef, (snapshot) => {
      const OrderDetailData = snapshot.val();
      const OrderDetailList: OrderDetail[] = OrderDetailData
        ? Object.keys(OrderDetailData).map((key) => ({
            id: key,
            ...OrderDetailData[key],
          }))
        : [];

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      triggerCardAnimation();
      setOrderDetail(OrderDetailList);
      setRefreshing(false);
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this OrderDetail?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            const deleteRef = ref(database, `OrderDetail/${id}`);
            remove(deleteRef);
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <SearchBarContainer>
        <SearchInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search OrderDetail"
          placeholderTextColor="gray" // Add this line
        />
        {searchQuery !== '' && (
          <ClearButton onPress={resetSearch}>
            <Ionicons name="close-circle" size={20} color="gray" />
          </ClearButton>
        )}
        <AddButton onPress={openDrawer} style={{ marginLeft: 10 }}>
          <AntDesign name="edit" size={20} color="#fff" />
        </AddButton>
      </SearchBarContainer>
      {loading ? (
        <ActivityIndicator size="large" color="#9969c7" />
      ) : (
        <FlatList
          data={filteredOrderDetail}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.OrderDetailItem}>
              <Text style={{ marginLeft: 20 }}>{item.name}</Text>
              <Text>{item.price}</Text>
              <Switch
                value={item.status}
                onValueChange={(value) => update(ref(database, `OrderDetail/${item.id}`), { status: value })}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 20 }}>
                  <AntDesign name="edit" size={24} color="#9969c7" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginRight: 20 }}>
                  <AntDesign name="delete" size={24} color="#9969c7" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
      {drawerVisible && (
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [
                {
                  translateX: drawerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [dimensions.width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={isEditing ? 'Edit Name' : 'Create Name'}
            style={styles.input}
            placeholderTextColor="gray" // Add this line
          />
          <TextInput
            value={price.toString()} // Ensuring price is a string
            onChangeText={(text) => setPrice(parseFloat(text) || 0)} // Parsing to number
            placeholder={isEditing ? 'Edit Price' : 'Create Price'}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="gray" // Add this line
          />
          
          <View style={styles.switchContainer}>
            <Switch
              value={status}
              onValueChange={setStatus}
              style={styles.switch}
            />
            <Text style={styles.switchLabel}>{status ? 'Active' : 'Inactive'}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
              <Text style={styles.buttonText}>{isEditing ? 'Update' : 'Create'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  OrderDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  drawer: {
    position: 'absolute',
    width: '80%',
    height: '100%',
    backgroundColor: '#fff',
    right: 0,
    top: 0,
    padding: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  inputHolder: {
    color: '#dddddd',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switch: {
    marginRight: 10,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    backgroundColor: '#9969c7',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default OrderDetailComponent;


