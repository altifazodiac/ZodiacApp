import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { getDatabase, ref, onValue } from 'firebase/database';

const screenWidth = Dimensions.get('window').width;

interface PaymentSummary {
  [method: string]: number;
}

const colorMap: Record<string, string> = {
  'Cash': '#4ade80',
  'QR Code': '#60a5fa',
  'Card': '#facc15',
  'อื่น ๆ': '#f87171',
};

const PaymentBreakdown = () => {
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({});

  useEffect(() => {
    const db = getDatabase();
    const ordersRef = ref(db, 'orders');

    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      const summary: PaymentSummary = {};
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      if (data) {
        Object.values(data).forEach((order: any) => {
          // Check if order has a orderDate and matches today's date
          const orderDate = order.orderDate ? 
            new Date(order.orderDate).toISOString().split('T')[0] : 
            null;
          
          if (orderDate === todayString) {
            const method = order.paymentMethods?.[0] || 'อื่น ๆ';
            const amount = order.total || 0;

            if (summary[method]) {
              summary[method] += amount;
            } else {
              summary[method] = amount;
            }
          }
        });
      }

      setPaymentSummary(summary);
    });
  }, []);

  const chartData = Object.entries(paymentSummary).map(([method, amount]) => ({
    name: method,
    amount,
    color: colorMap[method] || '#ccc',
    legendFontColor: '#333',
    legendFontSize: 14,
  }));

  return (
    <View className="bg-white rounded-xl p-6 shadow-xl mt-6">
      <Text className="text-2xl font-bold text-gray-800 mb-4">
        ช่องทางชำระเงินวันนี้ (Today's Payment Breakdown)
      </Text>

      {chartData.length > 0 ? (
        <>
          <PieChart
            data={chartData as any}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: () => `#000`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
          />

          <View className="mt-6 space-y-4">
            {chartData.map((item, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center p-4 rounded-lg shadow-md bg-gray-50"
              >
                <View className="flex-row items-center space-x-4">
                  <View
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className="text-gray-800 text-lg font-bold">{item.name}</Text>
                </View>
                <Text className="text-xl font-semibold text-gray-900">
                  {item.amount.toLocaleString()} บาท
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text className="text-gray-500 mt-4">ไม่มีข้อมูลคำสั่งซื้อวันนี้</Text>
      )}
    </View>
  );
};

export default PaymentBreakdown;