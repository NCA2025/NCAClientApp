import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Image, ImageBackground, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Card, Text, ActivityIndicator, Divider, FAB, IconButton } from "react-native-paper";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { StackNavigationProp } from "@react-navigation/stack";

// **Navigation Types**
type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  JobSubmission: undefined;
  JobDetail: { jobId: string; jobData?: any };
  Support: undefined;
};

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Profile">;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const db = getFirestore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row" }}>
          <IconButton icon="account-circle-outline" size={26} onPress={() => navigation.navigate("Profile")} />
          <IconButton icon="help-circle-outline" size={26} onPress={() => navigation.navigate("Support")} />
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const jobsRef = collection(db, "jobs");

    // ✅ TEMP: Remove filter so we get all jobs
    const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
      const jobList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("📦 Jobs from Firestore:", jobList);
      setJobs(jobList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
  }

  return (
    <ImageBackground source={require("../screens/background.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.logoRow}>
            <Image source={require("../screens/NCALogo.png")} style={styles.logo} />
            <Text style={styles.headerText}>New Century Appraisals</Text>
          </View>
          <Text style={styles.heroText}>"Unlock your vehicle's true value" - William Fitzgerald</Text>
        </View>

        {jobs.length === 0 ? (
          <Text style={{ color: "#fff", textAlign: "center", marginTop: 30 }}>No jobs found.</Text>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.claimNumber}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate("JobDetail", { jobId: item.id, jobData: item })}>
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.title}>#{item.claimNumber} — {item.insuranceCompany || "N/A"}</Text>
                    <Divider style={styles.divider} />
                    <Text style={styles.detail}>🚗 <Text style={styles.label}>Vehicle:</Text> {item.vehicle || "N/A"}</Text>
                    <Text style={styles.detail}>👤 <Text style={styles.label}>Customer:</Text> {item.customerName || "N/A"}</Text>
                    <Text style={styles.detail}>💵 <Text style={styles.label}>Amount:</Text> ${item.jobAmount || "0"}</Text>
                    <Text style={styles.detail}>📅 <Text style={styles.label}>Date In:</Text> {item.dateIn || "N/A"}</Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}

        <FAB style={styles.fab} icon="plus" onPress={() => navigation.navigate("JobSubmission")} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1, backgroundColor: "rgba(75, 73, 73, 0.4)", padding: 20 },
  loader: { marginTop: 20 },
  headerContainer: { marginBottom: 20 },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 5 },
  logo: { width: 40, height: 40, marginRight: 10, resizeMode: "contain" },
  headerText: { fontSize: 27, fontWeight: "bold", color: "#FFFFFF" },
  heroText: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF", fontStyle: "italic", marginLeft: 130 },
  card: {
    backgroundColor: "#FFFFFF", marginBottom: 15, borderRadius: 12, elevation: 6, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: "#000" },
  divider: { marginVertical: 6 },
  detail: { fontSize: 15, marginBottom: 5, color: "#333" },
  label: { fontWeight: "bold", color: "#000" },
  fab: { position: "absolute", right: 20, bottom: 30, backgroundColor: "#023E8A" },
});

export default HomeScreen;
