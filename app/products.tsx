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
  Alert,
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
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);  
  const [hasMore, setHasMore] = useState(true);  
  const [lastKey, setLastKey] = useState<string | null>(null);  
  const [isImageUploadClicked, setIsImageUploadClicked] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(products);
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
      applyFilter();
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
    setNameDisplay(product.nameDisplay);
    setProductPrice(product.price);
    setProductDescription(product.description);
    setCategoryId(product.categoryId);
    setCostPrice(product.costPrice);
    setQuantity(product.quantity);
    setUnit(product.unit);
    setProductBarcode(product.productBarcode);
    setProductSize(product.productSize);
    setStatus(product.status);
  
    // Set imageUrl from the database (Firebase Storage URL)
    setImageUrl(product.imageUrl || ''); // Use the image URL from the database
    
    // Reset imageUri to null because it's only used when selecting a new image
    setImageUri(null); 
  
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
  const applyFilter = () => {
    let filtered = products;
  
    // Filter by product name
    if (searchName) {
      filtered = filtered.filter(product =>
        product.nameDisplay.toLowerCase().includes(searchName.toLowerCase())
      );
    }
  
    // Filter by category
    if (searchCategory) {
      filtered = filtered.filter(product =>
        product.categoryId === searchCategory
      );
    }
  
    // Filter by min price
    if (minPrice) {
      filtered = filtered.filter(product =>
        parseFloat(product.price) >= parseFloat(minPrice)
      );
    }
  
    // Filter by max price
    if (maxPrice) {
      filtered = filtered.filter(product =>
        parseFloat(product.price) <= parseFloat(maxPrice)
      );
    }
   // Filter by min price
   if (minQuantity) {
    filtered = filtered.filter(product =>
      parseFloat(product.Quantity) >= parseFloat(minQuantity)
    );
  }

  // Filter by max price
  if (maxQuantity) {
    filtered = filtered.filter(product =>
      parseFloat(product.Quantity) <= parseFloat(maxQuantity)
    );
  }
    setFilteredProducts(filtered);
  };
  const resetFilters = () => {
    setSearchName('');
    setSearchCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinQuantity('');
    setMaxQuantity('');
    setFilteredProducts(products); // Reset filtered products
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
      // If the product has an associated image URL, delete the image from Firebase Storage
      if (imageUrl) {
        const storage = getStorage();
        const imageRef = storageRef(storage, imageUrl); // Reference to the image in Firebase Storage
  
        await deleteObject(imageRef); // Delete the image from storage
        console.log('Image deleted successfully');
      }
  
      // Delete the product from the database
      await deleteProduct(id);
  
      loadInitialProducts(); // Reload products after deletion
      alert('Product deleted successfully!');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error deleting product:', error.message);
        alert(`Error deleting product: ${error.message}`);
      } else {
        console.error('Error deleting product:', error);
        alert('An unknown error occurred while deleting the product.');
      }
    }
  };
  const handleRemoveImage = async () => {
    if (!imageUrl) return;
  
    try {
      const storage = getStorage();
      const imageRef = storageRef(storage, imageUrl); // Reference to the image in Firebase Storage
  
      // Delete the image from Firebase Storage
      await deleteObject(imageRef);
      console.log('Image deleted successfully from storage');
  
      // Clear the image URL from the form state
      setImageUrl(null);
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error deleting image:', error.message);
        alert(`Error deleting image: ${error.message}`);
      } else {
        console.error('Error deleting image:', error);
        alert('An unknown error occurred while deleting the image.');
      }
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
  
    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      const selectedImage = pickerResult.assets[0].uri;
      setImageUri(selectedImage); // Set imageUri for uploading the local image
    }
  };
  
  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null; // Only upload if imageUri exists
  
    try {
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri, // Use the local imageUri here
        [{ resize: { width: 100, height: 100 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
  
      const storage = getStorage();
      const response = await fetch(resizedImage.uri);
      const blob = await response.blob();
  
      const storageReference = storageRef(storage, `products/${Date.now()}`);
      await uploadBytes(storageReference, blob);
      const downloadUrl = await getDownloadURL(storageReference);
  
      setImageUrl(downloadUrl); // Set the Firebase image URL
      setImageUri(null); // Reset imageUri after upload
      return downloadUrl;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Image upload failed:', error.message);
        alert(`Image upload failed: ${error.message}`);
      } else {
        console.error('Image upload failed:', error);
        alert('Image upload failed. Please try again.');
      }
      return null;
    }
  };
  
  const handleAddOrUpdateProduct = async () => {
    if (!productName || !productPrice || !nameDisplay || !categoryId) {
      alert('Please fill all product details before submitting.');
      return;
    }
  
    let finalImageUrl = imageUrl; // Start with the current image URL (from Firebase)
  
    // Only upload a new image if one was selected (via imageUri)
    if (imageUri) {
      const uploadedImageUrl = await handleUploadImage();
      if (uploadedImageUrl) {
        finalImageUrl = uploadedImageUrl; // Replace with the new image URL
      }
    }
   
    const productData = {
      name: productName,
      price: productPrice,
      description: productDescription,
      nameDisplay,
      categoryId,
      costPrice,
      quantity,
      unit,
      productBarcode : productBarcode || '',
      productSize,
      status,
      imageUrl: finalImageUrl, // Use the existing or new image URL
    };
  
    try {
      if (editId) {
        await addOrUpdateProduct(productData, editId);
        alert('Product updated successfully!');
      } else {
        await addOrUpdateProduct(productData, null);
        alert('Product added successfully!');
      }
      resetForm(); // Reset the form after submission
      loadProducts(); // Reload the product list
      toggleFormDrawer(); // Close the form drawer
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
        console.error('Error adding/updating product:', error.message);
      } else {
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
    setNameDisplay('');
    setProductSize('');
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
  interface UnitSelectorProps {
    unit: string;
    setUnit: (unit: string) => void;
  }
  const UnitSelector = ({ unit, setUnit }: UnitSelectorProps) => {
    const units = [
      { label: 'Kilograms (kg)', value: 'kg' },
      { label: 'Pounds (lb)', value: 'lb' },
      { label: 'Liters (l)', value: 'l' },
      { label: 'Milliliters (ml)', value: 'ml' },
      { label: 'Grams (g)', value: 'g' },
      { label: 'Ounces (oz)', value: 'oz' },
      { label: 'Cups', value: 'cup' },
      { label: 'Teaspoons (tsp)', value: 'tsp' },
      { label: 'Tablespoons (tbsp)', value: 'tbsp' },
      { label: 'Square Meters (m²)', value: 'm2' },
      { label: 'Square Feet (ft²)', value: 'ft2' },
      { label: 'Cubic Meters (m³)', value: 'm3' },
      { label: 'Cubic Feet (ft³)', value: 'ft3' },
      { label: 'Inches', value: 'in' },
      { label: 'Centimeters (cm)', value: 'cm' },
      { label: 'Millimeters (mm)', value: 'mm' },
      { label: 'Hectares (ha)', value: 'ha' },
      { label: 'Acres', value: 'acre' },
      { label: 'Kilowatt-hours (kWh)', value: 'kWh' },
      { label: 'Gallons (gal)', value: 'gal' }, // Common volume unit in US
      { label: 'Quarts (qt)', value: 'qt' }, // Another volume measurement
      { label: 'Pints (pt)', value: 'pt' }, // Volume measurement
      { label: 'Metric Tons (t)', value: 't' }, // Weight unit
      { label: 'Short Tons (ton)', value: 'ton' }, // Another weight unit
      { label: 'Long Tons (long-ton)', value: 'long-ton' }, // Weight unit
      { label: 'Degrees Celsius (°C)', value: 'C' }, // Temperature
      { label: 'Degrees Fahrenheit (°F)', value: 'F' }, // Temperature
      { label: 'Seconds (s)', value: 's' }, // Time unit
      { label: 'Minutes (min)', value: 'min' }, // Time unit
      { label: 'Hours (h)', value: 'h' }, // Time unit
      { label: 'Kilometers (km)', value: 'km' }, // Length unit
      { label: 'Miles (mi)', value: 'mi' }, // Length unit
      { label: 'Light Years', value: 'ly' }, // Astronomical unit
    ];
  
    return (
      <RNPickerSelect
        placeholder={{ label: 'Select a Unit', value: ''}} // Update placeholder text
        items={units}
        onValueChange={(value) => setUnit(value)} // Use setUnit to update the unit state
        style={{
          ...pickerSelectStyles,
          iconContainer: {
            top: 10,
            right: 10,
          },
        }}
        value={unit} // Bind the value to the unit state
        useNativeAndroidPickerStyle={false}
      />
    );
  };
  interface ProductSizesSelectorProps {
    productSize: string;
    setProductSizes: (productSizes: string) => void;
  }
  const productSizes = [
    { label: 'Small (S)', value: 'S' },
    { label: 'Medium (M)', value: 'M' },
    { label: 'Large (L)', value: 'L' },
    { label: 'Extra Large (XL)', value: 'XL' },
    { label: 'Extra Extra Large (XXL)', value: 'XXL' },
    { label: 'XXX Large (3XL)', value: '3XL' },
    { label: 'XXXX Large (4XL)', value: '4XL' },
    { label: 'Youth Small (YS)', value: 'YS' },
    { label: 'Youth Medium (YM)', value: 'YM' },
    { label: 'Youth Large (YL)', value: 'YL' },
    { label: 'Toddler (T)', value: 'T' },
    { label: 'Infant (I)', value: 'I' },
    { label: 'One Size Fits All', value: 'OS' },
    { label: 'Petite (P)', value: 'P' },
    { label: 'Tall (T)', value: 'T' },
    { label: 'Plus Size (1X)', value: '1X' },
    { label: 'Plus Size (2X)', value: '2X' },
    { label: 'Plus Size (3X)', value: '3X' },
    { label: 'Plus Size (4X)', value: '4X' },
    { label: 'Size 5 (5)', value: '5' },
    { label: 'Size 6 (6)', value: '6' },
    { label: 'Size 7 (7)', value: '7' },
    { label: 'Size 8 (8)', value: '8' },
    { label: 'Size 9 (9)', value: '9' },
    { label: 'Size 10 (10)', value: '10' },
    { label: 'Size 11 (11)', value: '11' },
    { label: 'Size 12 (12)', value: '12' },
    { label: 'Size 13 (13)', value: '13' },
    { label: 'Size 14 (14)', value: '14' },
    { label: 'Size 15 (15)', value: '15' },
    { label: 'Half Sizes (e.g., 7.5)', value: '7.5' },
    { label: 'Custom Size', value: 'custom' },
    { label: 'XL Tall (XLT)', value: 'XLT' },
    { label: 'Short Size (SH)', value: 'SH' },
    { label: 'Pet Size Small', value: 'pet_small' },
    { label: 'Pet Size Medium', value: 'pet_medium' },
    { label: 'Pet Size Large', value: 'pet_large' },
    { label: 'Width Sizes (D, E, EE)', value: 'D' },
    { label: 'Custom Width', value: 'custom_width' },
    
    // Additional Sizes
    { label: 'Extra Small (XS)', value: 'XS' },
    { label: 'Extra Extra Extra Large (3XL)', value: '3XL' },
    { label: 'Extra Extra Extra Extra Large (4XL)', value: '4XL' },
    { label: 'Boys Small (BS)', value: 'BS' },
    { label: 'Boys Medium (BM)', value: 'BM' },
    { label: 'Boys Large (BL)', value: 'BL' },
    { label: 'Girls Small (GS)', value: 'GS' },
    { label: 'Girls Medium (GM)', value: 'GM' },
    { label: 'Girls Large (GL)', value: 'GL' },
    { label: 'Size 16 (16)', value: '16' }, // Common for girls' clothing
    { label: 'Size 18 (18)', value: '18' }, // Common for girls' clothing
    { label: 'Size 20 (20)', value: '20' }, // Common for girls' clothing
    { label: 'Footwear Size 4 (4)', value: '4' },
    { label: 'Footwear Size 8 (8)', value: '8' },
    { label: 'Footwear Size 9 (9)', value: '9' },
    { label: 'Footwear Size 10.5 (10.5)', value: '10.5' },
    { label: 'Footwear Size 11.5 (11.5)', value: '11.5' },
    { label: 'Wide Width (W)', value: 'W' },
    { label: 'Narrow Width (N)', value: 'N' },
    { label: 'Boys Extra Large (BXL)', value: 'BXL' },
    { label: 'Girls Extra Large (GXL)', value: 'GXL' },
    { label: 'Size A (A)', value: 'A' }, // For some specialty products
    { label: 'Size B (B)', value: 'B' }, 
    { label: 'Size C (C)', value: 'C' }, 
    { label: 'Size D (D)', value: 'D' }, 
    { label: 'Size E (E)', value: 'E' }, 
    { label: 'Custom Length', value: 'custom_length' }, // For custom length options
    { label: 'Neck Size (inches)', value: 'neck_size' }, // For dress shirts and formal wear
    { label: 'Waist Size (inches)', value: 'waist_size' }, // For pants
    { label: 'Chest Size (inches)', value: 'chest_size' }, // For shirts
    // Add more sizes as necessary
  ];
  
  
  // Your component
  const ProductSizeSelector = ({ productSize, setProductSizes }: ProductSizesSelectorProps) => {
    return (
      <RNPickerSelect
        placeholder={{ label: "Select a Product Size", value: '' }} // Placeholder text
        items={productSizes} // The defined product sizes
        onValueChange={(value) => setProductSize(value)} // Update the state on selection
        style={{ 
          ...pickerSelectStyles, 
          iconContainer: { 
            top: 10,
            right: 10,
          },
        }} 
        value={productSize} // Set the current value
        useNativeAndroidPickerStyle={false} // Optional: style for Android
      />
    );
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
    source={{ uri: imageUri || imageUrl || placeholderImage }} // Use imageUri first if a new image is picked, else imageUrl from Firebase
    style={styles.image}
  />
 {imageUrl && (
  <TouchableOpacity onPress={handleRemoveImage} style={styles.removeButton}>
    <Icon name="trash" size={16} color="#fff" />
  </TouchableOpacity>
)}
</View>
<TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
  <Icon name="upload" size={18} color="#fff" />
  <Text style={styles.uploadButtonText}>Upload Image</Text>
</TouchableOpacity>
          <View style={styles.inputContainer}>
          <View style={styles.formGroup}>
 
  <TextInput 
  style={ { width: 0, height: 0 }}
  value={imageUrl ?? ''} // Use the nullish coalescing operator to provide a default value
  onChangeText={(text) => setImageUrl(text)} // Allow manual editing of the image URL
  placeholder="Image URL"
  editable={editId !== null} // Only editable in update mode
/>
</View>
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
          <ProductSizeSelector productSize={productSize} setProductSizes={setProductSize} />
          <TextInput
            style={styles.input}
            placeholder="Product Price"
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="numeric"
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
         <UnitSelector unit={unit} setUnit={setUnit} />
          <TextInput
            style={styles.input}
            placeholder="Product Barcode (optional)"  
            value={productBarcode} 
            onChangeText={setProductBarcode} 
          />
          
          <TextInput
  style={styles.input}
  placeholder="Description (optional)"  // Clarify that it's optional
  value={productDescription}
  onChangeText={setProductDescription}
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
            <TouchableOpacity
  style={styles.button}
  onPress={() => {
    toggleFormDrawer();
    resetForm();
  }}
>
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
  
        <RNPickerSelect
          placeholder={{ label: "Search by Category", value: '' }}
          items={categories.map(category => ({ label: category.name, value: category.id }))}
          onValueChange={(value) => setSearchCategory(value)}
          style={{
            ...pickerSelectStyles,
            iconContainer: {
              top: 10,
              right: 10,
            },
          }}
          value={searchCategory}
          useNativeAndroidPickerStyle={false}
        />
  <View style={styles.PriceContainer}> 
  <TextInput
    style={styles.inputHalf}  // Use inputHalf style
    placeholder="Min Price"
    value={minPrice}
    onChangeText={setMinPrice}
    keyboardType="numeric"
  />
  <TextInput
    style={styles.inputHalf}  // Use inputHalf style
    placeholder="Max Price"
    value={maxPrice}
    onChangeText={setMaxPrice}
    keyboardType="numeric"
  />
  </View>
   <View style={styles.PriceContainer}> 
  <TextInput
    style={styles.inputHalf}  // Use inputHalf style
    placeholder="Min Quantity"
    value={minQuantity}
    onChangeText={setMinQuantity}
    keyboardType="numeric"
  />
  <TextInput
    style={styles.inputHalf}  // Use inputHalf style
    placeholder="Max Quantity"
    value={maxQuantity}
    onChangeText={setMaxQuantity}
    keyboardType="numeric"
  />
</View>
        <View style={styles.buttonContainer}>
        <TouchableOpacity 
  onPress={() => {
    applyFilter();  // First apply the filter
    toggleFilterDrawer();  // Then toggle the drawer
  }} 
  style={styles.button}
>
  <Text style={styles.buttonText}>Search</Text>
</TouchableOpacity>

          <TouchableOpacity onPress={resetFilters} style={styles.button}>
            <Text style={styles.buttonText}>Reset</Text>
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
       <View style={styles.PriceContainer}> 
      
    <TouchableOpacity onPress={toggleFilterDrawer} style={styles.drawerToggleButton}>
      <Icon name="filter" size={20} color="#fff" />
      <Text style={[styles.drawerToggleText,{fontFamily:'GoogleSans,Kanit-Regular'}]}>Show Filters</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={toggleFormDrawer} style={styles.drawerToggleButton}>
      <Icon name="plus" size={20} color="#fff" />
      <Text style={[styles.drawerToggleText,,{fontFamily:'GoogleSans,Kanit-Regular'}]}>Add New Item</Text>
    </TouchableOpacity>
</View>
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
      data={filteredProducts}
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
const ProductItem = ({ 
  item, 
  onDelete, 
  onEdit, 
  categories 
}: { 
  item: any; 
  onDelete: (id: string, imageUrl: string | null) => Promise<void>; 
  onEdit: (product: any) => void; 
  categories: Category[]; 
}) => {
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

  const handleDeletePress = (id: string, imageUrl: string | null) => {
    console.log('Delete button pressed with id:', id); // Debug log

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Delete canceled"),
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            console.log('Deleting item...'); // Debug log
            await onDelete(id, imageUrl); // Ensure onDelete is awaited
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <Animated.View style={[styles.smallProductCard, animatedStyle]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.smallProductImage} />
      ) : (
        <Text>No Image</Text>
      )}
      <View>
        <Text style={[{fontFamily:'Kanit-Regular'}]}>{item.nameDisplay}</Text>
        <Text style={[{fontFamily:'GoogleSans'}]}>{categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}</Text> 
      </View>
      <View>
        <Text style={[{fontFamily:'GoogleSans'}]}>Size: {item.productSize}</Text>
        <Text style={[{fontFamily:'GoogleSans'}]}>Unit: {item.unit}</Text> 
      </View>
      <View>
        <Text style={[{fontFamily:'GoogleSans'}]}>Price: {item.price}</Text>
        <Text style={[{ color: item.status ? 'green' : 'red' }, {fontFamily:'GoogleSans'}]}>
          {item.status ? 'Active' : 'Inactive'}
        </Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => onEdit(item)}>
          <AntDesign name="edit" size={24} color="#9969c7" />
        </TouchableOpacity>
        <TouchableOpacity 
  onPress={() => handleDeletePress(item.id, item.imageUrl)} 
  style={styles.buttonMargin}
  delayPressIn={100} // Add a small delay
>
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
    marginBottom: 10,
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
 marginBottom: 10,
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
    marginBottom: 10,
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
    borderRadius: 10,
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
  PriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',  // Ensure container takes full width
    marginTop: 10,
  },
  inputHalf: {
    width: '48%',  // Each input takes up 48% of the width
    paddingHorizontal: 10, // Add padding inside inputs if needed
    borderWidth: 1,  // Add border or other styles as needed
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 8, // Adjust height if needed
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
  formGroup: {
    
  }
  
});

export default Products;
