import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fetchProducts, fetchNextPage, addOrUpdateProduct, deleteProduct } from './firebaseFunctions';

const { width } = Dimensions.get('window');
const numColumns = width > 1000 ? 4 : width > 600 ? 3 : 2;

const debounceDelay = 500; // Delay in milliseconds

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [loadingImageIds, setLoadingImageIds] = useState<string[]>([]);
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
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const itemsPerPage = 10;

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
    setLastKey(productList[productList.length - 1]?.id);
    setLoading(false);
  };

  const loadNextPage = async () => {
    if (!lastKey) return;
    const nextProductList = await fetchNextPage(lastKey, itemsPerPage);
    setProducts((prevProducts) => [...prevProducts, ...nextProductList]);
    setLastKey(nextProductList[nextProductList.length - 1]?.id);
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
      const storage = getStorage();
      const response = await fetch(imageUri);
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
      await addOrUpdateProduct(productData, editId);
      alert(editId ? 'Product updated successfully!' : 'Product added successfully!');
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error adding/updating product: ', error);
      alert('There was an error, please try again.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      alert('Product deleted successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product: ', error);
      alert('Error deleting product, please try again.');
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
    setImageUrl(product.imageUrl || null);
    setEditId(product.id || null);
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

    // Filter by product name
    if (searchName) {
      filteredList = filteredList.filter((product) =>
        product.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by category
    if (searchCategory) {
      filteredList = filteredList.filter((product) =>
        product.categoryId.toLowerCase().includes(searchCategory.toLowerCase())
      );
    }

    // Filter by price range
    if (minPrice) {
      filteredList = filteredList.filter((product) => parseFloat(product.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filteredList = filteredList.filter((product) => parseFloat(product.price) <= parseFloat(maxPrice));
    }

    // Filter by status
    if (statusFilter) {
      filteredList = filteredList.filter((product) =>
        product.status.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }

    setFilteredProducts(filteredList);
  };
  return (
    <View style={styles.container}>
  <ScrollView contentContainerStyle={styles.scrollContent}>
    <Text style={styles.heading}>Product Management</Text>
    
    <View style={styles.inputContainer}>
      <TextInput style={styles.input} placeholder="Search by Product Name" value={searchName} onChangeText={setSearchName} />
      <TextInput style={styles.input} placeholder="Search by Category" value={searchCategory} onChangeText={setSearchCategory} />
      <TextInput style={styles.input} placeholder="Min Price" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Max Price" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Status (e.g., Active, Inactive)" value={statusFilter} onChangeText={setStatusFilter} />
    </View>
    
    <Button title="Search" onPress={handleSearch} />
    
    <View style={styles.inputContainer}>
      <TextInput style={styles.input} placeholder="Product Name" value={productName} onChangeText={setProductName} />
      <TextInput style={styles.input} placeholder="Product Price" value={productPrice} onChangeText={setProductPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Product Description" value={productDescription} onChangeText={setProductDescription} />
      <TextInput style={styles.input} placeholder="Category ID" value={categoryId} onChangeText={setCategoryId} />
      <TextInput style={styles.input} placeholder="Cost Price" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
    </View>
    
    <Button title="Pick an Image" onPress={handleImagePick} />
    {imageUri && (
      <View style={styles.imagePreview}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <Button title="Remove Image" onPress={() => setImageUri(null)} />
      </View>
    )}
    <Button title={editId ? 'Update Product' : 'Add Product'} onPress={handleAddOrUpdateProduct} />
  </ScrollView>

  <FlatList
    data={filteredProducts.length > 0 ? filteredProducts : products}
    renderItem={({ item }) => (
      <View style={styles.smallProductCard}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.smallProductImage} />
        ) : (
          <Text>No Image</Text>
        )}
        <Text>Name: {item.name}</Text>
        <Text>Category: {item.categoryId}</Text>
        <Text>Price: {item.price}</Text>
        <Text>Status: {item.status}</Text>
        <Icon name="pencil" size={20} onPress={() => handleEditProduct(item)} />
        <Icon name="trash" size={20} onPress={() => handleDeleteProduct(item.id)} />
      </View>
    )}
    keyExtractor={(item) => item.id}
    numColumns={numColumns}
    onEndReached={loadNextPage}
    onEndReachedThreshold={0.5}
  />
  {loading && <ActivityIndicator />}
</View>

  );
};
 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  input: {
    width: '48%', // Adjust width for 2-column layout
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 4,
    marginRight: 10,
  },
  smallProductCard: {
    flex: 1,
    alignItems: 'center',
    margin: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  smallProductImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginBottom: 10,
  },
});

export default Products;
