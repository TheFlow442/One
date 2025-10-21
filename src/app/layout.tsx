
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as admin from 'firebase-admin';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VoltaView',
  description: 'VoltaView Dashboard',
};

// Helper function to initialize Firebase Admin SDK safely.
function initializeAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error('Firebase Admin initialization error:', e);
    }
  }
}

async function verifySession(session: string | undefined) {
  if (!session) {
    return false;
  }
  initializeAdmin();
  try {
    await admin.auth().verifySessionCookie(session, true);
    return true;
  } catch (error) {
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = cookies().get('__session')?.value;
  const isAuthPage = false; // Simplified for root layout logic
  const isSessionValid = await verifySession(session);

  // This logic is now simplified and part of the layout, not middleware.
  // The logic for redirecting based on path will be handled inside page/layout components.

  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
