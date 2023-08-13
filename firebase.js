const admin = require('firebase-admin');

const firebaseCredentials = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');

const serviceAccount = JSON.parse(firebaseCredentials);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.db = admin.firestore();
