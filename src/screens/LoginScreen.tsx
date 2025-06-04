import React, { useState } from "react";
import { View, Text, TextInput, Image, ImageBackground, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Button, Card } from "react-native-paper";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

// Navigation types
type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Login">;
  route: RouteProp<RootStackParamList, "Login">;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("Home");
    } catch (error: any) {
      console.error("Firebase Login Error:", error);

      if (error.code === "auth/invalid-email") {
        alert("Invalid email format.");
      } else if (error.code === "auth/user-not-found") {
        alert("No user found with this email.");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } else {
        alert("Login failed: " + error.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Missing Email", "Please enter your email to receive reset instructions.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Password Reset Sent", "Please check your inbox.");
    } catch (error: any) {
      console.error("Reset Error:", error);
      Alert.alert("Error", error.message || "Failed to send password reset email.");
    }
  };

  return (
    <ImageBackground source={require("../screens/background.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <Image source={require("../screens/NCALogo.png")} style={styles.logo} resizeMode="contain" />

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.header}>Login</Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#6C757D"
            />

            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#6C757D"
            />

            {/* Forgot Password Link */}
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button mode="contained" style={styles.button} onPress={handleLogin}>
              Log In
            </Button>

            <Button mode="outlined" style={styles.signupButton} labelStyle={styles.signupLabel} onPress={() => navigation.navigate("SignUp")}
>
  Sign Up
</Button>

          </Card.Content>
        </Card>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: "rgba(75, 73, 73, 0.4)",
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  header: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    fontSize: 16,
    marginBottom: 12,
    padding: 8,
    color: "#000",
  },
  forgotText: {
    color: "#000000",
    textAlign: "right",
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    marginTop: 5,
    backgroundColor: "#000000",
    borderRadius: 3,
  },
  signupButton: {
    marginTop: 10,
    borderColor: "#000000",
    borderWidth: 1,
    borderRadius: 3,
    color: "#000000",
  },
  signupLabel: {
  color: "#000000",
  fontWeight: "bold",
},

});

export default LoginScreen;
