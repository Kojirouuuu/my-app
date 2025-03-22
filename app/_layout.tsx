import { useEffect } from "react";
import { Stack, Redirect, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { SplashScreen } from "expo-router";
import { AuthProvider, useAuth } from "@/../contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
// import { Amplify } from "aws-amplify";
// import awsconfig from "../src/aws-exports";

import React from "react";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Amplifyの設定
// Amplify.configure(awsconfig);

function RootLayoutNav() {
  useFrameworkReady();
  const { isAuthenticated, isLoading } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-Bold": Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ToastProvider>
  );
}
