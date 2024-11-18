import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

interface EditNoteModalProps {
    visible: boolean;
    customInput: string;
    productName: string | null;
    onSave: (input: string) => void;
    onClose: () => void;
    onChangeText: (text: string) => void; // Add this line
  }
  

const EditNoteModal: React.FC<EditNoteModalProps> = ({
  visible,
  customInput,
  productName,
  onSave,
  onClose,
}) => {
  const [inputText, setInputText] = useState<string>(customInput); // Initialize with customInput
  const maxLength = 40;

  useEffect(() => {
    setInputText(customInput); // Sync local state when customInput changes
  }, [customInput]);

  const validateInputText = (text: string): boolean => {
    const validPattern = /^[a-zA-Z0-9\u0E00-\u0E7F\s.,'-]*$/; // Allow Thai, English, numbers, spaces, and punctuation

    if (text.length > maxLength) {
      alert(`Input is too long. Maximum length is ${maxLength} characters.`);
      return false;
    }
    if (!validPattern.test(text)) {
      alert('Input contains invalid characters.');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateInputText(inputText)) return;
    onSave(inputText);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <Text>Note for {productName}</Text>
        <View style={styles.charCountContainer}>
          <Text style={styles.charCount}>
            {inputText.length}/{maxLength}
          </Text>
          <View style={styles.textInputContainer}>
  <TextInput
    style={styles.textInput}
    value={inputText}
    onChangeText={(text) => {
      if (validateInputText(text)) setInputText(text);
    }}
    placeholder="Enter a note"
    maxLength={maxLength}
  />
  {inputText.length > 0 && (
    <TouchableOpacity style={styles.clearButton} onPress={() => setInputText('')}>
      <Text style={styles.clearButtonText}>✕</Text>
    </TouchableOpacity>
  )}
</View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleSave}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const isMobile = false;
const { width, height } = Dimensions.get("window");
const isLandscape = width > height; // Check if the screen is in landscape mode
const isTablet = width > 600; // Assume tablet view if width > 600
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    position: 'relative',
    width: '80%', // Match TextInput width
  },
  textInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingRight: 40, // Add padding to make space for the clear button
    textAlign: 'center',
    marginBottom: 10,
  },
  clearButton: {
    position: 'absolute',
    right: 10, // Position on the right inside TextInput
    top: '50%',
    transform: [{ translateY: -10 }], // Center vertically
    backgroundColor: '#ddd',
    borderRadius: 10,
    padding: 5,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: '#3a5565',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '45%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#cccccc',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '45%',
    height: 40,
     
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
  },
  charCountContainer: {
    width: '100%',
    alignItems: 'center',
  },
  charCount: {
   textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    
     
  },
});

export default EditNoteModal;
