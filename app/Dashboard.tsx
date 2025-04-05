// Dashboard.tsx
// This component displays a dashboard with various statistics and charts.
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import tailwind from 'tailwind-react-native-classnames';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../utils/firebase'; // adjust this path
import { useWindowDimensions } from 'react-native';
import PaymentBreakdown from '../components/PaymentBreakdown';
import { Animated, Easing } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface StatBoxProps {
  label: string;
  value: string;
  sub: string;
  badge: string;
  hidden?: boolean;
}

interface ButtonProps {
  text: string;
}

interface InfoBoxProps {
  label: string;
  value: string;
  sub: string;
}
interface ExpenseSummaryProps {
  productCost: number;
  totalIncome: number;
  otherExpenses?: number;
}
interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  imageUrl?: string; // Added imageUrl property
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
interface DailyIncomeProps {
  dailyQty: number;
}


const ExpenseSummary = ({ productCost, totalIncome, otherExpenses = 0 }: ExpenseSummaryProps) => {
  const { width } = useWindowDimensions();
  
  // Calculate expense percentages
  const productCostPercentage = totalIncome > 0 ? productCost / totalIncome : 0;
  const otherExpensesPercentage = totalIncome > 0 ? otherExpenses / totalIncome : 0;
  const profitPercentage = totalIncome > 0 ? (totalIncome - productCost - otherExpenses) / totalIncome : 0;

  // Responsive sizing
  const chartWidth = width - 40; // 20 padding on each side
  const chartHeight = width > 400 ? 150 : 120;
  const strokeWidth = width > 400 ? 16 : 12;
const radius = width > 400 ? 32 : 24;
  const textSize = width > 400 ? 'text-sm' : 'text-xs';
  const itemPadding = width > 400 ? 'p-4' : 'p-3';
};

const StatBox = ({ label, value, sub, badge, hidden = false }: StatBoxProps) => (
  <View style={tailwind`bg-white p-4 rounded-xl shadow w-1/3 mr-2`}>
    <View style={tailwind`flex-row justify-between items-center`}>
      <Text style={tailwind`text-gray-500 text-xs`}>{label}</Text>
      <TouchableOpacity onPress={() => {}}>
        <Text style={tailwind`text-gray-400`}>
          {hidden ? '👁️' : '👁️‍🗨️'}
        </Text>
      </TouchableOpacity>
    </View>
    <Text style={tailwind`text-lg font-bold`}>
      {hidden ? '••••' : value}
    </Text>
    <Text style={tailwind`text-green-500 text-xs`}>
      {hidden ? '••••••••••••••••' : sub}
    </Text>
    <Text style={tailwind`text-xs bg-green-100 px-2 py-1 mt-1 rounded-full text-green-600`}>
      {hidden ? '•••' : badge}
    </Text>
  </View>
);

const Button = ({ text }: ButtonProps) => (
  <TouchableOpacity style={tailwind`bg-white px-4 py-2 rounded-lg`}>
    <Text style={tailwind`text-blue-600 font-semibold`}>{text}</Text>
  </TouchableOpacity>
);

const InfoBox = ({ label, value, sub }: InfoBoxProps) => (
  <View style={tailwind`bg-white p-4 rounded-xl w-1/2 mb-4 `}>
    <Text style={tailwind`text-xs text-gray-500 mb-1`}>{label}</Text>
    <Text style={tailwind`text-xl font-bold`}>{value}</Text>
    <Text style={tailwind`text-green-500 text-xs`}>{sub}</Text>
  </View>
);


