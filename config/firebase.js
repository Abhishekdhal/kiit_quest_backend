const admin = require("firebase-admin");
// Path to the service account key you placed in your root folder
const serviceAccount = require("../serviceAccountKey.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // If you are using Firestore
const messaging = admin.messaging(); // For push notifications

module.exports = { admin, db, messaging };