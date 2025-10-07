import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

// Firebase configuration for PeoplePerson
const firebaseConfig = {
  apiKey: "AIzaSyAuuFSDPSASTvk9FNdpTAfetoAmZrT4cw4",
  authDomain: "peopleperson-d189e.firebaseapp.com",
  projectId: "peopleperson-d189e",
  storageBucket: "peopleperson-d189e.firebasestorage.app",
  messagingSenderId: "779461876428",
  appId: "1:779461876428:web:b93d0f6491e78c507c0069",
  measurementId: "G-9QL25JCSG6"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Connect to Firebase Auth emulator for development
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
}

export default app