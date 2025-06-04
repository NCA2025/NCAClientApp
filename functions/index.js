const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const stripeLib = require("stripe");
const serviceAccount = require("./serviceAccountKey.json");

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const sheets = google.sheets("v4");
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = "1G0AlTMLhy7ZSYP0BOkuuzcQp7g8_u438MRx-jirz27g";

async function syncToFirestore() {
  const sheetsClient = await auth.getClient();
  const response = await sheets.spreadsheets.values.get({
    auth: sheetsClient,
    spreadsheetId: SHEET_ID,
    range: "Jobs!A2:Z1000",
  });

  const rows = response.data.values || [];
  if (!rows.length) return;

  const headers = [
    "claimNumber", "insuranceCompany", "customerName", "vin", "vehicle",
    "jobAmount", "nadaValue", "typeOfLoss", "estimateType", "status", "statusPhase",
    "bodyshopName", "account", "adjusterAssigned", "dateIn", "dateOut", "notes",
    "timestamp", "zoneSummary", "uploadCount"
  ];

  const batch = db.batch();

  rows.forEach((row, rowIndex) => {
    const jobData = {};
    headers.forEach((header, idx) => {
      jobData[header] = row[idx]?.trim() || "";
    });

    const rawClaimNumber = jobData.claimNumber;
    if (!rawClaimNumber || rawClaimNumber.includes("Claim Num.")) return;

    const cleanClaimNumber = rawClaimNumber.replace(/\s+/g, "").replace(/[^a-zA-Z0-9-_]/g, "");
    if (!cleanClaimNumber) return;

    const docRef = db.collection("jobs").doc(cleanClaimNumber);
    batch.set(docRef, jobData, { merge: true }); // 👈 force update with new fields
  });

  await batch.commit();
  console.log(`✅ Synced ${rows.length} rows to Firestore.`);
}


exports.addJobToGoogleSheets = onDocumentCreated("jobs/{jobId}", async (event) => {
  const job = event.data?.data();
  const sheetsClient = await auth.getClient();
  let bodyshopName = "N/A";

  if (job?.userId) {
    try {
      const userSnap = await db.collection("users").doc(job.userId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        bodyshopName = userData?.bodyshopName || "N/A";
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

  const submissionDate = job?.dateIn ? new Date(job.dateIn) : new Date();
  const monthTab = submissionDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  }); // e.g., "May 2025"

  // 🧾 Structured Row for Google Sheets
  const jobRow = [
    job.claimNumber || "N/A",             // A: Claim Number
    job.insuranceCompany || "N/A",        // B: Insurance Company
    job.customerName || "N/A",            // C: Customer Name
    job.vin || "N/A",                     // D: VIN
    job.vehicle || "N/A",                 // E: Vehicle
    job.jobAmount || "N/A",               // F: Supp Amount
    job.nadaValue || "N/A",               // G: NADA
    job.typeOfLoss || "N/A",              // H: Type Of Loss
    job.estimateType || "N/A",            // I: Estimate Type
    job.status || "Pending Inspection",      // J: Status
    job.statusPhase || "N/A",             // K: Status Phase
    bodyshopName,                         // L: Shop
    job.account || "N/A",                 // M: Account
    job.adjusterAssigned || "N/A",        // N: Adjuster
    job.dateIn || "N/A",                  // O: Date In
    job.dateOut || "N/A",                 // P: Date Out
    job.notes || "N/A",                   // Q: Notes
    new Date().toISOString(),             // R: Timestamp
    Object.keys(job.zonePhotos || {}).join(", "), // S: Zones
    (job.photos || []).length             // T: Upload Count
  ];

  try {
    // 📄 Append to master sheet
    await sheets.spreadsheets.values.append({
      auth: sheetsClient,
      spreadsheetId: SHEET_ID,
      range: "Jobs!A:Z",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [jobRow] },
    });

    // 📅 Append to dynamic monthly sheet
    await sheets.spreadsheets.values.append({
      auth: sheetsClient,
      spreadsheetId: SHEET_ID,
      range: `${monthTab}!A:Z`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [jobRow] },
    });

    console.log(`✅ Job ${job.claimNumber} added to Jobs and '${monthTab}' tab`);
  } catch (err) {
    console.error("❌ Failed to append job to Google Sheets:", err);
  }
});



exports.scheduledSheetSync = onSchedule("every 24 hours", async () => {
  await syncToFirestore();
});

exports.manualSheetSync = onRequest(async (req, res) => {
  await syncToFirestore();
  res.send("✅ Manual sync complete!");
});

// ✅ This is required for secret injection to work
exports.createPaymentIntent = onRequest(
  { secrets: [stripeSecret] }, // ✅ This line is required to inject the secret
  async (req, res) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid ID token" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ error: "Invalid ID token" });
    }

    const stripe = stripeLib(stripeSecret.value()); // ✅ use the injected secret

    try {
      const customer = await stripe.customers.create({
        metadata: { firebaseUID: decodedToken.uid },
      });

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2023-10-16" }
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500,
        currency: "usd",
        customer: customer.id,
      });

      return res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      });
    } catch (err) {
      console.error("❌ Stripe error:", err);
      return res.status(500).json({ error: "Stripe failure", details: err.message });
    }
  }
);





