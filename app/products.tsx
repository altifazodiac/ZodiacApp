import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Switch,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { fetchProducts, addOrUpdateProduct, deleteProduct, fetchNextPage } from './firebaseFunctions';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated'; 
import { getDatabase, ref as databaseRef, get, update } from 'firebase/database';
import RNPickerSelect from 'react-native-picker-select'; // Import statement
import { AntDesign } from '@expo/vector-icons';
import { database } from './firebase';
 

const placeholderImage = 'https://via.placeholder.com/100';
const { width } = Dimensions.get('window');

type Category = {
  id: string;
  name: string;
};
const Products = () => {
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]); 
  const [costPrice, setCostPrice] = useState('');
  const [nameDisplay, setNameDisplay] = useState('');
 const [reorderLevel, setReorderLevel] = useState('');
 const [unit, setUnit] = useState('');
 const [productBarcode, setProductBarcode] = useState('');
 const [productSize, setProductSize] = useState('');
 const [status, setStatus] = useState<boolean>(false);
  const [quantity, setQuantity] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);  
  const [hasMore, setHasMore] = useState(true);  
  const [lastKey, setLastKey] = useState<string | null>(null);  
  const [isImageUploadClicked, setIsImageUploadClicked] = useState(false);
  const itemsPerPage = 10;
  const debounceDelay = 500;

  const formDrawerOpacity = useSharedValue(0);
  const formDrawerTranslateY = useSharedValue(300);
  const filterDrawerOpacity = useSharedValue(0);
  const filterDrawerTranslateY = useSharedValue(300);
  


  const toggleFormDrawer = () => {
    if (!formDrawerVisible) {
      formDrawerOpacity.value = withTiming(1, { duration: 300 });
      formDrawerTranslateY.value = withSpring(0);
      setFormDrawerVisible(true);  
    } else {
    
      formDrawerOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setFormDrawerVisible)(false);  
      });
      formDrawerTranslateY.value = withTiming(300);  
    }
  };

  const toggleFilterDrawer = () => {
    if (!filterDrawerVisible) {
      // Open the drawer with animation
      filterDrawerOpacity.value = withTiming(1, { duration: 300 });
      filterDrawerTranslateY.value = withSpring(0);
      setFilterDrawerVisible(true); // Set visibility to true immediately for opening
    } else {
      // Close the drawer with animation
      filterDrawerOpacity.value = withTiming(0, { duration: 300 }, () => {
        // After the opacity animation finishes, hide the drawer
        runOnJS(setFilterDrawerVisible)(false);
      });
      filterDrawerTranslateY.value = withTiming(300, { duration: 500 }); // Slide the drawer down
    }
  };
  const formDrawerStyle = useAnimatedStyle(() => {
    return {
      opacity: formDrawerOpacity.value,
      transform: [{ translateY: formDrawerTranslateY.value }],
    };
  });

  const filterDrawerStyle = useAnimatedStyle(() => {
    return {
      opacity: filterDrawerOpacity.value,
      transform: [{ translateY: filterDrawerTranslateY.value }],
    };
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      handleSearch();
    }, debounceDelay);

    return () => clearTimeout(searchTimeout);
  }, [products]);

  const loadProducts = async (newPage = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const productList = await fetchProducts(itemsPerPage);
      if (productList.length < itemsPerPage) {
        setHasMore(false); // No more pages if the returned list is smaller than requested items per page
      }
      if (newPage === 1) {
        setProducts(productList);
      } else {
        setProducts((prevProducts) => [...prevProducts, ...productList]); // Append new products for pagination
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: any) => {
    setProductName(product.name);
    setProductPrice(product.price);
    setProductDescription(product.description);
    setCategoryId(product.categoryId);
    setCostPrice(product.costPrice);
    setQuantity(product.quantity);
    setUnit(product.unit);
    setProductBarcode(product.productBarcode);
    setProductSize(product.productSize);
    setStatus(product.status);
    setImageUri(product.imageUrl || null);
    setEditId(product.id || null);

    toggleFormDrawer();
  };
  const fetchCategories = async () => {
    try {
      const db = getDatabase();
      const categoriesRef = databaseRef(db, 'categories'); // Assuming categories are stored under the 'categories' node
      const snapshot = await get(categoriesRef);

      // Check if snapshot exists and is an object
      if (snapshot.exists() && typeof snapshot.val() === 'object') {
        const categoryList: Category[] = Object.entries(snapshot.val()).map(([id, category]) => ({
          id,
          name: (category as { name: string }).name, // Cast category to expected shape
        }));
        setCategories(categoryList);
      } else {
        console.log('No categories found in the database');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories(); // Fetch categories when component mounts
  }, []);
  const handleSearch = () => {
    let filteredList = products;

    if (searchName) {
      filteredList = filteredList.filter((product) =>
        product.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchCategory) {
      filteredList = filteredList.filter((product) =>
        product.categoryId.toLowerCase().includes(searchCategory.toLowerCase())
      );
    }

    if (minPrice) {
      filteredList = filteredList.filter((product) => parseFloat(product.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredList = filteredList.filter((product) => parseFloat(product.price) <= parseFloat(maxPrice));
    }

    if (statusFilter) {
      filteredList = filteredList.filter((product) =>
        product.status.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    setFilteredProducts(filteredList);
  };



  useEffect(() => {
    loadInitialProducts(); // Load initial products
  }, []);

  const loadInitialProducts = async () => {
    setLoading(true);
    try {
      const productList = await fetchProducts(itemsPerPage);
      setProducts(productList);
      if (productList.length > 0) {
        const lastProduct = productList[productList.length - 1];
        setLastKey(lastProduct.id); // Set the last key for fetching the next page
      }
      if (productList.length < itemsPerPage) {
        setHasMore(false); // No more products to load
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (hasMore && !loading && lastKey) {
      setLoading(true);
      try {
        const nextPage = await fetchNextPage(lastKey, itemsPerPage);
        if (nextPage.length > 0) {
          setProducts((prevProducts) => [...prevProducts, ...nextPage]); // Append new products
          const lastProduct = nextPage[nextPage.length - 1];
          setLastKey(lastProduct.id); // Update the last key
        }
        if (nextPage.length < itemsPerPage) {
          setHasMore(false); // No more pages to load
        }
      } catch (error) {
        console.error('Error loading more products:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteProduct = async (id: string, imageUrl: string | null) => {
    try {
      await deleteProduct(id);
      loadInitialProducts(); // Reload products after deletion
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleImagePick = async () => {
    setIsImageUploadClicked(true); // Track that the upload button was clicked
  
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access the gallery is required!');
      return;
    }
  
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!pickerResult.canceled) {
      const selectedImage = pickerResult.assets[0].uri;
      setImageUri(selectedImage);
    }
  };
  
  
  
  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;
  
    try {
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 100, height: 100 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
  
      const storage = getStorage();
      const response = await fetch(resizedImage.uri);
      const blob = await response.blob();
  
      const storageReference = storageRef(storage, `products/${Date.now()}`);
      await uploadBytes(storageReference, blob);
      const downloadUrl = await getDownloadURL(storageReference);
  
      setImageUrl(downloadUrl);
      return downloadUrl;
    } catch (error) {
      // Check if 'error' is an instance of Error to safely access 'message'
      if (error instanceof Error) {
        console.error('Image upload failed:', error.message);
        alert(`Image upload failed: ${error.message}`);
      } else {
        console.error('Image upload failed:', error); // Handle non-standard errors
        alert('Image upload failed. Please try again.');
      }
      return null;
    }
  };
  
  
  const handleAddOrUpdateProduct = async () => {
    // Check for required fields
    if (!productName || !productPrice || !productDescription) {
      alert('Please fill all product details before submitting.');
      return;
    }
  
    let uploadedImageUrl = imageUrl; // Default to the existing imageUrl
  
    // If user clicked the upload button and selected a new image, handle the image upload
    if (isImageUploadClicked && imageUri && imageUri !== imageUrl) {
      uploadedImageUrl = await handleUploadImage(); // Upload new image
      if (!uploadedImageUrl) {
        return; // Stop if image upload fails
      }
    }
  
    // Make sure imageUrl is included in product data, even if no new image was uploaded
    const productData = {
      name: productName,
      price: productPrice,
      description: productDescription,
      categoryId, // Ensure categoryId is correct and available
      costPrice,
      quantity,
      unit,
      productBarcode,
      productSize,
      status,
      imageUrl: uploadedImageUrl || imageUrl, // Ensure imageUrl is not lost
    };
  
    try {
      // Update or add the product in Firebase
      if (editId) {
        await addOrUpdateProduct(productData, editId); // Updating product
        alert('Product updated successfully!');
      } else {
        await addOrUpdateProduct(productData, null); // Adding new product
        alert('Product added successfully!');
      }
      resetForm(); // Reset the form after successful submission
      loadProducts(); // Reload the product list
    } catch (error) {
      if (error instanceof Error) {
        // Safely access 'message' since 'error' is an instance of 'Error'
        alert(`Error: ${error.message}`);
        console.error('Error adding/updating product:', error.message);
      } else {
        // Handle non-standard errors
        alert('An unknown error occurred.');
        console.error('Error adding/updating product:', error);
      }
    }
  };
  
  
  const resetForm = () => {
    setProductName('');
    setProductPrice('');
    setProductDescription('');
    setCategoryId('');
    setCostPrice('');
    setQuantity('');
    setUnit('');
    setProductBarcode('');
    setProductSize('');
    setStatus(false);
    setImageUri(null);
    setImageUrl(null);
    setEditId(null);
    setIsImageUploadClicked(false);
  };
  
  const renderFormDrawerContent = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>  
        <View style={styles.card}>
          <Text style={styles.drawerHeading}>
            {editId ? 'Edit Product' : 'Add New Product'}
          </Text>
  
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: imageUri ? imageUri : placeholderImage }}
              style={styles.image}
            />
            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeButton}>
                <Icon name="trash" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
            <Icon name="upload" size={18} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload Image</Text>
          </TouchableOpacity>
          <View style={styles.inputContainer}>
          <RNPickerSelect
      placeholder={{ label: "Select a Category" }}
      items={categories.map(category => ({ label: category.name, value: category.id }))}
      onValueChange={(value) => setCategoryId(value)}
      style={{ ...pickerSelectStyles, 
              iconContainer: { 
                top: 10,
                right: 10,
              }
            }} 
      value={categoryId}
      useNativeAndroidPickerStyle={false} 
    /> 
</View>
           <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={productName}
            onChangeText={setProductName}
          />
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            value={nameDisplay} 
            onChangeText={setNameDisplay} 
          />
          <TextInput
            style={styles.input}
            placeholder="Product Price"
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Product Description"
            value={productDescription}
            onChangeText={setProductDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Cost Price"
            value={costPrice}
            onChangeText={setCostPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Reorder Level"  
            value={reorderLevel}  
            onChangeText={setReorderLevel}  
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Unit"  
            value={unit} 
            onChangeText={setUnit}  
          />
          <TextInput
            style={styles.input}
            placeholder="Product Barcode"  
            value={productBarcode} 
            onChangeText={setProductBarcode} 
          />
          <TextInput
            style={styles.input}
            placeholder="Product Size" 
            value={productSize} 
            onChangeText={setProductSize}  
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
            <TouchableOpacity style={styles.button} onPress={handleAddOrUpdateProduct}>
              <Text style={styles.buttonText}>{editId ? 'Update' : 'Submit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggleFormDrawer}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
  

  const renderFilterDrawerContent = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.card}>
        <Text style={styles.drawerHeading}>Filter Products</Text>
        <TextInput
          style={styles.input}
          placeholder="Search by Product Name"
          value={searchName}
          onChangeText={setSearchName}
        />
        <TextInput
          style={styles.input}
          placeholder="Search by Category"
          value={searchCategory}
          onChangeText={setSearchCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Min Price"
          value={minPrice}
          onChangeText={setMinPrice}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Max Price"
          value={maxPrice}
          onChangeText={setMaxPrice}
          keyboardType="numeric"
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => console.log('Filtering')} style={styles.button}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFilterDrawer} style={styles.button}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleFilterDrawer} style={styles.drawerToggleButton}>
        <Icon name="filter" size={20} color="#fff" />
        <Text style={styles.drawerToggleText}>Show Filters</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleFormDrawer} style={styles.drawerToggleButton}>
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.drawerToggleText}>Add New Item</Text>
      </TouchableOpacity>

      <Modal visible={formDrawerVisible} transparent={true} animationType="none">
        <Animated.View style={[styles.modal, formDrawerStyle]}>
          {renderFormDrawerContent()}
        </Animated.View>
      </Modal>
      <Modal visible={filterDrawerVisible} transparent={true} animationType="none">
        <Animated.View style={[styles.modal, filterDrawerStyle]}>
          {renderFilterDrawerContent()}
        </Animated.View>
      </Modal>

      <FlatList
  data={products}
  renderItem={({ item }) => (
    <ProductItem 
      item={item} 
      onDelete={handleDeleteProduct} 
      onEdit={handleEditProduct} 
      categories={categories} 
    />
  )}
  keyExtractor={(item) => item.id}
  ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
  onEndReached={loadMoreProducts}
  onEndReachedThreshold={0.5}
  ListFooterComponent={loading ? <ActivityIndicator size="large" color="#9969c7" /> : null}
/>
      {loading && products.length === 0 && <ActivityIndicator size="large" color="#9969c7" />}
    </View>
  );
};

// New Functional Component for Product Items
const ProductItem = ({ item, onDelete, onEdit, categories }: { item: any; onDelete: (id: string, imageUrl: string | null) => Promise<void>; onEdit: (product: any) => void; categories: Category[]; }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, []);

  return (
    <Animated.View style={[styles.smallProductCard, animatedStyle]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.smallProductImage} />
      ) : (
        <Text>No Image</Text>
      )}
      <View>
        <Text>Name: {item.name}</Text>
        <Text>Category: {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}</Text> 
      </View>
      <View>
        <Text>Price: {item.price}</Text>
        <Text style={{ color: item.status ? 'green' : 'red' }}>
  {item.status ? 'Active' : 'Inactive'}
</Text>
      </View>
       
      <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => onEdit(item)} >
                <AntDesign name="edit" size={24} color="#9969c7" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id, item.imageUrl)} style={styles.buttonMargin}>
                <AntDesign name="delete" size={24} color="#9969c7" />
              </TouchableOpacity>
            </View>
    </Animated.View>
  );
};
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor:   
 '#ddd',
    borderRadius: 10,
    color: 'black',
    paddingRight: 30, 
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor:   
 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight:   
 30,  
  },
  inputWeb: { 
    fontSize: 14,
    padding: 10, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    color: 'black',
    backgroundColor: '#fff', 
    cursor: 'pointer', 
  }
});
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#CED0CE',
    marginVertical: 10,
  },
  drawerToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9969c7',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  drawerToggleText: {
    color: '#fff',
    marginLeft: 8,
  },
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  drawerHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  modal: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  uploadButton: {
    width: 150,
    padding: 8,
    borderRadius: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9969c7',
    marginTop: 10,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    marginLeft: 'auto',
    marginRight: 'auto',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#A9A9A9',
  },
  removeButton: {
    position: 'absolute',
    bottom: 2,
    right: 1,
    padding: 8,
    borderRadius: 80,
    backgroundColor: '#000000',
  },
  smallProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    flexWrap: 'wrap',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  smallProductImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    backgroundColor: '#9969c7',
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginTop: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollViewContainer: {
    paddingBottom: 20,  
  },
  inputContainer: {
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
   
  },
  buttonMargin: {
    marginLeft: 15,
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
});

export default Products;
