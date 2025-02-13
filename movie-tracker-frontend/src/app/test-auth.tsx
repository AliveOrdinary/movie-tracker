import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function TestAuth() {
  const handleLogin = async () => {
    try {
      // Sign in
      const userCredential = await signInWithEmailAndPassword(auth, "your-test-email@example.com", "your-password");
      
      // Get the token
      const token = await userCredential.user.getIdToken();
      console.log('Your Firebase Token:', token);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Get Firebase Token
      </button>
    </div>
  );
}