const Dailyincome = ({ dailyQty }: DailyIncomeProps) => (
  <View style={tailwind`bg-white p-4 rounded-xl w-1/2 mb-4 ml-2`}>  
    <Text style={tailwind`text-xs text-gray-500 mb-1`}>จำนวนสินค้า</Text>
    <Text style={tailwind`text-lg font-bold mb-2`}>{`${dailyQty}`}</Text>
    <Text style={tailwind`text-xs text-gray-600`}>รวมสินค้าทุกรายการ</Text>
  </View>
);
// ใน DailySalesReport component
const DailySalesReport = () => {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [dailySales, setDailySales] = useState<SaleItem[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [paymentDetails, setPaymentDetails] = useState<Record<string, {
    methods: { method: string; amount: number }[];
    orderType: string;
    receiptNumber: string;
    cashChange: number;
  }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log("Today String (DailySalesReport):", todayString);

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
      const sales: SaleItem[] = [];
      const payments: typeof paymentDetails = {};

      Object.entries(orders).forEach(([orderId, order]: [string, any]) => {
        try {
          const orderDate = new Date(order.orderDate);
          const orderDateString = orderDate.toISOString().split('T')[0];
          
          if (orderDateString === todayString) {
            // รวบรวมข้อมูล sales
            if (order.items) {
              Object.values(order.items).forEach((item: any) => {
                sales.push({
                  productId: item.productId,
                  productName: item.productName || products[item.productId]?.name || 'Unknown',
                  quantity: parseFloat(item.quantity) || 0,
                  totalPrice: parseFloat(item.totalPrice) || 0
                });
              });
            }
            
            // รวบรวมข้อมูล payment และข้อมูลอื่นๆ
            payments[orderId] = {
              methods: order.paymentMethods ? Object.values(order.paymentMethods) : [],
              orderType: order.orderType || 'Unknown',
              receiptNumber: order.receiptNumber || 'N/A',
              cashChange: parseFloat(order.cashChange) || 0
            };
          }
        } catch (error) {
          console.error(`Error processing order ${orderId}:`, error);
        }
      });

      setDailySales(sales);
      setPaymentDetails(payments);
      setLoading(false);

      // Debug log
      console.log("Payment Details:", payments);
    });
  }, []);

  // คำนวณยอดตามประเภทการชำระเงิน
  const paymentSummary = Object.values(paymentDetails).reduce((acc, payment) => {
    payment.methods.forEach(method => {
      acc[method.method] = (acc[method.method] || 0) + method.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  // คำนวณยอดตามประเภทคำสั่ง
  const orderTypeSummary = Object.values(paymentDetails).reduce((acc, payment) => {
    const type = payment.orderType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Debug log สำหรับ orderTypeSummary
  console.log("Order Type Summary:", orderTypeSummary);

  // คำนวณ product sales และ category sales
  const productSales: Record<string, { name: string; quantity: number; total: number }> = {};
  dailySales.forEach((sale) => {
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

  if (loading) {
    return (
      <View style={tailwind`p-4`}>
        <Text>Loading sales data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={tailwind`p-4`}>
      <Text style={tailwind`text-xl font-bold mb-4`}>รายงานยอดขายประจำวัน</Text>

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
              <Text style={tailwind`w-24 text-right font-bold`}>{sales.total.toFixed(2)} บาท</Text>
            </View>
          ))
        ) : (
          <Text style={tailwind`text-gray-500`}>ไม่มีข้อมูลยอดขายวันนี้</Text>
        )}
      </View>

      {/* Category Sales */}
      <Text style={tailwind`text-lg font-bold mb-2`}>ยอดขายตามหมวดหมู่</Text>
      <View style={tailwind`bg-white rounded-lg p-4 mb-6 shadow`}>
        {Object.entries(categorySales).length > 0 ? (
          Object.entries(categorySales).map(([categoryId, sales]) => (
            <View key={categoryId} style={tailwind`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tailwind`flex-1`}>{sales.name}</Text>
              <Text style={tailwind`w-24 text-right font-bold`}>{sales.total.toFixed(2)} บาท</Text>
            </View>
          ))
        ) : (
          <Text style={tailwind`text-gray-500`}>ไม่มีข้อมูลหมวดหมู่</Text>
        )}
      </View>

      {/* Payment Methods Summary */}
      <Text style={tailwind`text-lg font-bold mb-2`}>สรุปวิธีการชำระเงิน</Text>
      <View style={tailwind`bg-white rounded-lg p-4 mb-6 shadow`}>
        {Object.entries(paymentSummary).length > 0 ? (
          Object.entries(paymentSummary).map(([method, amount]) => (
            <View key={method} style={tailwind`flex-row justify-between py-2 border-b border-gray-100`}>
              <Text style={tailwind`flex-1`}>{method}</Text>
              <Text style={tailwind`w-24 text-right font-bold`}>{amount.toFixed(2)} บาท</Text>
            </View>
          ))
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


const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [productCost, setProductCost] = useState(0);
  const [previousIncome, setPreviousIncome] = useState(0);
  const [previousCost, setPreviousCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState(0);
  const [dailyQty, setDailyQty] = useState(0);
  const [showFinancialData, setShowFinancialData] = useState(false);
  const [monthlySalesData, setMonthlySalesData] = useState<{month: string, value: number}[]>([]);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const toggleVisibility = () => {
    Animated.timing(fadeAnim, {
      toValue: showFinancialData ? 0 : 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
    setShowFinancialData(!showFinancialData);
  };

  const isCurrentMonth = (orderDate: string) => {
    const orderDateObj = new Date(orderDate);
    const currentDate = new Date();
    return (
      orderDateObj.getMonth() === currentDate.getMonth() &&
      orderDateObj.getFullYear() === currentDate.getFullYear()
    );
  };

  const isPreviousMonth = (orderDate: string) => {
    const orderDateObj = new Date(orderDate);
    const currentDate = new Date();
    if (currentDate.getMonth() === 0) {
      return (
        orderDateObj.getMonth() === 11 &&
        orderDateObj.getFullYear() === currentDate.getFullYear() - 1
      );
    }
    return (
      orderDateObj.getMonth() === currentDate.getMonth() - 1 &&
      orderDateObj.getFullYear() === currentDate.getFullYear()
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnapshot = await get(ref(database, 'products'));
        const ordersSnapshot = await get(ref(database, 'orders'));
        let todaySales = 0;
        let todayQty = 0;

        let costByProductId: Record<string, number> = {};
        const products = productsSnapshot.val();
        
        if (products) {
          Object.entries(products).forEach(([id, prod]: any) => {
            costByProductId[id] = parseFloat(prod.costPrice) || 0;
          });
        }

        let currentMonthIncome = 0;
        let currentMonthCost = 0;
        let previousMonthIncome = 0;
        let previousMonthCost = 0;

        const orders = ordersSnapshot.val();
        if (orders) {
          const today = new Date();
          const todayString = today.toISOString().split('T')[0];

          Object.entries(orders).forEach(([orderId, order]: [string, any]) => {
            try {
              const orderDate = new Date(order.orderDate);
              const orderDateString = orderDate.toISOString().split('T')[0];

              if (orderDateString === todayString) {
                todaySales += parseFloat(order.total) || 0;
                if (order.items) {
                  Object.values(order.items).forEach((item: any) => {
                    const qty = parseFloat(item.quantity) || 0;
                    todayQty += qty;
                  });
                }
              }

              if (order.items) {
                let orderIncome = 0;
                let orderCost = 0;
                
                Object.values(order.items).forEach((item: any) => {
                  const totalPrice = parseFloat(item.totalPrice) || 0;
                  const costPrice = costByProductId[item.productId] || 0;
                  const quantity = parseFloat(item.quantity) || 1;
                  
                  orderIncome += totalPrice;
                  orderCost += costPrice * quantity;
                });

                if (isCurrentMonth(order.orderDate)) {
                  currentMonthIncome += orderIncome;
                  currentMonthCost += orderCost;
                } else if (isPreviousMonth(order.orderDate)) {
                  previousMonthIncome += orderIncome;
                  previousMonthCost += orderCost;
                }
              }
            } catch (error) {
              console.error(`Error processing order ${orderId}:`, error);
            }
          });
        }

        setDailyQty(todayQty);
        setDailySales(todaySales);
        setTotalIncome(currentMonthIncome);
        setProductCost(currentMonthCost);
        setPreviousIncome(previousMonthIncome);
        setPreviousCost(previousMonthCost);
        setLoading(false);

        console.log('Total Income (Current Month):', currentMonthIncome);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    const fetchMonthlyData = async () => {
      try {
        const ordersSnapshot = await get(ref(database, 'orders'));
        const orders = ordersSnapshot.val();
    
        const monthlySales: Record<string, number> = {
          Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
          Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
        };
    
        if (orders) {
          Object.values(orders).forEach((order: any) => {
            const orderDate = new Date(order.orderDate);
            const month = orderDate.getMonth();
            const monthName = [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ][month];
    
            let orderTotalPrice = 0;
            if (order.items) {
              Object.values(order.items).forEach((item: any) => {
                const itemTotalPrice = Math.round(parseFloat(item.totalPrice) || 0);
                orderTotalPrice += itemTotalPrice;
              });
            }
    
            if (!monthlySales[monthName]) {
              monthlySales[monthName] = 0;
            }
            monthlySales[monthName] += orderTotalPrice;
          });
        }
    
        const sortedData = Object.entries(monthlySales)
          .map(([month, value]) => ({ month, value }))
          .sort((a, b) => {
            const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month);
          });
    
        setMonthlySalesData(sortedData);
      } catch (error) {
        console.error("Error fetching monthly data:", error);
      }
    };

    fetchData();
    fetchMonthlyData();
  }, []);

  const incomeChange = totalIncome - previousIncome;
  const incomeChangePercent = Number(((incomeChange / previousIncome) * 100).toFixed(1));
  const isPositive = incomeChangePercent >= 0;

  const costChange = productCost - previousCost;
  const costChangePercent = Number(((costChange / previousCost) * 100).toFixed(1));

  const earnings = totalIncome - productCost;
  const previousEarnings = previousIncome - previousCost;
  const earningsChange = earnings - previousEarnings;
  const earningsChangePercent = Number(((earningsChange / previousEarnings) * 100).toFixed(1));

  const chartLabels = monthlySalesData.map(item => item.month);
  const chartData = monthlySalesData.map(item => Math.round(item.value));

  return (
    <ScrollView style={tailwind`bg-gray-100 p-4`}>
      <View style={tailwind`flex-row justify-between`}>
        <InfoBox label="ยอดขายวันนี้" value={`฿${dailySales.toFixed(0)}`} sub="Today's sales"/>
        <Dailyincome dailyQty={dailyQty} />
      </View>
      <View style={tailwind`flex-row justify-between mb-4`}>
        <StatBox
          label="ยอดขายเดือนนี้"
          value={`฿${totalIncome.toFixed(0)}`}
          sub={`${incomeChange >= 0 ? '+' : '-'}฿${Math.abs(incomeChange).toFixed(0)} เทียบกับเดือนที่แล้ว`}
          badge={`${incomeChange >= 0 ? '+' : '-'}${Math.abs(incomeChangePercent)}%`}
        />
        <StatBox
          label="ต้นทุนสินค้า"
          value={`฿${productCost.toFixed(0)}`}
          sub={`${costChange >= 0 ? '+' : '-'}฿${Math.abs(costChange).toFixed(0)} เทียบกับเดือนที่แล้ว`}
          badge={`${costChange >= 0 ? '+' : '-'}${Math.abs(costChangePercent)}%`}
          hidden={!showFinancialData}
        />
        <StatBox
          label="กำไรสุทธิ"
          value={`฿${earnings.toFixed(0)}`}
          sub={`${earningsChange >= 0 ? '+' : '-'}฿${Math.abs(earningsChange).toFixed(0)} เทียบกับเดือนที่แล้ว`}
          badge={`${earningsChange >= 0 ? '+' : '-'}${Math.abs(earningsChangePercent)}%`}
          hidden={!showFinancialData}
        />
      </View>

      <View style={tailwind`absolute top-2 right-0`}>
        <TouchableOpacity 
          onPress={() => setShowFinancialData(!showFinancialData)}
          style={tailwind`bg-white p-2 rounded-full `}
        >
          <Text style={tailwind`text-md`}>
            {showFinancialData ? '👁️‍🗨️' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={tailwind`bg-white rounded-xl p-4 mb-4 shadow overflow-hidden`}>
        <Text style={tailwind`text-lg font-bold mb-2`}>Balance Summary</Text>
        {chartData.length > 0 ? (
         <LineChart 
           data={{
             labels: chartLabels,
             datasets: [{
               data: chartData
             }]
           }}
           width={screenWidth - 40}
           height={200}
           chartConfig={{
             backgroundGradientFrom: "#fff",
             backgroundGradientTo: "#fff",
             color: () => "#3b82f6",
             labelColor: () => "#4b5563",
             propsForDots: { 
               r: "4", 
               strokeWidth: "2", 
               stroke: "#60a5fa" 
             },
             decimalPlaces: 0,
           }}
           bezier
           withDots={true}
           withInnerLines={false}
           style={tailwind`rounded-xl`}
         />
        ) : (
          <View style={tailwind`h-40 justify-center items-center`}>
            <Text style={tailwind`text-gray-500`}>No sales data available</Text>
          </View>
        )}
      </View>

      <LinearGradient colors={['#1e3a8a', '#2563eb']} style={tailwind`rounded-xl p-4 mb-4`}>
        <Text style={tailwind`text-white text-2xl mb-2`}>฿{totalIncome.toFixed(0)}</Text>
        <Text style={tailwind`text-gray-300`}>ยอดขายรวมทั้งหมด</Text>
        <Text style={tailwind`text-gray-300`}>Current Month</Text>
        <View style={tailwind`flex-row mt-4 justify-between`}>
          <Button text="Send" />
          <Button text="Request" />
          <Button text="+ Add" />
        </View>
      </LinearGradient>

      <View style={tailwind`flex-row flex-wrap justify-between`}>
         
      </View>
      <DailySalesReport />
      <PaymentBreakdown/>
    </ScrollView>
  );
};

export default Dashboard;