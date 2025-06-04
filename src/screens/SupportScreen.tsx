import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Button, Card } from "react-native-paper";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const SupportScreen: React.FC = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const db = getFirestore();
  const user = getAuth().currentUser;

  const handleSubmit = async () => {
    if (!subject || !message) {
      Alert.alert("Missing fields", "Please complete both the subject and message.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "supportMessages"), {
        userId: user?.uid || null,
        email: user?.email || "anonymous",
        subject,
        message,
        createdAt: serverTimestamp(),
      });

      Alert.alert("✅ Sent", "Your message was sent successfully.");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Support submission error:", error);
      Alert.alert("❌ Error", "Failed to send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.header}>Need Help?</Text>
            <Text style={styles.subtext}>We're here to assist. Send us a message:</Text>

            <TextInput
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
              placeholderTextColor="#6C757D"
            />
            <TextInput
              placeholder="Your Message"
              value={message}
              onChangeText={setMessage}
              style={[styles.input, { height: 120 }]}
              placeholderTextColor="#6C757D"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.button}
            >
              Submit Message
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F1F3F5",
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#023E8A",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 16,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
    color: "#000",
  },
  button: {
    backgroundColor: "#023E8A",
    borderRadius: 8,
    marginTop: 10,
  },
});

export default SupportScreen;
