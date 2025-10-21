import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth }from 'firebase/auth';

const firebaseConfig: FirebaseOptions = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG!);

function initializeFirebase() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
}

export { initializeFirebase };
