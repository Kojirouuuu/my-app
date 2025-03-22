import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
}

export function Toast({ message, type }: ToastProps) {
  const backgroundColor = {
    success: "#4CAF50",
    error: "#f44336",
    info: "#2196F3",
  }[type];

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
