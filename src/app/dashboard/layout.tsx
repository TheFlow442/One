
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarNavContent } from "@/components/dashboard/sidebar-content";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as admin from 'firebase-admin';

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
    // Verify the session cookie. This will throw an error if the cookie is invalid.
    await admin.auth().verifySessionCookie(session, true);
    return true;
  } catch (error) {
    // Session cookie is invalid.
    return false;
  }
}


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = cookies().get('__session')?.value;
  const isSessionValid = await verifySession(session);

  if (!isSessionValid) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarNavContent />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6 bg-background flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
