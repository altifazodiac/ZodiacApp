// components/Clock.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Easing } from "react-native";

const Clock = React.memo(() => {
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [second, setSecond] = useState("");

  const fadeAnimHour = useRef(new Animated.Value(1)).current;
  const fadeAnimMinute = useRef(new Animated.Value(1)).current;
  const fadeAnimSecond = useRef(new Animated.Value(1)).current;

  const translateYAnimHour = useRef(new Animated.Value(0)).current;
  const translateYAnimMinute = useRef(new Animated.Value(0)).current;
  const translateYAnimSecond = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const newHour = date
        .toLocaleString("en-US", { hour: "2-digit", hour12: false })
        .padStart(2, "0");
      const newMinute = date
        .toLocaleString("en-US", { minute: "2-digit" })
        .padStart(2, "0");
      const newSecond = date
        .toLocaleString("en-US", { second: "2-digit" })
        .padStart(2, "0");

      if (newHour !== hour) {
        animateChange(fadeAnimHour, translateYAnimHour, () =>
          setHour(newHour)
        );
      }
      if (newMinute !== minute) {
        animateChange(fadeAnimMinute, translateYAnimMinute, () =>
          setMinute(newMinute)
        );
      }
      if (newSecond !== second) {
        animateChange(fadeAnimSecond, translateYAnimSecond, () =>
          setSecond(newSecond)
        );
      }
    };

    updateTime(); // Initial call
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [hour, minute, second]);

  const animateChange = (
    fadeAnim: Animated.Value,
    translateYAnim: Animated.Value,
    setTime: () => void
  ) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -10,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTime();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <View style={styles.timeContainer}>
      <Animated.Text
        style={[
          styles.timeText,
          { opacity: fadeAnimHour, transform: [{ translateY: translateYAnimHour }] },
        ]}
      >
        {hour}
      </Animated.Text>
      <Text style={styles.timeSeparator}>:</Text>
      <Animated.Text
        style={[
          styles.timeText,
          { opacity: fadeAnimMinute, transform: [{ translateY: translateYAnimMinute }] },
        ]}
      >
        {minute}
      </Animated.Text>
      <Text style={styles.timeSeparator}>:</Text>
      <Animated.Text
        style={[
          styles.timeText,
          { opacity: fadeAnimSecond, transform: [{ translateY: translateYAnimSecond }] },
        ]}
      >
        {second}
      </Animated.Text>
    </View>
  );
});

// นำ StyleSheet ออกมาแยกใน Clock.tsx
const styles = StyleSheet.create({
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: "#606060",
  },
  timeSeparator: {
    fontSize: 14,
    marginHorizontal: 2,
    color: "#606060",
  },
});

export default Clock;