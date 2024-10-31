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
  export interface Settings {
    OrderPanels: OrderPanels;
  }
  
  export interface OrderPanels {
    displayDiscount: boolean;
    discountValue: number;
    displaySize: boolean;
    displayTax: boolean;
    taxValue: number;
    displayServiceCharge: boolean;
    ServiceChargeValue: number;
    largeimage: boolean;
    ordersListPaper: boolean;
    isPercentage?: boolean;  
  }
 