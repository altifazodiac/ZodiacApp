import React, { useEffect, useState } from 'react';
import { Platform, View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import tailwind from 'tailwind-react-native-classnames';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { ref, onValue } from 'firebase/database';
import { database } from '../utils/firebase';
import { useWindowDimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

// เพิ่ม DateTimePicker เฉพาะเมื่อไม่ใช่แพลตฟอร์ม web
let DateTimePicker: any = () => null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
}

interface PaymentDetail {
  methods: { method: string; amount: number }[];
  orderType: string;
  receiptNumber: string;
  cashChange: number;
}

const SalesAnalytics = () => {
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, PaymentDetail>>({});
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      setProducts(snapshot.val() || {});
    });

    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
      setCategories(snapshot.val() || {});
    });

    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val() || {};
      const filteredSales: SaleItem[] = [];
      const filteredPayments: typeof paymentDetails = {};

      Object.entries(orders).forEach(([orderId, order]: [string, any]) => {
        try {
          const orderDate = new Date(order.orderDate);
          const start = new Date(startDate);
          const end = new Date(endDate);

          // Adjust start and end dates based on filter type
          if (filterType === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
          } else if (filterType === 'week') {
            start.setDate(start.getDate() - start.getDay());
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
          } else if (filterType === 'month') {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
          }

          // Check if order falls within the date range
          if (orderDate >= start && orderDate <= end) {
            // Apply additional filters
            const matchesCategory = selectedCategory === 'all' || products[order.items?.[0]?.productId]?.categoryId === selectedCategory;
            const matchesPaymentMethod = selectedPaymentMethod === 'all' || (order.paymentMethods && Object.values(order.paymentMethods).some((method: any) => method.method === selectedPaymentMethod));
            const matchesOrderType = selectedOrderType === 'all' || order.orderType === selectedOrderType;
            const matchesSearch = !searchQuery || order.receiptNumber?.includes(searchQuery) || order.items?.some((item: any) => item.productName?.toLowerCase().includes(searchQuery.toLowerCase()));

            if (matchesCategory && matchesPaymentMethod && matchesOrderType && matchesSearch) {
              if (order.items) {
                Object.values(order.items).forEach((item: any) => {
                  filteredSales.push({
                    productId: item.productId,
                    productName: item.productName || products[item.productId]?.name || 'Unknown',
                    quantity: parseFloat(item.quantity) || 0,
                    totalPrice: parseFloat(item.totalPrice) || 0,
                  });
                });
              }

              filteredPayments[orderId] = {
                methods: order.paymentMethods ? Object.values(order.paymentMethods) : [],
                orderType: order.orderType || 'Unknown',
                receiptNumber: order.receiptNumber || 'N/A',
                cashChange: parseFloat(order.cashChange) || 0,
              };
            }
          }
        } catch (error) {
          console.error(`Error processing order ${orderId}:`, error);
        }
      });

      setSales(filteredSales);
      setPaymentDetails(filteredPayments);
      setLoading(false);
    });
  }, [filterType, startDate, endDate, selectedCategory, selectedPaymentMethod, selectedOrderType, searchQuery]);

  // Calculate summaries
  const productSales: Record<string, { name: string; quantity: number; total: number }> = {};
  sales.forEach((sale) => {
    if (!productSales[sale.productId]) {
      productSales[sale.productId] = {
        name: sale.productName,
        quantity: 0,
        total: 0,
      };
    }
    productSales[sale.productId].quantity += sale.quantity;
    productSales[sale.productId].total += sale.totalPrice;
  });

  const categorySales: Record<string, { name: string; total: number }> = {};
  Object.entries(productSales).forEach(([productId, sales]) => {
    const categoryId = products[productId]?.categoryId;
    const categoryName = categories[categoryId]?.name || 'Unknown Category';
    if (!categorySales[categoryId]) {
      categorySales[categoryId] = { name: categoryName, total: 0 };
    }
    categorySales[categoryId].total += sales.total;
  });

  const paymentSummary = Object.values(paymentDetails).reduce((acc, payment) => {
    payment.methods.forEach(method => {
      acc[method.method] = (acc[method.method] || 0) + method.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  const orderTypeSummary = Object.values(paymentDetails).reduce((acc, payment) => {
    const type = payment.orderType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSales = Object.values(productSales).reduce((sum, sales) => sum + sales.total, 0);
  const totalQuantity = Object.values(productSales).reduce((sum, sales) => sum + sales.quantity, 0);

  // Chart data for payment methods
  const paymentChartData = Object.entries(paymentSummary).map(([method, amount]) => ({
    name: method,
    amount,
    color: method === 'Cash' ? '#4ade80' : method === 'Scan' ? '#60a5fa' : method === 'Card' ? '#facc15' : '#f87171',
    legendFontColor: '#333',
    legendFontSize: 14,
  }));

  if (loading) {
    return (
      <View style={tailwind`flex-1 justify-center items-center`}>
        <Text style={tailwind`text-gray-500`}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={tailwind`bg-gray-100 p-4`}>
      {/* Header */}
      <LinearGradient colors={['#1e3a8a', '#2563eb']} style={tailwind`rounded-xl p-4 mb-4`}>
        <Text style={tailwind`text-white text-2xl font-bold`}>Sales Analytics</Text>
        <Text style={tailwind`text-gray-200`}>Analyze your sales data with advanced filters</Text>
      </LinearGradient>

      {/* Filter Section */}
      <View style={tailwind`bg-white rounded-xl p-4 mb-4 shadow`}>
        <Text style={tailwind`text-lg font-bold mb-2`}>Filters</Text>

        {/* Filter Type */}
        <View style={tailwind`flex-row justify-between mb-4`}>
          <TouchableOpacity
            style={tailwind`flex-1 mr-2 p-2 rounded-lg ${filterType === 'day' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => setFilterType('day')}
          >
            <Text style={tailwind`text-center ${filterType === 'day' ? 'text-white' : 'text-gray-700'}`}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tailwind`flex-1 mr-2 p-2 rounded-lg ${filterType === 'week' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => setFilterType('week')}
          >
            <Text style={tailwind`text-center ${filterType === 'week' ? 'text-white' : 'text-gray-700'}`}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tailwind`flex-1 mr-2 p-2 rounded-lg ${filterType === 'month' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => setFilterType('month')}
          >
            <Text style={tailwind`text-center ${filterType === 'month' ? 'text-white' : 'text-gray-700'}`}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tailwind`flex-1 p-2 rounded-lg ${filterType === 'custom' ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => setFilterType('custom')}
          >
            <Text style={tailwind`text-center ${filterType === 'custom' ? 'text-white' : 'text-gray-700'}`}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Date Range Picker */}
        {filterType === 'custom' && (
          <View style={tailwind`mb-4`}>
            <View style={tailwind`flex-row justify-between mb-2`}>
              {Platform.OS === 'web' ? (
                <>
                  <View style={tailwind`flex-1 mr-2 p-2 bg-gray-100 rounded-lg`}>
                    <Text style={tailwind`text-gray-700 mb-1`}>Start Date</Text>
                    <TextInput
                      // ใช้ inputMode และส่ง type="date" ผ่าน webProps สำหรับ React Native Web
                      inputMode="numeric"
                      value={startDate.toISOString().split('T')[0]}
                      onChangeText={(text) => {
                        const date = new Date(text);
                        if (!isNaN(date.getTime())) {
                          setStartDate(date);
                        }
                      }}
                      {...(Platform.OS === 'web' ? { type: 'date' } : {})} // ใช้ type="date" เฉพาะสำหรับแพลตฟอร์มเว็บ
                      style={tailwind`border border-gray-300 rounded-lg p-2 w-full`}
                    />
                  </View>
                  <View style={tailwind`flex-1 p-2 bg-gray-100 rounded-lg`}>
                    <Text style={tailwind`text-gray-700 mb-1`}>End Date</Text>
                    <TextInput
                      inputMode="numeric"
                      value={endDate.toISOString().split('T')[0]}
                      onChangeText={(text) => {
                        const date = new Date(text);
                        if (!isNaN(date.getTime())) {
                          setEndDate(date);
                        }
                      }}
                      {...(Platform.OS === 'web' ? { type: 'date' } : {})}
                      style={tailwind`border border-gray-300 rounded-lg p-2 w-full`}
                    />
                  </View>
                </>
              ) : (
                // เดิมสำหรับ mobile
                <>
                  <TouchableOpacity
                    style={tailwind`flex-1 mr-2 p-2 bg-gray-100 rounded-lg`}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={tailwind`text-gray-700`}>Start: {startDate.toISOString().split('T')[0]}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tailwind`flex-1 p-2 bg-gray-100 rounded-lg`}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={tailwind`text-gray-700`}>End: {endDate.toISOString().split('T')[0]}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            {Platform.OS !== 'web' && showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event: any, selectedDate: any) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}
            {Platform.OS !== 'web' && showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event: any, selectedDate: any) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}
          </View>
        )}

        {/* Category Filter */}
        <View style={tailwind`mb-4`}>
          <Text style={tailwind`text-gray-700 mb-1`}>Category</Text>
          <View style={tailwind`border border-gray-300 rounded-lg`}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(itemValue) => setSelectedCategory(itemValue)}
              style={tailwind`h-12`}
            >
              <Picker.Item label="All Categories" value="all" />
              {Object.entries(categories).map(([id, category]) => (
                <Picker.Item key={id} label={category.name} value={id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Payment Method Filter */}
        <View style={tailwind`mb-4`}>
          <Text style={tailwind`text-gray-700 mb-1`}>Payment Method</Text>
          <View style={tailwind`border border-gray-300 rounded-lg`}>
            <Picker
              selectedValue={selectedPaymentMethod}
              onValueChange={(itemValue) => setSelectedPaymentMethod(itemValue)}
              style={tailwind`h-12`}
            >
              <Picker.Item label="All Methods" value="all" />
              <Picker.Item label="Cash" value="Cash" />
              <Picker.Item label="Scan" value="Scan" />
              <Picker.Item label="Card" value="Card" />
            </Picker>
          </View>
        </View>

        {/* Order Type Filter */}
        <View style={tailwind`mb-4`}>
          <Text style={tailwind`text-gray-700 mb-1`}>Order Type</Text>
          <View style={tailwind`border border-gray-300 rounded-lg`}>
            <Picker
              selectedValue={selectedOrderType}
              onValueChange={(itemValue) => setSelectedOrderType(itemValue)}
              style={tailwind`h-12`}
            >
              <Picker.Item label="All Types" value="all" />
              <Picker.Item label="Dine In" value="Dine In" />
              <Picker.Item label="Take Away" value="Take Away" />
              <Picker.Item label="Delivery" value="Delivery" />
            </Picker>
          </View>
        </View>

        {/* Search Bar */}
        <View style={tailwind`mb-4`}>
          <Text style={tailwind`text-gray-700 mb-1`}>Search by Receipt or Product</Text>
          <TextInput
            style={tailwind`border border-gray-300 rounded-lg p-2`}
            placeholder="Enter receipt number or product name"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={tailwind`flex-row justify-between mb-4`}>
        <View style={tailwind`bg-white p-4 rounded-xl shadow w-1/2 mr-2`}>
          <Text style={tailwind`text-gray-500 text-xs`}>Total Sales</Text>
          <Text style={tailwind`text-xl font-bold`}>฿{totalSales.toFixed(2)}</Text>
        </View>
        <View style={tailwind`bg-white p-4 rounded-xl shadow w-1/2`}>
          <Text style={tailwind`text-gray-500 text-xs`}>Total Items Sold</Text>
          <Text style={tailwind`text-xl font-bold`}>{totalQuantity}</Text>
        </View>
      </View>

      {/* Product Sales */}
      <Text style={tailwind`text-lg font-bold mb-2`}>ยอดขายรายสินค้า</Text>
      <View style={tailwind`bg-white rounded-lg p-4 mb-6 shadow`}>
        {Object.entries(productSales).length > 0 ? (
          Object.entries(productSales).map(([productId, sales]) => (
            <View key={productId} style={tailwind`flex-row justify-between py-2 border-b border-gray-100`}>
              {products[productId]?.imageUrl && (
                <Image 
                  source={{ uri: products[productId].imageUrl }} 
                  style={tailwind`w-10 h-10 rounded-full mr-2 bg-gray-200`} 
                />
              )}
              <Text style={tailwind`flex-1`}>{sales.name}</Text>
              <Text style={tailwind`w-16 text-right`}>{sales.quantity} ชิ้น</Text>
              <Text style={tailwind`w-24 text-right font-bold`}>฿{sales.total.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <Text style={tailwind`text-gray-500`}>ไม่มีข้อมูลยอดขาย</Text>
        )}
      </View>

      {/* Category Sales */}
      <Text style={tailwind`text-lg font-bold mb-2`}>ยอดขายตามหมวดหมู่</Text>
      <View style={tailwind`bg-white rounded-lg p-4 mb-6 shadow`}>
        {Object.entries(categorySales).length > 0 ? (
          Object.entries(categorySales).map(([categoryId, sales]) => (
            <View key={categoryId} style={tailwind`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tailwind`flex-1`}>{sales.name}</Text>
              <Text style={tailwind`w-24 text-right font-bold`}>฿{sales.total.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <Text style={tailwind`text-gray-500`}>ไม่มีข้อมูลหมวดหมู่</Text>
        )}
      </View>

      {/* Payment Methods Summary */}
      <Text style={tailwind`text-lg font-bold mb-2`}>สรุปวิธีการชำระเงิน</Text>
      <View style={tailwind`bg-white rounded-lg p-4 mb-6 shadow`}>
        {paymentChartData.length > 0 ? (
          <>
            <PieChart
              data={paymentChartData}
              width={width - 32}
              height={220}
              chartConfig={{
                color: () => `#000`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
            <View style={tailwind`mt-4`}>
              {Object.entries(paymentSummary).map(([method, amount]) => (
                <View key={method} style={tailwind`flex-row justify-between py-2 border-b border-gray-100`}>
                  <Text style={tailwind`flex-1`}>{method}</Text>
                  <Text style={tailwind`w-24 text-right font-bold`}>฿{amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={tailwind`text-gray-500`}>ไม่มีข้อมูลการชำระเงิน</Text>
        )}
      </View>

      {/* Order Type Summary */}
      <Text style={tailwind`text-lg font-bold mb-2`}>สรุปประเภทคำสั่ง</Text>
      <View style={tailwind`bg-white rounded-lg p-4 mb-6 shadow`}>
        {Object.entries(orderTypeSummary).length > 0 ? (
          Object.entries(orderTypeSummary).map(([type, count]) => (
            <View key={type} style={tailwind`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tailwind`flex-1`}>{type}</Text>
              <Text style={tailwind`w-24 text-right font-bold`}>{count} รายการ</Text>
            </View>
          ))
        ) : (
          <Text style={tailwind`text-gray-500`}>ไม่มีข้อมูลประเภทคำสั่ง</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default SalesAnalytics;