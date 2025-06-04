import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, Image, TextInput, TouchableOpacity } from "react-native";
import { Button, Card, Divider } from "react-native-paper";
import { getAuth, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { launchImageLibrary } from "react-native-image-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// **Define Navigation**
type RootStackParamList = {
  Login: undefined;
  Support: undefined; // ✅ Add Support to navigation types
};
type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Login">;
};

// ...same imports

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;

  const [bodyshopName, setBodyshopName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBodyshopName(data.bodyshopName || "");
          setContactName(data.contactName || "");
          setPhoneNumber(data.phoneNumber || "");
          setAddress(data.address || "");
          setProfilePic(data.profilePic || null);
        }
      });
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        maxWidth: 500,
        maxHeight: 500,
        quality: 1,
      });

      if (result.didCancel || !result.assets?.length) return;

      const imageUri = result.assets[0].uri;
      setProfilePic(imageUri);
      uploadImage(imageUri);
    } catch (error) {
      alert("Error selecting image.");
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_pictures/${user.uid}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    setProfilePic(downloadURL);
    await setDoc(doc(db, "users", user.uid), { profilePic: downloadURL }, { merge: true });
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), {
      bodyshopName,
      contactName,
      phoneNumber,
      address,
      profilePic,
    }, { merge: true });
    alert("Profile updated!");
  };

  const handlePasswordReset = () => {
    if (user?.email) {
      sendPasswordResetEmail(auth, user.email).then(() => {
        alert("Password reset email sent.");
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  return (
    <ImageBackground source={require("../screens/background.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.header}>Your Profile</Text>
            {user ? (
              <>
                <TouchableOpacity onPress={pickImage}>
                  <Image
                    source={{ uri: profilePic || "https://via.placeholder.com/150" }}
                    style={styles.profilePic}
                  />
                  <Text style={styles.uploadText}>Tap to change logo</Text>
                </TouchableOpacity>

                <Divider style={styles.divider} />

                <View style={styles.infoContainer}>
                  <Icon name="storefront" size={24} color="#023E8A" style={styles.icon} />
                  <TextInput
                    placeholder="Bodyshop Name"
                    value={bodyshopName}
                    onChangeText={setBodyshopName}
                    style={styles.input}
                    placeholderTextColor="#6C757D"
                  />
                </View>
                <View style={styles.infoContainer}>
                  <Icon name="account-outline" size={24} color="#023E8A" style={styles.icon} />
                  <TextInput
                    placeholder="Contact Name"
                    value={contactName}
                    onChangeText={setContactName}
                    style={styles.input}
                    placeholderTextColor="#6C757D"
                  />
                </View>
                <View style={styles.infoContainer}>
                  <Icon name="phone" size={24} color="#023E8A" style={styles.icon} />
                  <TextInput
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholderTextColor="#6C757D"
                  />
                </View>
                <View style={styles.infoContainer}>
                  <Icon name="map-marker" size={24} color="#023E8A" style={styles.icon} />
                  <TextInput
                    placeholder="Address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    placeholderTextColor="#6C757D"
                  />
                </View>

                <Button mode="contained" style={styles.button} onPress={handleSaveChanges}>
                  Save Changes
                </Button>

                <Button mode="outlined" style={styles.buttonOutline} onPress={() => navigation.navigate("Support")}>
                  Need Help? Contact Support
                </Button>

                <Button mode="outlined" style={styles.buttonOutline} onPress={handlePasswordReset}>
                  Reset Password
                </Button>

                <Button mode="contained" style={styles.logoutButton} onPress={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Text style={styles.noUserText}>No user logged in.</Text>
            )}
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
    fontSize: 25,
    fontWeight: "bold",
    color: "#023E8A",
    textAlign: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#023E8A",
    alignSelf: "center",
    marginBottom: 5,
  },
  uploadText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    fontSize: 15,
  },
  divider: {
    marginVertical: 10,
  },
  button: {
    marginTop: 15,
    backgroundColor: "#023E8A",
    borderRadius: 8,
  },
  buttonOutline: {
    marginTop: 10,
    borderColor: "#023E8A",
    borderWidth: 1,
    borderRadius: 8,
  },
  logoutButton: {
    marginTop: 15,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  noUserText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6C757D",
  },
});

export default ProfileScreen;
