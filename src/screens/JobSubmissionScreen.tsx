import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Image, ImageBackground,
  TouchableOpacity, Dimensions,
} from "react-native";
import { Button, Card, Divider } from "react-native-paper";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "react-native-image-picker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Picker } from "@react-native-picker/picker";

type JobSubmissionScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "JobSubmission">;
};

const JobSubmissionScreen: React.FC<JobSubmissionScreenProps> = ({ navigation }) => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;

  const [claimNumber, setClaimNumber] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [jobAmount, setJobAmount] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [zonePhotos, setZonePhotos] = useState<Record<string, string>>({});
  const [typeOfLoss, setTypeOfLoss] = useState("");
  const [estimateType, setEstimateType] = useState("");
  const [vin, setVin] = useState("");
  const [decodedInfo, setDecodedInfo] = useState<{ year: string, make: string, model: string } | null>(null);
  const [nadaValue, setNadaValue] = useState<string | null>(null);

  const uploadImage = async (uri: string, zone?: string) => {
    if (!user) return;
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = zone ? `zones/${zone}` : "job_photos";
    const storageRef = ref(storage, `${path}/${user.uid}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    if (zone) {
      setZonePhotos(prev => ({ ...prev, [zone]: downloadURL }));
    } else {
      setPhotos(prev => [...prev, downloadURL]);
    }
  };

  const pickImage = (zone?: string) => {
    ImagePicker.launchImageLibrary({ mediaType: "photo" }, async (response) => {
      if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        await uploadImage(uri, zone);
      }
    });
  };

  const decodeVIN = async () => {
    if (!vin) return alert("Please enter a VIN");
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      const data = await response.json();
      const year = data.Results.find((r: any) => r.Variable === "Model Year")?.Value;
      const make = data.Results.find((r: any) => r.Variable === "Make")?.Value;
      const model = data.Results.find((r: any) => r.Variable === "Model")?.Value;

      if (year && make && model) {
        setDecodedInfo({ year, make, model });
        setVehicle(`${year} ${make} ${model}`);
        fetchNADAValue(year, make, model);
      } else {
        alert("VIN decoding incomplete. Please check the VIN.");
      }
    } catch (err) {
      console.error("VIN Decode Error:", err);
      alert("Failed to decode VIN.");
    }
  };

  const fetchNADAValue = async (year: string, make: string, model: string) => {
    console.log(`Fetching NADA for ${year} ${make} ${model}`);
    setNadaValue("16500"); // Simulated. Replace with actual API.
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!claimNumber || !insuranceCompany || !customerName || !vehicle || !jobAmount) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        claimNumber,
        insuranceCompany,
        customerName,
        vehicle,
        jobAmount,
        typeOfLoss,
        estimateType,
        nadaValue,
        photos,
        zonePhotos,
        userId: user.uid,
        account: user.email,
        status: "Pending Payment",
        createdAt: new Date(),
      });

      alert("✅ Job submitted! It will be added to Google Sheets automatically.");
      navigation.navigate("Payment");
    } catch (error) {
      console.error("❌ Error submitting job:", error);
      alert("Failed to submit job.");
    }
  };

  const renderZones = () => {
    const width = Dimensions.get("window").width;
    const ratio = width / 1058;
    const coords: Record<string, [number, number]> = {
      "1": [600, 140], "2": [600, 302], "3": [600, 464], "4": [600, 627],
      "5": [600, 790], "6": [55, 790], "7": [55, 628], "8": [55, 465],
      "9": [55, 303], "10": [55, 140], "11": [327, 523], "12": [327, 33], "13": [327, 967],
    };

    return Object.entries(coords).map(([key, [x, y]]) => (
      <TouchableOpacity
        key={key}
        onPress={() => pickImage(key)}
        style={[styles.zone, { top: y * ratio, left: x * ratio, width: 45, height: 45 }]}
      >
        {zonePhotos[key] && (
          <Image source={{ uri: zonePhotos[key] }} style={styles.zoneImage} />
        )}
      </TouchableOpacity>
    ));
  };

  return (
    <ImageBackground source={require("../screens/background.jpg")} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.header}>Submit a New Job</Text>
            <Divider style={styles.divider} />

            <TextInput placeholder="Claim Number" value={claimNumber} onChangeText={setClaimNumber} style={styles.input} />
            <TextInput placeholder="Insurance Company" value={insuranceCompany} onChangeText={setInsuranceCompany} style={styles.input} />
            <TextInput placeholder="Customer Name" value={customerName} onChangeText={setCustomerName} style={styles.input} />

            <Text style={styles.subHeader}><Text style={{ fontWeight: "bold" }}>VIN (Vehicle Identification Number)</Text></Text>
              <View style={styles.vinRow}>
                <TextInput
                  placeholder="Enter VIN"
                  value={vin}
                  onChangeText={setVin}
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                />
                <Button mode="outlined" style={styles.decodeBtn} onPress={decodeVIN}>
                  Decode
                </Button>
              </View>

            {nadaValue && (
              <Text style={{ marginTop: 5, fontWeight: "bold" }}>
                NADA Value: ${nadaValue}
              </Text>
            )}

            <TextInput placeholder="Vehicle" value={vehicle} onChangeText={setVehicle} style={styles.input} />
            
            <Text style={styles.subHeader}>Type of Loss</Text>
            <Picker selectedValue={typeOfLoss} style={styles.picker} onValueChange={(val) => setTypeOfLoss(val)}>
              <Picker.Item label="Select Type" value="" />
              <Picker.Item label="Collision" value="Collision" />
              <Picker.Item label="Theft" value="Theft" />
              <Picker.Item label="Vandalism" value="Vandalism" />
              <Picker.Item label="Weather" value="Weather" />
              <Picker.Item label="Other" value="Other" />
            </Picker>

            <Text style={styles.subHeader}>Estimate Type</Text>
            <Picker selectedValue={estimateType} style={styles.picker} onValueChange={(val) => setEstimateType(val)}>
              <Picker.Item label="Select Type" value="" />
              <Picker.Item label="Preliminary Estimate" value="Preliminary Estimate" />
              <Picker.Item label="Supplement" value="Supplement" />
            </Picker>

            <TextInput placeholder="If supplement, enter full amount" value={jobAmount} onChangeText={setJobAmount} keyboardType="numeric" style={styles.input} />


            <Text style={styles.subHeader}>Vehicle Damage Map</Text>
            <View style={styles.diagramWrapper}>
              <Image source={require("../screens/CarDiagram.png")} style={styles.diagram} />
              {renderZones()}
            </View>

            <Text style={styles.subHeader}>Upload Additional Photos</Text>
            <TouchableOpacity onPress={() => pickImage()} style={styles.uploadButton}>
              <Text style={styles.uploadText}>Upload Photos</Text>
            </TouchableOpacity>

            <ScrollView horizontal style={styles.photoContainer}>
              {photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.photo} />
              ))}
            </ScrollView>

            <Button mode="contained" style={styles.submitButton} onPress={handleSubmit}>
              Submit & Proceed to Payment
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </ImageBackground>
  );
};

// ✂️ Styles
const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flexGrow: 1, alignItems: "center", padding: 20 },
  card: {
    width: "100%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 12, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  header: { fontSize: 22, fontWeight: "bold", color: "#000", textAlign: "center", marginBottom: 15 },
  divider: { marginVertical: 10 },
  subHeader: { fontSize: 16, fontWeight: "bold", color: "#000", marginTop: 20, marginBottom: 5 },
  input: {
    borderBottomWidth: 1, padding: 10, borderRadius: 5, marginBottom: 12, backgroundColor: "#fff"
  },
  picker: { backgroundColor: "#f0f0f0", borderRadius: 5, marginBottom: 10 },
  uploadButton: {
    backgroundColor: "#000", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 10,
  },
  uploadText: { color: "#fff", fontWeight: "bold" },
  submitButton: { marginTop: 15, backgroundColor: "#000", borderRadius: 8 },
  photoContainer: { flexDirection: "row", marginTop: 10 },
  photo: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  diagramWrapper: { position: "relative", marginTop: 10, width: "100%", aspectRatio: 1024 / 1536 },
  diagram: { width: "100%", height: "100%", resizeMode: "contain" },
  zone: {
    position: "absolute", borderRadius: 28, borderWidth: 2, borderColor: "orange",
    justifyContent: "center", alignItems: "center", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.3)",
  },
  zoneImage: { width: "100%", height: "100%" },
  vinRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
},
decodeBtn: {
  marginLeft: 8,
  paddingVertical: 2,
  paddingHorizontal: 10,
  height: 45,
  justifyContent: "center",
},

});

export default JobSubmissionScreen;
