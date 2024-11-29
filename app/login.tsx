import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Checkbox } from "react-native-paper";
import { theme } from "../components/theme";

export default function App() {
  const [isRemember, setIsRemember] = React.useState(false);
  const [blurIntensity, setBlurIntensity] = React.useState(50);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const componentAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.4)).current; // Initial scale value

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1, // Final scale value
      duration: 400, // Animation duration in milliseconds
      useNativeDriver: true, // Enable native driver for better performance
      easing: Easing.bezier(0.39, 0.575, 0.565, 1.0), // Use Easing directly
    }).start();
  }, []);
  useEffect(() => {
    // Step 1: Animate the LoginBox (fade and slide up)
    
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
      // Step 2: Animate the TextInputs (fade and slide up sequentially)
      Animated.timing(componentAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        // Step 3: Animate the Button (scale and slide up)
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.elastic(1.5)),
          useNativeDriver: true,
        }).start();
      });
    });

    // Step 4: Border Animation (independent loop)
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const increaseBlur = () => {
    setBlurIntensity(80);
  };

  const resetBlur = () => {
    setBlurIntensity(50);
  };

  // Interpolated border animation
  const borderAnimation = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"], // Animate the gradient position
  });

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
        style={[
          styles.logo,
          {
            transform: [{ scaleX: scaleAnim }], // Horizontal scale animation
          },
        ]}
      >
        ZODIAC POS APPLICATION
      </Animated.Text>
  

      {/* Animated Border Overlay */}
      <Animated.View
        style={[
          styles.borderContainer,
          {
            transform: [{ scaleX: scaleAnim }], // Horizontal scale animation
          },
        ]}
      >
        <Animated.View
          style={[
            styles.animatedBorder,
            {
              borderColor: borderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#2c3e50", "#1e90ff"], // Change between two colors
              }),
            },
          ]}
        />
        {/* Login Box */}
        <View style={styles.loginBox}>
          <Text style={[styles.loginHeader, { color: "#2c3e50" }]}>Log in</Text>
          <Text style={styles.loginSubheader}>
            Welcome to Zodiac Pos, please login
          </Text>

          {/* Staggered Child Components */}
          <Animated.View
            style={{
              opacity: componentAnim,
              transform: [
                {
                  translateY: componentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0], // Slide from below
                  }),
                },
              ],
            }}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: componentAnim,
              transform: [
                {
                  translateY: componentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
          </Animated.View>

          <View style={styles.optionsContainer}>
            <View style={styles.rememberMe}>
              <View style={styles.checkboxContainer}>
              <Checkbox  
                status={isRemember ? "checked" : "unchecked"}
                onPress={() => setIsRemember(!isRemember)}
                color="#2c3e50" 
              />
              </View>
              <Text style={styles.rememberText}>Remember</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={{
              opacity: componentAnim, // Button fades in with componentAnim
              transform: [
                { scale: buttonScale }, // Scale effect
                {
                  translateY: componentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0], // Slide from below
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.continueButton}
              onPressIn={increaseBlur}
              onPressOut={resetBlur}
            >
              <Text style={styles.continueButtonText}>Log In</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.signupText}>
            Don’t have an account?{" "}
            <Text style={styles.signupLink}>Sign-up</Text>
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
    width:200,
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
