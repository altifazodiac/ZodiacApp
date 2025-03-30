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

  return (
    <View style={tailwind`bg-white rounded-xl w-full mb-4 shadow ${itemPadding}`}>
      <Text style={tailwind`text-lg font-bold mb-2`}>Expense Breakdown</Text>
      
      <ProgressChart
        data={{
          data: [productCostPercentage,  profitPercentage, otherExpensesPercentage],
          colors: ["#ef4444", "#f59e0b", "#10b981"]
        }}
        width={chartWidth}
        height={chartHeight}
        strokeWidth={strokeWidth}
        radius={radius}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1, index = 0) => {
            const colors = ["#ef4444", "#f59e0b", "#10b981"];
            return colors[index as number] || "#3b82f6";
          },
        }}
      />
      
      <View style={tailwind`mt-4`}>
        <View style={tailwind`flex-row items-center mb-1`}>
          <View style={tailwind`w-3 h-3 bg-red-500 rounded-full mr-2`} />
          <Text style={tailwind`${textSize} text-gray-600`}>
            Product Costs: ${productCost.toFixed(2)} ({(productCostPercentage * 100).toFixed(1)}%)
          </Text>
        </View>
          <View style={tailwind`flex-row items-center`}>
          <View style={tailwind`w-3 h-3 bg-green-500 rounded-full mr-2`} />
          <Text style={tailwind`${textSize} text-gray-600`}>
            Profit: ${(totalIncome - productCost - otherExpenses).toFixed(2)} ({(profitPercentage * 100).toFixed(1)}%)
          </Text>
        </View>
        <View style={tailwind`flex-row items-center mb-1`}>
          <View style={tailwind`w-3 h-3 bg-amber-500 rounded-full mr-2`} />
          <Text style={tailwind`${textSize} text-gray-600`}>
            Other Expenses: ${otherExpenses.toFixed(2)} ({(otherExpensesPercentage * 100).toFixed(1)}%)
          </Text>
        </View>
      </View>
    </View>
  );
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
  <View style={tailwind`bg-white p-4 rounded-xl w-1/2 mb-4  `}>
    <Text style={tailwind`text-xs text-gray-500 mb-1`}>จำนวนรายการ</Text>
    <Text style={tailwind`text-lg font-bold mb-2`}>{`${dailyQty}`}</Text>
    <Text style={tailwind`text-xs text-gray-600`}>รวมสินค้าทุกรายการ</Text>
  </View>
);
const DailySalesReport = () => {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [dailySales, setDailySales] = useState<SaleItem[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ใช้วันที่ปัจจุบันจริง แทนการ hardcode
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log("Using date:", todayString);

    // ดึงข้อมูล products
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      setProducts(snapshot.val() || {});
    });
    // ดึงข้อมูล categories
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
      setCategories(snapshot.val() || {});
    });

    // ดึงข้อมูล orders และกรองตามวันที่
    // ดึงข้อมูล orders และกรองตามวันที่
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val() || {};
      const sales: SaleItem[] = [];

      Object.values(orders).forEach((order: any) => {
        try {
          // ใช้ orderDate แทน timestamp ตามข้อมูลตัวอย่าง
          const orderDate = order.orderDate ? new Date(order.orderDate) : null;
          if (!orderDate || isNaN(orderDate.getTime())) {
            console.warn("Invalid date:", order.orderDate);
            return;
          }

          const orderDateString = orderDate.toISOString().split('T')[0];
          if (orderDateString === todayString && order.items) {
            Object.values(order.items).forEach((item: any) => {
              sales.push({
                productId: item.productId,
                productName: item.productName || products[item.productId]?.name || 'Unknown',
                quantity: item.quantity || 0,
                totalPrice: item.totalPrice || 0
              });
            });
          }
        } catch (error) {
          console.error("Error processing order:", error);
        }
      });

      setDailySales(sales);
      setLoading(false);
    });
  }, []);

  // Calculate product sales
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

  // Calculate category sales
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
      <View style={tailwind`bg-white rounded-lg p-4 shadow`}>
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

      {/* Total Sales */}
      <View style={tailwind`mt-6 bg-blue-50 rounded-lg p-4`}>
        <Text style={tailwind`text-lg font-bold text-center mb-2`}>ยอดขายรวมวันนี้</Text>
        <Text style={tailwind`text-2xl font-bold text-center text-blue-600`}>
          {Object.values(productSales).reduce((sum, sales) => sum + sales.total, 0).toFixed(2)} บาท
        </Text>
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
  // ฟังก์ชันตรวจสอบว่าอยู่ในเดือนปัจจุบัน
  const isCurrentMonth = (orderDate: string) => {
    const orderDateObj = new Date(orderDate);
    const currentDate = new Date();
    return (
      orderDateObj.getMonth() === currentDate.getMonth() &&
      orderDateObj.getFullYear() === currentDate.getFullYear()
    );
  };

  // ฟังก์ชันตรวจสอบว่าอยู่ในเดือนที่แล้ว
  const isPreviousMonth = (orderDate: string) => {
    const orderDateObj = new Date(orderDate);
    const currentDate = new Date();
    
    // ตรวจสอบกรณีเดือนที่แล้วเป็นเดือนธันวาคมของปีก่อน
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
          Object.values(orders).forEach((order: any) => {
            if (isCurrentMonth(order.orderDate)) {
              // คำนวณยอดขายเดือนปัจจุบัน
              if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  const totalPrice = parseFloat(item.totalPrice) || 0;
                  const costPrice = costByProductId[item.productId] || 0;
                  currentMonthIncome += totalPrice;
                  currentMonthCost += costPrice * (item.quantity || 1);
                });
              }
            } else if (isPreviousMonth(order.orderDate)) {
              // คำนวณยอดขายเดือนที่แล้ว
              if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  const totalPrice = parseFloat(item.totalPrice) || 0;
                  const costPrice = costByProductId[item.productId] || 0;
                  previousMonthIncome += totalPrice;
                  previousMonthCost += costPrice * (item.quantity || 1);
                });
              }
            }
          });
        }
        if (orders) {
          Object.values(orders).forEach((order: any) => {
            const orderDate = new Date(order.orderDate);
            const today = new Date();
            
            if (
              orderDate.getDate() === today.getDate() &&
              orderDate.getMonth() === today.getMonth() &&
              orderDate.getFullYear() === today.getFullYear()
            ) {
              if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  todaySales += parseFloat(item.totalPrice) || 0;
                });
              }
              if (Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  todayQty += parseFloat(item.quantity) || 0;
                });
              }
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
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
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
  const [monthlySalesData, setMonthlySalesData] = useState<{month: string, value: number}[]>([]);

  
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const productsRef = ref(database, 'products');
    let costByProductId: Record<string, number> = {};

    // Fetch product cost data first
    onValue(productsRef, (snapshot) => {
      const products = snapshot.val();
      if (products) {
        Object.entries(products).forEach(([id, prod]: any) => {
          costByProductId[id] = parseFloat(prod.costPrice) || 0;
        });
      }
    });

    // Fetch orders and calculate totals
    onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val();
      let income = 0;
      let cost = 0;

      if (orders) {
        Object.values(orders).forEach((order: any) => {
          if (Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const totalPrice = parseFloat(item.totalPrice) || 0;
              const costPrice = costByProductId[item.productId] || 0;
              income += totalPrice;
              cost += costPrice * (item.quantity || 1);
            });
          }
        });
      }

      setTotalIncome(income);
      setProductCost(cost);
      setLoading(false);
    });

   interface Order {
    orderDate: string;
    totalPrice: string;
   }

   // Additional data processing
   get(ordersRef).then(snapshot => {
    const orders = Object.values(snapshot.val() || {}) as Order[];
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const filteredOrders = orders.filter(order => new Date(order.orderDate) >= startOfWeek);
    const monthlyData = Array(12).fill(0);
    orders.forEach(order => {
      const month = new Date(order.orderDate).getMonth();
      monthlyData[month] += parseFloat(order.totalPrice);
    });
   });
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
if (Array.isArray(order.items)) {
  order.items.forEach((item: any) => {
    const itemTotalPrice = Math.round(parseFloat(item.totalPrice.toFixed(0)) || 0); // ปัดเศษตามปกติ
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

     

  fetchMonthlyData();
   }, []);
 // เตรียมข้อมูลสำหรับ LineChart
 const chartLabels = monthlySalesData.map(item => item.month);
 const chartData = monthlySalesData.map(item => Math.round(item.value));
  
  return (
    <ScrollView style={tailwind`bg-gray-100 p-4`}>
        {/* Top Stats */}
        <View style={tailwind`flex-row justify-between mb-4`}>
        <StatBox
          label="Total Income"
          value={`฿${totalIncome.toFixed(0)}`}
          sub={`${incomeChange >= 0 ? '+' : '-'}฿${Math.abs(incomeChange).toFixed(0)} than last month`}
          badge={`${incomeChange >= 0 ? '+' : '-'}${Math.abs(incomeChangePercent)}%`}
           
        />
        <StatBox
          label="Product Cost"
          value={`฿${productCost.toFixed(0)}`}
          sub={`${costChange >= 0 ? '+' : '-'}฿${Math.abs(costChange).toFixed(0)} than last month`}
          badge={`${costChange >= 0 ? '+' : '-'}${Math.abs(costChangePercent)}%`}
          hidden={!showFinancialData}
        />
        <StatBox
          label="Earnings"
          value={`฿${earnings.toFixed(0)}`}
          sub={`${earningsChange >= 0 ? '+' : '-'}฿${Math.abs(earningsChange).toFixed(0)} than last month`}
          badge={`${earningsChange >= 0 ? '+' : '-'}${Math.abs(earningsChangePercent)}%`}
          hidden={!showFinancialData}
        />
      </View>

      {/* Add a toggle button in the header */}
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

      {/* Balance Summary */}
      <View style={tailwind`bg-white rounded-xl p-4 mb-4 shadow overflow-hidden`}>
        <Text style={tailwind`text-lg font-bold mb-2`}>Balance Summary</Text>
        {chartData.length > 0 ? (
         <LineChart 
         data={{
           labels: chartLabels,
           datasets: [{
             data: chartData // ใช้ข้อมูลที่ไม่มีจุดทศนิยม
           }]
         }}
         width={screenWidth - 40}
         height={200}
         chartConfig={{
           
           backgroundGradientFrom: "#fff",
           backgroundGradientTo: "#fff",
           color: () => "#3b82f6", // สีของเส้นกราฟ
           labelColor: () => "#4b5563", // สีของตัวอักษรในแกน
           propsForDots: { 
             r: "4", 
             strokeWidth: "2", 
             stroke: "#60a5fa" 
           }, // คุณสมบัติของจุดบนกราฟ
           decimalPlaces: 0, // ลบจุดทศนิยมออกจากค่าที่แสดงใน tooltip (ถ้ามี)
         }}
         bezier // ทำให้เส้นกราฟโค้งมน
         withDots={true} // แสดงจุดบนกราฟ
          withInnerLines={false} // ไม่แสดงเส้นภายใน

         style={tailwind`rounded-xl`}
           
       />
        
        ) : (
          <View style={tailwind`h-40 justify-center items-center`}>
            <Text style={tailwind`text-gray-500`}>No sales data available</Text>
          </View>
        )}
      </View>

      {/* Card Display */}
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

      {/* Quick Transactions */}
     {/* <View style={tailwind`flex-row items-center mt-2 mb-4`}>
        <TouchableOpacity style={tailwind`bg-gray-200 rounded-full p-2 mr-2`}>
          <Text style={tailwind`text-lg`}>+</Text>
        </TouchableOpacity>
        {['Devi', 'John', 'Will', 'Kris'].map((name, idx) => (
          <Image 
            key={idx} 
            source={{ uri: `https://i.pravatar.cc/150?img=${idx + 1}` }} 
            style={tailwind`w-10 h-10 rounded-full mr-2`} 
          />
        ))}
      </View>*/}
       
      {/* Lower Row */}
      <View style={tailwind`flex-row flex-wrap justify-between`}>
      <InfoBox label="ยอดขายวันนี้" value={`฿${dailySales.toFixed(0)}`} sub="Today's sales" />
        <Dailyincome dailyQty={dailyQty} />
      
        <ExpenseSummary 
  productCost={productCost} 
  totalIncome={totalIncome} 
  otherExpenses={0} // Add your other expenses if available
        />
    
      </View>
      <DailySalesReport />
      <PaymentBreakdown/>
    </ScrollView>
  );
};

export default Dashboard;