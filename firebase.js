const admin = require('firebase-admin');
const serviceAccount = require('./discord-account-bot-firebase-adminsdk-4vgii-21fb2d3cce.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.db = admin.firestore();
