// src/config/firebase.js
// ⚠️ FICHIER DÉSACTIVÉ - Migration vers SQLite effectuée
// Ce fichier n'est plus utilisé. L'authentification utilise maintenant SQLite via databaseService.js

// import { initializeApp } from 'firebase/app';
// import {
//   getReactNativePersistence,
//   initializeAuth
// } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Configuration Firebase
// const firebaseConfig = {
//   apiKey: "AIzaSyCNnwLssieWw70ydAL12kutEfNPqlUSrC0",
//   authDomain: "mon-app-ia.firebaseapp.com",
//   projectId: "mon-app-ia",
//   storageBucket: "mon-app-ia.firebasestorage.app",
//   messagingSenderId: "633612934327",
//   appId: "1:633612934327:web:8e74ea3c1e5ee6bd87c132",
//   measurementId: "G-W9EPVVMG0K"
// };

// ✅ Initialiser Firebase App
// const app = initializeApp(firebaseConfig);

// ✅ Authentification avec persistance sur AsyncStorage
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage)
// });

// ✅ Firestore
// const db = getFirestore(app);

// ✅ Exporter les instances
// export { auth, db };
// export default app;
