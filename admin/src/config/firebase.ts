import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'
import { getMessaging } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYChC9Zd2KjC9hEP29g1MpNXEc6_97YdE",
  authDomain: "zippup-demo.firebaseapp.com",
  projectId: "zippup-demo",
  storageBucket: "zippup-demo.firebasestorage.app",
  messagingSenderId: "469588069805",
  appId: "1:469588069805:web:bc2f623680e1ee21fe6524",
  measurementId: "G-TJCXYJSZRP"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const firestore = getFirestore(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)

// Initialize messaging (for admin notifications)
let messaging: any = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app)
}
export { messaging }

export default app