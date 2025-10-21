import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

function initializeAdminApp(): App {
    if (getApps().length) {
        return getApps()[0];
    }
    
    const adminCredential = credential.applicationDefault();

    return initializeApp({
        credential: adminCredential,
    });
}


export { initializeAdminApp };
