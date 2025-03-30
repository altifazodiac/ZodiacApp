import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Pressable } from 'react-native';
import { Colors } from '../constants/Colors';  
import { useColorScheme } from '../hooks/useColorScheme'; 
import Login from './login';  
import Products from './products';  
import CategoryScreen from './CategoryScreen';
import Orders from './Orders';
import OrderDetail from './OrderDetail';
import Setting from './Setting';
import MemberRegister from './MemberRegister';
import SignUp from './SignUp';
import CreatePasscode from './CreatePasscode';
import Passcode from './Passcode';
import Dashboard from './Dashboard';
import { FaLock, FaTachometerAlt, FaReceipt, FaFileAlt, FaTags, FaThLarge, FaCog, FaUserPlus, FaBars } from 'react-icons/fa'; // นำเข้าไอคอนจาก Font Awesome

const Drawer = createDrawerNavigator();

const DrawerLayout = () => {
  const colorScheme = useColorScheme();  

  return (
    <Drawer.Navigator
    initialRouteName="Passcode"
    screenOptions={({ navigation }) => ({
      drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      headerShown: true,
      headerTitleStyle: { fontFamily: 'Kanit-Regular' }, // กำหนดฟอนต์ Kanit สำหรับหัวข้อ
      drawerLabelStyle: { fontFamily: 'Kanit-Regular' }, // กำหนดฟอนต์ Kanit สำหรับป้ายกำกับใน Drawer
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.toggleDrawer()}
          style={{ marginLeft: 10 }}
        >
          <FaBars size={24} color={Colors[colorScheme ?? 'light'].text} />
        </Pressable>
      ),
    })}
  >
  <Drawer.Screen
  name="Passcode"
  options={{
    title: 'Passcode',
    headerShown: false,           // ซ่อนแถบด้านบน
    swipeEnabled: false,         // ปิด gesture ลิ้นชัก
    drawerIcon: ({ color }) => <FaLock color={color} size={24} />,
    drawerItemStyle: { display: 'none' }, // ซ่อนจากเมนูลิ้นชัก
  }}
  component={Passcode}
/>
    <Drawer.Screen
      name="Dashboard"
      options={{
        title: 'สรุปการขาย',
        drawerIcon: ({ color }) => <FaTachometerAlt color={color} size={24} />,
     
      }}
      component={Dashboard}
    />
    <Drawer.Screen
      name="Orders"
      options={{
        title: 'จัดการออเดอร์',
        drawerIcon: ({ color }) => <FaReceipt color={color} size={24} />,
      }}
      component={Orders}
    />
    <Drawer.Screen
      name="OrderDetail"
      options={{
        title: 'จัดการสินค้าในออเดอร์',
        drawerIcon: ({ color }) => <FaFileAlt color={color} size={24} />,
      }}
      component={OrderDetail}
    />
    <Drawer.Screen
      name="products"
      options={{
        title: 'เพิ่ม/แก้ไขสินค้า',
        drawerIcon: ({ color }) => <FaTags color={color} size={24} />,
      }}
      component={Products}
    />
    <Drawer.Screen
      name="CategoryScreen"
      options={{
        title: 'เพิ่ม/แก้ไขหมวดหมู่สินค้า',
        drawerIcon: ({ color }) => <FaThLarge color={color} size={24} />,
      }}
      component={CategoryScreen}
    />
    <Drawer.Screen
      name="Setting"
      options={{
        title: 'ตั้งค่า',
        drawerIcon: ({ color }) => <FaCog color={color} size={24} />,
      }}
      component={Setting}
    />
    <Drawer.Screen
      name="MemberRegister"
      options={{
        title: 'ลงทะเบียนสมาชิก',
        drawerIcon: ({ color }) => <FaUserPlus color={color} size={24} />,
      }}
      component={MemberRegister}
    />
  </Drawer.Navigator>
  );
};

export default DrawerLayout;