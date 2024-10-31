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
    } else {
      console.warn(`Invalid value for ${panel}.${String(option)}:`, value);
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
const OrderSettings: React.FC<OrderSettingsProps> = ({
  isPercentage,
  setIsPercentage,
}) => {
  const context = useContext(FormContext);
  const [selectedValue, setSelectedValue] = useState<number | string>("");
  const { formState, toggleOption, handleValueChange } = context!;

  useEffect(() => {
    
    handleValueChange("OrderPanels", "taxValue", String(selectedValue));
  }, [selectedValue]);

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

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Order Setting</Text>

          <View style={styles.option}>
            <Text>Display Size</Text>
            <Switch
              value={formState.OrderPanels.displaySize}
              onValueChange={() => toggleOption("OrderPanels", "displaySize")}
            />
          </View>

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
            <View style={styles.option}>
              <Text style={styles.optionLabel}>Discount Value</Text>
              <View style={styles.discountContainer}>
                <TextInput
                  style={styles.discountInput}
                  keyboardType="numeric"
                  value={(formState.OrderPanels.discountValue ?? 0).toString()}
                  onChangeText={(value) =>
                    handleValueChange("OrderPanels", "discountValue", value)
                  }
                  placeholder="Enter discount"
                  placeholderTextColor="#888"
                />
                <Text style={styles.unitLabel}>{isPercentage ? "%" : "฿"}</Text>
                <Switch
                  value={isPercentage}
                  onValueChange={setIsPercentage}
                  trackColor={{ false: "#9969c7", true: "#4CAF50" }}
                  thumbColor={isPercentage ? "#FFEB3B" : "#f4f3f4"}
                />
                
              </View>
            </View>
          )}

          <View style={styles.option}>
            <Text>Display Tax</Text>
            <Switch
              value={formState.OrderPanels.displayTax}
              onValueChange={() => toggleOption("OrderPanels", "displayTax")}
            />
          </View>
          {formState.OrderPanels.displayTax && (
            <View style={styles.option}>
              <Text>Tax Value (%)</Text>
              <Picker
                selectedValue={formState.OrderPanels.taxValue}
                style={styles.dropdown}
                onValueChange={(itemValue) => handleTaxValueChange(Number(itemValue))}
              >
                {generateDropdownItems()}
              </Picker>
            </View>
          )}
        <View style={styles.option}>
            <Text>Display Service Charge</Text>
            <Switch
              value={formState.OrderPanels.displayServiceCharge}
              onValueChange={() =>
                toggleOption("OrderPanels", "displayServiceCharge")
              }
            />
          </View>
          {formState.OrderPanels.displayServiceCharge && (
            <View style={styles.option}>
              <Text>Service Charge (%)</Text>
              <Picker
                selectedValue={formState.OrderPanels.serviceChargeValue}
                style={styles.dropdown}
                onValueChange={(itemValue) =>
                  handleServiceChargeChange(Number(itemValue)) 
                }
              >
                {generateDropdownItems()}
              </Picker>
            </View>
          )}
          <View style={styles.option}>
            <Text>Large image</Text>
            <Switch
              value={formState.OrderPanels.largeimage}
              onValueChange={() => toggleOption("OrderPanels", "largeimage")}
            />
          </View>

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
    fontSize: 18,
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
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    width: 80,
    textAlign: "center",
    borderRadius: 20,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 5,
    width: 80,
    textAlign: "center",
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
    alignItems: "center",
  },
  discountInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 10,
    width: 80,
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
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

export default Setting; // Ensure Setting is the default export
