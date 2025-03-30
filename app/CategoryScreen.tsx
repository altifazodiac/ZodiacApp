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
  Image,
  Alert,
  PermissionsAndroid,
  Easing,
  UIManager,
  ActivityIndicator,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { ref, onValue, remove, update, push, set } from 'firebase/database';
import { database } from "../utils/firebase";  
import styled from 'styled-components/native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { MenuProvider } from 'react-native-popup-menu'; 
import { FaTrash, FaCloudUploadAlt, FaFilter, FaPlus, FaEdit, FaEye,FaTimesCircle  } from "react-icons/fa"; // นำเข้าไอคอนจาก Font Awesome

type Category = {
  id: string;
  name: string;
  status: boolean;
};

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

const CategoryScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [drawerAnim] = useState(new Animated.Value(0));
  const [cardAnim] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [scaleValue] = useState(new Animated.Value(0));
  const [opacityValue] = useState(new Animated.Value(0));
  const dimensions = useWindowDimensions(); // To handle responsive changes for accessibility

  useEffect(() => {
    const categoryRef = ref(database, 'categories');
    const unsubscribe = onValue(categoryRef, (snapshot) => {
      const categoriesData = snapshot.val();
      const categoryList: Category[] = categoriesData
        ? Object.keys(categoriesData).map((key) => ({
            id: key,
            ...categoriesData[key],
          }))
        : [];
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      triggerCardAnimation();
      setCategories(categoryList);
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

  const filteredCategories = useMemo(() => {
    return searchQuery.trim() === ''
      ? categories
      : categories.filter(category =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
  }, [categories, searchQuery]);

  const handleCreate = () => {
    const categoryRef = ref(database, 'categories');
    if (isEditing && editId) {
      const updateRef = ref(database, `categories/${editId}`);
      update(updateRef, { name, status });
    } else {
      const newCategory = push(categoryRef);
      set(newCategory, { name, status });
    }
    setName('');
    setStatus(false);
    closeDrawer();
    setIsEditing(false);
  };

  const handleEdit = (item: Category) => {
    setName(item.name);
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
    fetchCategories();
  };

  const fetchCategories = () => {
    const categoryRef = ref(database, 'categories');
    onValue(categoryRef, (snapshot) => {
      const categoriesData = snapshot.val();
      const categoryList: Category[] = categoriesData
        ? Object.keys(categoriesData).map((key) => ({
            id: key,
            ...categoriesData[key],
          }))
        : [];

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      triggerCardAnimation();
      setCategories(categoryList);
      setRefreshing(false);
    });
  };
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      console.log("Deleting category...");
      const deleteRef = ref(database, `categories/${id}`);
      remove(deleteRef);
    } else {
      console.log("Delete canceled");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <SearchBarContainer>
        <SearchInput style ={[{fontFamily:'GoogleSans,Kanit-Regular'}]}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="ค้นหาหมวดหมู่"
          placeholderTextColor="#B0B0B0"  
          accessibilityLabel="Search categories" 
        />
        {searchQuery !== '' && (
          <ClearButton onPress={resetSearch} accessibilityRole="button" accessibilityLabel="Clear search input">
           <FaTimesCircle size={20} color="gray" />
          </ClearButton>
        )}
       <AddButton
  onPress={openDrawer}
  style={{
    marginLeft: 10,
    height: 40,
    width: 40,
    justifyContent: 'center',  // Center horizontally
    alignItems: 'center',      // Center vertically
    display: 'flex',           // Make it a flex container
  }}
>
<FaEdit size={24} color="#fff" />
</AddButton>
      </SearchBarContainer>
      {loading ? (
        <ActivityIndicator size="large" color="#9969c7" />
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.categoryItem}>
              <Text style ={[{fontFamily:'GoogleSans,Kanit-Regular'}]}>{item.name}</Text>
              <Switch  
                value={item.status} 
                onValueChange={(value) => update(ref(database, `categories/${item.id}`), { status: value })}
              />
              <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => handleEdit(item)} >
              <FaEdit size={24} color="#9969c7" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.buttonMargin}>
  <FaTrash  size={24} color="#9969c7" />
</TouchableOpacity>
            </View>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
      {/* Drawer implementation */}
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
            placeholder={isEditing ? 'แก้ไขชื่อหมวดหมู่' : 'สร้างชื่อหมวดหมู่'}
            placeholderTextColor="#B0B0B0"
            style={styles.input}
          />
          <View style={styles.switchContainer}>
            <Switch
              value={status}
              onValueChange={setStatus}
              style={styles.switch}
            />
            <Text style={styles.switchLabel}>{status ? 'แสดง' : 'ไม่แสดง'}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
              <Text style={styles.buttonText}>{isEditing ? 'แก้ไข' : 'สร้างใหม่'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
              <Text style={styles.buttonText}>ปิด</Text>
            </TouchableOpacity>
          </View>
           
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  categoryItem: {
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
  buttonMargin: {
    marginLeft: 15,
  },
});

export default CategoryScreen;
