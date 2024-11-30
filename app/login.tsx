import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Checkbox } from "react-native-paper";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRemember, setIsRemember] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(50);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const componentAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const easingConfig = useMemo(
    () => Easing.bezier(0.39, 0.575, 0.565, 1.0),
    []
  );
  const navigation: NavigationProp<any> = useNavigation();

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: easingConfig,
    }).start();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.elastic(1.5),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.bezier(0.42, 0, 0.58, 1)),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(componentAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.elastic(1.5)),
          useNativeDriver: true,
        }).start();
      });
    });

    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Invalid email address.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleLogin = () => {
    if (!validateInputs()) return;

    const auth = getAuth();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
       // Alert.alert("Success", `Welcome back, ${user.email}!`);
        navigation.navigate("Passcode"); // Navigate to the Home screen
      })
      .catch((error) => {
        console.error("Login Error:", error); // Log the error
        const errorMessage = error.message || "Login failed. Try again.";
        Alert.alert("Error", errorMessage);
      });
  };
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#eeeeee", "#cccccc"]}
        style={StyleSheet.absoluteFillObject}
      />
      <BlurView
        intensity={blurIntensity}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.Text
        style={[styles.logo, { transform: [{ scaleX: scaleAnim }] }]}
      >
        ZODIAC POS APPLICATION
      </Animated.Text>
      <Animated.View
        style={[styles.borderContainer, { transform: [{ scaleX: scaleAnim }] }]}
      >
        <Animated.View
          style={[
            styles.animatedBorder,
            {
              borderColor: borderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#2c3e50", "#1e90ff"],
              }),
            },
          ]}
        />
        <View style={styles.loginBox}>
          <Text style={styles.loginHeader}>Log in</Text>
          <Text style={styles.loginSubheader}>
            Welcome to Zodiac POS, please login
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              console.log("Setting Email:", text); // Debugging line
              setEmail(text);
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              console.log("Setting Password:", text); // Debugging line
              setPassword(text);
            }}
          />
          <View style={styles.optionsContainer}>
            <View style={styles.rememberMe}>
              <Checkbox
                status={isRemember ? "checked" : "unchecked"}
                onPress={() => setIsRemember(!isRemember)}
                color="#2c3e50"
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.continueButton} onPress={handleLogin}>
            <Text style={styles.continueButtonText}>Log In</Text>
          </TouchableOpacity>
          <Text style={styles.signupText}>
            Don’t have an account?{" "}
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.signupLink}>Sign-up</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 28,

    fontWeight: "bold",
    marginBottom: 40,
  },
  borderContainer: {
    position: "relative",
    width: 300,
    height: 400, // Match the login box dimensions
  },
  animatedBorder: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16, // Match the login box
    borderWidth: 2,
    borderColor: "transparent",
  },
  loginBox: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  loginHeader: {
    fontFamily: "GoogleSans",
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 10,
  },
  loginSubheader: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  input: {
    fontFamily: "GoogleSans",
    borderColor: "#ddd",
    borderWidth: 1,
    color: "#2c3e50",
    borderRadius: 40,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    width: 200,
    marginBottom: 15,
  },
  optionsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxContainer: {
    backgroundColor: "#eeeeee",
    borderRadius: 20,
    marginRight: 5,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    fontFamily: "GoogleSans",
    color: "gray",
  },
  forgotPassword: {
    fontFamily: "GoogleSans",
    color: "gray",
  },
  continueButton: {
    backgroundColor: "#2c3e50",
    width: 200,
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
  },
  continueButtonText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  signupText: {
    fontFamily: "GoogleSans",
    color: "#aaa",
    fontSize: 14,
  },
  signupLink: {
    fontFamily: "GoogleSans",
    color: "#2c3e50",
    fontWeight: "600",
  },
});
