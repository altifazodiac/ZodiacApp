import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Colors } from '../constants/Colors';  
import { useColorScheme } from '../hooks/useColorScheme'; 
import Login from './login';  
import Products from './products';  
import CategoryScreen from './CategoryScreen ';
import Orders from './Orders';
import OrderDetail from './OrderDetail';

const Drawer = createDrawerNavigator();

const DrawerLayout = () => {
  const colorScheme = useColorScheme();  

  return (
    <Drawer.Navigator  
      screenOptions={({ navigation }) => ({
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.toggleDrawer()}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="menu" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </Pressable>
        ),
      })}
    >
      
      <Drawer.Screen
        name="login"
        options={{
          title: 'Login',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={Login}  
      />
       <Drawer.Screen
        name="Orders"
        options={{
          title: 'Orders',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'menu' : 'menu-outline'} color={color} size={24} />
          ),
        }}
        component={Orders}  
      />
       <Drawer.Screen
        name="CategoryScreen "
        options={{
          title: 'Categories',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={CategoryScreen}  
      />
      <Drawer.Screen
        name="products"
        options={{
          title: 'Products',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={Products}  
      />
      <Drawer.Screen
        name="OrderDetail"
        options={{
          title: 'OrderDetail',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={OrderDetail}  
      />
    </Drawer.Navigator>
  );
};

export default DrawerLayout;
