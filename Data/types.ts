// types.ts
export interface Option {
    id: string;
    name: string;
    price: number;
    status:boolean;
  }
  
  export interface Product {
    id: string;
    nameDisplay: string;
    price: string;
    imageUrl?: string | null;
    description?: string;
    productSize: string;
    categoryId: string;
    status: string;
    options?: Option[];
  }
  
  export interface OrderItem {
    product: Product;
    quantity: number;
    selectedOptions: Option[];
  }
  
  export type Category = {
    id: string;
    name: string;
  };