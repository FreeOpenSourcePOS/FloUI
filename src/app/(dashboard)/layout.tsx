'use client';

import { usePathname } from 'next/navigation';
import AppSidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/layout/AuthGuard';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import MenuActionHandler from '@/components/layout/MenuActionHandler';
import StatusBar from '@/components/layout/StatusBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPos = pathname === '/pos' || pathname === '/kds';

  return (
    <AuthGuard>
      <MenuActionHandler />
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="h-screen overflow-hidden flex flex-col">
          {!isPos && (
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 !h-4" />
            </header>
          )}
          <div className={isPos
            ? 'flex-1 min-h-0 flex flex-col overflow-hidden'
            : 'flex-1 p-4 overflow-auto min-w-0'
          }>
            {children}
          </div>
          <StatusBar />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
