import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import { database } from "./firebase";
import { onValue, ref, set } from "firebase/database";
import { Picker } from "@react-native-picker/picker";

type OrderSettingsProps = {
  isPercentage: boolean;
  setIsPercentage: React.Dispatch<React.SetStateAction<boolean>>;
};

// Define the shape of the form state
type FormState = {
  general: {
    prePublishChecks: boolean;
    showMostUsedBlocks: boolean;
    containCursorInsideActiveBlock: boolean;
  };
  keyboardOptions: {
    containCursorInsideActiveBlock: boolean;
  };
  OrderPanels: {
    displaySize: boolean;
    displayDiscount: boolean;
    discountValue: number;
    displayTax: boolean;
    displayServiceCharge: boolean;
    serviceChargeValue: number;
    taxValue: number;
    largeimage: boolean;
    ordersListPaper: boolean;
    isPercentage?: boolean;
  };
  advancedPanels: {
    customFields: boolean;
    adSettings: boolean;
  };
};

// Define the specific keys of FormState
type PanelKey = keyof FormState;
type OptionKey<T extends PanelKey> = keyof FormState[T];

// Define the context type
type FormContextType = {
  formState: FormState;
  toggleOption: <T extends PanelKey>(panel: T, option: OptionKey<T>) => void;
  handleValueChange: <T extends PanelKey>(
    panel: T,
    option: OptionKey<T>,
    value: string
  ) => void;
};

// Set up the initial form state
const initialFormState: FormState = {
  general: {
    prePublishChecks: false,
    showMostUsedBlocks: false,
    containCursorInsideActiveBlock: false,
  },
  keyboardOptions: {
    containCursorInsideActiveBlock: false,
  },
  OrderPanels: {
    displaySize: false,
    displayDiscount: false,
    discountValue: 0,
    displayTax: false,
    taxValue: 0,
    displayServiceCharge: false,
    serviceChargeValue: 0,
    largeimage: false,
    ordersListPaper: false,
    isPercentage: false,
  },
  advancedPanels: {
    customFields: false,
    adSettings: false,
  },
};

// Create the FormContext
const FormContext = createContext<FormContextType | undefined>(undefined);

// Define the FormProvider component
type FormProviderProps = {
  children: ReactNode;
};
const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [formState, setFormState] = useState<FormState>(initialFormState);

  useEffect(() => {
    const settingsRef = ref(database, "settings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFormState(data as FormState);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleOption = <T extends PanelKey>(panel: T, option: OptionKey<T>) => {
    setFormState((prevState: FormState) => {
      const updatedValue = !prevState[panel][option];
      addToDatabase(panel, String(option), updatedValue);
      return {
        ...prevState,
        [panel]: {
          ...prevState[panel],
          [option]: updatedValue,
        },
      };
    });
  };

  const handleValueChange = <T extends PanelKey>(
    panel: T,
    option: OptionKey<T>,
    value: string
  ) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setFormState((prevState: FormState) => ({
        ...prevState,
        [panel]: {
          ...prevState[panel],
          [option]: numericValue,
        },
      }));
      addToDatabase(panel, String(option), numericValue);
    }
  };

  return (
    <FormContext.Provider
      value={{ formState, toggleOption, handleValueChange }}
    >
      {children}
    </FormContext.Provider>
  );
};

const addToDatabase = (
  panel: string,
  option: string,
  value: boolean | number
) => {
  set(ref(database, `settings/${panel}/${option}`), value)
    .then(() => {
      console.log("Data successfully written to Firebase!");
    })
    .catch((error: Error) => {
      console.error("Error writing data to Firebase: ", error);
    });
};

