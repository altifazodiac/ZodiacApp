import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';
import tailwind from 'tailwind-react-native-classnames';

interface PaymentMethod {
  method: string;
  amount: number;
}

interface PaymentSummary {
  [method: string]: number;
}

const colorMap: Record<string, string> = {
  'Cash': '#4ade80',
  'Scan': '#60a5fa',
  'Card': '#facc15',
  'Other': '#f87171',
};

const PaymentBreakdown = () => {
  const { width, height } = useWindowDimensions();
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({});
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const db = getDatabase();
    const ordersRef = ref(db, 'orders');

    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const summary: PaymentSummary = {};
      let orderCount = 0;
      let totalSum = 0;
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      if (data) {
        Object.entries(data).forEach(([_, order]: [string, any]) => {
          const orderDate = order.orderDate ? 
            new Date(order.orderDate).toISOString().split('T')[0] : 
            null;
          
          if (orderDate === todayString) {
            orderCount++;
            totalSum += parseFloat(order.total) || 0;

            if (order.paymentMethods && Array.isArray(Object.values(order.paymentMethods))) {
              (Object.values(order.paymentMethods) as PaymentMethod[]).forEach((payment) => {
                const method = payment.method || 'Other';
                const amount = parseFloat(payment.amount.toString()) || 0;
                summary[method] = (summary[method] || 0) + amount;
              });
            } else {
              summary['Other'] = (summary['Other'] || 0) + (parseFloat(order.total) || 0);
            }
          }
        });
      }

      setPaymentSummary(summary);
      setTotalOrders(orderCount);
      setTotalAmount(totalSum);
    });
  }, []);

  const chartData = Object.entries(paymentSummary).map(([method, amount]) => ({
    name: method,
    amount,
    color: colorMap[method] || '#ccc',
    legendFontColor: '#333',
    legendFontSize: width > 400 ? 14 : 12,
  }));

  const getPercentage = (amount: number) => {
    return totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0';
  };

  // Responsive sizing
  const chartWidth = width - (width > 600 ? 64 : 32);
  const chartHeight = width > 600 ? 250 : width > 400 ? 220 : 180;
  const padding = width > 600 ? 'p-8' : 'p-6';
  const textSize = width > 600 ? 'text-2xl' : width > 400 ? 'text-xl' : 'text-lg';
  const summaryTextSize = width > 600 ? 'text-lg' : 'text-base';
  const legendTextSize = width > 600 ? 'text-lg' : width > 400 ? 'text-base' : 'text-sm';
  const legendAmountSize = width > 600 ? 'text-xl' : width > 400 ? 'text-lg' : 'text-base';
  const percentTextSize = width > 600 ? 'text-base' : 'text-sm';

  return (
    <View style={tailwind`bg-white rounded-xl ${padding} shadow-xl mt-6`}>
      <Text style={tailwind`${textSize} font-bold text-gray-800 mb-4`}>
        ช่องทางชำระเงินวันนี้
      </Text>

      {chartData.length > 0 ? (
        <>
          {/* Summary Header */}
          <View style={tailwind`mb-6 p-4 bg-gray-50 rounded-lg`}>
            <Text style={tailwind`${summaryTextSize} font-semibold text-gray-700`}>
              จำนวนคำสั่ง: {totalOrders} รายการ
            </Text>
            <Text style={tailwind`${summaryTextSize} font-semibold text-gray-700`}>
              ยอดรวม: {totalAmount.toLocaleString()} บาท
            </Text>
          </View>

          {/* Pie Chart */}
          <PieChart
            data={chartData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              color: () => `#000`,
              labelColor: () => `#333`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft={width > 400 ? "10" : "5"}
            absolute
            hasLegend={false}
            style={tailwind`self-center`}
          />

          {/* Custom Legend */}
          <View style={tailwind`mt-6 space-y-4`}>
            {chartData.map((item, index) => (
              <View
                key={index}
                style={tailwind`flex-row justify-between items-center p-4 rounded-lg shadow-md bg-gray-50`}
              >
                <View style={tailwind`flex-row items-center space-x-4`}>
                  <View
                    style={[tailwind`rounded-full`, { 
                      backgroundColor: item.color,
                      width: width > 600 ? 24 : width > 400 ? 20 : 16,
                      height: width > 600 ? 24 : width > 400 ? 20 : 16,
                    }]}
                  />
                  <Text style={tailwind`${legendTextSize} text-gray-800 font-bold`}>
                    {item.name}
                  </Text>
                </View>
                <View style={tailwind`items-end`}>
                  <Text style={tailwind`${legendAmountSize} font-semibold text-gray-900`}>
                    {item.amount.toLocaleString()} บาท
                  </Text>
                  <Text style={tailwind`${percentTextSize} text-gray-600`}>
                    {getPercentage(item.amount)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={tailwind`${textSize} text-gray-500 mt-4 text-center`}>
          ไม่มีข้อมูลคำสั่งซื้อวันนี้
        </Text>
      )}
    </View>
  );
};

export default PaymentBreakdown;