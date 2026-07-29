import { requireAdmin } from "@/lib/admin-guard";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <main className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/50">
          {children}
        </main>
      </div>
    </div>
  );
}