// OrderSettings component
const OrderSettings: React.FC<{
  isPercentage: boolean;
  setIsPercentage: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ isPercentage, setIsPercentage }) => {
  const { formState, toggleOption, handleValueChange } =
    useContext(FormContext)!;
  const [selectedValue, setSelectedValue] = useState<number | string>("");
  const [selectedServiceCharge, setSelectedServiceCharge] = useState<
    number | string
  >("");
  const [taxModalVisible, setTaxModalVisible] = useState(false);
  const [serviceChargeModalVisible, setServiceChargeModalVisible] =
    useState(false);

  useEffect(() => {
    if (formState.OrderPanels.displayTax) {
      handleValueChange("OrderPanels", "taxValue", String(selectedValue));
    }
  }, [selectedValue]);

  useEffect(() => {
    handleValueChange(
      "OrderPanels",
      "serviceChargeValue",
      String(selectedServiceCharge)
    );
  }, [selectedServiceCharge]);
  
  const handleTaxValueChange = (value: number) => {
    const newValue = isPercentage ? value / 100 : value;
    if (!isNaN(newValue)) {
      handleValueChange("OrderPanels", "taxValue", String(newValue));
    }
  };

  const handleServiceChargeChange = (value: number) => {
    const newValue = isPercentage ? value / 100 : value;
    if (!isNaN(newValue)) {
      handleValueChange("OrderPanels", "serviceChargeValue", String(newValue));
    }
  };

  const generateDropdownItems = () => {
    return Array.from({ length: 101 }, (_, i) => (
      <Picker.Item key={i} label={`${i}%`} value={i / 100} />
    ));
  };
  
  const toggleSwitch = () => {
    const newIsPercentage = !isPercentage;
    setIsPercentage(newIsPercentage);
  
    // Update state only within events or `useEffect`
    handleValueChange("OrderPanels", "isPercentage", newIsPercentage ? "1" : "0");
    addToDatabase("OrderPanels", "isPercentage", newIsPercentage);
  };

  // Toggle the modal when the service charge Switch is turned on
  const handleServiceChargeToggle = () => {
    toggleOption("OrderPanels", "displayServiceCharge");
    setServiceChargeModalVisible(!formState.OrderPanels.displayServiceCharge);
  };
  const handleTaxToggle = () => {
    toggleOption("OrderPanels", "displayTax");
    setTaxModalVisible(!formState.OrderPanels.displayTax);
  };

  // Sync selectedServiceCharge state with formState
  useEffect(() => {
    setSelectedServiceCharge(formState.OrderPanels.serviceChargeValue);
  }, [formState.OrderPanels.serviceChargeValue]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Order Setting</Text>
          <View style={styles.underlinedGroup}>
            <View style={styles.option}>
              <Text>Display Size</Text>
              <Switch
                value={formState.OrderPanels.displaySize}
                onValueChange={() => toggleOption("OrderPanels", "displaySize")}
              />
            </View>
          </View>
          <View style={styles.underlinedGroup}>
            <View style={styles.option}>
              <Text>Display Discount</Text>
              <Switch
                value={formState.OrderPanels.displayDiscount}
                onValueChange={() =>
                  toggleOption("OrderPanels", "displayDiscount")
                }
              />
            </View>
            {formState.OrderPanels.displayDiscount && (
              <View style={styles.underlinedGroup}>
                <View style={styles.option}>
                  <Text style={styles.optionLabel}>
                    Discount Value {isPercentage ? "Percentage (%)" : "Amount (฿)"}
                  </Text>
                  <View style={styles.discountContainer}>
                    <TextInput
                      style={styles.discountInput}
                      keyboardType="numeric"
                      value={(
                        formState.OrderPanels.discountValue ?? 0
                      ).toString()}
                      onChangeText={(value) =>
                        handleValueChange("OrderPanels", "discountValue", value)
                      }
                      placeholder="Enter discount"
                      placeholderTextColor="#888"
                    />
                     
                    <TouchableOpacity
                      style={styles.switchContainer}
                      onPress={toggleSwitch}
                    >
                      <View
                        style={[
                          styles.switchBackground,
                          isPercentage ? styles.rightActive : styles.leftActive,
                        ]}
                      />
                      <Text
                        style={[
                          styles.label,
                          !isPercentage && styles.activeLabel,
                        ]}
                      >
                        ฿
                      </Text>
                      <Text
                        style={[
                          styles.label,
                          isPercentage && styles.activeLabel,
                        ]}
                      >
                        %
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
           <View style={styles.underlinedGroup}>
            <View style={styles.option}>
            <Text>Display Tax  {`(${(formState.OrderPanels.taxValue * 100).toFixed(0)}%)`}</Text>
              <View style={styles.discountContainer}>
                <TextInput
                   style={[styles.Input,{width:0}]}
                  value={formState.OrderPanels.taxValue.toString()}
                  readOnly={!formState.OrderPanels.displayTax}
                 
                />
                <Switch
                  value={formState.OrderPanels.displayTax}
                  onValueChange={handleTaxToggle}
                />
              </View>
            </View>
            <Modal
          transparent={true}
          visible={taxModalVisible}
          animationType="slide"
          onRequestClose={() => setTaxModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Tax Value</Text>
              <Picker
                selectedValue={formState.OrderPanels.taxValue}
                style={styles.dropdown}
                onValueChange={(itemValue) =>
                  handleTaxValueChange(Number(itemValue))
                }
              >
                {generateDropdownItems()}
              </Picker>
              <TouchableOpacity onPress={() => setTaxModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
          </View>
          <View style={styles.underlinedGroup}>
            <View style={styles.option}>
              <Text>Display Service Charge  {`(${(formState.OrderPanels.serviceChargeValue * 100).toFixed(0)}%)`}</Text>
              <View style={styles.discountContainer}>
                <TextInput
                  style={[styles.Input,{width:0}]}
                  value={formState.OrderPanels.serviceChargeValue.toString()}
                  readOnly={!formState.OrderPanels.displayServiceCharge}
                  
                />
                <Switch
                  value={formState.OrderPanels.displayServiceCharge}
                  onValueChange={handleServiceChargeToggle}
                />
              </View>
            </View>
            <Modal
          transparent={true}
          visible={serviceChargeModalVisible}
          animationType="slide"
          onRequestClose={() => setServiceChargeModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Service Charge</Text>
              <Picker
                selectedValue={formState.OrderPanels.serviceChargeValue}
                style={styles.dropdown}
                onValueChange={(itemValue) =>
                  handleServiceChargeChange(Number(itemValue))
                }
              >
                {generateDropdownItems()}
              </Picker>
              <TouchableOpacity onPress={() => setServiceChargeModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
          </View>
          <View style={styles.underlinedGroup}>
            <View style={styles.option}>
              <Text>Large image</Text>
              <Switch
                value={formState.OrderPanels.largeimage}
                onValueChange={() => toggleOption("OrderPanels", "largeimage")}
              />
            </View>
          </View>
          <View style={styles.underlinedGroup}>
            <View style={styles.option}>
              <Text>Orders List Paper</Text>
              <Switch
                value={formState.OrderPanels.ordersListPaper}
                onValueChange={() =>
                  toggleOption("OrderPanels", "ordersListPaper")
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  panel: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#6a1b9a",
    paddingHorizontal: "5%",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: "5%",
  },
  input: {

  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  discountContainer: {
    flexDirection: "row",
  },
  Input:{
    fontSize: 14,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  discountInput: {
    fontSize: 14,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
    width: 100,
    textAlign: "center",
  },

  underlinedGroup: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    marginTop: 10,
  },
  switchContainer: {
    flexDirection: "row",
    width: 60,
    height: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  switchBackground: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#9969c7",
    borderRadius: 20,
  },
  leftActive: {
    left: 0,
  },
  rightActive: {
    right: 0,
  },
  label: {
    fontFamily: "GoogleSans",
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#888",
    zIndex: 1,
  },
  activeLabel: {
    color: "#fff",
    fontWeight: "bold",
  },
  unitLabel: {
    fontFamily: "GoogleSans",
    fontWeight: "800",
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginRight: 22,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 20,
    padding: 5,
    fontSize: 14,
    width: 150,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  closeButton: {
     width:100,
     fontFamily: "GoogleSans",
     fontSize: 16,
     color: "#fff",
     fontWeight: "bold",
     marginBottom: 10,
   height: 30,
     backgroundColor: "#9969c7",
     borderRadius: 20,
     paddingVertical: 5,
  marginTop: 15,
  textAlign: "center",
     
  },
});
const Setting: React.FC = () => {
  // Ensure Setting is defined as a React.FC
  const [isPercentage, setIsPercentage] = React.useState(false);

  return (
    <FormProvider>
      <OrderSettings
        isPercentage={isPercentage}
        setIsPercentage={setIsPercentage}
      />
    </FormProvider>
  );
};

export default Setting; 