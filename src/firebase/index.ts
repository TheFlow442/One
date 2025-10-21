import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG!);

function initializeFirebase() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
}

export { initializeFirebase };
