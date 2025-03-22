import React, { createContext, useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  show: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <View style={styles.toast}>
          <Text style={styles.text}>{message}</Text>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 16,
  },
});
