// firebaseFunctions.ts
import { ref, query, orderByKey, startAfter, limitToFirst, push, set, remove, get } from 'firebase/database';
import { database } from '../firebase';  // Adjust the import based on your project structure

// Fetch initial set of products
export const fetchProducts = async (itemsPerPage: number) => {
  const productRef = ref(database, 'products/');
  const initialQuery = query(productRef, orderByKey(), limitToFirst(itemsPerPage));
  const snapshot = await get(initialQuery);
  const data = snapshot.val();
  if (data) {
    const productList = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
    return productList;
  }
  return [];
};

// Fetch next set of products for pagination
export const fetchNextPage = async (lastKey: string, itemsPerPage: number) => {
  const productRef = ref(database, 'products/');
  const nextPageQuery = query(productRef, orderByKey(), startAfter(lastKey), limitToFirst(itemsPerPage));
  const snapshot = await get(nextPageQuery);
  const data = snapshot.val();
  if (data) {
    const productList = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
    return productList;
  }
  return [];
};

// Add or update product
export const addOrUpdateProduct = async (productData: any, editId: string | null) => {
  const productRef = editId ? ref(database, `products/${editId}`) : push(ref(database, 'products/'));
  await set(productRef, productData);
};

// Delete product
export const deleteProduct = async (id: string) => {
  const productRef = ref(database, `products/${id}`);
  await remove(productRef);
};
