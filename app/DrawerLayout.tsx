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
import Setting from './Setting';
import MemberRegister from './MemberRegister';
import Passcode from './Passcode';
import SignUp from './SignUp';
import CreatePasscode from './CreatePasscode';
import DisplayPasscode from './DisplayPasscodeScreen';
 

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
        name="DisplayPasscodesScreen"
        options={{
          title: 'DisplayPasscodesScreen',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={DisplayPasscode}  
      />
          <Drawer.Screen
  name="SignUp"
  options={{
    title: 'Sign Up',
    drawerIcon: ({ color, focused }) => (
      <Ionicons name={focused ? 'log-in' : 'log-in-outline'} color={color} size={24} />
    ),
  }}
  component={SignUp}
/>
<Drawer.Screen
        name="CreatePasscode"
        options={{
          title: 'Create Passcode',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={CreatePasscode}  
      />
       <Drawer.Screen
        name="Passcode"
        options={{
          title: 'Passcode',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
        component={Passcode}  
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
       <Drawer.Screen
        name="Setting"
        options={{
          title: 'Setting',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={24} />
          ),
        }}
        component={Setting}  
      />
       <Drawer.Screen
        name="MemberRegister"
        options={{
          title: 'MemberRegister',
          drawerIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'log-in' : 'log-in-outline'} color={color} size={24} />
          ),
        }}
        component={MemberRegister}  
      />
    </Drawer.Navigator>
    
  );
};

export default DrawerLayout;
