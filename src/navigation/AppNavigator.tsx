import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StripeProvider } from "@stripe/stripe-react-native";

// Import Screens
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SignUpScreen from "../screens/SignUpScreen";
import JobSubmissionScreen from "../screens/JobSubmissionScreen";
import PaymentScreen from "../screens/PaymentScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import SupportScreen from "../screens/SupportScreen"

// Define TypeScript Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  SignUp: undefined;
  JobSubmission: undefined;
  Payment: undefined;
  JobDetail: undefined;
  Support: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <StripeProvider
      publishableKey="pk_test_51Qcv5oDABfK0vRyydMX74XqBwThiB5j0gmVgYomdjtjr87eVJ82PIsii4yRMlkODMmWGdYIxJJwQZKNDSRkztOK900wVF5rAKy" // use your real live publishable key
      merchantIdentifier="merchant.com.newcentury.appraisals" // fine for Apple Pay
    >
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="JobSubmission" component={JobSubmissionScreen} options={{ title: "Submit a Job" }} />
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          <Stack.Screen name="Support" component={SupportScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
};

export default AppNavigator;
