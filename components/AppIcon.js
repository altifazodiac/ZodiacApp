// src/components/AppIcon.js
import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AppIcon = ({ name, size, color }) => {
  const [WebIcon, setWebIcon] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Dynamically import only when on web
      import('react-icons/io5').then(io5 => {
        const iconMap = {
          'home': io5.IoHome,
          'home-outline': io5.IoHomeOutline,
          'menu': io5.IoMenu,
          'menu-outline': io5.IoMenuOutline,
          'log-in': io5.IoLogIn,
          'log-in-outline': io5.IoLogInOutline,
          'settings': io5.IoSettings,
          'settings-outline': io5.IoSettingsOutline,
          'list': io5.IoList,
          'list-outline': io5.IoListOutline,
          'cube': io5.IoCube,
          'cube-outline': io5.IoCubeOutline,
          'cart': io5.IoCart,
          'cart-outline': io5.IoCartOutline,
          'login': io5.IoLogIn,
          'log-out': io5.IoLogOut,
          'log-out-outline': io5.IoLogOutOutline,
          'heart': io5.IoHeart,
          'time': io5.IoTime,
          'search': io5.IoSearch,
          'calendar': io5.IoCalendar,
          'person': io5.IoPerson,
          'person-outline': io5.IoPersonOutline,
          'checkmark': io5.IoCheckmark,
          'trash': io5.IoTrash,
          
        };
        
        const matchedIcon = iconMap[name];
        if (matchedIcon) {
          setWebIcon(() => matchedIcon);
        }
      }).catch(() => {
        console.warn('react-icons failed to load, using fallback');
      });
    }
  }, [name]);

  if (Platform.OS === 'web') {
    if (WebIcon) {
      return <WebIcon size={size} color={color} />;
    }
    return (
      <span style={{ fontSize: size, color }}>
        {name.includes('outline') ? '[O]' : '[•]'}
      </span>
    );
  }

  return <Ionicons name={name} size={size} color={color} />;
};

export default AppIcon;