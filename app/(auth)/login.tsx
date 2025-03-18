import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import { LogIn } from "lucide-react-native";
import { signIn } from "aws-amplify/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { isAuthenticated, checkAuthState } = useAuth();

  useEffect(() => {
    checkAuthState();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    try {
      // Input validation
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      console.log("Attempting login with:", { email });

      // Basic authentication flow
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      });

      console.log("Sign in result:", { isSignedIn });
      console.log("Next step:", { nextStep });

      if (isSignedIn) {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Login error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      // Set error message
      let errorMessage = "Login failed.";

      if (error.name === "UserNotConfirmedException") {
        errorMessage =
          "Please verify your email address. Check your email for a confirmation link.";
      } else if (error.name === "NotAuthorizedException") {
        errorMessage = "Incorrect email or password.";
      } else if (error.name === "UserNotFoundException") {
        errorMessage = "This email address is not registered.";
      } else if (error.name === "InvalidParameterException") {
        errorMessage = "Invalid input. Please check your entries.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LogIn size={48} color="#000" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={() => handleLogin()}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to the app?</Text>
          <Link href="/signup" style={styles.link}>
            <Text style={styles.linkText}>Create Account</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 50,
  },
  title: {
    fontFamily: "Inter-Bold",
    fontSize: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  button: {
    height: 50,
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-Bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontFamily: "Inter-Regular",
    color: "#666",
  },
  link: {
    marginLeft: 4,
  },
  linkText: {
    fontFamily: "Inter-Bold",
    color: "#000",
  },
  error: {
    color: "red",
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
});
