import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerText}>Freeform</Text>

      {/* List of Options */}
      <View style={styles.listItem}>
        <View style={styles.listLeft}>
          <Icon name="folder" size={30} color="#007AFF" />
          <Text style={styles.listText}>บอร์ดทั้งหมด</Text>
        </View>
        <Text style={styles.listNumber}>0</Text>
        <Icon name="chevron-right" size={20} color="#000" />
      </View>

      <View style={styles.listItem}>
        <View style={styles.listLeft}>
          <Icon name="clock-o" size={30} color="#FFA500" />
          <Text style={styles.listText}>ล่าสุด</Text>
        </View>
        <Text style={styles.listNumber}>0</Text>
        <Icon name="chevron-right" size={20} color="#000" />
      </View>

      <View style={styles.listItem}>
        <View style={styles.listLeft}>
          <Icon name="users" size={30} color="#007AFF" />
          <Text style={styles.listText}>แชร์อยู่</Text>
        </View>
        <Text style={styles.listNumber}>0</Text>
        <Icon name="chevron-right" size={20} color="#000" />
      </View>

      <View style={styles.listItem}>
        <View style={styles.listLeft}>
          <Icon name="heart" size={30} color="#FF4500" />
          <Text style={styles.listText}>รายการโปรด</Text>
        </View>
        <Text style={styles.listNumber}>0</Text>
        <Icon name="chevron-right" size={20} color="#000" />
      </View>

      {/* Bottom Button */}
      <TouchableOpacity style={styles.bottomButton}>
        <Icon name="pencil" size={20} color="#007AFF" />
        <Text style={styles.bottomButtonText}>บอร์ดใหม่</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listText: {
    fontSize: 18,
    marginLeft: 10,
    color: '#000',
  },
  listNumber: {
    fontSize: 18,
    color: '#000',
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  bottomButtonText: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 10,
  },
});