import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import { UserPlus } from "lucide-react-native";
import { signUp, confirmSignUp } from "aws-amplify/auth";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [userId, setUserId] = useState("");

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      console.log("Sign up result:", {
        isSignUpComplete,
        userId,
        nextStep,
      });

      if (!isSignUpComplete && nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setIsConfirming(true);
        setUserId(userId || "");
        setError("Please enter the confirmation code");
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = "Sign up failed.";

      if (error.name === "UsernameExistsException") {
        errorMessage = "This email is already registered.";
      } else if (error.name === "InvalidPasswordException") {
        errorMessage = "Invalid password format.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
    }
  };

  const handleConfirmSignUp = async () => {
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode,
      });

      if (isSignUpComplete) {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Confirmation code error:", error);
      let errorMessage = "Confirmation failed.";

      if (error.name === "CodeMismatchException") {
        errorMessage = "Invalid confirmation code.";
      } else if (error.name === "ExpiredCodeException") {
        errorMessage = "Confirmation code has expired.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserPlus size={48} color="#000" />
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Create an account</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {isConfirming && (
          <TextInput
            style={styles.input}
            placeholder="Confirmation Code"
            placeholderTextColor="#999"
            value={confirmationCode}
            onChangeText={setConfirmationCode}
            keyboardType="number-pad"
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={isConfirming ? handleConfirmSignUp : handleSignUp}
        >
          <Text style={styles.buttonText}>
            {isConfirming ? "Confirm" : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" style={styles.link}>
            <Text style={styles.linkText}>Login</Text>
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
