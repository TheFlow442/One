
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/dashboard/header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as admin from 'firebase-admin';
import { AdminSidebarNavContent } from "@/components/admin/sidebar-content";

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

async function verifyAdminSession(session: string | undefined) {
  if (!session) {
    return false;
  }
  initializeAdmin();
  try {
    // Verify the session cookie. This will throw an error if the cookie is invalid.
    const decodedToken = await admin.auth().verifySessionCookie(session, true);
    // Check if the user is the admin
    return decodedToken.email === 'admin@volta.view';
  } catch (error) {
    // Session cookie is invalid.
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = cookies().get('__session')?.value;
  const isAdmin = await verifyAdminSession(session);

  if (!isAdmin) {
    redirect('/dashboard'); // Or show an unauthorized page
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <AdminSidebarNavContent />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6 bg-background flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
