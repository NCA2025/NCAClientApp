// /screens/PaymentScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebaseConfig";

const PaymentScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);

  const fetchPaymentSheetParams = async (user: any) => {
  try {
    const idToken = await user.getIdToken(true);
    console.log("🔑 Firebase ID Token:", idToken); // <- Copy this from your logs

   const response = await fetch("https://createpaymentintent-mog3fenz3a-uc.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ amount: 5000 }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Server error: ${error}`);
    }

    const { paymentIntent, ephemeralKey, customer } = await response.json();
    return { paymentIntent, ephemeralKey, customer };
  } catch (error: any) {
    console.error("❌ fetchPaymentSheetParams error:", error);
    Alert.alert("Error", error.message || "Failed to fetch payment parameters.");
    return null;
  }
};



  const initializePaymentSheet = async (user: any) => {
    setLoading(true);

    const paymentSheetParams = await fetchPaymentSheetParams(user);
    if (!paymentSheetParams) {
      setLoading(false);
      return;
    }

    const { paymentIntent, ephemeralKey, customer } = paymentSheetParams;
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: paymentIntent,
      customerEphemeralKeySecret: ephemeralKey,
      customerId: customer,
      merchantDisplayName: "New Century Appraisals",
    });

    if (error) {
      console.error("❌ initPaymentSheet error", error);
      Alert.alert("Error", error.message || "Failed to initialize payment sheet.");
    } else {
      setPaymentSheetEnabled(true);
    }

    setLoading(false);
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert("Payment Failed", error.message);
    } else {
      Alert.alert("Success", "Your payment was successful!");
    }
  };

  useEffect(() => {
  const auth = getAuth(app);
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken(true);
      console.log("🔑 Firebase ID Token:", token); // ← Log token
      await initializePaymentSheet(user);
    } else {
      console.warn("No user logged in.");
      Alert.alert("Login Required", "Please log in to make a payment.");
    }
  });

  return () => unsubscribe();
}, []);


  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Make a Payment</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button
          title="Pay Now"
          disabled={!paymentSheetEnabled}
          onPress={openPaymentSheet}
        />
      )}
    </View>
  );
};

export default PaymentScreen;
