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
import DisplayPasscode from './DisplayPasscodeScreen';
import Dashboard from './Dashboard';
import Icon from "react-native-vector-icons/Ionicons"; 

const Drawer = createDrawerNavigator();

const DrawerLayout = () => {
  const colorScheme = useColorScheme();  

  return (
    <Drawer.Navigator  
      initialRouteName="Dashboard"
      screenOptions={({ navigation }) => ({
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.toggleDrawer()}
            style={{ marginLeft: 10 }}
          >
            <Icon name="menu" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </Pressable>
        ),
      })}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, focused }) => (
            <Icon name="speedometer-outline" color={color} size={24} />
          ),
        }}
        component={Dashboard}
      />

      <Drawer.Screen
        name="Orders"
        options={{
          title: 'Orders',
          drawerIcon: ({ color, focused }) => (
            <Icon name="receipt-outline" color={color} size={24} />
          ),
        }}
        component={Orders}
      />

      <Drawer.Screen
        name="OrderDetail"
        options={{
          title: 'Order Detail',
          drawerIcon: ({ color, focused }) => (
            <Icon name="document-text-outline" color={color} size={24} />
          ),
        }}
        component={OrderDetail}
      />

      <Drawer.Screen
        name="products"
        options={{
          title: 'Products',
          drawerIcon: ({ color, focused }) => (
            <Icon name="pricetags-outline" color={color} size={24} />
          ),
        }}
        component={Products}
      />

      <Drawer.Screen
        name="CategoryScreen"
        options={{
          title: 'Categories',
          drawerIcon: ({ color, focused }) => (
            <Icon name="apps-outline" color={color} size={24} />
          ),
        }}
        component={CategoryScreen}
      />

      <Drawer.Screen
        name="Setting"
        options={{
          title: 'Setting',
          drawerIcon: ({ color, focused }) => (
            <Icon name="settings-outline" color={color} size={24} />
          ),
        }}
        component={Setting}
      />

      <Drawer.Screen
        name="MemberRegister"
        options={{
          title: 'Member Register',
          drawerIcon: ({ color, focused }) => (
            <Icon name="person-add-outline" color={color} size={24} />
          ),
        }}
        component={MemberRegister}
      />

      {/* เอาหน้า Passcode และ CreatePasscode ออกจาก Drawer */}
    </Drawer.Navigator>
  );
};

export default DrawerLayout;