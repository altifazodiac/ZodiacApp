import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { fetchProducts, addOrUpdateProduct, deleteProduct } from './firebaseFunctions';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';


const placeholderImage = 'https://via.placeholder.com/100';
const { width } = Dimensions.get('window');

const Products = () => {
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [productSize, setProductSize] = useState('');
  const [status, setStatus] = useState('');
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
  }, [searchName, searchCategory, minPrice, maxPrice, statusFilter, products]);

  const loadProducts = async () => {
    setLoading(true);
    const productList = await fetchProducts(itemsPerPage);
    setProducts(productList);
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string, imageUrl: string | null) => {
    try {
      if (imageUrl) {
        const storage = getStorage();
        const imageRef = storageRef(storage, imageUrl);
        await deleteObject(imageRef);
      }

      await deleteProduct(id);
      alert('Product and its image deleted successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product or image: ', error);
      alert('Error deleting product or image, please try again.');
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

  const handleImagePick = async () => {
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

  const handleUploadImage = async () => {
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
      console.error('Image upload failed:', error);
      alert('Image upload failed. Please try again.');
      return null;
    }
  };

  const handleAddOrUpdateProduct = async () => {
    if (!productName || !productPrice || !productDescription) {
      alert('Please fill all product details before submitting.');
      return;
    }

    let uploadedImageUrl = imageUrl;
    if (imageUri && !imageUrl) {
      uploadedImageUrl = await handleUploadImage();
    }

    const productData = {
      name: productName,
      price: productPrice,
      description: productDescription,
      categoryId,
      costPrice,
      quantity,
      unit,
      productBarcode,
      productSize,
      status,
      imageUrl: uploadedImageUrl || null,
    };

    try {
      if (editId) {
        await addOrUpdateProduct(productData, editId);
        alert('Product updated successfully!');
      } else {
        await addOrUpdateProduct(productData, null);
        alert('Product added successfully!');
      }
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error adding/updating product: ', error);
      alert('There was an error, please try again.');
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
    setStatus('');
    setImageUri(null);
    setImageUrl(null);
    setEditId(null);
  };

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

  const renderFormDrawerContent = () => (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

        <TextInput
          style={styles.input}
          placeholder="Product Name"
          value={productName}
          onChangeText={setProductName}
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
          placeholder="Category ID"
          value={categoryId}
          onChangeText={setCategoryId}
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleAddOrUpdateProduct}>
            <Text style={styles.buttonText}>{editId ? 'Update' : 'Submit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleFormDrawer}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
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
        data={filteredProducts.length > 0 ? filteredProducts : products}
        renderItem={({ item }) => (
          <View style={styles.smallProductCard}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.smallProductImage} />
            ) : (
              <Text>No Image</Text>
            )}
            <View>
              <Text>Name: {item.name}</Text>
              <Text>Category: {item.categoryId}</Text>
            </View>
            <View>
              <Text>Price: {item.price}</Text>
              <Text>Status: {item.status}</Text>
            </View>
            <View>
              <Icon name="pencil" size={20} onPress={() => handleEditProduct(item)} />
              <Icon name="trash" size={20} onPress={() => handleDeleteProduct(item.id, item.imageUrl)} />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        numColumns={1}
      />
      {loading && <ActivityIndicator />}
    </View>
  );
};

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
    backgroundColor: '#007bff',
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
    backgroundColor: '#007BFF',
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
    backgroundColor: '#007AFF',
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
});

export default Products;
