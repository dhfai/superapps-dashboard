import { SiteHeader } from "@/components/Header/SiteHeader";
import { AppSidebar } from "@/components/Navigation/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <AppSidebar variant="inset" />
      <SidebarInset suppressHydrationWarning>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
