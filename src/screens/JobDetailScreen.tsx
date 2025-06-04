import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Share,
} from "react-native";
import { Card, Divider, IconButton, Button } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { getFirestore, doc, deleteDoc, updateDoc } from "firebase/firestore";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import RNPrint from "react-native-print";
import { RootStackParamList } from "../navigation/AppNavigator";

type JobDetailScreenRouteProp = RouteProp<RootStackParamList, "JobDetail">;

type Props = {
  route: JobDetailScreenRouteProp;
};

const JobDetailScreen: React.FC<Props> = ({ route }) => {
  const { jobData, jobId } = route.params;
  const navigation = useNavigation();
  const db = getFirestore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [editableJob, setEditableJob] = useState(jobData);

  const typeOfLossOptions = ["Estimate", "Supplement"];
  const statusBadgeColors: Record<string, string> = {
    "Intake & Forms": "#6c757d",
    "Pending Inspection": "#ffc107",
    "Pending Estimate Payment": "#17a2b8",
    "Pending Supplement Payment": "#fd7e14",
    "Repair Process": "#007bff",
    "Completed": "#28a745",
  };

  const handleDelete = () => {
    Alert.alert("Delete Job", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "jobs", jobId));
            Alert.alert("Deleted", "Job successfully deleted.");
            navigation.goBack();
          } catch {
            Alert.alert("Error", "Failed to delete job.");
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "jobs", jobId), {
        ...editableJob,
      });
      Alert.alert("Saved", "Changes updated successfully.");
    } catch {
      Alert.alert("Error", "Could not save changes.");
    }
  };

  const handleShare = async () => {
    const text = `
Claim #: ${editableJob.claimNumber}
Insurance: ${editableJob.insuranceCompany}
Customer: ${editableJob.customerName}
Vehicle: ${editableJob.vehicle}
NADA Value: $${editableJob.nadaValue || "N/A"}
Job Amount: $${editableJob.jobAmount}
Type of Loss: ${editableJob.typeOfLoss}
Status Phase: ${editableJob.statusPhase}
Adjuster: ${editableJob.adjusterAssigned}
Date In: ${editableJob.dateIn}
Date Out: ${editableJob.dateOut}
Notes: ${editableJob.notes}
    `;
    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert("Failed", "Unable to share job.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const html = `
        <h1>Job Details</h1>
        <p><strong>Claim #:</strong> ${editableJob.claimNumber}</p>
        <p><strong>Insurance:</strong> ${editableJob.insuranceCompany}</p>
        <p><strong>Customer:</strong> ${editableJob.customerName}</p>
        <p><strong>Vehicle:</strong> ${editableJob.vehicle}</p>
        <p><strong>NADA Value:</strong> $${editableJob.nadaValue || "N/A"}</p>
        <p><strong>Amount:</strong> $${editableJob.jobAmount}</p>
        <p><strong>Type of Loss:</strong> ${editableJob.typeOfLoss}</p>
        <p><strong>Status Phase:</strong> ${editableJob.statusPhase}</p>
        <p><strong>Adjuster:</strong> ${editableJob.adjusterAssigned}</p>
        <p><strong>Date In:</strong> ${editableJob.dateIn}</p>
        <p><strong>Date Out:</strong> ${editableJob.dateOut}</p>
        <p><strong>Notes:</strong> ${editableJob.notes}</p>
      `;
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `Claim_${editableJob.claimNumber}`,
        directory: "Documents",
      });
      Alert.alert("PDF Saved", file.filePath || "");
    } catch {
      Alert.alert("PDF Error", "Failed to save PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    const html = `
      <h1>Job Details</h1>
      <p><strong>Claim #:</strong> ${editableJob.claimNumber}</p>
      <p><strong>Insurance:</strong> ${editableJob.insuranceCompany}</p>
      <p><strong>Customer:</strong> ${editableJob.customerName}</p>
      <p><strong>Vehicle:</strong> ${editableJob.vehicle}</p>
      <p><strong>Amount:</strong> $${editableJob.jobAmount}</p>
      <p><strong>Status:</strong> ${editableJob.statusPhase}</p>
      <p><strong>Adjuster:</strong> ${editableJob.adjusterAssigned}</p>
      <p><strong>Date In:</strong> ${editableJob.dateIn}</p>
      <p><strong>Date Out:</strong> ${editableJob.dateOut}</p>
      <p><strong>Notes:</strong> ${editableJob.notes}</p>
    `;
    try {
      await RNPrint.print({ html });
    } catch {
      Alert.alert("Print Error", "Could not print.");
    }
  };

  return (
    <ImageBackground source={require("../screens/background.jpg")} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Title
            title={`Claim #${editableJob.claimNumber}`}
            subtitle={editableJob.insuranceCompany}
            right={() => (
              <View style={styles.actionIcons}>
                <IconButton icon="delete-outline" onPress={handleDelete} />
                <IconButton icon="share-outline" onPress={handleShare} />
              </View>
            )}
          />
          <Divider style={styles.divider} />

          <Card.Content>
            <Label>🚗 Vehicle</Label>
            <TextInput
              value={editableJob.vehicle}
              style={styles.input}
              onChangeText={(val) => setEditableJob({ ...editableJob, vehicle: val })}
            />

            <Label>💵 Job Amount</Label>
            <TextInput
              keyboardType="numeric"
              value={String(editableJob.jobAmount)}
              style={styles.input}
              onChangeText={(val) => setEditableJob({ ...editableJob, jobAmount: parseFloat(val) || 0 })}
            />

            <Label>🏷️ NADA Value</Label>
            <Text style={styles.value}>${editableJob.nadaValue || "Fetching..."}</Text>

            <Label>📄 Type of Loss</Label>
            <Picker
              selectedValue={editableJob.typeOfLoss}
              onValueChange={(val) => setEditableJob({ ...editableJob, typeOfLoss: val })}
            >
              {typeOfLossOptions.map((opt) => (
                <Picker.Item label={opt} value={opt} key={opt} />
              ))}
            </Picker>

            <Label>📊 Status Phase</Label>
            <View style={[styles.badge, { backgroundColor: statusBadgeColors[editableJob.statusPhase] || "#ccc" }]}>
              <Text style={styles.badgeText}>{editableJob.statusPhase}</Text>
            </View>

            <Label>👤 Customer</Label>
            <Text style={styles.value}>{editableJob.customerName}</Text>

            <Label>🧑‍💼 Adjuster Assigned</Label>
            <Text style={styles.value}>{editableJob.adjusterAssigned || "N/A"}</Text>

            <Label>📅 Date In</Label>
            <Text style={styles.value}>{editableJob.dateIn || "N/A"}</Text>

            <Label>📤 Date Out</Label>
            <Text style={styles.value}>{editableJob.dateOut || "N/A"}</Text>

            <Label>📝 Notes</Label>
            <TextInput
              multiline
              value={editableJob.notes}
              style={[styles.input, { height: 80 }]}
              onChangeText={(val) => setEditableJob({ ...editableJob, notes: val })}
            />

            {Array.isArray(editableJob.photos) && editableJob.photos.length > 0 && (
              <>
                <Label>📷 Photos</Label>
                <ScrollView horizontal style={styles.photoScroll}>
                  {editableJob.photos.map((url: string, index: number) => (
                    <Image key={index} source={{ uri: url }} style={styles.photo} />
                  ))}
                </ScrollView>
              </>
            )}

            <View style={{ marginTop: 24 }}>
              <Button mode="outlined" onPress={handleDownloadPDF} loading={isDownloading} style={{ marginBottom: 10 }}>
                Download PDF
              </Button>
              <Button mode="outlined" onPress={handlePrint} style={{ marginBottom: 10 }}>
                Print
              </Button>
              <Button mode="contained" onPress={handleSave}>Save Changes</Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </ImageBackground>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, paddingBottom: 16, elevation: 4,
  },
  divider: { marginBottom: 12 },
  label: { fontWeight: "bold", marginTop: 10, color: "#000" },
  value: { marginTop: 2, color: "#333" },
  input: {
    borderBottomWidth: 1, borderBottomColor: "#ccc", padding: 8, fontSize: 16, marginBottom: 8,
  },
  photoScroll: { marginTop: 8, flexDirection: "row" },
  photo: { width: 100, height: 100, borderRadius: 8, marginRight: 10 },
  actionIcons: { flexDirection: "row", marginRight: 8 },
  badge: {
    marginVertical: 6, paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 20, alignSelf: "flex-start",
  },
  badgeText: { color: "#fff", fontWeight: "bold" },
});

export default JobDetailScreen;
