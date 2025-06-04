import React, { useState } from "react";
import { View, Text, TextInput, ImageBackground, StyleSheet } from "react-native";
import { Button, Card } from "react-native-paper";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebaseConfig";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { doc, setDoc } from "firebase/firestore";

type RootStackParamList = {
  SignUp: undefined;
  Login: undefined;
  Home: undefined;
};

type SignUpScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "SignUp">;
  route: RouteProp<RootStackParamList, "SignUp">;
};

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bodyshopName, setBodyshopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        bodyshopName,
        contactName,
        phoneNumber,
        address,
        createdAt: new Date(),
      });

      navigation.replace("Home");
    } catch (error) {
      console.error("Signup Error:", error);
      alert("Failed to sign up.");
    }
  };

  return (
    <ImageBackground source={require("../screens/background.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.header}>Create Your Account</Text>

            <TextInput
              placeholder="Business Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#6C757D"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              placeholderTextColor="#6C757D"
            />
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              secureTextEntry
              placeholderTextColor="#6C757D"
            />
            <TextInput
              placeholder="Bodyshop Name"
              value={bodyshopName}
              onChangeText={setBodyshopName}
              style={styles.input}
              placeholderTextColor="#6C757D"
            />
            <TextInput
              placeholder="Contact Name"
              value={contactName}
              onChangeText={setContactName}
              style={styles.input}
              placeholderTextColor="#6C757D"
            />
            <TextInput
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={styles.input}
              keyboardType="phone-pad"
              placeholderTextColor="#6C757D"
            />
            <TextInput
              placeholder="Shop Address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
              placeholderTextColor="#6C757D"
            />

            <Button mode="contained" style={styles.button} onPress={handleSignup}>
              Sign Up
            </Button>
            <Button mode="text" style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
              Already have an account? Log In
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(75, 73, 73, 0.4)",
    padding: 20,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#023E8A",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#023E8A",
    fontSize: 16,
    marginBottom: 15,
    padding: 8,
    color: "#000",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#023E8A",
    borderRadius: 8,
  },
  loginButton: {
    marginTop: 15,
    textAlign: "center",
    color: "#023E8A",
  },
});

export default SignUpScreen;
