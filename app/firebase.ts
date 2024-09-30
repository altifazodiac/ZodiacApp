import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database'; // Optional, for saving URL to Realtime DB

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoS2rHQdVeWg8gYSmma55yq9AjIKJvwxI",
  authDomain: "zodiacfirebase.firebaseapp.com",
  databaseURL: "https://zodiacfirebase-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zodiacfirebase",
  storageBucket: "zodiacfirebase.appspot.com",
  messagingSenderId: "1075337645856",
  appId: "1:1075337645856:web:1952dd3b51cc32ebf39145"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app); // Optional if you're storing URLs in Realtime DB

export { storage, database };