import { useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { router } from "expo-router";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.warn("User is not logged in");
        setIsAuthenticated(false);
        router.replace("/login");
        return;
      }
      console.log("Authenticated user:", user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("getCurrentUser error:", error);
      setIsAuthenticated(false);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isAuthenticated };
}
